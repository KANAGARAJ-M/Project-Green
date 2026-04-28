require('dotenv').config();
const mongoose = require('mongoose');
const Vendor = require('./models/Vendor');

async function fixPaths() {
  await mongoose.connect(process.env.MONGO_DB_URI, { dbName: process.env.DB_NAME });
  console.log('Connected to DB. Fixing paths...');

  const vendors = await Vendor.find({});
  for (const v of vendors) {
    let changed = false;

    if (v.farmImages && v.farmImages.length > 0) {
      v.farmImages = v.farmImages.map(img => {
        if (img.includes('/media/farm_images/')) { changed = true; return img.replace('/media/farm_images/', '/media/vendor_docs/'); }
        return img;
      });
    }
    
    if (v.farmLogo && v.farmLogo.includes('/media/farm_logos/')) {
      v.farmLogo = v.farmLogo.replace('/media/farm_logos/', '/media/vendor_docs/');
      changed = true;
    }

    const docFields = ['addressProofImage', 'pattaChitta', 'landOwnership', 'leaseAgreement', 'farmerIdCard', 'organicCertification'];
    for (const f of docFields) {
      if (v[f] && v[f].includes('/media/documents/')) {
        v[f] = v[f].replace('/media/documents/', '/media/vendor_docs/');
        changed = true;
      }
    }

    if (changed) {
      await v.save();
      console.log(`Updated paths for vendor: ${v.email}`);
    }
  }

  console.log('Done!');
  process.exit();
}

fixPaths().catch(console.error);
