// components/ScoreRing.jsx
import React from 'react';
import '../Styles/ScoreRing.css';

export default function ScoreRing({ value, label = 'Rotten' }) {
  const score = parseInt(value);
  const normalized = isNaN(score) ? 0 : Math.min(score, 100);
  const strokeDashoffset = 282 - (282 * normalized) / 100;

  return (
    <div className="score-ring-wrapper">
      <svg className="score-ring" viewBox="0 0 100 100">
        <circle className="ring-bg" cx="50" cy="50" r="45" />
        <circle
          className="ring-fill"
          cx="50"
          cy="50"
          r="45"
          strokeDasharray="282"
          strokeDashoffset={strokeDashoffset}
        />
        <text className="score-text" x="50%" y="50%" dominantBaseline="middle" textAnchor="middle">
          {isNaN(score) ? 'N/A' : score}
        </text>
      </svg>
      <p className="ring-label">{label}</p>
    </div>
  );
}
