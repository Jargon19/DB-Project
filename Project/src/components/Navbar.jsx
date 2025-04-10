import { Link, useLocation } from "react-router-dom";

function Navbar({ user, setUser }) {
  const location = useLocation();
  const dashboardPath = user?.role === "super_admin" ? "superadmin" : user?.role;

  return (
    <nav className="navbar">
      <div className="logo">Event Manager</div>
      <div className="nav-links">
        {user ? (
          <>
            {/* Create RSO / Dashboard toggle */}
            {location.pathname === "/rso" ? (
              <Link to={`/${dashboardPath}`} className="nav-link">Dashboard</Link>
            ) : (
              <Link to="/rso" className="nav-link">Create RSO</Link>
            )}

            {/* My RSOs / Dashboard toggle for students */}
            {user.role === "student" && (
              location.pathname === "/my-rsos" ? (
                <Link to="/student" className="nav-link">Dashboard</Link>
              ) : (
                <Link to="/my-rsos" className="nav-link">My RSOs</Link>
              )
            )}

            {/* Create Event / Dashboard toggle for students */}
            {user.role === "student" && (
              location.pathname === "/admin" ? (
                <Link to="/student" className="nav-link">Dashboard</Link>
              ) : (
                <Link to="/admin" className="nav-link">Create Event</Link>
              )
            )}

            {/* Approve RSOs / Dashboard toggle for super_admin */}
            {user?.role === "super_admin" && (
              location.pathname === "/approve-rsos" ? (
                <Link to="/superadmin" className="nav-link">Dashboard</Link>
              ) : (
                <Link to="/approve-rsos" className="nav-link">Approve RSOs</Link>
              )
            )}

            {/* Logout button */}
            <button
              className="logout-button"
              onClick={() => {
                setUser(null);
                localStorage.removeItem("user");
                localStorage.removeItem("accessToken");
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="nav-link">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
