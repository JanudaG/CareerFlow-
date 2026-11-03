import { Link, useNavigate } from "react-router-dom";
import { getSession } from "../lib/api";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const session = getSession();
  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  }
  return <nav className="navbar">
    <Link to="/" className="logo"><span className="logo-icon">💼</span><span className="logo-text">Career<span>Flow</span></span></Link>
    <div className="nav-buttons">
      <Link to="/" className="nav-home">Home</Link>
      {session ? <>
        <Link to={session.user.role === "employer" ? "/company" : "/job-seeker"} className="nav-home">Dashboard</Link>
        <button type="button" className="nav-home" style={{cursor:"pointer"}} onClick={logout}>Logout</button>
      </> : <Link to="/login" className="nav-home">Login</Link>}
    </div>
  </nav>;
}
