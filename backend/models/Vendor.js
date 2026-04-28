const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  // Personal Info
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true },

  // Address
  fullAddress: { type: String, required: true },
  country: { type: String, default: 'India' },
  state: { type: String, required: true },
  district: { type: String, required: true },
  city: { type: String, required: true },
  landmark: { type: String },
  pincode: { type: String, required: true },
  mapLat: { type: Number },
  mapLng: { type: Number },

  // Farm Info
  farmName: { type: String, required: true },
  farmSize: { type: String, required: true }, // e.g. "5 acres"
  farmType: { type: String, enum: ['organic', 'conventional', 'mixed'], required: true },
  farmImages: [{ type: String }], // up to 3 paths
  farmLogo: { type: String }, // optional 1 image
  shopDescription: { type: String }, // public shop about section

  // Bank
  bankName: { type: String, required: true },
  bankAccountNumber: { type: String, required: true },
  bankIFSC: { type: String, required: true },
  bankAccountHolder: { type: String, required: true },

  // ID Proof
  addressProofType: { type: String, enum: ['PAN', 'DRIVING', 'VoterID'], required: true },
  addressProofNumber: { type: String, required: true },
  addressProofImage: { type: String, required: true },

  // Land Documents
  pattaChitta: { type: String }, // file path
  landOwnership: { type: String },
  leaseAgreement: { type: String },
  farmerIdCard: { type: String },
  organicCertification: { type: String },
  gst: { type: String }, // optional

  // Status
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionRemark: { type: String },
  isActive: { type: Boolean, default: true },

  // OTP
  otp: { type: String },
  otpExpiry: { type: Date },
  otpAttempts: { type: Number, default: 0 },
  otpLastReset: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
