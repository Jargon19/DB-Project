import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import SuperAdminPage from "./pages/SuperAdminPage";
import AdminPage from "./pages/AdminPage";
import StudentPage from "./pages/StudentPage";
import "./App.css";
import { useEffect } from "react";

// Main App component
function App() {
  const [user, setUser] = useState(null);

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
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/login" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage setUser={setUser}/>} />
        
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard user={user} />} />

          {/* Role-based dashboards */}
          <Route path="/superadmin" element={<SuperAdminPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/student" element={<StudentPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
