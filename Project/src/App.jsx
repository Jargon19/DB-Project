import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import EventPage from "./pages/EventPage";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import "./App.css";

// Main App component
function App() {
  const [user, setUser] = useState(null); // Defining state for the user

    // Protected routes wrapper
    const ProtectedLayout = () => {
      if (!user) {
        return <Navigate to="/login" replace />;
      }
      return <Outlet />;
    }; 

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        {/* Routing paths */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/event/:id" element={<EventPage user={user} />} />
        </Route>
        */
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
