import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

function EventComments() {
  const { id } = useParams(); // event_id from URL
  const [event, setEvent] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [userId, setUserId] = useState(null); // set from token
  const [error, setError] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState(""); 
  const navigate = useNavigate();


  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // Decode token manually to get userId
    const payload = JSON.parse(atob(token.split(".")[1]));
    setUserId(payload.userId);

    fetch(`/api/events/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(setEvent);

    fetch(`/api/comments/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json()).then(setComments);
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        },
        body: JSON.stringify({ comment_text: text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setComments(prev => [data, ...prev]);
      setText("");
    } catch (err) {
      setError("❌ " + err.message);
    }
  };

  const handleEdit = async (comment_id) => {
    try {
      const res = await fetch(`/api/comments/${comment_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ comment_text: editText }),
      });
  
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Edit failed");
      }
  
      setComments((prev) =>
        prev.map((c) =>
          c.comment_id === comment_id ? { ...c, comment_text: editText } : c
        )
      );
      setEditingCommentId(null);
      setEditText("");
    } catch (err) {
      setError("❌ " + err.message);
    }
  };
  

  const handleDelete = async (comment_id) => {
    await fetch(`/api/comments/${comment_id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
    });
    setComments(prev => prev.filter(c => c.comment_id !== comment_id));
  };

  if (!event) return <p>Loading event...</p>;

  return (
    <div className="auth-container">
      <div className="auth-box">
        <button onClick={() => navigate("/student")} style={{ marginBottom: "1rem" }}>
          ← Back to Dashboard
        </button>
        <h2>{event.name}</h2>
        <p><strong>Location:</strong> {event.location_name}</p>
        <p><strong>Time:</strong> {new Date(event.event_time).toLocaleString()}</p>
        <p>{event.description}</p>

        <h3 style={{ marginTop: "1rem" }}>Comments</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment"
            rows={3}
            required
          />
          <button type="submit">Post Comment</button>
        </form>
        {error && <p style={{ color: "red" }}>{error}</p>}

        <ul style={{ marginTop: "1rem" }}>
        {comments.map((c) => (
          <li key={c.comment_id}>
            <p><strong>{c.username}</strong> said:</p>
            {editingCommentId === c.comment_id ? (
              <>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={2}
                />
                <button onClick={() => handleEdit(c.comment_id)}>Save</button>
                <button onClick={() => setEditingCommentId(null)}>Cancel</button>
              </>
            ) : (
              <p>{c.comment_text}</p>
            )}
            <p><em>{new Date(c.created_at).toLocaleString()}</em></p>
            {c.user_id === userId && editingCommentId !== c.comment_id && (
              <>
                <button onClick={() => {
                  setEditingCommentId(c.comment_id);
                  setEditText(c.comment_text);
                }}>Edit</button>
                <button onClick={() => handleDelete(c.comment_id)}>Delete</button>
              </>
            )}
            <hr />
          </li>
        ))}
        </ul>
      </div>
    </div>
  );
}

export default EventComments;
