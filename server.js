// server.js
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const dns = require('dns').promises;
const net = require('net');

process.on('unhandledRejection', (reason) => {
  console.error('🛑 Unhandled Rejection:', reason && reason.stack ? reason.stack : reason);
});
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err && err.stack ? err.stack : err);
});

const app = express();
const port = process.env.PORT || 3001;
app.use(bodyParser.json());

// Validate required env
const requiredEnv = ['DB_HOST','DB_USER','DB_PASSWORD','DB_NAME'];
for (const v of requiredEnv) {
  if (!process.env[v]) {
    console.error(`❌ Missing required env var: ${v}`);
    process.exit(1);
  }
}

(async () => {
  let pool;
  try {
    const host = process.env.DB_HOST;
    const portNum = Number(process.env.DB_PORT || 3306);
    console.log('DB host from env:', host, 'port:', portNum);

    // DNS lookup - helpful if host is a hostname
    try {
      const addrs = await dns.lookup(host);
      console.log('Resolved DB host to:', addrs.address);
    } catch (dnsErr) {
      console.warn('DNS lookup failed for DB_HOST:', dnsErr && dnsErr.message ? dnsErr.message : dnsErr);
    }

    // Quick TCP probe to detect network/firewall issues early
    try {
      await new Promise((resolve, reject) => {
        const socket = net.connect({ host, port: portNum, timeout: 5000 }, () => {
          console.log(`TCP probe: connected to ${host}:${portNum}`);
          socket.end();
          resolve();
        });
        socket.on('timeout', () => {
          socket.destroy();
          reject(new Error('TCP probe timeout'));
        });
        socket.on('error', (err) => {
          reject(err);
        });
      });
    } catch (probeErr) {
      console.warn('TCP probe failed:', probeErr && probeErr.message ? probeErr.message : probeErr);
      // continue to create pool — pool will fail but logs will be clearer
    }

    // Create pool with sensible timeouts
    pool = await mysql.createPool({
      host,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: portNum,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,  // 10s
      acquireTimeout: 20000,  // 20s
    });

    // Quick ping to ensure DB reachable
    const conn = await pool.getConnection();
    try {
      await conn.ping();
      console.log('✅ Database ping successful');
    } finally {
      conn.release();
    }

    // Retry helper
    async function withRetry(fn, retries = 3, delay = 500) {
      let attempt = 0;
      while (attempt < retries) {
        try {
          return await fn();
        } catch (err) {
          attempt++;
          console.error(`DB error (attempt ${attempt}):`, err && err.message ? err.message : err);
          if (err && err.sqlMessage) {
            console.error('SQL message:', err.sqlMessage);
          }
          if (attempt >= retries) {
            console.error('Giving up after retries. Last error stack:', err && err.stack ? err.stack : err);
            throw err;
          }
          // exponential-ish backoff
          await new Promise(r => setTimeout(r, delay * attempt));
        }
      }
    }

    // Health endpoint
    app.get('/health', async (req, res) => {
      try {
        await pool.query('SELECT 1');
        res.json({ ok: true });
      } catch (err) {
        console.error('/health DB error:', err && err.stack ? err.stack : err);
        res.status(500).json({ ok: false, error: 'DB unreachable' });
      }
    });

    // Store token
    app.post('/storeToken', async (req, res) => {
      const { client_id, git_secret, email, client_access_token, user_name, code } = req.body;

      if (!client_id || !git_secret || !email || !client_access_token || !user_name || !code) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      try {
        const [result] = await withRetry(() =>
          pool.execute(
            `INSERT INTO github_user_details 
            (git_client_id, git_client_secret, email, client_access_token, user_name, code) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            [client_id, git_secret, email, client_access_token, user_name, code]
          )
        );

        const [rows] = await withRetry(() =>
          pool.execute(
            `SELECT id, user_name, created_at, code 
             FROM github_user_details 
             WHERE id = ?`,
            [result.insertId]
          )
        );

        if (!rows || rows.length === 0) {
          console.warn('Insert succeeded but select returned no rows. insertId:', result.insertId);
          return res.status(500).json({ error: 'Stored but failed to read back record' });
        }

        res.status(201).json({ message: "Stored", data: rows[0] });

      } catch (error) {
        // More detailed logs for debugging (do not expose SQL internals to clients)
        console.error('Error storing token after retries:', error && error.stack ? error.stack : error);
        if (error && error.code) {
          console.error('Error code:', error.code);
        }
        if (error && error.sqlMessage) {
          console.error('SQL message:', error.sqlMessage);
        }
        // Provide useful hint to client logs while keeping internal details private
        res.status(500).json({ error: 'Failed to store token after retries' });
      }
    });

    // Get token
    app.post('/getToken', async (req, res) => {
      const { username, platform } = req.body;

      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }

      try {
        const [rows] = await withRetry(() =>
          pool.execute(
            `SELECT client_access_token, code, user_name, email 
             FROM github_user_details 
             WHERE user_name = ? AND git_client_secret = ?
             ORDER BY id DESC 
             LIMIT 1`,
            [username, platform]
          )
        );

        if (!rows || rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User found', data: rows[0] });

      } catch (error) {
        console.error('Error retrieving token after retries:', error && error.stack ? error.stack : error);
        if (error && error.code) {
          console.error('Error code:', error.code);
        }
        if (error && error.sqlMessage) {
          console.error('SQL message:', error.sqlMessage);
        }
        res.status(500).json({ error: 'Database error after retries' });
      }
    });

    // root
    app.get('/', (req, res) => {
      res.json({
        message: "🔐 Welcome to VAPTlabs – Your Code, Secured.",
        description: "We provide cutting-edge Secure Code Reviews, Vulnerability Assessments, and Compliance Solutions. Protect your applications before attackers find a way in.",
        contact: "contact@vaptlabs.com"
      });
    });

    // start server
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });

  } catch (err) {
    console.error('❌ Startup error (detailed):', err && err.stack ? err.stack : err);
    // If pool partially created, try to show table existence for quick debug (best-effort)
    try {
      if (typeof pool !== 'undefined') {
        const [tables] = await pool.query("SHOW TABLES LIKE 'github_user_details'");
        console.error('SHOW TABLES result:', tables);
      }
    } catch (e) {
      console.error('Could not query tables during startup error:', e && e.stack ? e.stack : e);
    }
    process.exit(1);
  }
})();
