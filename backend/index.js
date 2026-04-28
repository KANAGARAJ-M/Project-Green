require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static media
app.use('/media', express.static(path.join(__dirname, 'media')));

// Routes
app.use('/api/auth/vendor', require('./routes/vendor/auth'));
app.use('/api/vendor', require('./routes/vendor/vendor'));
app.use('/api/auth/admin', require('./routes/admin/auth'));
app.use('/api/admin', require('./routes/admin/admin'));
app.use('/api/shared', require('./routes/shared'));
app.use('/api/location', require('./routes/location'));

// Connect DB
mongoose.connect(process.env.MONGO_DB_URI, { dbName: process.env.DB_NAME })
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => console.error('❌ MongoDB Error:', err));
