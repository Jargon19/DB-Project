import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AuthPages.css";

function RegisterPage({ setUser }) {
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    university_name: "",
  });

  const [universities, setUniversities] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const res = await fetch("/api/universities");
        const data = await res.json();
        setUniversities(data);
      } catch (err) {
        console.error("Failed to load universities:", err);
      }
    };
  
    fetchUniversities();
  }, []);
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords don't match");
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Registration failed");

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data));

      setUser(data);
  
      // Redirect based on role
      switch (formData.role) {
        case "super_admin":
        navigate("/superadmin");
        break;
        case "admin":
          navigate("/admin");
          break;
        case "student":
          navigate("/student");
          break;
        default:
          navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <span className="auth-icon">📝</span>
          <h2 className="auth-title">User Register</h2>
        </div>
        {error && <p className="auth-error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="student">Student</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <select
            name="university_name"
            value={formData.university_name}
            onChange={handleChange}
            required
          >
            <option value="">Select a University</option>
            {universities.map((uni) => (
              <option key={uni.university_id} value={uni.name}>
                {uni.name}
              </option>
            ))}
          </select>
          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "REGISTER"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
