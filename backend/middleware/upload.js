const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.vendorId || req.body.vendorId || 'temp';
    const dir = path.join(__dirname, '..', 'media', folder, String(userId));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const imageFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|gif/;
  if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new Error('Only image files allowed'));
};

const docFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|pdf/;
  if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
  else cb(new Error('Only image/PDF files allowed'));
};

exports.farmImageUpload = multer({ storage: createStorage('farm_images'), fileFilter: imageFilter, limits: { files: 3, fileSize: 5 * 1024 * 1024 } });
exports.farmLogoUpload = multer({ storage: createStorage('farm_logos'), fileFilter: imageFilter, limits: { files: 1, fileSize: 2 * 1024 * 1024 } });
exports.docUpload = multer({ storage: createStorage('documents'), fileFilter: docFilter, limits: { fileSize: 5 * 1024 * 1024 } });
exports.productImageUpload = multer({ storage: createStorage('products'), fileFilter: imageFilter, limits: { files: 10, fileSize: 5 * 1024 * 1024 } });
exports.categoryImageUpload = multer({ storage: createStorage('categories'), fileFilter: imageFilter, limits: { files: 1, fileSize: 2 * 1024 * 1024 } });

// Combined upload for registration (all vendor docs)
exports.vendorRegisterUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const folder = req.uploadFolder || 'vendor_docs';
      const dir = path.join(__dirname, '..', 'media', folder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${Date.now()}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|pdf/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) cb(null, true);
    else cb(new Error('Only image/PDF files allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
}).fields([
  { name: 'farmImages', maxCount: 3 },
  { name: 'farmLogo', maxCount: 1 },
  { name: 'addressProofImage', maxCount: 1 },
  { name: 'pattaChitta', maxCount: 1 },
  { name: 'landOwnership', maxCount: 1 },
  { name: 'leaseAgreement', maxCount: 1 },
  { name: 'farmerIdCard', maxCount: 1 },
  { name: 'organicCertification', maxCount: 1 },
]);
