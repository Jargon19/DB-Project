import React from "react";
import "../styles/AuthPages.css";

function StudentPage() {
  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2 className="auth-title">Student Dashboard</h2>
        <p>Welcome! Browse events, rate them, and leave comments.</p>
        {/* Insert events list and interaction features here */}
      </div>
    </div>
  );
}

export default StudentPage;
