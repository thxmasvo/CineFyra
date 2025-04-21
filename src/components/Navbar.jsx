import React, { useState } from 'react';
import '../Styles/Navbar.css';
import { Link } from 'react-router-dom';
// ✅ Correct: because SignInModal.jsx is inside /pages folder
import SignInModal from '../pages/SignInModal';
import SignUpModal from '../pages/SignUpModal';

function Navbar() {
  const [showModal, setShowModal] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          <img src="/assets/react.svg" alt="Logo" className="logo-img" />
          <span className="logo-text">CineFyra</span>
        </div>

        <div className="nav-center">
          <a href="/">Home</a>
          <a href="/movies">Movies</a>
          <a href="/progress">Progress</a>
          <a href="/profile">Profile</a>
        </div>

        <div className="nav-right">
          <button className="btn-signin" onClick={() => setShowModal(true)}>Sign In</button>
          <button className="btn-outline-gradient" onClick={() => setShowSignUp(true)}>
            Sign Up for Free
          </button>

        </div>
      </nav>

      {showModal && <SignInModal onClose={() => setShowModal(false)} />}
          {showSignUp && <SignUpModal onClose={() => setShowSignUp(false)} />}
    </>
  );
}

export default Navbar;
