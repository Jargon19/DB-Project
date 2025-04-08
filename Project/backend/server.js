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

// POST /api/auth/register (Register)
app.post('/api/auth/register', async (req, res) => {
  const { username, name, email, password, confirmPassword, role, university_name } = req.body;

  console.log('Register body:', req.body);

  if (!name || !email || !password || !role || !university_name || !username) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const [uniRows] = await pool.query(
      'SELECT university_id FROM universities WHERE LOWER(name) = ?',
      [university_name.toLowerCase()]
    );
    
    if (!uniRows.length) return res.status(400).json({ error: 'University not found' });
    const university_id = uniRows[0].university_id;

    const [existing] = await pool.query('SELECT 1 FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      'INSERT INTO users (username, name, email, password_hash, role, university_id) VALUES (?, ?, ?, ?, ?, ?)',
      [username, name, email, hashedPassword, role, university_id]
    );

    const payload = {
      userId: result.insertId,
      role,
      universityId: university_id
    };
    
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    
    res.status(201).json({
      id: result.insertId,
      name,
      email,
      role,
      username,
      university_id,
      accessToken
    });
    
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login (Login)
app.post('/api/auth/login', async (req, res) => {
  const { username, password} = req.body;

  console.log('Login request body:', req.body);

  if (!username || !password) {
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

// POST /api/events/create (Creating Event - SHOW IN DEMO)
app.post('/api/events/create', authenticateToken, async (req, res) => {
  const { name, description, location, datetime, category, contactPhone, contactEmail, visibility, rsoName } = req.body;

  console.log("🧾 Incoming event data:", req.body);

  let rsoId = null;
  if (visibility === "RSO") {
    const [rsoRows] = await pool.query(
      'SELECT rso_id FROM rsos WHERE name = ? AND status = ?',
      [rsoName, "approved"]
    );
    if (rsoRows.length === 0) {
      return res.status(400).json({ error: "RSO not found or approved." });
    }
    rsoId = rsoRows[0].rso_id;
  }  

  const { userId, universityId } = req.user;

  if (!name || !description || !location || !datetime || !category || !contactPhone || !contactEmail || !visibility) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // THIS IS USED TO PREVENT OVERLAPPING EVENTS - SHOW IN DEMO
    const [overlaps] = await pool.query(
      `SELECT 1 FROM events WHERE location_name = ? AND event_time = ?`,
      [location, datetime]
    );
    if (overlaps.length > 0) {
      return res.status(409).json({ error: "An event already exists at this time and location." });
    }

    const [result] = await pool.query(
      `INSERT INTO events 
        (name, description, location_name, event_time, category, contact_phone, contact_email, visibility, admin_id, university_id, rso_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, location, datetime, category, contactPhone, contactEmail, visibility, userId, universityId, rsoId]
    );
    

    res.status(201).json({ message: "Event created successfully", eventId: result.insertId });
  } catch (error) {
    console.error("Event creation error:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// GET /api/events/get (Loading All Events)
app.get('/api/events/get', authenticateToken, async (req, res) => {
  const { userId, universityId } = req.user;

  // This is for when we add RSOs
  try {
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
    );
    res.json(events);
  } catch (err) {
    console.error("Failed to fetch student events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// GET /api/events/:id (Loading Specific Event)
app.get('/api/events/:id', authenticateToken, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM events WHERE event_id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Event not found' });
  res.json(rows[0]);
});

// GET /api/comments/:event_id (Loading Comments)
app.get('/api/comments/:event_id', authenticateToken, async (req, res) => {
  const [comments] = await pool.query(
    `
    SELECT c.comment_id, c.event_id, c.user_id, u.username, c.comment_text, c.created_at
    FROM comments c
    JOIN users u ON c.user_id = u.user_id
    WHERE c.event_id = ?
    ORDER BY c.created_at DESC
    `,
    [req.params.event_id]
  );
  res.json(comments);
});

// POST /api/comments/:event_id (Adding Comments)
app.post('/api/comments/:event_id', authenticateToken, async (req, res) => {
  const { comment_text } = req.body;
  const user_id = req.user.userId;

  const [result] = await pool.query(
    `INSERT INTO comments (event_id, user_id, comment_text, created_at)
     VALUES (?, ?, ?, NOW())`,
    [req.params.event_id, user_id, comment_text]
  );

  res.status(201).json({
    comment_id: result.insertId,
    event_id: req.params.event_id,
    user_id,
    comment_text,
    created_at: new Date()
  });
});

// DELETE /api/comments/:comment_id (Deleting Comments)
app.delete('/api/comments/:comment_id', authenticateToken, async (req, res) => {
  const user_id = req.user.userId;
  const comment_id = req.params.comment_id;

  const [rows] = await pool.query('SELECT * FROM comments WHERE comment_id = ?', [comment_id]);
  if (!rows.length || rows[0].user_id !== user_id) {
    return res.status(403).json({ error: "Not authorized to delete this comment" });
  }

  await pool.query('DELETE FROM comments WHERE comment_id = ?', [comment_id]);
  res.json({ message: "Comment deleted" });
});

// PUT /api/comments/:comment_id (Editing Comments)
app.put('/api/comments/:comment_id', authenticateToken, async (req, res) => {
  const { comment_text } = req.body;
  const { comment_id } = req.params;
  const user_id = req.user.userId;

  if (!comment_text) return res.status(400).json({ error: "Comment text is required" });

  // Make sure the comment belongs to this user
  const [rows] = await pool.query('SELECT * FROM comments WHERE comment_id = ?', [comment_id]);
  if (!rows.length) return res.status(404).json({ error: "Comment not found" });
  if (rows[0].user_id !== user_id) return res.status(403).json({ error: "Unauthorized" });

  await pool.query('UPDATE comments SET comment_text = ? WHERE comment_id = ?', [comment_text, comment_id]);

  res.json({ message: "Comment updated" });
});

// POST /api/universities/create (Create University - for Superadmin)
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

// GET /api/universities (Loads universities - for Register page)
app.get('/api/universities', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT university_id, name FROM universities ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    console.error("Error fetching universities:", error);
    res.status(500).json({ error: "Failed to load universities" });
  }
});

// POST /api/rso/create (Create RSO - makes it pending)
app.post('/api/rso/create', authenticateToken, async (req, res) => {
  const { name, description, members } = req.body;
  const { userId, universityId } = req.user;

  if (!name || !description || !members || !Array.isArray(members)) {
    return res.status(400).json({ error: "RSO name, description, and members are required." });
  }

  if (members.length < 4) {
    return res.status(400).json({ error: "Requires at least 5 total members." });
  }

  try {
    const [[adminUser]] = await pool.query(`SELECT email FROM users WHERE user_id = ?`, [userId]);
    const adminEmail = adminUser.email;
    const emailDomain = adminEmail.split('@')[1];

    const allEmails = [adminEmail, ...members];
    const invalidEmails = allEmails.filter(email => !email.endsWith(`@${emailDomain}`));
    if (invalidEmails.length > 0) {
      return res.status(400).json({ error: "Members must have the same email domain." });
    }

    const [existing] = await pool.query(`SELECT 1 FROM rsos WHERE name = ?`, [name]);
    if (existing.length > 0) {
      return res.status(409).json({ error: "RSO name already exists." });
    }

    const [rsoInsert] = await pool.query(
      `INSERT INTO rsos (name, admin_id, university_id, status) VALUES (?, ?, ?, ?)`,
      [name, userId, universityId, "pending"]
    );
    const rsoId = rsoInsert.insertId;

    for (const email of allEmails) {
      const [[existingUser]] = await pool.query(`SELECT user_id FROM users WHERE email = ?`, [email]);
      const user_id = existingUser ? existingUser.user_id : null;

      await pool.query(
        `INSERT INTO rso_members (rso_id, email, user_id) VALUES (?, ?, ?)`,
        [rsoId, email, user_id]
      );
    }

    res.status(201).json({ message: "✅ RSO created and members added. Awaiting super admin approval.", rsoId });

  } catch (err) {
    console.error("RSO creation error:", err);
    res.status(500).json({ error: "Failed to create RSO" });
  }
});


// POST /api/rso/approve (Approve RSA - for Superadmins)
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


// GET /api/rso.pending (Loads all pending RSOs)
app.get('/api/rso/pending', authenticateToken, async (req, res) => {
  const { role } = req.user;

  if (role !== "super_admin") {
    return res.status(403).json({ error: "Access denied." });
  }

  try {
    const [rsos] = await pool.query(
      `SELECT r.rso_id, r.name, r.admin_id, r.university_id, u.name AS university_name
       FROM rsos r
       JOIN universities u ON r.university_id = u.university_id
       WHERE r.status = 'pending'`
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
