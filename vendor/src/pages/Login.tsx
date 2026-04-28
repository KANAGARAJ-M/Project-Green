import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Leaf, Mail, Lock, Phone, Key, Eye, EyeOff } from 'lucide-react';
import API from '../api';

type Mode = 'password' | 'otp';

export default function Login() {
  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/auth/vendor/login', { email, password });
      localStorage.setItem('vendor_token', data.token);
      localStorage.setItem('vendor_info', JSON.stringify(data.vendor));
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async () => {
    if (!email) { toast.error('Enter email first'); return; }
    setLoading(true);
    try {
      await API.post('/auth/vendor/send-otp', { email });
      setOtpSent(true);
      toast.success('OTP sent to your email');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/auth/vendor/verify-otp', { email, otp });
      localStorage.setItem('vendor_token', data.token);
      localStorage.setItem('vendor_info', JSON.stringify(data.vendor));
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-brand">
            <div className="auth-brand-icon"><Leaf size={22} /></div>
            <div>
              <div className="auth-brand-name">GreenMarket</div>
              <div className="auth-brand-sub">Fresh from the Farm</div>
            </div>
          </div>
          <div className="auth-card-title">Vendor Login</div>
          <div className="auth-card-sub">Access your farm dashboard</div>
        </div>

        <div className="auth-card-body">
          <div className="tabs">
            <button className={`tab-btn ${mode === 'password' ? 'active' : ''}`} onClick={() => setMode('password')}>
              <Lock size={14} style={{ display: 'inline', marginRight: 6 }} />Password
            </button>
            <button className={`tab-btn ${mode === 'otp' ? 'active' : ''}`} onClick={() => { setMode('otp'); setOtpSent(false); }}>
              <Key size={14} style={{ display: 'inline', marginRight: 6 }} />Email OTP
            </button>
          </div>

          {mode === 'password' ? (
            <form onSubmit={handlePasswordLogin}>
              <div className="form-group">
                <label className="form-label required">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                  <input className="form-control" style={{ paddingLeft: 36 }} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label required">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                  <input className="form-control" style={{ paddingLeft: 36, paddingRight: 42 }} type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpLogin}>
              <div className="form-group">
                <label className="form-label required">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                  <input className="form-control" style={{ paddingLeft: 36 }} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
              </div>
              {!otpSent ? (
                <button type="button" className="btn btn-primary" style={{ width: '100%' }} onClick={sendOtp} disabled={loading}>
                  {loading ? <><span className="spinner" /> Sending...</> : 'Send OTP'}
                </button>
              ) : (
                <>
                  <div className="alert alert-info">OTP sent to <strong>{email}</strong></div>
                  <div className="form-group">
                    <label className="form-label required">Enter OTP</label>
                    <input className="form-control" type="text" placeholder="1234" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} style={{ textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: 700 }} required />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setOtpSent(false); setOtp(''); }}>Resend</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                      {loading ? <><span className="spinner" /> Verifying...</> : 'Verify & Login'}
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#888' }}>
            New farmer? <Link to="/register" style={{ color: 'var(--green-600)', fontWeight: 600, textDecoration: 'none' }}>Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
