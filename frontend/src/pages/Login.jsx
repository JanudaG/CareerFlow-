import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (event) => {
    event.preventDefault();
    setError("");

    const savedUser = JSON.parse(
      localStorage.getItem("careerflowUser")
    );

    if (
      !savedUser ||
      savedUser.email !== email ||
      savedUser.password !== password
    ) {
      setError("Invalid email or password.");
      return;
    }

    if (savedUser.role === "job_seeker") {
      navigate("/job-seeker");
    } else if (savedUser.role === "company") {
      navigate("/company");
    } else if (savedUser.role === "admin") {
      navigate("/admin");
    }
  };

  const handleSocialLogin = (provider) => {
    if (!role) {
      setError(`Please select a role before using ${provider}.`);
      return;
    }

    setError(
      `${provider} login will be connected to the backend later.`
    );
  };

  return (
    <div className="login-page">

      <div className="login-container">

        <div className="login-header">
          <div className="login-logo">💜</div>

          <h2>Welcome Back!</h2>

          <p>
            Login to continue your CareerFlow journey ✨
          </p>
        </div>

        <form
          className="login-form"
          onSubmit={handleLogin}
        >
          <label>Email Address</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-submit-button"
          >
            Login to CareerFlow 🚀
          </button>
        </form>

        <div className="social-divider">
          Or continue with
        </div>

        <div className="social-register-role">
          <label>Select Role for Login</label>

          <select
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="">Select your role</option>

            <option value="job_seeker">Job Seeker</option>
            <option value="company">Company</option>
          </select>
        </div>

        <div className="social-buttons">
          <button
            className="social-button"
            onClick={() => handleSocialLogin("Google")}
          >
            🔵 Google
          </button>

          <button
            className="social-button"
            onClick={() => handleSocialLogin("Facebook")}
          >
            🔷 Facebook
          </button>
        </div>

        <div className="login-register-link">
          Don't have an account?{" "}
          <Link to="/register">
            Register Now
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Login;