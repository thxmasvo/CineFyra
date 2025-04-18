import React from 'react';
import '../Styles/Home.css';


function Home() {
  return (
    <div className="home-container">
      <div className="hero-content">
        <h1>Start your AI Course Journey</h1>
        <p>Create your own custom courses powered by movie data and smart learning paths.</p>
        <div>
          <a href="/register" className="btn-primary">Get Started</a>
          <a href="/movies" className="btn-outline">Browse Movies →</a>
        </div>
      </div>
    </div>
  );
}

export default Home;
