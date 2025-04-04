// Navbar.jsx
import { Link } from "react-router-dom";

function Navbar({ user, setUser }) {
  return (
    <nav className="navbar">
      <div className="logo">Event Manager</div>
      <div className="nav-links">
        {user ? (
          <button onClick={() => setUser(null)}>Logout</button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
