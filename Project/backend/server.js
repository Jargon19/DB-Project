const bcrypt = require('bcryptjs'); // Password hashing
const jwt = require('jsonwebtoken');
const express = require('express'); // Web Server & routing
const cors = require('cors'); // Allows for different ports to access backend
const bodyParser = require('body-parser'); // Parse JSON
const db = require('./db'); // MySQL DB Connection
require('dotenv').config(); 


const PORT = process.env.PORT || 3000;

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
const mysql = require('mysql2/promise');

// Middleware
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '', 
  database: process.env.DB_NAME || 'university_events',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
pool.getConnection()
  .then(conn => {
    console.log('Database connected');
    conn.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { user_id, name, email, password, confirmPassword, role, university_id } = req.body;

  console.log('Register body:', req.body);

  if (!name || !email || !password || !role || !university_id || !user_id) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const [university] = await pool.query('SELECT 1 FROM universities WHERE university_id = ?', [university_id]);
    if (!university) return res.status(400).json({ error: 'Invalid university' });

    const [existing] = await pool.query('SELECT 1 FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, university_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, university_id]
    );

    res.status(201).json({
      id: result.insertId,
      name,
      email,
      role
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { userId, password, role} = req.body;

  console.log('Login request body:', req.body);

  if (!userId || !password || !role) {
    return res.status(400).json({ error: 'Email, password and role are required' });
  }

  try {
    // Get user with university info
    const [users] = await pool.query(`
      SELECT u.user_id, u.name, u.email, u.role, u.password_hash, 
             u.university_id, un.name AS university_name
      FROM users u
      LEFT JOIN universities un ON u.university_id = un.university_id
      WHERE u.user_id = ?
    `, [userId]);

    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    // Create token payload
    const payload = {
      userId: user.user_id,
      role: user.role,
      universityId: user.university_id
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const { password_hash, ...userData } = user;

    res.json({
      ...userData,
      accessToken
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Improved auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = decoded; // Add decoded user info to request object
    next(); // Proceed to the next middleware or route handler
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
