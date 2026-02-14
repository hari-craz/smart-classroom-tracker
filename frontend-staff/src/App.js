import React, { useState, useEffect } from 'react';
import './styles/App.css';
import Login from './pages/Login';
import StaffDashboard from './pages/StaffDashboard';
import BookingPortal from './pages/BookingPortal';
import MyBookings from './pages/MyBookings';
import ContactUs from './pages/ContactUs';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (userToken, userData) => {
    setToken(userToken);
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setCurrentPage('dashboard');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'book', label: 'Book Classroom', icon: '📅' },
    { id: 'my-bookings', label: 'My Bookings', icon: '📋' },
    { id: 'contact', label: 'Contact Us', icon: '💬' },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <StaffDashboard token={token} />;
      case 'book':
        return <BookingPortal token={token} />;
      case 'my-bookings':
        return <MyBookings token={token} />;
      case 'contact':
        return <ContactUs />;
      default:
        return <StaffDashboard token={token} />;
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">🎓</div>
          <div className="brand-text">
            <h1>Smart Classroom</h1>
            <span>Staff Portal</span>
          </div>
        </div>

        <ul className="sidebar-nav">
          {navItems.map(item => (
            <li key={item.id}>
              <button
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => setCurrentPage(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user?.username?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.username}</div>
              <div className="user-role">{user?.role || 'Staff'}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            🚪 Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        {renderPage()}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-content">
            <div className="footer-left">
              <div className="footer-brand-icon">🎓</div>
              <p className="footer-copyright">
                © 2026 <span>Smart Classroom</span> Utilization Tracker. All rights reserved.
              </p>
            </div>
            <div className="footer-links">
              <a href="#" onClick={e => { e.preventDefault(); setCurrentPage('dashboard'); }}>Dashboard</a>
              <a href="#" onClick={e => { e.preventDefault(); setCurrentPage('book'); }}>Book Room</a>
              <a href="#" onClick={e => { e.preventDefault(); setCurrentPage('contact'); }}>Support</a>
              <div className="footer-divider" />
              <div className="footer-status">
                <div className="footer-status-dot" />
                System Online
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Mesh sphere decorations */}
      <div className="mesh-sphere mesh-sphere--1" />
      <div className="mesh-sphere mesh-sphere--2" />
      <div className="mesh-sphere mesh-sphere--3" />

      {/* Ambient floating orbs for depth */}
      <div className="ambient-orb ambient-orb--1" />
      <div className="ambient-orb ambient-orb--2" />
      <div className="ambient-orb ambient-orb--3" />

      {/* Shimmer particles */}
      <div className="shimmer-particle" />
      <div className="shimmer-particle" />
      <div className="shimmer-particle" />
      <div className="shimmer-particle" />
      <div className="shimmer-particle" />
      <div className="shimmer-particle" />
      <div className="shimmer-particle" />
      <div className="shimmer-particle" />
    </div>
  );
}

export default App;
