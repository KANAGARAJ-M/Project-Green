const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Vendor = require('../../models/Vendor');
const { vendorRegisterUpload } = require('../../middleware/upload');
const { sendVendorApprovedEmail, sendOtpEmail } = require('../../utils/email');
const path = require('path');

// Helper: generate OTP
const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

// Helper: media path relative
const mediaPath = (file) => file ? `/media/${path.relative(path.join(__dirname, '../../media'), file.path).replace(/\\/g, '/')}` : null;

// POST /api/auth/vendor/register
router.post('/register', (req, res, next) => {
  vendorRegisterUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });

    try {
      const {
        name, email, phone, password,
        fullAddress, state, district, city, landmark, pincode,
        mapLat, mapLng,
        farmName, farmSize, farmType,
        bankName, bankAccountNumber, bankIFSC, bankAccountHolder,
        addressProofType, addressProofNumber,
        gst,
      } = req.body;

      // Check existing
      const existing = await Vendor.findOne({ email });
      if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });

      // Hash password
      const hashed = await bcrypt.hash(password, 10);

      // File paths
      const files = req.files || {};
      const farmImages = (files.farmImages || []).map(f => `/media/farm_images/${path.basename(f.path)}`);
      const farmLogo = files.farmLogo?.[0] ? `/media/farm_logos/${path.basename(files.farmLogo[0].path)}` : null;
      const addressProofImage = files.addressProofImage?.[0] ? `/media/documents/${path.basename(files.addressProofImage[0].path)}` : null;
      const pattaChitta = files.pattaChitta?.[0] ? `/media/documents/${path.basename(files.pattaChitta[0].path)}` : null;
      const landOwnership = files.landOwnership?.[0] ? `/media/documents/${path.basename(files.landOwnership[0].path)}` : null;
      const leaseAgreement = files.leaseAgreement?.[0] ? `/media/documents/${path.basename(files.leaseAgreement[0].path)}` : null;
      const farmerIdCard = files.farmerIdCard?.[0] ? `/media/documents/${path.basename(files.farmerIdCard[0].path)}` : null;
      const organicCertification = files.organicCertification?.[0] ? `/media/documents/${path.basename(files.organicCertification[0].path)}` : null;

      const vendor = await Vendor.create({
        name, email, phone, password: hashed,
        fullAddress, state, district, city, landmark, pincode,
        mapLat: mapLat ? parseFloat(mapLat) : undefined,
        mapLng: mapLng ? parseFloat(mapLng) : undefined,
        farmName, farmSize, farmType,
        farmImages, farmLogo,
        bankName, bankAccountNumber, bankIFSC, bankAccountHolder,
        addressProofType, addressProofNumber, addressProofImage,
        pattaChitta, landOwnership, leaseAgreement, farmerIdCard, organicCertification,
        gst,
      });

      res.status(201).json({ success: true, message: 'Registration submitted. Awaiting admin approval.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: err.message });
    }
  });
});

// POST /api/auth/vendor/login (email + password)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const vendor = await Vendor.findOne({ email });
    if (!vendor) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    if (vendor.status === 'pending') return res.status(403).json({ success: false, message: 'Account pending admin approval' });
    if (vendor.status === 'rejected') return res.status(403).json({ success: false, message: `Account rejected: ${vendor.rejectionRemark}` });

    const match = await bcrypt.compare(password, vendor.password);
    if (!match) return res.status(400).json({ success: false, message: 'Invalid credentials' });

    const token = jwt.sign({ id: vendor._id, role: 'vendor' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, vendor: { id: vendor._id, name: vendor.name, email: vendor.email, farmName: vendor.farmName, farmLogo: vendor.farmLogo } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/vendor/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const vendor = await Vendor.findOne({ email });
    if (!vendor) return res.status(400).json({ success: false, message: 'Email not found' });
    if (vendor.status !== 'approved') return res.status(403).json({ success: false, message: 'Account not approved' });

    const otp = generateOtp();
    vendor.otp = otp;
    vendor.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await vendor.save();

    await sendOtpEmail(email, otp);
    res.json({ success: true, message: 'OTP sent to email' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/vendor/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const vendor = await Vendor.findOne({ email });
    if (!vendor) return res.status(400).json({ success: false, message: 'Email not found' });
    if (vendor.otp !== otp || new Date() > vendor.otpExpiry) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    vendor.otp = undefined;
    vendor.otpExpiry = undefined;
    await vendor.save();

    const token = jwt.sign({ id: vendor._id, role: 'vendor' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, vendor: { id: vendor._id, name: vendor.name, email: vendor.email, farmName: vendor.farmName, farmLogo: vendor.farmLogo } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
