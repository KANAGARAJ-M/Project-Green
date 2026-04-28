import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Leaf, Shield, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import API from '../api';

export default function Login() {
  const [email, setEmail] = useState('admin@nocorps.in');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post('/auth/admin/login', { email, password });
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_info', JSON.stringify(data.admin));
      toast.success('Welcome, Admin!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-brand">
            <div className="auth-brand-icon"><Leaf size={20} /></div>
            <div>
              <div className="auth-brand-name">GreenMarket</div>
              <div className="auth-brand-sub">Admin Control Panel</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Shield size={20} />
            <div className="auth-card-title">Admin Login</div>
          </div>
          <div className="auth-card-sub">Restricted access — authorized personnel only</div>
        </div>

        <div className="auth-card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label required">Admin Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                <input className="form-control" style={{ paddingLeft: 34 }} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label required">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                <input className="form-control" style={{ paddingLeft: 34, paddingRight: 40 }} type={showPass ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa' }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? <><span className="spinner" />Signing in...</> : <><Shield size={15} />Access Dashboard</>}
            </button>
          </form>

          <div className="alert alert-info" style={{ marginTop: 20, fontSize: 13 }}>
            <strong>Credentials:</strong><br />
            Email: admin@nocorps.in<br />
            Password: Aaaa@1234
          </div>
        </div>
      </div>
    </div>
  );
}
