import React, { useState, useEffect } from 'react';
import '../styles/Management.css';
import API_URL from '../config';

function DeviceManagement({ token }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    device_id: '',
    name: '',
    api_key: '',
    mac_address: '',
  });

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await fetch(`${API_URL}/api/admin/devices`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch devices');
        }

        const data = await response.json();
        setDevices(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_URL}/api/admin/devices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create device');
      }

      const newDevice = await response.json();
      setDevices([...devices, newDevice]);
      setFormData({ device_id: '', name: '', api_key: '', mac_address: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const generateApiKey = () => {
    const key = 'key_' + Math.random().toString(36).substr(2, 32);
    setFormData({ ...formData, api_key: key });
  };

  if (loading) return <div className="loading">Loading devices...</div>;

  return (
    <div className="management-container">
      <h2>Device Management</h2>

      {error && <div className="error-alert">{error}</div>}

      <button className="add-btn" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancel' : '+ Register Device'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="management-form">
          <div className="form-group">
            <label>Device ID</label>
            <input
              type="text"
              placeholder="e.g., CLASSROOM_001"
              value={formData.device_id}
              onChange={(e) => setFormData({ ...formData, device_id: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Device Name</label>
            <input
              type="text"
              placeholder="e.g., Main Hall ESP32"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>API Key</label>
            <div className="input-with-btn">
              <input
                type="text"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                required
              />
              <button type="button" onClick={generateApiKey} className="generate-btn">
                Generate
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>MAC Address (Optional)</label>
            <input
              type="text"
              placeholder="e.g., 00:1A:2B:3C:4D:5E"
              value={formData.mac_address}
              onChange={(e) => setFormData({ ...formData, mac_address: e.target.value })}
            />
          </div>

          <button type="submit" className="submit-btn">Register Device</button>
        </form>
      )}

      <table className="management-table">
        <thead>
          <tr>
            <th>Device ID</th>
            <th>Name</th>
            <th>MAC Address</th>
            <th>Status</th>
            <th>Last Seen</th>
            <th>Firmware</th>
          </tr>
        </thead>
        <tbody>
          {devices.map(device => (
            <tr key={device.device_id}>
              <td><code>{device.device_id}</code></td>
              <td>{device.name}</td>
              <td>{device.mac_address || '-'}</td>
              <td>
                <span className={`badge ${device.is_active ? 'active' : 'inactive'}`}>
                  {device.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>{device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never'}</td>
              <td>{device.firmware_version || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DeviceManagement;
