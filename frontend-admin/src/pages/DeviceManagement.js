import React, { useState, useEffect, useCallback } from 'react';
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

  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/devices/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch devices');
      }

      const data = await response.json();
      setDevices(data);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDevices();
    // Auto-refresh every 15 seconds to keep connection status current
    const interval = setInterval(fetchDevices, 15000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

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

  const getTimeSince = (isoDate) => {
    if (!isoDate) return 'Never';
    const now = new Date();
    const then = new Date(isoDate);
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return `${diffSec}s ago`;
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  const connectedCount = devices.filter(d => d.is_connected).length;
  const disconnectedCount = devices.filter(d => !d.is_connected).length;

  if (loading) return <div className="loading">Loading devices...</div>;

  return (
    <div className="management-container">
      <div className="page-header">
        <h2>Device Management</h2>
        <p>Monitor and manage your ESP32 devices</p>
      </div>

      {error && <div className="error-alert">⚠️ {error}</div>}

      {/* Connection Status Summary */}
      <div className="device-status-summary">
        <div className="status-card connected">
          <div className="status-indicator">
            <span className="pulse-dot online"></span>
          </div>
          <div className="status-info">
            <h3>{connectedCount}</h3>
            <p>Connected</p>
          </div>
        </div>
        <div className="status-card disconnected">
          <div className="status-indicator">
            <span className="pulse-dot offline"></span>
          </div>
          <div className="status-info">
            <h3>{disconnectedCount}</h3>
            <p>Disconnected</p>
          </div>
        </div>
        <div className="status-card total">
          <div className="status-indicator">
            <span className="device-icon">📡</span>
          </div>
          <div className="status-info">
            <h3>{devices.length}</h3>
            <p>Total Devices</p>
          </div>
        </div>
      </div>

      <button className="add-btn" onClick={() => setShowForm(!showForm)}>
        {showForm ? '✕ Cancel' : '+ Register Device'}
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
            <th>Connection</th>
            <th>Device ID</th>
            <th>Name</th>
            <th>Linked Classroom</th>
            <th>MAC Address</th>
            <th>Last Seen</th>
            <th>Firmware</th>
          </tr>
        </thead>
        <tbody>
          {devices.map(device => (
            <tr key={device.device_id} className={device.is_connected ? 'row-connected' : 'row-disconnected'}>
              <td>
                <div className="connection-status">
                  <span className={`pulse-dot ${device.is_connected ? 'online' : 'offline'}`}></span>
                  <span className={`connection-label ${device.is_connected ? 'online' : 'offline'}`}>
                    {device.is_connected ? 'Online' : 'Offline'}
                  </span>
                </div>
              </td>
              <td><code>{device.device_id}</code></td>
              <td>{device.name}</td>
              <td>{device.classroom_name || <span style={{ color: 'var(--text-muted)' }}>Not linked</span>}</td>
              <td>{device.mac_address || '—'}</td>
              <td>
                <span className={device.is_connected ? '' : 'last-seen-warning'}>
                  {getTimeSince(device.last_seen)}
                </span>
              </td>
              <td>{device.firmware_version || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {devices.length === 0 && (
        <div className="empty-state">
          <p>📡 No devices registered yet.</p>
          <p>Register your first ESP32 device to start monitoring.</p>
        </div>
      )}
    </div>
  );
}

export default DeviceManagement;
