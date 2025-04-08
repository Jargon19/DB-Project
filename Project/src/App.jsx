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
import RSOPage from "./pages/RSOPage";
import ApproveRSOPage from "./pages/ApproveRSOPage";
import EventComments from "./pages/EventComments";
import MyRSOsPage from "./pages/RSOListPage"; // Adjust path if needed
import "./App.css";
import { useEffect } from "react";

// Main App component
function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setCheckingAuth(false);
  }, []);

  const ProtectedLayout = () => {
    if (checkingAuth) return null; // Or a loader
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
          <Route path="/events/:id/comments" element={<EventComments />} />

          {/* Role-based dashboards */}
          <Route path="/superadmin" element={<SuperAdminPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/student" element={<StudentPage />} />
          <Route path="/rso" element={<RSOPage />} />
          <Route path="/approve-rsos" element={<ApproveRSOPage />} />
          <Route path="/my-rsos" element={<MyRSOsPage user={user} />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
