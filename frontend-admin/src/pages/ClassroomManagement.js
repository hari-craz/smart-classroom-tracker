import React, { useState, useEffect } from 'react';
import '../styles/Management.css';
import API_URL from '../config';

function ClassroomManagement({ token, onAuthError }) {
  const [classrooms, setClassrooms] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    capacity: '',
    esp_device_id: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [classroomsRes, devicesRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/classrooms`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch(`${API_URL}/api/admin/devices`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);

        if (classroomsRes.status === 401 || devicesRes.status === 401) {
          onAuthError && onAuthError();
          return;
        }
        if (!classroomsRes.ok || !devicesRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const classroomsData = await classroomsRes.json();
        const devicesData = await devicesRes.json();
        
        setClassrooms(classroomsData);
        setDevices(devicesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/admin/classrooms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create classroom');
      }

      const newClassroom = await response.json();
      setClassrooms([...classrooms, newClassroom]);
      setFormData({ name: '', location: '', capacity: '', esp_device_id: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Loading classrooms...</div>;

  return (
    <div className="management-container">
      <h2>Classroom Management</h2>

      {error && <div className="error-alert">{error}</div>}

      <button className="add-btn" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : '+ Add Classroom'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="management-form">
          <div className="form-group">
            <label>Classroom Name</label>
            <input
              type="text"
              placeholder="e.g., Math Lab"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              placeholder="e.g., Building A, Floor 2"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Capacity</label>
            <input
              type="number"
              placeholder="e.g., 30"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Assign ESP Device</label>
            <select
              value={formData.esp_device_id}
              onChange={(e) => setFormData({ ...formData, esp_device_id: e.target.value })}
            >
              <option value="">-- Select Device --</option>
              {devices.map(device => (
                <option key={device.device_id} value={device.device_id}>
                  {device.name} ({device.device_id})
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="submit-btn">Create Classroom</button>
        </form>
      )}

      <table className="management-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Location</th>
            <th>Capacity</th>
            <th>Device ID</th>
            <th>Status</th>
            <th>Power</th>
          </tr>
        </thead>
        <tbody>
          {classrooms.map(classroom => (
            <tr key={classroom.id}>
              <td>{classroom.name}</td>
              <td>{classroom.location || '-'}</td>
              <td>{classroom.capacity || '-'}</td>
              <td><code>{classroom.esp_device_id || '-'}</code></td>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ClassroomManagement;
