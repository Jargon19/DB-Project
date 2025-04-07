import React, { useState } from "react";
import "../styles/AuthPages.css";

function AdminPage() {
  const [eventData, setEventData] = useState({
    name: "",
    description: "",
    location: "",
    datetime: "",
    category: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Creation failed.");

      setMessage("✅ Event created successfully!");
      setEventData({
        name: "",
        description: "",
        location: "",
        datetime: "",
        category: "",
      });
    } catch (err) {
      setMessage("❌ Error: " + err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Admin Dashboard</h2>
        <p>Create a new event below:</p>
        <form onSubmit={handleCreateEvent}>
          <input
            type="text"
            name="name"
            placeholder="Event Name"
            value={eventData.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="location"
            placeholder="Location"
            value={eventData.location}
            onChange={handleChange}
            required
          />
          <input
            type="datetime-local"
            name="datetime"
            value={eventData.datetime}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="category"
            placeholder="Category (e.g. social, private)"
            value={eventData.category}
            onChange={handleChange}
            required
          />
          <textarea
            name="description"
            placeholder="Description"
            value={eventData.description}
            onChange={handleChange}
            rows={4}
            required
          />
          <button type="submit">Create Event</button>
        </form>
        {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
      </div>
    </div>
  );
}

export default AdminPage;
