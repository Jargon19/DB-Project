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
const { unstable_HistoryRouter } = require('react-router-dom');

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
  const { username, name, email, password, confirmPassword, role, university_id } = req.body;

  console.log('Register body:', req.body);

  if (!name || !email || !password || !role || !university_id || !username) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const [university] = await pool.query('SELECT 1 FROM universities WHERE university_id = ?', [university_id]);
    if (!university) return res.status(400).json({ error: 'Invalid university' });

    const [existing] = await pool.query('SELECT 1 FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      'INSERT INTO users (username, name, email, password_hash, role, university_id) VALUES (?, ?, ?, ?, ?, ?)',
      [username, name, email, hashedPassword, role, university_id]
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
  const { username, password, role} = req.body;

  console.log('Login request body:', req.body);

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Email, password and role are required' });
  }

  try {
    // Get user with university info
    const [users] = await pool.query(`
      SELECT u.user_id, u.username, u.name, u.email, u.role, u.password_hash, 
         u.university_id, un.name AS university_name
      FROM users u
      LEFT JOIN universities un ON u.university_id = un.university_id
      WHERE u.username = ?
    `, [username]);

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

// POST /api/events/create
app.post('/api/events/create', authenticateToken, async (req, res) => {
  const { name, description, location, datetime, category, contactPhone, contactEmail, visibility } = req.body;

  console.log("🧾 Incoming event data:", req.body);

  const { userId, universityId } = req.user;

  if (!name || !description || !location || !datetime || !category || !contactPhone || !contactEmail || !visibility) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO events 
        (name, description, location_name, event_time, category, contact_phone, contact_email, visibility, admin_id, university_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, location, datetime, category, contactPhone, contactEmail, visibility, userId, universityId]
    );

    res.status(201).json({ message: "Event created successfully", eventId: result.insertId });
  } catch (error) {
    console.error("Event creation error:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// GET /api/events/get
app.get('/api/events/get', authenticateToken, async (req, res) => {
  const { userId, universityId } = req.user;

  // This is for when we add RSOs
  /* try {
    const [events] = await pool.query(
      `
      SELECT DISTINCT e.*
      FROM events e
      LEFT JOIN rso_members rm ON e.rso_id = rm.rso_id
      WHERE 
        e.visibility = 'public'
        OR (e.visibility = 'private' AND e.university_id = ?)
        OR (e.visibility = 'RSO' AND rm.user_id = ?)
      `,
      [universityId, userId]
    ); */


  try {
    const [events] = await pool.query(
      `
      SELECT *
      FROM events
      WHERE 
        visibility = 'public'
        OR (visibility = 'private' AND university_id = ?)
      `,
      [universityId]
    );
    res.json(events);
  } catch (err) {
    console.error("Failed to fetch student events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// POST /api/universities/create
app.post('/api/universities/create', async (req, res) => {
  const { name, location, description, students } = req.body;

  if (!name || !location) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO universities (name, location, description, num_students)
       VALUES (?, ?, ?, ?)`,
      [name, location, description || null, students || null]
    );

    res.status(201).json({ message: "University created successfully", universityId: result.insertId });
  } catch (error) {
    console.error("University creation error:", error);
    res.status(500).json({ error: "Failed to create university" });
  }
});

// POST /api/rso/create
app.post('/api/rso/create', authenticateToken, async (req, res) => {
  const { name, description } = req.body;
  const { userId, universityId } = req.user;

  if (!name || !description) {
    return res.status(400).json({ error: "RSO name and description are required." });
  }

  try {
    const [existing] = await pool.query(
      "SELECT 1 FROM rsos WHERE name = ?",
      [name]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: "RSO name already exists." });
    }

    // change status from pending to approved later
    const [result] = await pool.query(
      `INSERT INTO rsos (name, admin_id, university_id, status)
       VALUES (?, ?, ?, ?)`,
      [name, userId, universityId, "pending"]
    );

    res.status(201).json({ message: "RSO created successfully. Waiting for approval by super admin.", rsoId: result.insertId });
  } catch (err) {
    console.error("RSO creation error:", err);
    res.status(500).json({ error: "Failed to create RSO" });
  }
});

// POST /api/rso/approve
app.post('/api/rso/approve', authenticateToken, async (req, res) => {
  const { rsoId } = req.body;
  const { role } = req.user;

  if (role !== "super_admin") {
    return res.status(403).json({ error: "Access denied." });
  }

  if (!rsoId) return res.status(400).json({ error: "Missing RSO ID." });

  try {
    const [result] = await pool.query(
      `UPDATE rsos SET status = 'approved' WHERE rso_id = ?`,
      [rsoId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "RSO not found" });
    }

    res.json({ message: "RSO approved." });
  } catch (err) {
    console.error("Error approving RSO:", err);
    res.status(500).json({ error: "Failed to approve RSO" });
  }
});

// GET /api/rso.pending
app.get('/api/rso/pending', authenticateToken, async (req, res) => {
  const { role } = req.user;

  if (role !== "super_admin") {
    return res.status(403).json({ error: "Access denied." });
  }

  try {
    const [rsos] = await pool.query(
      `SELECT rso_id, name, admin_id, university_id, status
       FROM rsos
       WHERE status = 'pending'`
    );

    res.json(rsos);
  } catch (err) {
    console.error("Error fetching pending RSOs:", err);
    res.status(500).json({ error: "Failed to fetch RSOs" });
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded; // Attach decoded token data to req.user
    next();
  });
};

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
