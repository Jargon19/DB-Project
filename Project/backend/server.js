const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// POST /api/auth/register (User Registration)
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role, university } = req.body;

  // Simple validation (e.g., check if email and password are provided)
  if (!name || !email || !password || !role || !university) {
    return res.status(400).json({ error: 'Please provide all fields' });
  }

  // Hash the password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: 'Error hashing password' });
    }

    // Insert user into database
    const query = `INSERT INTO users (name, email, password, role, university) VALUES (?, ?, ?, ?, ?)`;
    db.query(query, [name, email, hashedPassword, role, university], (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Error inserting user into database' });
      }
      res.status(201).json({ message: 'User registered successfully' });
    });
  });
});

// POST /api/auth/login (User Login)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password' });
  }

  // Fetch user from database by email
  const query = `SELECT * FROM users WHERE email = ?`;
  db.query(query, [email], (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = results[0];

    // Compare the provided password with the hashed password
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) {
        return res.status(400).json({ error: 'Invalid email or password' });
      }

      // Create JWT token
      const payload = {
        userId: user.id,
        role: user.role
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Return the token in the response
      res.json({ token });
    });
  });
});

// Protected route (only accessible with a valid JWT token)
app.get('/api/auth/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', userId: req.user.userId });
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = decoded; // Add decoded user info to request object
    next(); // Proceed to the next middleware or route handler
  });
}
