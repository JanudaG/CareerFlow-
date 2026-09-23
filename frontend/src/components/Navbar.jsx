import "./Navbar.css";
import { Link } from "react-router-dom"

function Navbar() {
  
  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <span className="logo-icon">💼</span>
        <span className="logo-text">
          Career<span>Flow</span>
        </span>
      </Link>

      <div className="nav-buttons">

        <Link to="/" className="nav-home">
        Home
        </Link>

      </div>
    </nav>
  );
}

export default Navbar;