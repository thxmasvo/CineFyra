import React from 'react';
import './Navbar.css'; // Make sure this is the correct path to your CSS

function Navbar() {
  return (
    <nav className="navbar">
      {/* Left Logo */}
      <div className="nav-left">
        <img src="/assets/react.svg" alt="Logo" className="logo-img" />
        <span className="logo-text">MovieVerse</span>
      </div>

      {/* Center Links */}
      <div className="nav-center">
        <a href="/">Home</a>
        <a href="/movies">Movies</a>
        <a href="/progress">Progress</a>
        <a href="/profile">Profile</a>
      </div>

      {/* Right Buttons */}
      <div className="nav-right">
        <button className="btn-signin">Sign In</button>
        <button className="btn-outline-gradient">Sign Up for Free</button>
      </div>
    </nav>
  );
}

export default Navbar;
