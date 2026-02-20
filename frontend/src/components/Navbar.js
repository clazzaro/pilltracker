import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar({ user, onLogout }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/dashboard" className="navbar-brand">
          Customer Portal
        </Link>
        
        <div className="navbar-menu">
          <Link to="/dashboard" className={`navbar-link ${isActive('/dashboard')}`}>
            Dashboard
          </Link>
          <Link to="/orders" className={`navbar-link ${isActive('/orders')}`}>
            Orders
          </Link>
          <Link to="/tickets" className={`navbar-link ${isActive('/tickets')}`}>
            Support
          </Link>
          <Link to="/billing" className={`navbar-link ${isActive('/billing')}`}>
            Billing
          </Link>
        </div>

        <div className="navbar-user">
          <span className="navbar-username">
            {user?.name || user?.email}
          </span>
          <button onClick={onLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

// Made with Bob
