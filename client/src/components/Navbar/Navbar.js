import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Navbar = () => {
  const [isMobile, setIsMobile] = useState(false);
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const decoded = token ? jwtDecode(token) : null;

  const toggleMenu = () => {
    setIsMobile(!isMobile);
  };

  return (
    <nav className="navbar">
      <div className="logo">Posts.Com</div>
      <ul className={`nav-links ${isMobile ? "active" : ""}`}>
        <li>
          <Link to="/home">Home</Link>
        </li>
        <li>
          <Link to="/allposts">All Posts</Link>
        </li>
        <li>
          <Link to="/createpost">Create Post</Link>
        </li>
        <li>
          <a href="#contact">Contact Us</a>
        </li>
        {!token ? (
          <>
            <li>
              <Link to="/signup">Signup</Link>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
          </>
        ) : (
          <li>
            <a
              href="#logout"
              className="logout-link"
              onClick={(e) => {
                e.preventDefault();
                logout();
                navigate("/login");
              }}
            >
              Logout {"@ " + decoded.username}
            </a>
          </li>
        )}
      </ul>
      <div
        className={`menu-toggle ${isMobile ? "active" : ""}`}
        onClick={toggleMenu}
      >
        <span></span>
        <span></span>
        <span></span>
      </div>
    </nav>
  );
};

export default Navbar;
