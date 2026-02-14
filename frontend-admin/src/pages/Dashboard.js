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
    connectedDevices: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [classroomRes, deviceRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/classrooms`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/admin/devices/status`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);

        if (!classroomRes.ok) throw new Error('Failed to fetch classrooms');

        const classroomData = await classroomRes.json();
        setClassrooms(classroomData);

        let deviceData = [];
        if (deviceRes.ok) {
          deviceData = await deviceRes.json();
        }

        setStats({
          totalClassrooms: classroomData.length,
          occupiedClassrooms: classroomData.filter(c => c.status?.is_occupied).length,
          poweredOnClassrooms: classroomData.filter(c => c.status?.is_power_on).length,
          totalDevices: deviceData.length,
          connectedDevices: deviceData.filter(d => d.is_connected).length,
        });

        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div className="dashboard">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Monitor your smart classroom ecosystem in real-time</p>
      </div>

      {error && <div className="error-alert">⚠️ {error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏫</div>
          <h3>{stats.totalClassrooms}</h3>
          <p>Total Classrooms</p>
        </div>
        <div className="stat-card occupied">
          <div className="stat-icon">🔴</div>
          <h3>{stats.occupiedClassrooms}</h3>
          <p>Occupied Now</p>
        </div>
        <div className="stat-card powered">
          <div className="stat-icon">⚡</div>
          <h3>{stats.poweredOnClassrooms}</h3>
          <p>Power On</p>
        </div>
        <div className="stat-card devices">
          <div className="stat-icon">📡</div>
          <h3>
            {stats.connectedDevices}
            <span className="stat-device-total">/{stats.totalDevices}</span>
          </h3>
          <p>Devices Online</p>
          {stats.totalDevices > 0 && (
            <div className={`device-indicator ${stats.connectedDevices === stats.totalDevices ? 'all-online' : stats.connectedDevices > 0 ? 'partial' : 'all-offline'}`}>
              <span className="indicator-dot"></span>
            </div>
          )}
        </div>
      </div>

      <div className="classrooms-overview">
        <h3>📋 Classroom Status</h3>
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
                <td style={{ fontWeight: 600 }}>{classroom.name}</td>
                <td>{classroom.location || '—'}</td>
                <td>{classroom.capacity || '—'}</td>
                <td>
                  <span className={`badge ${classroom.status?.is_occupied ? 'occupied' : 'idle'}`}>
                    {classroom.status?.is_occupied ? '● Occupied' : '● Idle'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${classroom.status?.is_power_on ? 'on' : 'off'}`}>
                    {classroom.status?.is_power_on ? '⚡ ON' : '○ OFF'}
                  </span>
                </td>
                <td style={{ color: 'var(--text-secondary)' }}>{classroom.status?.last_movement || 0}s ago</td>
                <td style={{ color: 'var(--text-secondary)' }}>{classroom.status?.temperature || '—'}°C</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
