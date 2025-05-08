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
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = async () => {
    await logoutUser();
    setLoggedIn(false);
    navigate('/');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
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
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? '🌞 Light Mode' : '🌙 Dark Mode'}
          </button>

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
            setLoggedIn(isLoggedIn());
          }}
        />
      )}

      {showSignUp && (
        <SignUpModal
          onClose={() => {
            setShowSignUp(false);
            setLoggedIn(isLoggedIn());
          }}
        />
      )}
    </>
  );
}

export default Navbar;
