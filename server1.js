// require('dotenv').config();  // For loading environment variables from .env
// const express = require('express');
// const { Pool } = require('pg');
// const bodyParser = require('body-parser');

// // Initialize Express
// const app = express();
// const port = 3000;

// // Middleware to parse JSON request body
// app.use(bodyParser.json());

// // Setup PostgreSQL connection using the connection string from .env
// const pool = new Pool({
//   connectionString: process.env.DB_CONNECTION
// });

// // API to store token and user details in the database
// app.post('/storeToken', async (req, res) => {
//   const { code, client_id, username, client_secret, client_access_token } = req.body;

//   if (!code || !client_id || !username || !client_secret || !client_access_token) {
//     return res.status(400).json({ error: 'Missing required fields' });
//   }

//   try {
//     // Insert the user details into the database
//     const result = await pool.query(
//       'INSERT INTO github_user_details (code, client_id, username, client_secret, client_access_token) VALUES ($1, $2, $3, $4, $5) RETURNING *',
//       [code, client_id, username, client_secret, client_access_token]
//     );

//     res.status(201).json({ message: 'User details stored successfully', data: result.rows[0] });
//   } catch (error) {
//     console.error('Error storing token:', error);
//     res.status(500).json({ error: 'Database connection failed' });
//   }
// });

// // API to get token and user details from the database
// app.post('/getToken', async (req, res) => {
//   const { username } = req.body;

//   if (!username) {
//     return res.status(400).json({ error: 'Username is required' });
//   }

//   try {
//     // Retrieve user details for the given username
//     const result = await pool.query(
//       'SELECT client_access_token, client_id, username FROM github_user_details WHERE username = $1',
//       [username]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.status(200).json({ message: 'User found', data: result.rows[0] });
//   } catch (error) {
//     console.error('Error retrieving token:', error);
//     res.status(500).json({ error: 'Database connection failed' });
//   }
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });

// Load environment variables


// require('dotenv').config();

// const express = require('express');
// const { Pool } = require('pg');
// const bodyParser = require('body-parser');

// // Initialize Express
// const app = express();
// const port = process.env.PORT || 3000; // Use port from env or default to 3000

// // Middleware to parse JSON request body
// app.use(bodyParser.json());

// // Setup PostgreSQL connection using the connection string from .env
// const pool = new Pool({
//   connectionString: process.env.DB_CONNECTION,
//   ssl: {
//     rejectUnauthorized: false  // This is needed for Render's PostgreSQL SSL
//   }
// });

// // API to store token and user details in the database
// app.post('/storeToken', async (req, res) => {
//     const { client_id, git_secret, email, client_access_token, user_name, code } = req.body;
  
//     // Check if all required fields are provided
//     if (!client_id || !git_secret || !email || !client_access_token || !user_name || !code) {
//       return res.status(400).json({ error: 'Missing required fields' });
//     }
  
//     try {
//       // Insert the user details into the database using correct column names
//       const result = await pool.query(
//         'INSERT INTO github_user_details (git_client_id, git_client_secret, email, client_access_token, user_name, code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
//         [client_id, git_secret, email, client_access_token, user_name, code]
//       );
      
//       res.status(201).json({ message: 'User details stored successfully', data: result.rows[0] });
//     } catch (error) {
//       console.error('Error storing token:', error);
//       res.status(500).json({ error: 'Database connection failed' });
//     }
// });

  

// // API to get token and user details from the database
// app.post('/getToken', async (req, res) => {
//   const { username } = req.body;

//   // Validate the request body
//   if (!username) {
//     return res.status(400).json({ error: 'Username is required' });
//   }

//   try {
//     // Retrieve user details for the given username
//     const result = await pool.query(
//       'SELECT client_access_token, client_id, username FROM github_user_details WHERE username = $1',
//       [username]
//     );

//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.status(200).json({ message: 'User found', data: result.rows[0] });
//   } catch (error) {
//     console.error('Error retrieving token:', error);
//     res.status(500).json({ error: 'Database connection failed' });
//   }
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });






