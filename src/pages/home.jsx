import React from 'react';
import '../Styles/Home.css';
import logo from '../assets/CineFyraLogo.jpg';


//Home Page (Landing Page) of client side application
function Home() {
  return (
    <div className="home-wrapper">
      <div className="hero">
           <h1>Welcome to CineFyra</h1>
        <div className="hero-image">
          <img src={logo} alt="CineFyra Logo" />
        </div>
        <p>Explore and analyze movies from 1990 to 2023.</p>
        <div className="hero-buttons">
          <a href="/movies" className="btn btn-primary">Browse Movies</a>
        </div>
      </div>
    </div>
  );
}

export default Home;
