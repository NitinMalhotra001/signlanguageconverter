import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="home-page">
      <header className="page-header">
        <h2>🤟 Welcome to Sign Language Converter</h2>
        <p>Translate, learn, and practice American Sign Language (ASL).</p>
      </header>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">📸</div>
          <h3>Live Camera</h3>
          <p>Use webcam for real-time sign detection and practice.</p>
          <Link to="/camera" className="feature-btn">Open Camera</Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🔤</div>
          <h3>Translator</h3>
          <p>Type text and convert it into ASL alphabet guidance.</p>
          <Link to="/translator" className="feature-btn">Open Translator</Link>
        </div>

        <div className="feature-card">
          <div className="feature-icon">🎯</div>
          <h3>Practice</h3>
          <p>Practice words and sequences to build muscle memory.</p>
          <Link to="/practice" className="feature-btn">Start Practicing</Link>
        </div>
      </section>
    </div>
  );
};

export default Home;