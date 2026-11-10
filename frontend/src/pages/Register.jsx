import React, { useState } from "react";
import axios from "axios";
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

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    setError("");
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");

    if (!formData.role) {
      setError("Please select your role.");
      return;
    }

    if (!formData.name.trim()) {
      setError(
        formData.role === "employer"
          ? "Company name is required."
          : "Full name is required."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const name = formData.name.trim();

    const payload = {
      name: name,
      email: formData.email.trim(),
      password: formData.password,
      role: formData.role
    };

    // Company name uses the same name input.
    if (formData.role === "employer") {
      payload.companyName = name;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        payload
      );

      alert(response.data.message);

      navigate("/login");

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Registration failed"
      );
    } finally {
      setLoading(false);
    }
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

          {/* SELECT ROLE FIRST */}
          <label>Select Your Role</label>

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
          >
            <option value="">Choose your role</option>
            <option value="jobseeker">Job Seeker</option>
            <option value="employer">Company</option>
          </select>

          {/* FULL NAME / COMPANY NAME */}
          <label>
            {formData.role === "employer"
              ? "Company Name"
              : "Full Name"}
          </label>

          <input
            type="text"
            name="name"
            placeholder={
              formData.role === "employer"
                ? "Enter your company name"
                : "Enter your full name"
            }
            value={formData.name}
            onChange={handleChange}
            required
          />

          {/* EMAIL */}
          <label>Email Address</label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {/* PASSWORD */}
          <label>Password</label>

          <input
            type="password"
            name="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {/* CONFIRM PASSWORD */}
          <label>Confirm Password</label>

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          {/* ERROR MESSAGE */}
          {error && (
            <div className="register-error">
              {error}
            </div>
          )}

          {/* REGISTER BUTTON */}
          <button
            type="submit"
            className="register-submit-button"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account ✨"}
          </button>

        </form>

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
