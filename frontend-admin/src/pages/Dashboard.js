import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';
import API_URL from '../config';

function Dashboard({ token }) {
  const [classrooms, setClassrooms] = useState([]);
  const [stats, setStats] = useState({
    totalClassrooms: 0,
    occupiedClassrooms: 0,
    poweredOnClassrooms: 0,
    totalDevices: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/classrooms`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        setClassrooms(data);

        // Calculate stats
        const stats = {
        totalClassrooms: data.length,
        occupiedClassrooms: data.filter(c => c.status?.is_occupied).length,
        poweredOnClassrooms: data.filter(c => c.status?.is_power_on).length,
        totalDevices: data.filter(c => c.esp_device_id).length,
      };

      setStats(stats);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchDashboardData();
  const interval = setInterval(fetchDashboardData, 30000);
  return () => clearInterval(interval);
}, [token]);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>

      {error && <div className="error-alert">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.totalClassrooms}</h3>
          <p>Total Classrooms</p>
        </div>
        <div className="stat-card occupied">
          <h3>{stats.occupiedClassrooms}</h3>
          <p>Occupied Now</p>
        </div>
        <div className="stat-card powered">
          <h3>{stats.poweredOnClassrooms}</h3>
          <p>Power On</p>
        </div>
        <div className="stat-card devices">
          <h3>{stats.totalDevices}</h3>
          <p>Active Devices</p>
        </div>
      </div>

      <div className="classrooms-overview">
        <h3>Classroom Status</h3>
        <table className="status-table">
          <thead>
            <tr>
              <th>Classroom</th>
              <th>Location</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Power</th>
              <th>Last Movement</th>
              <th>Temp</th>
            </tr>
          </thead>
          <tbody>
            {classrooms.map(classroom => (
              <tr key={classroom.id}>
                <td>{classroom.name}</td>
                <td>{classroom.location || '-'}</td>
                <td>{classroom.capacity || '-'}</td>
                <td>
                  <span className={`badge ${classroom.status?.is_occupied ? 'occupied' : 'idle'}`}>
                    {classroom.status?.is_occupied ? 'Occupied' : 'Idle'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${classroom.status?.is_power_on ? 'on' : 'off'}`}>
                    {classroom.status?.is_power_on ? 'ON' : 'OFF'}
                  </span>
                </td>
                <td>{classroom.status?.last_movement || 0} s</td>
                <td>{classroom.status?.temperature || '-'}°C</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
