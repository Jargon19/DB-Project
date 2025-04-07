import React, { useState } from "react";
import "../styles/AuthPages.css";

function SuperAdminPage() {
  const [universityName, setUniversityName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState(""); 
  const [students, setStudents] = useState("");
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
          description,
          students,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Creation failed.");

      setMessage("✅ University created successfully!");
      setUniversityName("");
      setLocation("");
      setDescription("");
      setStudents("");
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
          <input
            type="number"
            placeholder="Num. of Students"
            value={students}
            onChange={(e) => setStudents(e.target.value)}
            min="0"
            step="1"
          />
          <textarea
            placeholder="University Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <button type="submit">Create University</button>
        </form>
        {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
      </div>
    </div>
  );
}

export default SuperAdminPage;
