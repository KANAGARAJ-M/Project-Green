import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, PlusCircle, User, LogOut, Leaf, Store } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const vendor = JSON.parse(localStorage.getItem('vendor_info') || '{}');

  const logout = () => {
    localStorage.removeItem('vendor_token');
    localStorage.removeItem('vendor_info');
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/products', icon: <Package size={18} />, label: 'My Products' },
    { to: '/products/add', icon: <PlusCircle size={18} />, label: 'Add Product' },
    { to: '/profile', icon: <User size={18} />, label: 'Account Profile' },
    { to: '/shop-profile', icon: <Store size={18} />, label: 'Shop Profile Preview' },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon"><Leaf size={20} /></div>
          <div>
            <div className="sidebar-logo-text">GreenMarket</div>
            <div className="sidebar-logo-sub">Vendor Portal</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Main Menu</div>
          {navItems.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-item-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="vendor-card">
            <div className="vendor-avatar">
              {vendor.farmLogo
                ? <img src={`http://localhost:5000${vendor.farmLogo}`} alt="" />
                : (vendor.name?.[0] || 'V')}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div className="vendor-name">{vendor.name || 'Vendor'}</div>
              <div className="vendor-role">{vendor.farmName || 'Farm'}</div>
            </div>
            <button onClick={logout} title="Logout" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center' }}>
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
