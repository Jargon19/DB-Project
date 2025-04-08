import React, { useState } from "react";
import "../styles/AuthPages.css";

function AdminPage() {
  const [eventData, setEventData] = useState({
    name: "",
    description: "",
    location: "",
    datetime: "",
    category: "",
    contactPhone: "",
    contactEmail: "",
    visibility: "",
  });

  const [message, setMessage] = useState("");
  const [rsoName, setRsoName] = useState("");


  const handleChange = (e) => {
    const { name, value } = e.target;
    setEventData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setMessage("");

    const token = localStorage.getItem("accessToken");

    try {
      const response = await fetch("/api/events/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...eventData,
          rsoName: eventData.visibility === "RSO" ? rsoName : null
        })        
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
        contactPhone: "",
        contactEmail: "",
        visibility: "",
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
          <select
            name="visibility"
            value={eventData.visibility}
            onChange={handleChange}
            required
          >
            <option value="" disabled hidden>
              Select Visibility
            </option>
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="RSO">RSO</option>
          </select>
          {eventData.visibility === "RSO" && (
            <input
              type="text"
              name="rsoName"
              placeholder="Enter RSO Name"
              value={rsoName}
              onChange={(e) => setRsoName(e.target.value)}
              required
            />
          )}
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
          <input
            type="email"
            name="contactEmail"
            placeholder="Contact Email"
            value={eventData.contactEmail}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="contactPhone"
            placeholder="Contact Phone Number"
            value={eventData.contactPhone}
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
