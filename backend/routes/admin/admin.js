const express = require('express');
const router = express.Router();
const { adminAuth } = require('../../middleware/auth');
const Vendor = require('../../models/Vendor');
const Product = require('../../models/Product');
const Category = require('../../models/Category');
const SubCategory = require('../../models/SubCategory');
const { sendVendorApprovedEmail, sendVendorRejectedEmail, sendProductApprovedEmail, sendProductRejectedEmail } = require('../../utils/email');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Category image upload
const catStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../media/categories');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});
const catUpload = multer({ storage: catStorage, limits: { files: 1 } }).single('image');

// ============== VENDORS ==============

// GET /api/admin/vendors?status=pending&page=1
router.get('/vendors', adminAuth, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];

    const vendors = await Vendor.find(filter)
      .select('-password -otp -otpExpiry')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Vendor.countDocuments(filter);
    res.json({ success: true, vendors, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/vendors/:id
router.get('/vendors/:id', adminAuth, async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).select('-password -otp -otpExpiry');
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    res.json({ success: true, vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/vendors/:id/approve
router.put('/vendors/:id/approve', adminAuth, async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, { status: 'approved', rejectionRemark: undefined }, { new: true });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    sendVendorApprovedEmail(vendor).catch(() => {});
    res.json({ success: true, message: 'Vendor approved', vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/admin/vendors/:id/reject
router.put('/vendors/:id/reject', adminAuth, async (req, res) => {
  try {
    const { remark } = req.body;
    if (!remark) return res.status(400).json({ success: false, message: 'Rejection remark required' });
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectionRemark: remark }, { new: true });
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });
    sendVendorRejectedEmail(vendor, remark).catch(() => {});
    res.json({ success: true, message: 'Vendor rejected', vendor });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============== CATEGORIES ==============

router.get('/categories', adminAuth, async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/categories', adminAuth, (req, res) => {
  catUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    try {
      const { name } = req.body;
      const image = req.file ? `/media/categories/${req.file.filename}` : undefined;
      const cat = await Category.create({ name, image });
      res.status(201).json({ success: true, category: cat });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
});

router.put('/categories/:id', adminAuth, (req, res) => {
  catUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    try {
      const update = { name: req.body.name };
      if (req.file) update.image = `/media/categories/${req.file.filename}`;
      const cat = await Category.findByIdAndUpdate(req.params.id, update, { new: true });
      if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
      res.json({ success: true, category: cat });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
});

router.delete('/categories/:id', adminAuth, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    await SubCategory.deleteMany({ category: req.params.id });
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============== SUB CATEGORIES ==============

router.get('/subcategories', adminAuth, async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const subs = await SubCategory.find(filter).populate('category', 'name').sort({ createdAt: -1 });
    res.json({ success: true, subcategories: subs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/subcategories', adminAuth, (req, res) => {
  catUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    try {
      const { name, category } = req.body;
      const image = req.file ? `/media/categories/${req.file.filename}` : undefined;
      const sub = await SubCategory.create({ name, category, image });
      const populated = await sub.populate('category', 'name');
      res.status(201).json({ success: true, subcategory: populated });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
});

router.put('/subcategories/:id', adminAuth, (req, res) => {
  catUpload(req, res, async (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    try {
      const update = { name: req.body.name, category: req.body.category };
      if (req.file) update.image = `/media/categories/${req.file.filename}`;
      const sub = await SubCategory.findByIdAndUpdate(req.params.id, update, { new: true }).populate('category', 'name');
      if (!sub) return res.status(404).json({ success: false, message: 'SubCategory not found' });
      res.json({ success: true, subcategory: sub });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
});

router.delete('/subcategories/:id', adminAuth, async (req, res) => {
  try {
    await SubCategory.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'SubCategory deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============== PRODUCTS ==============

router.get('/products', adminAuth, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 10, search } = req.query;
    const filter = { status };
    if (search) filter.name = { $regex: search, $options: 'i' };

    const products = await Product.find(filter)
      .populate('vendor', 'name farmName email')
      .populate('category', 'name')
      .populate('subCategory', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(filter);
    res.json({ success: true, products, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/products/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendor', 'name farmName email phone')
      .populate('category', 'name')
      .populate('subCategory', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/products/:id/approve', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { status: 'approved', rejectionRemark: undefined }, { new: true }).populate('vendor');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.vendor) sendProductApprovedEmail(product.vendor, product).catch(() => {});
    res.json({ success: true, message: 'Product approved', product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/products/:id/reject', adminAuth, async (req, res) => {
  try {
    const { remark } = req.body;
    if (!remark) return res.status(400).json({ success: false, message: 'Rejection remark required' });
    const product = await Product.findByIdAndUpdate(req.params.id, { status: 'rejected', rejectionRemark: remark }, { new: true }).populate('vendor');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    if (product.vendor) sendProductRejectedEmail(product.vendor, product, remark).catch(() => {});
    res.json({ success: true, message: 'Product rejected', product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [totalVendors, pendingVendors, approvedVendors, pendingProducts, approvedProducts] = await Promise.all([
      Vendor.countDocuments(),
      Vendor.countDocuments({ status: 'pending' }),
      Vendor.countDocuments({ status: 'approved' }),
      Product.countDocuments({ status: 'pending' }),
      Product.countDocuments({ status: 'approved' }),
    ]);
    res.json({ success: true, stats: { totalVendors, pendingVendors, approvedVendors, pendingProducts, approvedProducts } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
