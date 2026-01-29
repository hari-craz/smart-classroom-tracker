import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';
import API_URL from '../config';

function StaffDashboard({ token }) {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClassrooms = async () => {
      if (!token) {
        setError('No authentication token');
        setLoading(false);
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/api/staff/classrooms`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch classrooms');
        }

        const data = await response.json();
        setClassrooms(data);
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
    const interval = setInterval(fetchClassrooms, 30000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) return <div className="loading">Loading classrooms...</div>;

  return (
    <div className="dashboard">
      <h2>Available Classrooms</h2>

      {error && <div className="error-alert">{error}</div>}

      <div className="classrooms-grid">
        {classrooms.map(classroom => (
          <div key={classroom.id} className="classroom-card">
            <h3>{classroom.name}</h3>
            <p className="location">📍 {classroom.location || 'Location not specified'}</p>
            
            <div className="room-details">
              <div className="detail-row">
                <span>Capacity:</span>
                <strong>{classroom.capacity || '-'} seats</strong>
              </div>
              <div className="detail-row">
                <span>Current Status:</span>
                <span className={`badge ${classroom.status?.is_occupied ? 'occupied' : 'idle'}`}>
                  {classroom.status?.is_occupied ? '🔴 Occupied' : '🟢 Available'}
                </span>
              </div>
              <div className="detail-row">
                <span>Power:</span>
                <span className={`badge ${classroom.status?.is_power_on ? 'on' : 'off'}`}>
                  {classroom.status?.is_power_on ? '⚡ ON' : '⚫ OFF'}
                </span>
              </div>
            </div>

            {classroom.status?.last_movement !== undefined && (
              <div className="info-text">
                Last activity: {classroom.status.last_movement} seconds ago
              </div>
            )}

            <button className="book-btn">Book This Room</button>
          </div>
        ))}
      </div>

      {classrooms.length === 0 && (
        <div className="empty-state">
          <p>No classrooms available at the moment.</p>
        </div>
      )}
    </div>
  );
}

export default StaffDashboard;
