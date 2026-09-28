import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");

  
  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
   try {

    const response = await axios.post(
      "http://localhost:5000/api/auth/login",
      {
        email,
        password
      }
    );


    // Save JWT token
    localStorage.setItem(
      "token",
      response.data.token
    );


    // Save user information
    localStorage.setItem(
      "user",
      JSON.stringify(response.data.user)
    );


    const user = response.data.user;


    if (user.role === "jobseeker") {
      navigate("/jobseeker");
    } 
    
    else if (user.role === "employer") {
      navigate("/company");
    }


  } catch (error) {

    setError(
      error.response?.data?.message ||
      "Login failed"
    );

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

            <option value="jobseeker">Job Seeker</option>
            <option value="employer">Company</option>
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