// // Importing dependencies
// require('dotenv').config();
// const express = require('express');
// const { Pool } = require('pg');
// const bodyParser = require('body-parser');

// // Initialize Express
// const app = express();
// const port = process.env.PORT || 3000; // Default to 3000 or use environment variable

// // Middleware to parse JSON request body
// app.use(bodyParser.json());

// // Set up PostgreSQL connection using the connection string from .env
// const pool = new Pool({
//   connectionString: process.env.DB_CONNECTION,
//   ssl: {
//     rejectUnauthorized: false // Required for SSL connections to PostgreSQL (e.g., Render)
//   }
// });


// app.post('/storeToken', async (req, res) => {
//     // Destructure the correct field names from the request body
//     const { client_id, git_secret, email, client_access_token, user_name, code } = req.body;
  
//     // Validate all required fields
//     // if ( !email || !client_access_token || !user_name || !code) {
//     //   return res.status(400).json({ error: 'Missing required fields' });
//     // }
  
//     try {
//       // Store the token in the database with correct column names
//       const result = await pool.query(
//         'INSERT INTO github_user_details(git_client_id, git_client_secret, email, client_access_token, user_name, code) VALUES($1, $2, $3, $4, $5, $6) RETURNING id, user_name, created_at, code',
//         [client_id, git_secret, email, client_access_token, user_name, code] // Use the destructured variables here
//       );
  
//       // Return the result with only the necessary fields
//       const response = {
//         message: "User details stored successfully",
//         data: {
//           id: result.rows[0].id,
//           user_name: result.rows[0].user_name,
//           created_at: result.rows[0].created_at,
//           code: result.rows[0].code
//         }
//       };
  
//       return res.status(201).json(response);
  
//     } catch (error) {
//       console.error('Error storing token:', error);
//       return res.status(500).json({ error: 'Failed to store token' });
//     }
//   });
  




// // Get token and user details from the database
// app.post('/getToken', async (req, res) => {
//   const { username } = req.body;

//   // Validate the request body
//   if (!username) {
//     return res.status(400).json({ error: 'Username is required' });
//   }

//   try {
//     // Retrieve user details from the database based on the username
//     const result = await pool.query(
//       `SELECT client_access_token, code, user_name, email 
//       FROM github_user_details 
//       WHERE user_name = $1 order by id desc limit 1`,
//       [username]
//     );

//     // If no user is found, return a 404 error
//     if (result.rows.length === 0) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // Respond with the user data
//     res.status(200).json({
//       message: 'User found',
//       data: result.rows[0]
//     });
//   } catch (error) {
//     console.error('Error retrieving token:', error);
//     res.status(500).json({ error: 'Database connection failed' });
//   }
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });



// require('dotenv').config();
// const express = require('express');
// const mysql = require('mysql2/promise');
// const bodyParser = require('body-parser');

// // Initialize Express
// const app = express();
// const port = process.env.PORT || 3000;


require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;


// Middleware
app.use(bodyParser.json());

// Set up MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Store token and user details
app.post('/storeToken', async (req, res) => {
  const { client_id, git_secret, email, client_access_token, user_name, code } = req.body;

  try {
    // Insert new record
    const [result] = await pool.execute(
      `INSERT INTO github_user_details 
       (git_client_id, git_client_secret, email, client_access_token, user_name, code) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [client_id, git_secret, email, client_access_token, user_name, code]
    );

    // Fetch inserted row for confirmation
    const [rows] = await pool.execute(
      `SELECT id, user_name, created_at, code 
       FROM github_user_details 
       WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      message: "User details stored successfully",
      data: rows[0]
    });

  } catch (error) {
    console.error('Error storing token:', error);
    return res.status(500).json({ error: 'Failed to store token' });
  }
});

// Retrieve token and user details
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

    res.status(200).json({
      message: 'User found',
      data: rows[0]
    });

  } catch (error) {
    console.error('Error retrieving token:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
