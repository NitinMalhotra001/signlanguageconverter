import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="about-page">
      <header className="page-header">
        <h2>ℹ️ About</h2>
        <p>About this Sign Language Converter project.</p>
      </header>

      <section className="about-content">
        <p>This project helps users learn and practice ASL using camera and translation tools.</p>
        <Link to="/guide" className="feature-btn">View Guide</Link>
      </section>
    </div>
  );
};

export default About;
