import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Leaf, ChevronRight, ChevronLeft, Mail, Phone, ShieldCheck } from 'lucide-react';
import API from '../api';
import AddressSelect from '../components/AddressSelect';

// Step order: Personal → Verify OTP → Farm → Bank → Documents
const STEPS = ['Personal', 'Verify', 'Farm', 'Bank', 'Documents'];
const FARM_TYPES = ['organic', 'conventional', 'mixed'];
const PROOF_TYPES = ['PAN', 'DRIVING', 'VoterID'];

export default function Register() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneDemo, setPhoneDemo] = useState(false);

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

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  // ── Step validations ──────────────────────────────────────────────────────
  const validatePersonal = () => {
    if (!form.name || !form.email || !form.phone || !form.password) { toast.error('Fill all required fields'); return false; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return false; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 chars'); return false; }
    if (!form.fullAddress) { toast.error('Enter your full address'); return false; }
    if (!form.state) { toast.error('Please select a State'); return false; }
    if (!form.district) { toast.error('Please select a District'); return false; }
    if (!form.city) { toast.error('Please select a City / Village'); return false; }
    return true;
  };


  // ── Send OTP ──────────────────────────────────────────────────────────────
  const sendOtp = async () => {
    if (!validatePersonal()) return;
    setLoading(true);
    try {
      const { data } = await API.post('/auth/vendor/send-reg-otp', { email: form.email, phone: form.phone });
      setOtpSent(true);
      setPhoneDemo(data.phoneDemo);
      toast.success('OTPs sent to your email & phone');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const verifyOtp = async () => {
    if (!emailOtp || !phoneOtp) { toast.error('Enter both OTPs'); return; }
    setLoading(true);
    try {
      await API.post('/auth/vendor/verify-reg-otp', { email: form.email, emailOtp, phoneOtp });
      toast.success('✅ Both contacts verified!');
      setStep(2); // jump to farm
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Navigate between steps ────────────────────────────────────────────────
  const handleNext = () => {
    if (step === 0) {
      // Go to OTP verify step
      if (!validatePersonal()) return;
      setStep(1);
      if (!otpSent) sendOtp();
      return;
    }
    if (step === 2) {
      if (!form.farmName || !form.farmSize) { toast.error('Fill farm details'); return; }
      if (farmImages.length === 0) { toast.error('Upload at least 1 farm image'); return; }
    }
    if (step === 3) {
      if (!form.bankName || !form.bankAccountNumber || !form.bankIFSC || !form.bankAccountHolder) { toast.error('Fill all bank details'); return; }
    }
    setStep(s => s + 1);
  };

  // ── Final submit ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.addressProofNumber || !addressProofImage) { toast.error('Upload address proof document'); return; }
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
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: 32, paddingBottom: 32 }}>
      {/* ── Square card ── */}
      <div className="auth-card" style={{ maxWidth: 660, borderRadius: 0 }}>
        <div className="auth-card-header" style={{ borderRadius: 0 }}>
          <div className="auth-brand">
            <div className="auth-brand-icon" style={{ borderRadius: 0 }}><Leaf size={22} /></div>
            <div>
              <div className="auth-brand-name">GreenMarket</div>
              <div className="auth-brand-sub">Vendor Registration</div>
            </div>
          </div>
          <div className="auth-card-title">Join as a Farmer/Vendor</div>
          <div className="auth-card-sub">Fill in details to create your farm account</div>
        </div>

        <div className="auth-card-body">
          {/* Step indicators */}
          <div className="steps" style={{ marginBottom: 28 }}>
            {STEPS.map((s, i) => (
              <div key={s} className="step">
                <div className={`step-circle ${i < step ? 'done' : i === step ? 'active' : 'todo'}`} style={{ borderRadius: 4 }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`step-label ${i === step ? 'active' : ''}`}>{s}</span>
                {i < STEPS.length - 1 && <div className={`step-line ${i < step ? 'done' : ''}`} />}
              </div>
            ))}
          </div>

          {/* ── Step 0: Personal & Address ── */}
          {step === 0 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--green-600)' }}>👤 Personal Information</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required">Full Name</label>
                  <input className="form-control" style={{ borderRadius: 4 }} value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Arjun Kumar" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Phone Number</label>
                  <input className="form-control" style={{ borderRadius: 4 }} value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+91 98765 43210" />
                </div>
                <div className="form-group col-span-2">
                  <label className="form-label required">Email Address</label>
                  <input className="form-control" style={{ borderRadius: 4 }} type="email" value={form.email} onChange={e => setField('email', e.target.value)} placeholder="arjun@farm.com" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Password</label>
                  <input className="form-control" style={{ borderRadius: 4 }} type="password" value={form.password} onChange={e => setField('password', e.target.value)} placeholder="••••••••" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Confirm Password</label>
                  <input className="form-control" style={{ borderRadius: 4 }} type="password" value={form.confirmPassword} onChange={e => setField('confirmPassword', e.target.value)} placeholder="••••••••" />
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: 15, margin: '20px 0 14px', color: 'var(--green-600)' }}>📍 Farm / Home Address</div>
              <div className="form-group">
                <label className="form-label required">Full Address</label>
                <textarea className="form-control" style={{ borderRadius: 4 }} rows={2} value={form.fullAddress} onChange={e => setField('fullAddress', e.target.value)} placeholder="Door no, Street, Area..." />
              </div>

              {/* Cascading location dropdowns from loca.json */}
              <AddressSelect
                state={form.state}
                district={form.district}
                city={form.city}
                pincode={form.pincode}
                onChange={setField}
              />

              <div className="form-grid" style={{ marginTop: 14 }}>
                <div className="form-group">
                  <label className="form-label">Landmark</label>
                  <input className="form-control" style={{ borderRadius: 4 }} value={form.landmark} onChange={e => setField('landmark', e.target.value)} placeholder="Near bus stand" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Pincode</label>
                  <input className="form-control" style={{ borderRadius: 4, background: form.pincode ? '#f0fdf4' : undefined }} value={form.pincode} onChange={e => setField('pincode', e.target.value)} placeholder="Auto-filled from city" />
                  {form.pincode && <div className="form-hint" style={{ color: 'var(--green-600)' }}>✓ Auto-filled from city selection</div>}
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: 15, margin: '8px 0 16px', color: 'var(--green-600)' }}>🗺️ Map Location (Optional)</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input className="form-control" style={{ borderRadius: 4 }} type="number" value={form.mapLat} onChange={e => setField('mapLat', e.target.value)} placeholder="11.0168" />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude</label>
                  <input className="form-control" style={{ borderRadius: 4 }} type="number" value={form.mapLng} onChange={e => setField('mapLng', e.target.value)} placeholder="76.9558" />
                </div>
              </div>
            </>
          )}

          {/* ── Step 1: OTP Verification ── */}
          {step === 1 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ width: 60, height: 60, background: '#E8F5E9', borderRadius: 4, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={28} color="var(--green-600)" />
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-dark)' }}>Verify Your Contacts</div>
                <div style={{ fontSize: 14, color: '#888', marginTop: 6 }}>OTPs have been sent to your email and phone</div>
              </div>

              {/* Email OTP */}
              <div className="form-group">
                <label className="form-label required" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={15} color="var(--green-600)" /> Email OTP
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#888', marginLeft: 4 }}>sent to {form.email}</span>
                </label>
                <input
                  className="form-control"
                  style={{ textAlign: 'center', fontSize: 26, letterSpacing: 12, fontWeight: 700, borderRadius: 4 }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={emailOtp}
                  onChange={e => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • •"
                />
              </div>

              {/* Phone OTP */}
              <div className="form-group">
                <label className="form-label required" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Phone size={15} color="var(--green-600)" /> Phone OTP
                  <span style={{ fontSize: 12, fontWeight: 400, color: '#888', marginLeft: 4 }}>sent to {form.phone}</span>
                </label>
                <input
                  className="form-control"
                  style={{ textAlign: 'center', fontSize: 26, letterSpacing: 12, fontWeight: 700, borderRadius: 4 }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={phoneOtp}
                  onChange={e => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • •"
                />
              </div>

              {phoneDemo && (
                <div className="alert alert-warning" style={{ borderRadius: 4, fontSize: 13 }}>
                  📱 <strong>Demo Mode:</strong> Phone OTP is <strong>{form.phone ? '1463' : '—'}</strong> (SMS not sent in test environment)
                </div>
              )}

              <button
                className="btn btn-primary"
                style={{ width: '100%', borderRadius: 4 }}
                onClick={verifyOtp}
                disabled={loading}
              >
                {loading ? <><span className="spinner" /> Verifying...</> : <><ShieldCheck size={16} /> Verify Both OTPs</>}
              </button>

              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ borderRadius: 4 }}
                  onClick={() => { setOtpSent(false); setEmailOtp(''); setPhoneOtp(''); sendOtp(); }}
                  disabled={loading}
                >
                  Resend OTPs
                </button>
              </div>
            </>
          )}

          {/* ── Step 2: Farm Info ── */}
          {step === 2 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--green-600)' }}>🌾 Farm Details</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required">Farm Name</label>
                  <input className="form-control" style={{ borderRadius: 4 }} value={form.farmName} onChange={e => setField('farmName', e.target.value)} placeholder="Green Valley Farm" />
                </div>
                <div className="form-group">
                  <label className="form-label required">Farm Size</label>
                  <input className="form-control" style={{ borderRadius: 4 }} value={form.farmSize} onChange={e => setField('farmSize', e.target.value)} placeholder="5 acres" />
                </div>
                <div className="form-group col-span-2">
                  <label className="form-label required">Farm Type</label>
                  <select className="form-control form-select" style={{ borderRadius: 4 }} value={form.farmType} onChange={e => setField('farmType', e.target.value)}>
                    {FARM_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label required">Farm Images (Up to 3)</label>
                <div className="file-drop" style={{ borderRadius: 4 }} onClick={() => farmImagesRef.current?.click()}>
                  <div className="file-drop-icon">🌿</div>
                  <div className="file-drop-text">Click to upload farm images</div>
                  <div className="file-drop-hint">JPG, PNG, WebP • Max 5MB each • Up to 3</div>
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
                <div className="file-drop" style={{ borderRadius: 4 }} onClick={() => farmLogoRef.current?.click()}>
                  <div className="file-drop-icon">🏷️</div>
                  {farmLogo
                    ? <><img src={URL.createObjectURL(farmLogo)} alt="" style={{ height: 60, borderRadius: 4, margin: '0 auto' }} /><div style={{ fontSize: 13, marginTop: 4 }}>{farmLogo.name}</div></>
                    : <><div className="file-drop-text">Upload your farm logo</div><div className="file-drop-hint">1 image • Max 2MB</div></>
                  }
                </div>
                <input ref={farmLogoRef} type="file" accept="image/*" hidden onChange={e => setFarmLogo(e.target.files?.[0] || null)} />
              </div>
            </>
          )}

          {/* ── Step 3: Bank Info ── */}
          {step === 3 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--green-600)' }}>🏦 Bank Details</div>
              <div className="form-group">
                <label className="form-label required">Bank Name</label>
                <input className="form-control" style={{ borderRadius: 4 }} value={form.bankName} onChange={e => setField('bankName', e.target.value)} placeholder="State Bank of India" />
              </div>
              <div className="form-group">
                <label className="form-label required">Account Holder Name</label>
                <input className="form-control" style={{ borderRadius: 4 }} value={form.bankAccountHolder} onChange={e => setField('bankAccountHolder', e.target.value)} placeholder="As per bank records" />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required">Account Number</label>
                  <input className="form-control" style={{ borderRadius: 4 }} value={form.bankAccountNumber} onChange={e => setField('bankAccountNumber', e.target.value)} placeholder="XXXXXXXXXX" />
                </div>
                <div className="form-group">
                  <label className="form-label required">IFSC Code</label>
                  <input className="form-control" style={{ borderRadius: 4, textTransform: 'uppercase' }} value={form.bankIFSC} onChange={e => setField('bankIFSC', e.target.value)} placeholder="SBIN0001234" />
                </div>
              </div>
            </>
          )}

          {/* ── Step 4: Documents ── */}
          {step === 4 && (
            <>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, color: 'var(--green-600)' }}>📄 Identity Proof</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label required">Document Type</label>
                  <select className="form-control form-select" style={{ borderRadius: 4 }} value={form.addressProofType} onChange={e => setField('addressProofType', e.target.value)}>
                    {PROOF_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label required">Document Number</label>
                  <input className="form-control" style={{ borderRadius: 4 }} value={form.addressProofNumber} onChange={e => setField('addressProofNumber', e.target.value)} placeholder="ABCDE1234F" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">Upload {form.addressProofType}</label>
                <div className="file-drop" style={{ borderRadius: 4 }} onClick={() => addrProofRef.current?.click()}>
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
                { label: 'Patta / Chitta / Adangal', setter: setPattaChitta, val: pattaChitta, icon: '📜' },
                { label: 'Land Ownership Document', setter: setLandOwnership, val: landOwnership, icon: '🏞️' },
                { label: 'Lease Agreement (if rented)', setter: setLeaseAgreement, val: leaseAgreement, icon: '📋' },
                { label: 'Farmer ID Card (State-issued)', setter: setFarmerIdCard, val: farmerIdCard, icon: '🪪' },
                { label: 'Organic Certification (if applicable)', setter: setOrganicCertification, val: organicCertification, icon: '🌿' },
              ].map(({ label, setter, val, icon }) => (
                <div className="form-group" key={label}>
                  <label className="form-label">{label} <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></label>
                  <div className="file-drop" style={{ borderRadius: 4, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => document.getElementById(`doc-${label}`)?.click()}>
                    <span style={{ fontSize: 20 }}>{icon}</span>
                    {val ? <span style={{ fontSize: 14, color: 'var(--green-600)', fontWeight: 500 }}>✅ {val.name}</span> : <span className="file-drop-text" style={{ fontSize: 13 }}>Click to upload</span>}
                  </div>
                  <input id={`doc-${label}`} type="file" accept="image/*,.pdf" hidden onChange={e => setter(e.target.files?.[0] || null)} />
                </div>
              ))}

              <div className="form-group" style={{ marginTop: 8 }}>
                <label className="form-label">GST Number (Optional)</label>
                <input className="form-control" style={{ borderRadius: 4 }} value={form.gst} onChange={e => setField('gst', e.target.value)} placeholder="22AAAAA0000A1Z5" />
              </div>
            </>
          )}

          {/* ── Navigation buttons ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, gap: 12 }}>
            {/* Back */}
            {step === 0
              ? <Link to="/login" className="btn btn-ghost" style={{ borderRadius: 4 }}>← Login</Link>
              : step === 1
                ? <button className="btn btn-ghost" style={{ borderRadius: 4 }} onClick={() => setStep(0)}><ChevronLeft size={16} />Back</button>
                : <button className="btn btn-ghost" style={{ borderRadius: 4 }} onClick={() => setStep(s => s - 1)}><ChevronLeft size={16} />Back</button>
            }

            {/* Forward — hide on OTP step (verify button handles it) */}
            {step !== 1 && (
              step < STEPS.length - 1
                ? <button className="btn btn-primary" style={{ borderRadius: 4 }} onClick={handleNext}>
                    Next <ChevronRight size={16} />
                  </button>
                : <button className="btn btn-primary" style={{ borderRadius: 4 }} onClick={handleSubmit} disabled={loading}>
                    {loading ? <><span className="spinner" /> Submitting...</> : '✅ Submit Registration'}
                  </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
