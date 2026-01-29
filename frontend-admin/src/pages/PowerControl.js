import React, { useState, useEffect } from 'react';
import '../styles/PowerControl.css';
import API_URL from '../config';

function PowerControl({ token }) {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/classrooms`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch classrooms');
        }

        const data = await response.json();
        setClassrooms(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, [token, refreshTrigger]);

  const handlePowerControl = async (classroomId, powerOn) => {
    try {
      const response = await fetch(
        `/api/admin/power/${classroomId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ power_on: powerOn }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to control power');
      }

      setSuccess(`Power ${powerOn ? 'turned ON' : 'turned OFF'}`);
      setRefreshTrigger(prev => prev + 1);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="power-control-container">
      <h2>Power Control</h2>

      {error && <div className="error-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      <div className="power-grid">
        {classrooms.map(classroom => (
          <div key={classroom.id} className="power-card">
            <h3>{classroom.name}</h3>
            <p className="location">{classroom.location || 'Location not set'}</p>

            <div className="status-info">
              <div className="info-item">
                <span>Status:</span>
                <span className={`badge ${classroom.status?.is_occupied ? 'occupied' : 'idle'}`}>
                  {classroom.status?.is_occupied ? 'Occupied' : 'Idle'}
                </span>
              </div>
              <div className="info-item">
                <span>Current Power:</span>
                <span className={`badge ${classroom.status?.is_power_on ? 'on' : 'off'}`}>
                  {classroom.status?.is_power_on ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {classroom.esp_device_id ? (
              <div className="button-group">
                <button
                  className="btn btn-success"
                  onClick={() => handlePowerControl(classroom.id, true)}
                  disabled={classroom.status?.is_power_on}
                >
                  Turn On
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handlePowerControl(classroom.id, false)}
                  disabled={!classroom.status?.is_power_on}
                >
                  Turn Off
                </button>
              </div>
            ) : (
              <p className="warning">⚠️ No device assigned</p>
            )}
          </div>
        ))}
      </div>

      {classrooms.length === 0 && (
        <div className="empty-state">
          <p>No classrooms available. Create some classrooms first.</p>
        </div>
      )}
    </div>
  );
}

export default PowerControl;
