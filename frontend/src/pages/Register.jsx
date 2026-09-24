import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: ""
  });

  const [socialRole, setSocialRole] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value
    });
  };

  const handleRegister = (event) => {
    event.preventDefault();
    setError("");

    if (
      formData.password !== formData.confirmPassword
    ) {
      setError("Passwords do not match.");
      return;
    }

    if (!formData.role) {
      setError("Please select your role.");
      return;
    }

    const userData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role
    };

    localStorage.setItem(
      "careerflowUser",
      JSON.stringify(userData)
    );

    navigate("/login");
  };

  const handleSocialRegister = (provider) => {
    if (!socialRole) {
      setError(
        `Please select a role before using ${provider}.`
      );
      return;
    }

    setError(
      `${provider} registration will be connected to the backend later.`
    );
  };

  return (
    <div className="register-page">

      <div className="register-container">

        <div className="register-header">
          <div className="register-logo">🌈</div>

          <h2>Join CareerFlow</h2>

          <p>
            Create your account and start your journey 🚀
          </p>
        </div>

        <form
          className="register-form"
          onSubmit={handleRegister}
        >
          <label>Full Name</label>

          <input
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Email Address</label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>Password</label>

          <input
            type="password"
            name="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <label>Confirm Password</label>

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <label>Select Your Role</label>

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="">Choose your role</option>
            <option value="job_seeker">Job Seeker</option>
            <option value="company">Company</option>
            <option value="admin">Admin</option>
          </select>

          {error && (
            <div className="register-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="register-submit-button"
          >
            Create Account ✨
          </button>
        </form>

        <div className="register-social-title">
          Or register with
        </div>

        <div className="social-register-role">
          <label>Select Role for Registration</label>

          <select
            value={socialRole}
            onChange={(event) => setSocialRole(event.target.value)}
          >
            <option value="">Select your role</option>
            <option value="job_seeker">Job Seeker</option>
            <option value="company">Company</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="register-social-buttons">
          <button
            className="register-social-button"
            onClick={() => handleSocialRegister("Google")}
          >
            🔵 Google
          </button>

          <button
            className="register-social-button"
            onClick={() => handleSocialRegister("Facebook")}
          >
            🔷 Facebook
          </button>
        </div>

        <div className="register-login-link">
          Already have an account?{" "}
          <Link to="/login">
            Login Now
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Register;