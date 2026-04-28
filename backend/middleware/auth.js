const jwt = require('jsonwebtoken');
const Vendor = require('../models/Vendor');

exports.vendorAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'vendor') return res.status(403).json({ success: false, message: 'Access denied' });

    const vendor = await Vendor.findById(decoded.id);
    if (!vendor) return res.status(401).json({ success: false, message: 'Vendor not found' });
    if (vendor.status !== 'approved') return res.status(403).json({ success: false, message: 'Account not approved yet' });

    req.vendor = vendor;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

exports.adminAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ success: false, message: 'Access denied' });

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};
