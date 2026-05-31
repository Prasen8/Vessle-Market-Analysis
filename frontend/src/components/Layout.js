import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { to: '/regional', label: 'Regional View', icon: '⌖' },
  { to: '/aggregated', label: 'Aggregated View', icon: '⊕' },
  { to: '/entry', label: 'Data Entry', icon: '✎', adminOnly: true },
];

export default function Layout({ children }) {
  const { user, logout, isAdmin } = useAuth();
  const nav = useNavigate();

  const handleLogout = async () => {
    await logout();
    nav('/login');
  };

  const visibleNav = navItems.filter(n => !n.adminOnly || isAdmin);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-icon">⚓</span>
          <div>
            <div className="brand-name">Vessel Market</div>
            <div className="brand-sub">Performance</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => {
            if (item.adminOnly && !isAdmin) {
              return (
                <div key={item.to} className="nav-item nav-item--locked" title="Admin only">
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  <span className="nav-lock">🔒</span>
                </div>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'nav-item--active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.username?.[0]?.toUpperCase()}</div>
            <div>
              <div className="user-name">{user?.username}</div>
              <div className={`user-role ${isAdmin ? 'role-admin' : 'role-user'}`}>
                {isAdmin ? '● Admin' : '● User'}
              </div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-title" id="page-title" />
          <div className="topbar-right">
            <span className={`role-badge ${isAdmin ? 'badge-admin' : 'badge-user'}`}>
              {isAdmin ? 'Admin' : 'User'}
            </span>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
