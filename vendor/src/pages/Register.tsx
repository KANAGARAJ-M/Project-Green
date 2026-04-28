import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Leaf, ChevronRight, ChevronLeft, Upload, X } from 'lucide-react';
import API from '../api';

const STEPS = ['Personal', 'Farm', 'Bank', 'Documents'];

const FARM_TYPES = ['organic', 'conventional', 'mixed'];
const UNITS = ['g', 'kg', 'ml', 'l', 'pcs', 'pack', 'ton', 'dozen', 'bundle'];
const PROOF_TYPES = ['PAN', 'DRIVING', 'VoterID'];

interface LocaData { [state: string]: { [district: string]: string[] } }

export default function Register() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [locaData, setLocaData] = useState<LocaData>({});
  const navigate = useNavigate();

  // Form state
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    fullAddress: '', state: '', district: '', city: '', landmark: '', pincode: '',
    mapLat: '', mapLng: '',
    farmName: '', farmSize: '', farmType: 'organic',
    bankName: '', bankAccountNumber: '', bankIFSC: '', bankAccountHolder: '',
    addressProofType: 'PAN', addressProofNumber: '',
    gst: '',
  });

  const [farmImages, setFarmImages] = useState<File[]>([]);
  const [farmLogo, setFarmLogo] = useState<File | null>(null);
  const [addressProofImage, setAddressProofImage] = useState<File | null>(null);
  const [pattaChitta, setPattaChitta] = useState<File | null>(null);
  const [landOwnership, setLandOwnership] = useState<File | null>(null);
  const [leaseAgreement, setLeaseAgreement] = useState<File | null>(null);
  const [farmerIdCard, setFarmerIdCard] = useState<File | null>(null);
  const [organicCertification, setOrganicCertification] = useState<File | null>(null);

  const farmImagesRef = useRef<HTMLInputElement>(null);
  const farmLogoRef = useRef<HTMLInputElement>(null);
  const addrProofRef = useRef<HTMLInputElement>(null);

  // Load location data
  useEffect(() => {
    fetch('/../../shared/loca.json').catch(() => {});
    fetch('http://localhost:5000/../shared/loca.json').catch(() => {});
  }, []);

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const renderPreviews = (files: File[]) => (
    <div className="file-preview-grid">
      {files.map((f, i) => (
        <div key={i} className="file-preview">
          <img src={URL.createObjectURL(f)} alt="" />
          <button className="file-preview-remove" onClick={() => setFarmImages(prev => prev.filter((_, idx) => idx !== i))}>×</button>
        </div>
      ))}
    </div>
  );

  const validateStep = () => {
    if (step === 0) {
      if (!form.name || !form.email || !form.phone || !form.password) { toast.error('Fill all required fields'); return false; }
      if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return false; }
      if (form.password.length < 6) { toast.error('Password must be at least 6 chars'); return false; }
      if (!form.fullAddress || !form.state || !form.district || !form.city || !form.pincode) { toast.error('Fill complete address'); return false; }
    }
    if (step === 1) {
      if (!form.farmName || !form.farmSize) { toast.error('Fill farm details'); return false; }
      if (farmImages.length === 0) { toast.error('Upload at least 1 farm image'); return false; }
    }
    if (step === 2) {
      if (!form.bankName || !form.bankAccountNumber || !form.bankIFSC || !form.bankAccountHolder) { toast.error('Fill all bank details'); return false; }
    }
    if (step === 3) {
      if (!form.addressProofNumber || !addressProofImage) { toast.error('Upload address proof document'); return false; }
    }
    return true;
  };

  const handleNext = () => { if (validateStep()) setStep(s => s + 1); };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (k !== 'confirmPassword') fd.append(k, v); });
      farmImages.forEach(f => fd.append('farmImages', f));
      if (farmLogo) fd.append('farmLogo', farmLogo);
      if (addressProofImage) fd.append('addressProofImage', addressProofImage);
      if (pattaChitta) fd.append('pattaChitta', pattaChitta);
      if (landOwnership) fd.append('landOwnership', landOwnership);
      if (leaseAgreement) fd.append('leaseAgreement', leaseAgreement);
      if (farmerIdCard) fd.append('farmerIdCard', farmerIdCard);
      if (organicCertification) fd.append('organicCertification', organicCertification);

      await API.post('/auth/vendor/register', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Registration submitted! Admin will verify your account.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: 32, paddingBottom: 32 }}>
      <div className="auth-card" style={{ maxWidth: 640 }}>
        <div className="auth-card-header">
          <div className="auth-brand">
            <div className="auth-brand-icon"><Leaf size={22} /></div>
            <div>
              <div className="auth-brand-name">GreenMarket</div>
              <div className="auth-brand-sub">Vendor Registration</div>
            </div>
          </div>
          <div className="auth-card-title">Join as a Farmer/Vendor</div>
          <div className="auth-card-sub">Fill in details to create your farm account</div>
        </div>

        <div className="auth-card-body">
          {/* Steps */}
          <div className="steps" style={{ marginBottom: 28 }}>
            {STEPS.map((s, i) => (
              <div key={s} className="step">
                <div className={`step-circle ${i < step ? 'done' : i === step ? 'active' : 'todo'}`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`step-label ${i === step ? 'active' : ''}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} />}
              </div>
            ))}
          </div>

          {/* Step 0: Personal & Address */}
          {step === 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--green-600)' }}>👤 Personal Information</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required">Full Name</label>
                  <input className="form-control" value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Arjun Kumar" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Phone Number</label>
                  <input className="form-control" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <div className="form-group col-span-2">
                  <label className="form-label required">Email Address</label>
                  <input className="form-control" type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="arjun@farm.com" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Password</label>
                  <input className="form-control" type="password" value={form.password} onChange={e => setField('password', e.target.value)} placeholder="••••••••" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Confirm Password</label>
                  <input className="form-control" type="password" value={form.confirmPassword} onChange={e => setField('confirmPassword', e.target.value)} placeholder="••••••••" />
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: 15, margin: '20px 0 16px', color: 'var(--green-600)' }}>📍 Farm/Home Address</div>
              <div className="form-group">
                <label className="form-label required">Full Address</label>
                <textarea className="form-control" rows={2} value={form.fullAddress} onChange={e => setField('fullAddress', e.target.value)} placeholder="House/Farm address..." />
              </div>
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input className="form-control" value="India" disabled style={{ background: '#f5f5f5' }} />
                </div>
                <div className="form-group">
                  <label className="form-label required">State</label>
                  <input className="form-control" value={form.state} onChange={e => setField('state', e.target.value)} placeholder="Tamil Nadu" />
                </div>
                <div className="form-group">
                  <label className="form-label required">District</label>
                  <input className="form-control" value={form.district} onChange={e => setField('district', e.target.value)} placeholder="Coimbatore" />
                </div>
                <div className="form-group">
                  <label className="form-label required">City / Village</label>
                  <input className="form-control" value={form.city} onChange={e => setField('city', e.target.value)} placeholder="Pollachi" />
                </div>
                <div className="form-group">
                  <label className="form-label">Landmark</label>
                  <input className="form-control" value={form.landmark} onChange={e => setField('landmark', e.target.value)} placeholder="Near bus stand" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Pincode</label>
                  <input className="form-control" value={form.pincode} onChange={e => setField('pincode', e.target.value)} placeholder="642001" />
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: 15, margin: '8px 0 16px', color: 'var(--green-600)' }}>🗺️ Map Location (Optional)</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input className="form-control" type="number" value={form.mapLat} onChange={e => setField('mapLat', e.target.value)} placeholder="11.0168" />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input className="form-control" type="number" value={form.mapLng} onChange={e => setField('mapLng', e.target.value)} placeholder="76.9558" />
                </div>
              </div>
            </>
          )}

          {/* Step 1: Farm Info */}
          {step === 1 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--green-600)' }}>🌾 Farm Details</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required">Farm Name</label>
                  <input className="form-control" value={form.farmName} onChange={e => setField('farmName', e.target.value)} placeholder="Green Valley Farm" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Farm Size</label>
                  <input className="form-control" value={form.farmSize} onChange={e => setField('farmSize', e.target.value)} placeholder="5 acres" />
                </div>
                <div className="form-group col-span-2">
                  <label className="form-label required">Farm Type</label>
                  <select className="form-control form-select" value={form.farmType} onChange={e => setField('farmType', e.target.value)}>
                    {FARM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">Farm Images (Up to 3)</label>
                <div className="file-drop" onClick={() => farmImagesRef.current?.click()}>
                  <div className="file-drop-icon">🌿</div>
                  <div className="file-drop-text">Click to upload farm images</div>
                  <div className="file-drop-hint">JPG, PNG, WebP • Max 5MB each • Up to 3 images</div>
                </div>
                <input ref={farmImagesRef} type="file" accept="image/*" multiple hidden onChange={e => {
                  const files = Array.from(e.target.files || []).slice(0, 3);
                  setFarmImages(prev => [...prev, ...files].slice(0, 3));
                  e.target.value = '';
                }} />
                {renderPreviews(farmImages)}
              </div>

              <div className="form-group">
                <label className="form-label">Farm Logo (Optional)</label>
                <div className="file-drop" onClick={() => farmLogoRef.current?.click()}>
                  <div className="file-drop-icon">🏷️</div>
                  {farmLogo
                    ? <><img src={URL.createObjectURL(farmLogo)} alt="" style={{ height: 60, borderRadius: 8, margin: '0 auto' }} />{farmLogo.name}</>
                    : <><div className="file-drop-text">Upload your farm logo</div><div className="file-drop-hint">1 image • Max 2MB</div></>
                  }
                </div>
                <input ref={farmLogoRef} type="file" accept="image/*" hidden onChange={e => setFarmLogo(e.target.files?.[0] || null)} />
              </div>
            </>
          )}

          {/* Step 2: Bank Info */}
          {step === 2 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--green-600)' }}>🏦 Bank Details</div>
              <div className="form-group">
                <label className="form-label required">Bank Name</label>
                <input className="form-control" value={form.bankName} onChange={e => setField('bankName', e.target.value)} placeholder="State Bank of India" />
              </div>
              <div className="form-group">
                <label className="form-label required">Account Holder Name</label>
                <input className="form-control" value={form.bankAccountHolder} onChange={e => setField('bankAccountHolder', e.target.value)} placeholder="As per bank records" />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required">Account Number</label>
                  <input className="form-control" value={form.bankAccountNumber} onChange={e => setField('bankAccountNumber', e.target.value)} placeholder="XXXXXXXXXX" />
                </div>
                <div className="form-group">
                  <label className="form-label required">IFSC Code</label>
                  <input className="form-control" value={form.bankIFSC} onChange={e => setField('bankIFSC', e.target.value)} placeholder="SBIN0001234" style={{ textTransform: 'uppercase' }} />
                </div>
              </div>
            </>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--green-600)' }}>📄 Identity Proof</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required">Document Type</label>
                  <select className="form-control form-select" value={form.addressProofType} onChange={e => setField('addressProofType', e.target.value)}>
                    {PROOF_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label required">Document Number</label>
                  <input className="form-control" value={form.addressProofNumber} onChange={e => setField('addressProofNumber', e.target.value)} placeholder="ABCDE1234F" style={{ textTransform: 'uppercase' }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">Upload {form.addressProofType}</label>
                <div className="file-drop" onClick={() => addrProofRef.current?.click()}>
                  <div className="file-drop-icon">🪪</div>
                  {addressProofImage
                    ? <div className="file-drop-text">✅ {addressProofImage.name}</div>
                    : <><div className="file-drop-text">Upload document image</div><div className="file-drop-hint">JPG, PNG, PDF • Max 5MB</div></>
                  }
                </div>
                <input ref={addrProofRef} type="file" accept="image/*,.pdf" hidden onChange={e => setAddressProofImage(e.target.files?.[0] || null)} />
              </div>

              <div style={{ fontWeight: 700, fontSize: 15, margin: '20px 0 16px', color: 'var(--green-600)' }}>🌱 Land & Farm Documents</div>
              {[
                { label: 'Patta / Chitta / Adangal', key: 'pattaChitta', setter: setPattaChitta, val: pattaChitta, icon: '📜' },
                { label: 'Land Ownership Document', key: 'landOwnership', setter: setLandOwnership, val: landOwnership, icon: '🏞️' },
                { label: 'Lease Agreement (if rented)', key: 'leaseAgreement', setter: setLeaseAgreement, val: leaseAgreement, icon: '📋' },
                { label: 'Farmer ID Card (State-issued)', key: 'farmerIdCard', setter: setFarmerIdCard, val: farmerIdCard, icon: '🪪' },
                { label: 'Organic Certification (if applicable)', key: 'organicCertification', setter: setOrganicCertification, val: organicCertification, icon: '🌿' },
              ].map(({ label, setter, val, icon }) => {
                const ref = { current: null as HTMLInputElement | null };
                return (
                  <div className="form-group" key={label}>
                    <label className="form-label">{label} <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
                    <div className="file-drop" onClick={() => document.getElementById(`doc-${label}`)?.click()} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 20 }}>{icon}</span>
                      <div style={{ textAlign: 'left' }}>
                        {val ? <span style={{ fontSize: 14, color: 'var(--green-600)', fontWeight: 500 }}>✅ {val.name}</span> : <span className="file-drop-text" style={{ fontSize: 13 }}>Click to upload</span>}
                      </div>
                    </div>
                    <input id={`doc-${label}`} type="file" accept="image/*,.pdf" hidden onChange={e => setter(e.target.files?.[0] || null)} />
                  </div>
                );
              })}

              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label">GST Number (Optional)</label>
                <input className="form-control" value={form.gst} onChange={e => setField('gst', e.target.value)} placeholder="22AAAAA0000A1Z5" style={{ textTransform: 'uppercase' }} />
              </div>
            </>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, gap: 12 }}>
            {step > 0
              ? <button className="btn btn-ghost" onClick={() => setStep(s => s - 1)}><ChevronLeft size={16} />Back</button>
              : <Link to="/login" className="btn btn-ghost">← Login</Link>
            }
            {step < STEPS.length - 1
              ? <button className="btn btn-primary" onClick={handleNext}>Next<ChevronRight size={16} /></button>
              : <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>{loading ? <><span className="spinner" /> Submitting...</> : '✅ Submit Registration'}</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
}
