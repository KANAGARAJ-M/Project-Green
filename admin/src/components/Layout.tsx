import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UserCheck, Tag, Layers, Package, LogOut, Leaf } from 'lucide-react';
import { useEffect, useState } from 'react';
import API from '../api';

export default function Layout() {
  const navigate = useNavigate();
  const [badges, setBadges] = useState({ pendingVendors: 0, pendingProducts: 0 });
  const admin = JSON.parse(localStorage.getItem('admin_info') || '{"name":"Admin"}');

  useEffect(() => {
    API.get('/admin/stats').then(r => {
      setBadges({ pendingVendors: r.data.stats.pendingVendors, pendingProducts: r.data.stats.pendingProducts });
    }).catch(() => {});
  }, []);

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_info');
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={17} />, label: 'Dashboard' },
    { to: '/verify-vendors', icon: <UserCheck size={17} />, label: 'Verify Farmers', badge: badges.pendingVendors },
    { to: '/verify-products', icon: <Package size={17} />, label: 'Verify Products', badge: badges.pendingProducts },
    { to: '/categories', icon: <Tag size={17} />, label: 'Categories' },
    { to: '/subcategories', icon: <Layers size={17} />, label: 'Sub Categories' },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><Leaf size={18} /></div>
          <div>
            <div className="sidebar-logo-text">GreenMarket</div>
            <div className="sidebar-logo-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">Navigation</div>
          {navItems.map(({ to, icon, label, badge }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-item-icon">{icon}</span>
              {label}
              {badge ? <span className="nav-badge">{badge}</span> : null}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="admin-info">
            <div className="admin-avatar">A</div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{admin.name}</div>
              <div style={{ fontSize: 11, opacity: 0.5 }}>Administrator</div>
            </div>
            <button onClick={logout} title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex' }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
