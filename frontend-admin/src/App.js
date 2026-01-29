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
    // Check for stored token on mount
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

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard token={token} />;
      case 'users':
        return <UserManagement token={token} />;
      case 'devices':
        return <DeviceManagement token={token} />;
      case 'classrooms':
        return <ClassroomManagement token={token} />;
      case 'power':
        return <PowerControl token={token} />;
      default:
        return <Dashboard token={token} />;
    }
  };

  return (
    <div className="app">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Smart Classroom Admin</h1>
        </div>
        <ul className="navbar-menu">
          <li><button onClick={() => setCurrentPage('dashboard')}>Dashboard</button></li>
          <li><button onClick={() => setCurrentPage('classrooms')}>Classrooms</button></li>
          <li><button onClick={() => setCurrentPage('devices')}>Devices</button></li>
          <li><button onClick={() => setCurrentPage('power')}>Power Control</button></li>
          <li><button onClick={() => setCurrentPage('users')}>Users</button></li>
          <li className="user-info">
            <span>{user?.username}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </li>
        </ul>
      </nav>

      <main className="main-content">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
