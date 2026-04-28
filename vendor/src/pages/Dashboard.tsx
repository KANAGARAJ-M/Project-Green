import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, TrendingUp, Clock, CheckCircle, XCircle, PlusCircle, Leaf } from 'lucide-react';
import API from '../api';

interface Stats {
  totalProducts: number;
  approved: number;
  pending: number;
  rejected: number;
  estimatedInventoryValue: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [vendorInfo, setVendorInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const info = JSON.parse(localStorage.getItem('vendor_info') || '{}');
    setVendorInfo(info);
    API.get('/vendor/dashboard').then(r => setStats(r.data.stats)).finally(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = stats ? [
    { label: 'Total Products', value: stats.totalProducts, icon: <Package size={22} />, color: 'blue' },
    { label: 'Approved', value: stats.approved, icon: <CheckCircle size={22} />, color: 'green' },
    { label: 'Pending Review', value: stats.pending, icon: <Clock size={22} />, color: 'orange' },
    { label: 'Rejected', value: stats.rejected, icon: <XCircle size={22} />, color: 'red' },
  ] : [];

  return (
    <>
      {/* Topbar */}
      <div className="topbar">
        <div>
          <div className="topbar-title">{greeting()}, {vendorInfo.name?.split(' ')[0] || 'Farmer'}! 👋</div>
          <div className="topbar-subtitle">Here's your farm overview</div>
        </div>
        <div className="topbar-actions">
          <Link to="/products/add" className="btn btn-primary"><PlusCircle size={16} />Add Product</Link>
        </div>
      </div>

      <div className="page-content">
        {/* Farm banner */}
        <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, #2E7D32, #4CAF50)', border: 'none', color: '#fff', padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
            {vendorInfo.farmLogo ? <img src={`http://localhost:5000${vendorInfo.farmLogo}`} alt="" style={{ width: '100%', height: '100%', borderRadius: 16, objectFit: 'cover' }} /> : '🌾'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{vendorInfo.farmName || 'Your Farm'}</div>
            <div style={{ opacity: 0.8, fontSize: 14, marginTop: 4 }}>Your farm is live on GreenMarket 🌱</div>
          </div>
          {stats && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 800 }}>₹{stats.estimatedInventoryValue.toLocaleString('en-IN')}</div>
              <div style={{ opacity: 0.8, fontSize: 13 }}>Est. Inventory Value</div>
            </div>
          )}
        </div>

        {/* Stats */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Loading dashboard...</div>
        ) : (
          <div className="stats-grid">
            {statCards.map(c => (
              <div key={c.label} className="stat-card">
                <div className={`stat-icon ${c.color}`}>{c.icon}</div>
                <div>
                  <div className="stat-value">{c.value}</div>
                  <div className="stat-label">{c.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick actions */}
        <div className="card">
          <div className="card-header"><div className="card-title">Quick Actions</div></div>
          <div className="card-body">
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/products/add" className="btn btn-primary"><PlusCircle size={16} />List New Product</Link>
              <Link to="/products?status=pending" className="btn btn-outline"><Clock size={16} />View Pending</Link>
              <Link to="/products?status=rejected" className="btn btn-ghost"><XCircle size={16} />View Rejected</Link>
              <Link to="/profile" className="btn btn-ghost"><Leaf size={16} />My Profile</Link>
            </div>
          </div>
        </div>

        {/* Info notice */}
        {stats && stats.pending > 0 && (
          <div className="alert alert-warning" style={{ marginTop: 16 }}>
            ⏳ You have <strong>{stats.pending}</strong> product(s) pending admin review. They will be visible to customers once approved.
          </div>
        )}
        {stats && stats.rejected > 0 && (
          <div className="alert alert-error" style={{ marginTop: 8 }}>
            ❌ <strong>{stats.rejected}</strong> product(s) were rejected. <Link to="/products?status=rejected" style={{ color: 'inherit', fontWeight: 700 }}>View & edit them</Link> to resubmit.
          </div>
        )}
      </div>
    </>
  );
}
