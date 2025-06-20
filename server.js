
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
    app.post('/getToken', async (req, res) => {
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({ error: 'Username is required' });
      }

      try {
        const [rows] = await pool.execute(
          `SELECT client_access_token, code, user_name, email 
           FROM github_user_details 
           WHERE user_name = ? 
           ORDER BY id DESC 
           LIMIT 1`,
          [username]
        );

        if (rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User found', data: rows[0] });

      } catch (error) {
        console.error('Error retrieving token:', error);
        res.status(500).json({ error: 'Database error' });
      }
    });

    // Add a test route
    app.get('/', (req, res) => {
      res.send('Welcome to Secure Code VAPT');
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
