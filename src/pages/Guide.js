import React from 'react';
import { Link } from 'react-router-dom';

const Guide = () => {
  return (
    <div className="guide-page">
      <header className="page-header">
        <h2>📚 ASL Guide</h2>
        <p>A quick reference for ASL alphabet and common signs.</p>
      </header>

      <section className="guide-content">
        <p>This guide is a placeholder. More content can be added here.</p>
        <Link to="/camera" className="feature-btn">Try Camera Detection</Link>
      </section>
    </div>
  );
};

export default Guide;
