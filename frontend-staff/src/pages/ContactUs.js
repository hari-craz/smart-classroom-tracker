import React, { useState } from 'react';
import '../styles/ContactUs.css';
import API_URL from '../config';

function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    message_type: 'query',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setSuccess('Your message has been sent successfully! We will get back to you soon.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        message_type: 'query',
      });
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-container">
      <h2>Contact Us</h2>
      <p className="subtitle">Have a question or found a bug? Let us know!</p>

      <div className="contact-layout">
        <div className="contact-info">
          <h3>Get in Touch</h3>
          <div className="info-item">
            <h4>📧 Email</h4>
            <p>support@smartclassroom.local</p>
          </div>
          <div className="info-item">
            <h4>🕐 Response Time</h4>
            <p>We aim to respond within 24 hours</p>
          </div>
          <div className="info-item">
            <h4>📍 Issues & Feedback</h4>
            <p>Use the form to report bugs or send feedback</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="contact-form">
          {error && <div className="error-alert">{error}</div>}
          {success && <div className="success-alert">{success}</div>}

          <div className="form-group">
            <label>Your Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Your Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Message Type *</label>
            <select
              value={formData.message_type}
              onChange={(e) => setFormData({ ...formData, message_type: e.target.value })}
              disabled={loading}
            >
              <option value="query">General Query</option>
              <option value="bug_report">Bug Report</option>
              <option value="feedback">Feedback</option>
            </select>
          </div>

          <div className="form-group">
            <label>Subject *</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Message *</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              rows="6"
              disabled={loading}
              placeholder="Please provide detailed information about your message"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ContactUs;
