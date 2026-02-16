import React, { useState, useEffect } from 'react';
import '../styles/MyBookings.css';
import API_URL from '../config';

function MyBookings({ token, onAuthError }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch(`${API_URL}/api/staff/bookings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          onAuthError && onAuthError();
          return;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch bookings');
        }

        const data = await response.json();
        setBookings(data.sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) return <div className="loading">Loading bookings...</div>;

  const upcomingBookings = bookings.filter(b => new Date(b.start_time) > new Date());
  const activeBookings = bookings.filter(b => {
    const now = new Date();
    const start = new Date(b.start_time);
    const end = new Date(b.end_time);
    return now >= start && now <= end;
  });

  return (
    <div className="my-bookings">
      <h2>My Bookings</h2>

      {error && <div className="error-alert">{error}</div>}

      {activeBookings.length > 0 && (
        <div className="bookings-section">
          <h3>🔴 Active Now</h3>
          <div className="bookings-list">
            {activeBookings.map(booking => (
              <div key={booking.id} className="booking-item active">
                <div className="booking-header">
                  <h4>{booking.title}</h4>
                  <span className="badge active">In Progress</span>
                </div>
                <p className="time">
                  ⏰ {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                  {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {booking.description && <p className="description">{booking.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingBookings.length > 0 && (
        <div className="bookings-section">
          <h3>📅 Upcoming</h3>
          <div className="bookings-list">
            {upcomingBookings.map(booking => (
              <div key={booking.id} className="booking-item">
                <div className="booking-header">
                  <h4>{booking.title}</h4>
                  <span className="badge upcoming">Scheduled</span>
                </div>
                <p className="date">
                  📆 {new Date(booking.start_time).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
                <p className="time">
                  ⏰ {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                  {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {booking.description && <p className="description">{booking.description}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {bookings.length === 0 && (
        <div className="empty-state">
          <p>📭 You have no bookings yet</p>
          <p>Start booking a classroom to get started!</p>
        </div>
      )}
    </div>
  );
}

export default MyBookings;
