import React, { useState } from "react";
import "../styles/AuthPages.css";

function CreateRSOPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

  const handleCreateRSO = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await fetch("/api/rso/create", {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
         },
         body: JSON.stringify({ name, description }),
       });
       

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Creation failed.");

      setMessage("✅ RSO created successfully!");
      setName("");
      setDescription("");
    } catch (err) {
      setMessage("❌ Error: " + err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Create RSO</h2>
        <form onSubmit={handleCreateRSO}>
          <input
            type="text"
            placeholder="RSO Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <textarea
            placeholder="RSO Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            required
          />
          <button type="submit">Create RSO</button>
        </form>
        {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
      </div>
    </div>
  );
}

export default CreateRSOPage;
