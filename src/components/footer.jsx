import React from 'react';
import '../Styles/Footer.css';

// Footer appears on all pages — attribution and copyright
export default function Footer() {
  return (
    <footer className="footer">
      <p>
        All data is from IMDB, Metacritic and RottenTomatoes.<br/>
        &copy; 2025 Thomas Vo
      </p>
    </footer>
  );
}
