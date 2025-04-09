import React, { useEffect, useState } from "react";
import "../styles/AuthPages.css";

function RSOListPage() {
  const [rsos, setRsos] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/rsos", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    })
      .then((res) => res.json())
      .then(setRsos)
      .catch(() => setMessage("❌ Failed to load RSOs"));
  }, []);

  const handleJoinLeave = async (rso_id, isJoining) => {
    setMessage("");
    try {
      const endpoint = isJoining ? "/api/rso/join" : "/api/rso/leave";
  
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ rso_id }),
      });
  
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
  
      // Handle special case: RSO deleted
      if (data.message?.includes("RSO has been deleted")) {
        setRsos((prev) => prev.filter((rso) => rso.rso_id !== rso_id));
      } else {
        // Update membership status
        setRsos((prev) =>
          prev.map((rso) =>
            rso.rso_id === rso_id ? { ...rso, is_member: isJoining ? 1 : 0 } : rso
          )
        );
      }
  
      setMessage(data.message);
    } catch (err) {
      setMessage("❌ " + err.message);
    }
  };
  

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">RSOs at Your University</h2>
        {message && <p>{message}</p>}
        {rsos.length === 0 ? (
          <p>No RSOs found.</p>
        ) : (
          <ul>
            {rsos.map((rso) => (
              <li key={rso.rso_id} style={{ marginBottom: "1rem" }}>
                <strong>{rso.name}</strong>
                <br />
                <button
                  onClick={() => handleJoinLeave(rso.rso_id, !rso.is_member)}
                >
                  {rso.is_member ? "Leave" : "Join"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default RSOListPage;
