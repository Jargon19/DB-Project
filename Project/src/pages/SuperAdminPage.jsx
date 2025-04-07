import React, { useState } from "react";
import "../styles/AuthPages.css";

function SuperAdminPage() {
  const [universityName, setUniversityName] = useState("");
  const [location, setLocation] = useState("");
  const [message, setMessage] = useState("");

  const handleCreateUniversity = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("/api/universities/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: universityName,
          location,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Creation failed.");

      setMessage("✅ University created successfully!");
      setUniversityName("");
      setLocation("");
    } catch (err) {
      setMessage("❌ Error: " + err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Super Admin Dashboard</h2>
        <p>Create a new university below:</p>
        <form onSubmit={handleCreateUniversity}>
          <input
            type="text"
            placeholder="University Name"
            value={universityName}
            onChange={(e) => setUniversityName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
          />
          <button type="submit">Create University</button>
        </form>
        {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
      </div>
    </div>
  );
}

export default SuperAdminPage;
