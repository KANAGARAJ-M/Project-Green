const express = require('express');
const router = express.Router();
const { vendorAuth } = require('../../middleware/auth');
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const SubCategory = require('../../models/SubCategory');
const Vendor = require('../../models/Vendor');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Product image upload
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../media/products');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`);
  },
});
const productUpload = multer({ storage: productStorage, limits: { files: 10, fileSize: 5 * 1024 * 1024 } }).array('images', 10);

// GET /api/vendor/dashboard
router.get('/dashboard', vendorAuth, async (req, res) => {
  try {
    const vendorId = req.vendor._id;
    const totalProducts = await Product.countDocuments({ vendor: vendorId });
    const approved = await Product.countDocuments({ vendor: vendorId, status: 'approved' });
    const pending = await Product.countDocuments({ vendor: vendorId, status: 'pending' });
    const rejected = await Product.countDocuments({ vendor: vendorId, status: 'rejected' });
    const revenue = await Product.aggregate([
      { $match: { vendor: vendorId, status: 'approved' } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$price', '$stock'] } } } }
    ]);

    res.json({
      success: true,
      stats: {
        totalProducts,
        approved,
        pending,
        rejected,
        estimatedInventoryValue: revenue[0]?.total || 0,
      },
      vendor: {
        name: req.vendor.name,
        farmName: req.vendor.farmName,
        farmLogo: req.vendor.farmLogo,
        status: req.vendor.status,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/vendor/products
router.get('/products', vendorAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = { vendor: req.vendor._id };
    if (status) filter.status = status;

    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);

    res.json({ success: true, products, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/vendor/products/:id
router.get('/products/:id', vendorAuth, async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, vendor: req.vendor._id })
      .populate('category', 'name')
      .populate('subCategory', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/vendor/products
router.post('/products', vendorAuth, (req, res) => {
  productUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    try {
      const { name, description, highlights, unit, price, discountPrice, stock, category, subCategory, tags } = req.body;
      const images = (req.files || []).map(f => `/media/products/${path.basename(f.path)}`);

      const product = await Product.create({
        vendor: req.vendor._id,
        name, description, highlights, unit,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
        stock: parseInt(stock),
        category, subCategory: subCategory || undefined,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
        images,
        status: 'pending',
      });

      res.status(201).json({ success: true, message: 'Product submitted for review', product });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
});

// PUT /api/vendor/products/:id
router.put('/products/:id', vendorAuth, (req, res) => {
  productUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    try {
      const product = await Product.findOne({ _id: req.params.id, vendor: req.vendor._id });
      if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

      const { name, description, highlights, unit, price, discountPrice, stock, category, subCategory, tags, existingImages } = req.body;
      const newImages = (req.files || []).map(f => `/media/products/${path.basename(f.path)}`);
      const kept = existingImages ? (Array.isArray(existingImages) ? existingImages : [existingImages]) : [];
      const images = [...kept, ...newImages].slice(0, 10);

      Object.assign(product, {
        name, description, highlights, unit,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
        stock: parseInt(stock),
        category, subCategory: subCategory || undefined,
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
        images,
        status: 'pending', // re-submit for review
        rejectionRemark: undefined,
      });

      await product.save();
      res.json({ success: true, message: 'Product updated and resubmitted for review', product });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
});

// DELETE /api/vendor/products/:id
router.delete('/products/:id', vendorAuth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, vendor: req.vendor._id });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/vendor/profile
router.get('/profile', vendorAuth, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.vendor._id).select('-password -otp -otpExpiry');
    res.json({ success: true, vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
