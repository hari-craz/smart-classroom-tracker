import React, { useState, useEffect } from 'react';
import '../styles/Booking.css';
import API_URL from '../config';

function BookingPortal({ token }) {
  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [bookingForm, setBookingForm] = useState({
    start_time: '',
    end_time: '',
    title: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchClassrooms = async () => {
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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClassroom) {
      setError('Please select a classroom');
      return;
    }

    const startTime = new Date(bookingForm.start_time);
    const endTime = new Date(bookingForm.end_time);

    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    if (startTime < new Date()) {
      setError('Cannot book in the past');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/staff/bookings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classroom_id: selectedClassroom.id,
          start_time: bookingForm.start_time,
          end_time: bookingForm.end_time,
          title: bookingForm.title,
          description: bookingForm.description,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create booking');
      }

      setSuccess('Booking created successfully!');
      setBookingForm({ start_time: '', end_time: '', title: '', description: '' });
      setSelectedClassroom(null);
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="loading">Loading classrooms...</div>;

  return (
    <div className="booking-container">
      <h2>Book a Classroom</h2>

      {error && <div className="error-alert">{error}</div>}
      {success && <div className="success-alert">{success}</div>}

      <div className="booking-layout">
        <div className="classrooms-list">
          <h3>Select Classroom</h3>
          <div className="list">
            {classrooms.map(classroom => (
              <div
                key={classroom.id}
                className={`list-item ${selectedClassroom?.id === classroom.id ? 'selected' : ''}`}
                onClick={() => setSelectedClassroom(classroom)}
              >
                <h4>{classroom.name}</h4>
                <p>{classroom.location || 'No location'}</p>
                <small>Capacity: {classroom.capacity || '-'}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="booking-form-container">
          {selectedClassroom ? (
            <>
              <div className="selected-classroom">
                <h3>📍 {selectedClassroom.name}</h3>
                <p>{selectedClassroom.location}</p>
              </div>

              <form onSubmit={handleSubmit} className="booking-form">
                <div className="form-group">
                  <label>Booking Title</label>
                  <input
                    type="text"
                    placeholder="e.g., Physics Lab Session"
                    value={bookingForm.title}
                    onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="datetime-local"
                    value={bookingForm.start_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, start_time: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="datetime-local"
                    value={bookingForm.end_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description (Optional)</label>
                  <textarea
                    placeholder="Add any additional details about this booking"
                    value={bookingForm.description}
                    onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                    rows="4"
                  />
                </div>

                <button type="submit" className="submit-btn">Confirm Booking</button>
              </form>
            </>
          ) : (
            <div className="empty-state">
              <p>👈 Select a classroom to start booking</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookingPortal;
