
import React, { useState } from "react";
import { api } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      const { token, user } = response.data;

      if (!token || !user?.role) {
        throw new Error("Invalid login response");
      }

      const routes = {
        jobseeker: "/job-seeker",
        employer: "/company",
        admin: "/admin",
      };

      const destination = routes[user.role];

      if (!destination) {
        setError("Unknown account role");
        return;
      }

      // Store authenticated session
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      // Redirect based on authenticated role
      navigate(destination, { replace: true });

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    if (!role) {
      setError(
        `Please select a role before using ${provider}.`
      );
      return;
    }

    setError(
      `${provider} login is not available yet.`
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
          <label htmlFor="login-email">
            Email Address
          </label>

          <input
            id="login-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
          />

          <label htmlFor="login-password">
            Password
          </label>

          <input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
          />

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-submit-button"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login to CareerFlow 🚀"}
          </button>
        </form>

        <div className="social-divider">
          Or continue with
        </div>

        <div className="social-register-role">
          <label htmlFor="social-role">
            Select Role for Social Login
          </label>

          <select
            id="social-role"
            value={role}
            onChange={(event) =>
              setRole(event.target.value)
            }
          >
            <option value="">
              Select your role
            </option>

            <option value="jobseeker">
              Job Seeker
            </option>

            <option value="employer">
              Company
            </option>
          </select>
        </div>

        <div className="social-buttons">
          <button
            type="button"
            className="social-button"
            onClick={() =>
              handleSocialLogin("Google")
            }
          >
            🔵 Google
          </button>

          <button
            type="button"
            className="social-button"
            onClick={() =>
              handleSocialLogin("Facebook")
            }
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
