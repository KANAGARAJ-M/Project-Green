const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const ADMIN_EMAIL = 'admin@nocorps.in';
const ADMIN_PASSWORD = 'Aaaa@1234';

// POST /api/auth/admin/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }
  const token = jwt.sign({ role: 'admin', email }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ success: true, token, admin: { email, name: 'Admin' } });
});

module.exports = router;
