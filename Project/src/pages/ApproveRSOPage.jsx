import React, { useEffect, useState } from "react";

function ApproveRSOs() {
  const [rsos, setRsos] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/rso/pending", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    })
      .then((res) => res.json())
      .then(setRsos)
      .catch(() => setMessage("❌ Failed to load RSOs"));
  }, []);

  const handleApprove = async (rsoId) => {
    setMessage("");
    try {
      const res = await fetch("/api/rso/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ rsoId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");

      setRsos((prev) => prev.filter((rso) => rso.rso_id !== rsoId));
      setMessage("✅ RSO approved");
    } catch (err) {
      setMessage("❌ " + err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Approve RSOs</h2>
        {message && <p>{message}</p>}
        {rsos.length === 0 ? (
          <p>No RSOs pending approval.</p>
        ) : (
          <ul>
            {rsos.map((rso) => (
              <li key={rso.rso_id} style={{ marginBottom: "1rem" }}>
              <strong>{rso.name}</strong> ({rso.university_name})
              <br />
              <button onClick={() => handleApprove(rso.rso_id)}>Approve</button>
            </li>            
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ApproveRSOs;
