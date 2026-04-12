import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const navItems = [
  { path: '/farmers',  label: 'Farmers' },
  { path: '/entries',  label: 'New Entry' },
  { path: '/payments', label: 'Payments' },
  { path: '/produce',  label: 'Produce' },
  { path: '/reports',  label: 'Reports' },
];

function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>VegCenter</h2>
        <p>Management System</p>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? 'nav-item active' : 'nav-item'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <p>VegCenter v1.0</p>
      </div>
    </div>
  );
}

export default Sidebar;