import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Styles/Navbar.css';
import SignInModal from '../pages/SignInModal';
import SignUpModal from '../pages/SignUpModal';
import { isLoggedIn, getUserEmail, logoutUser } from '../utils/auth';

function Navbar() {
  const [showSignIn, setShowSignIn] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const navigate = useNavigate();

  useEffect(() => {
    setLoggedIn(isLoggedIn()); // Sync state on mount
  }, []);

  const handleLogout = async () => {
    await logoutUser(); // Clears tokens and session
    setLoggedIn(false);
    navigate('/');
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-left">
          <span className="logo-text">CineFyra</span>
        </div>

        <div className="nav-center">
          <Link to="/">Home</Link>
          <Link to="/movies">Movies</Link>
           <Link to="/movies-grid">Browse</Link>

        </div>

        <div className="nav-right">
          {loggedIn ? (
            <div className="nav-user">
              <span className="user-email">{getUserEmail()}</span>
              <button onClick={handleLogout} className="btn-logout">Logout</button>
            </div>
          ) : (
            <>
              <button className="btn-signin" onClick={() => setShowSignIn(true)}>Sign In</button>
              <button className="btn-outline-gradient" onClick={() => setShowSignUp(true)}>
                Sign Up for Free
              </button>
            </>
          )}
        </div>
      </nav>

      {showSignIn && (
        <SignInModal
          onClose={() => {
            setShowSignIn(false);
            setLoggedIn(isLoggedIn()); // Recheck after modal closes
          }}
        />
      )}

      {showSignUp && (
        <SignUpModal
          onClose={() => {
            setShowSignUp(false);
            setLoggedIn(isLoggedIn()); // Recheck after modal closes
          }}
        />
      )}
    </>
  );
}

export default Navbar;
