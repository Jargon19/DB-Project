import React, { useEffect, useState } from "react";
import "../styles/AuthPages.css";

function StudentPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events/get", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Failed to load events");

        setEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Student Dashboard</h2>
        <p>Welcome! Browse events, rate them, and leave comments.</p>

        {loading && <p>Loading events...</p>}
        {error && <p style={{ color: "red" }}>❌ {error}</p>}

        {!loading && !error && events.length === 0 && (
          <p>No events available at the moment.</p>
        )}

        <ul className="event-list">
          {events.map((event) => (
            <li key={event.event_id} className="event-item">
              <h3>{event.name}</h3>
              <p><strong>Type:</strong> {event.visibility}</p>
              <p><strong>Location:</strong> {event.location_name}</p>
              <p><strong>Time:</strong> {new Date(event.event_time).toLocaleString()}</p>
              <p>{event.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default StudentPage;

