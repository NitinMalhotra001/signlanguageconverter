import React from 'react';
import { Link } from 'react-router-dom';

const Practice = () => {
  return (
    <div className="practice-page">
      <header className="page-header">
        <h2>🎯 Practice</h2>
        <p>Practice common words and drills to improve your ASL alphabet fluency.</p>
      </header>

      <section className="practice-content">
        <p>This is a placeholder practice page. Use the Camera to practice live.</p>
        <Link to="/camera" className="feature-btn">Open Camera</Link>
      </section>
    </div>
  );
};

export default Practice;
