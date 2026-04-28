import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Package, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import API from '../api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/stats').then(r => setStats(r.data.stats)).finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { label: 'Total Farmers', value: stats.totalVendors, icon: <Users size={22} />, color: 'blue' },
    { label: 'Approved Farmers', value: stats.approvedVendors, icon: <CheckCircle size={22} />, color: 'green' },
    { label: 'Pending Farmers', value: stats.pendingVendors, icon: <Clock size={22} />, color: 'orange' },
    { label: 'Approved Products', value: stats.approvedProducts, icon: <Package size={22} />, color: 'green' },
    { label: 'Pending Products', value: stats.pendingProducts, icon: <ShieldCheck size={22} />, color: 'orange' },
  ] : [];

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Admin Dashboard</div>
          <div className="topbar-subtitle">Overview of GreenMarket platform</div>
        </div>
      </div>

      <div className="page-content">
        {/* Welcome banner */}
        <div className="card" style={{ background: 'linear-gradient(135deg, #1a2e1b, #2E7D32)', color: '#fff', border: 'none', padding: '28px 32px', marginBottom: 24 }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Welcome, Administrator 🌿</div>
          <div style={{ opacity: 0.8, fontSize: 14, marginTop: 6 }}>Manage farmers, products, and categories from here.</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            <Link to="/verify-vendors" className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)' }}>
              <Users size={15} /> Verify Farmers
            </Link>
            <Link to="/verify-products" className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)' }}>
              <Package size={15} /> Verify Products
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Loading...</div>
        ) : (
          <div className="stats-grid">
            {statCards.map(c => (
              <div key={c.label} className="stat-card">
                <div className={`stat-icon ${c.color}`}>{c.icon}</div>
                <div className="stat-value">{c.value}</div>
                <div className="stat-label">{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Quick links */}
        <div className="card">
          <div className="card-header"><div className="card-title">Quick Actions</div></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { to: '/verify-vendors', icon: '👨‍🌾', label: 'Verify Pending Farmers', count: stats?.pendingVendors },
                { to: '/verify-products', icon: '📦', label: 'Review Pending Products', count: stats?.pendingProducts },
                { to: '/categories', icon: '🏷️', label: 'Manage Categories', count: null },
                { to: '/subcategories', icon: '🗂️', label: 'Manage Sub Categories', count: null },
              ].map(item => (
                <Link key={item.to} to={item.to} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: '#FAFAFA', borderRadius: 10, border: '1px solid var(--border)', transition: 'all 0.15s', color: 'var(--text-dark)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--green-500)'; (e.currentTarget as HTMLElement).style.background = '#E8F5E9'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = '#FAFAFA'; }}>
                  <span style={{ fontSize: 24 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{item.label}</div>
                    {item.count !== null && <div style={{ fontSize: 12, color: item.count ? 'var(--orange)' : '#aaa', fontWeight: 600 }}>{item.count} pending</div>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
