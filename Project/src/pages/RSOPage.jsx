import React, { useState } from "react";
import "../styles/AuthPages.css";

function CreateRSOPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState([""]); // Start with one member input
  const [message, setMessage] = useState("");

  const MAX_MEMBERS = 10;

  const handleAddMember = () => {
    if (members.length < MAX_MEMBERS) {
      setMembers([...members, ""]);
    }
  };

  const handleRemoveMember = (index) => {
    const updated = [...members];
    updated.splice(index, 1);
    setMembers(updated);
  };

  const handleMemberChange = (index, value) => {
    const updated = [...members];
    updated[index] = value;
    setMembers(updated);
  };

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
        body: JSON.stringify({ name, description, members }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Creation failed.");
      
      setMessage("✅ RSO created, awaiting super admin approval.");
      setName("");
      setDescription("");
      setMembers([""]);
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
          <p style={{ fontWeight: "bold", marginTop: "1rem", marginBottom: "0.5rem", color: "black" }}> Additional Members (min. 4) </p>
          {members.map((email, idx) => (
            <div key={idx} style={{ display: "flex", marginBottom: "0.5rem" }}>
              <input
                type="email"
                placeholder="Member Email"
                value={email}
                onChange={(e) => handleMemberChange(idx, e.target.value)}
                required
              />
              {members.length > 1 && (
                <button type="button" onClick={() => handleRemoveMember(idx)}>
                  ❌
                </button>
              )}
            </div>
          ))}

          {members.length < MAX_MEMBERS && (
            <button type="button" onClick={handleAddMember}>
              ➕ Add Member
            </button>
          )}

          <button type="submit" style={{ marginTop: "1rem" }}>Create RSO</button>
        </form>
        {message && <p style={{ marginTop: "1rem" }}>{message}</p>}
      </div>
    </div>
  );
}

export default CreateRSOPage;
