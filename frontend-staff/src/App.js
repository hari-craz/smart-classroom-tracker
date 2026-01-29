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
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Smart Classroom Portal</h1>
        </div>
        <ul className="navbar-menu">
          <li><button onClick={() => setCurrentPage('dashboard')}>Dashboard</button></li>
          <li><button onClick={() => setCurrentPage('book')}>Book Classroom</button></li>
          <li><button onClick={() => setCurrentPage('my-bookings')}>My Bookings</button></li>
          <li><button onClick={() => setCurrentPage('contact')}>Contact Us</button></li>
          <li className="user-info">
            <span>{user?.username}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </li>
        </ul>
      </nav>

      <main className="main-content">
        {renderPage()}
      </main>

      <footer className="footer">
        <p>&copy; 2026 Smart Classroom Utilization Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
