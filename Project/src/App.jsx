import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom"; // Importing routing components
import { useState } from "react"; // Importing React hooks
import LoginPage from "./pages/LoginPage"; // Importing custom components
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import EventPage from "./pages/EventPage";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css"; // Importing styles

// Main App component
function App() {
  const [user, setUser] = useState(null); // Defining state for the user

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <Routes>
        {/* Routing paths */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              <Dashboard user={user} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/event/:id"
          element={
            <ProtectedRoute user={user}>
              <EventPage user={user} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
