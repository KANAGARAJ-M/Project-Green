const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Load and index once at startup
let records = [];
let stateIndex = {}; // { state: { district: [{ city, pincode }] } }
let statesList = [];

try {
  const raw = fs.readFileSync(path.join(__dirname, '../../asset/loca.json'), 'utf-8');
  records = JSON.parse(raw).records;

  records.forEach(r => {
    if (!r.state || !r.district || !r.city) return;
    const s = r.state.trim();
    const d = r.district.trim();
    const c = r.city.trim();
    const p = (r.pincode || '').trim();
    if (!stateIndex[s]) stateIndex[s] = {};
    if (!stateIndex[s][d]) stateIndex[s][d] = [];
    // avoid duplicate city/pincode entries
    if (!stateIndex[s][d].find(x => x.city === c && x.pincode === p)) {
      stateIndex[s][d].push({ city: c, pincode: p });
    }
  });

  statesList = Object.keys(stateIndex).sort();
  console.log(`[loca] Loaded ${records.length} records, ${statesList.length} states`);
} catch (e) {
  console.error('[loca] Failed to load loca.json:', e.message);
}

// GET /api/location/states
router.get('/states', (req, res) => {
  res.json({ states: statesList });
});

// GET /api/location/districts?state=TAMIL+NADU
router.get('/districts', (req, res) => {
  const { state } = req.query;
  if (!state || !stateIndex[state]) return res.json({ districts: [] });
  const districts = Object.keys(stateIndex[state]).sort();
  res.json({ districts });
});

// GET /api/location/cities?state=TAMIL+NADU&district=COIMBATORE
router.get('/cities', (req, res) => {
  const { state, district } = req.query;
  if (!state || !district || !stateIndex[state]?.[district]) return res.json({ cities: [] });
  const cities = stateIndex[state][district].sort((a, b) => a.city.localeCompare(b.city));
  res.json({ cities });
});

module.exports = router;
