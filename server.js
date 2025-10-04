
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

// Error Handlers
process.on('unhandledRejection', (reason) => {
  console.error('🛑 Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
});

const app = express();
const port = process.env.PORT || 3001;
app.use(bodyParser.json());

(async () => {
  try {
    const pool = await mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });



    // Store token
    app.post('/storeToken', async (req, res) => {
      const { client_id, git_secret, email, client_access_token, user_name, code } = req.body;

      if (!client_id || !git_secret || !email || !client_access_token || !user_name || !code) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      try {
        const [result] = await pool.execute(
          `INSERT INTO github_user_details 
          (git_client_id, git_client_secret, email, client_access_token, user_name, code) 
          VALUES (?, ?, ?, ?, ?, ?)`,
          [client_id, git_secret, email, client_access_token, user_name, code]
        );

        const [rows] = await pool.execute(
          `SELECT id, user_name, created_at, code 
          FROM github_user_details 
          WHERE id = ?`,
          [result.insertId]
        );

        res.status(201).json({ message: "Stored", data: rows[0] });

      } catch (error) {
        console.error('Error storing token:', error);
        res.status(500).json({ error: 'Failed to store token' });
      }
    });

    // Get token
    // app.post('/getToken', async (req, res) => {
    //   const { username,platform } = req.body;

    //   if (!username) {
    //     return res.status(400).json({ error: 'Username is required' });
    //   }

    //   try {
    //     const [rows] = await pool.execute(
    //       `SELECT client_access_token, code, user_name, email 
    //        FROM github_user_details 
    //        WHERE user_name = ? 
    //        ORDER BY id DESC 
    //        LIMIT 1`,
    //       [username]
    //     );

    //     if (rows.length === 0) {
    //       return res.status(404).json({ error: 'User not found' });
    //     }

    //     res.status(200).json({ message: 'User found', data: rows[0] });

    //   } catch (error) {
    //     console.error('Error retrieving token:', error);
    //     res.status(500).json({ error: 'Database error' });
    //   }
    // });

    app.post('/getToken', async (req, res) => {
  try {
    const { username, platform } = req.body;

    if (!username || !platform) {
      return res.status(400).json({ error: 'Username and platform are required' });
    }

    const sql = `
      SELECT 
        client_access_token,
        code,
        user_name,
        email,
        git_client_id,
        git_client_secret
      FROM github_user_details
      WHERE user_name = ? 
        AND git_client_secret = ?
      ORDER BY id DESC 
      LIMIT 1
    `;

    const [rows] = await pool.execute(sql, [username, platform]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'User not found for this platform' });
    }

    const row = rows[0];

    res.status(200).json({
      message: 'User found',
      data: {
        client_access_token: row.client_access_token,
        code: row.code,
        user_name: row.user_name,
        email: row.email,
        git_client_id: row.git_client_id,
        platform: row.git_client_secret 
      }
    });
  } catch (error) {
    console.error('Error retrieving token:', error);
    res.status(500).json({ error: 'Database error' });
  }
});


    // Add a test route
    // app.get('/', (req, res) => {
    //   res.send('Welcome to Secure Code VAPT');
    // });

    app.get('/', (req, res) => {
  res.json({
    message: "🔐 Welcome to VAPTlabs – Your Code, Secured.",
    description: "We provide cutting-edge Secure Code Reviews, Vulnerability Assessments, and Compliance Solutions. Protect your applications before attackers find a way in.",
    contact: "contact@vaptlabs.com"
  });
});


    // ✅ Start server *inside* the IIFE
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });

  } catch (err) {
    console.error('❌ Startup error:', err);
    process.exit(1);
  }
})();
