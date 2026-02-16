import React, { useState, useEffect } from 'react';
import './styles/App.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import DeviceManagement from './pages/DeviceManagement';
import ClassroomManagement from './pages/ClassroomManagement';
import PowerControl from './pages/PowerControl';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      // Check if token is expired by decoding JWT payload
      try {
        const payload = JSON.parse(atob(storedToken.split('.')[1]));
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          // Token expired — clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return;
        }
      } catch (e) {
        // If token can't be decoded, clear it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return;
      }
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthError = () => {
    handleLogout();
  };

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
    { id: 'classrooms', label: 'Classrooms', icon: '🏫' },
    { id: 'devices', label: 'Devices', icon: '📡' },
    { id: 'power', label: 'Power Control', icon: '⚡' },
    { id: 'users', label: 'Users', icon: '👥' },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard token={token} onAuthError={handleAuthError} />;
      case 'users':
        return <UserManagement token={token} onAuthError={handleAuthError} />;
      case 'devices':
        return <DeviceManagement token={token} onAuthError={handleAuthError} />;
      case 'classrooms':
        return <ClassroomManagement token={token} onAuthError={handleAuthError} />;
      case 'power':
        return <PowerControl token={token} onAuthError={handleAuthError} />;
      default:
        return <Dashboard token={token} onAuthError={handleAuthError} />;
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">🎓</div>
          <div className="brand-text">
            <h1>Smart Classroom</h1>
            <span>Admin Panel</span>
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
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.username}</div>
              <div className="user-role">{user?.role || 'Admin'}</div>
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
              <a href="#" onClick={e => { e.preventDefault(); setCurrentPage('classrooms'); }}>Classrooms</a>
              <a href="#" onClick={e => { e.preventDefault(); setCurrentPage('devices'); }}>Devices</a>
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
