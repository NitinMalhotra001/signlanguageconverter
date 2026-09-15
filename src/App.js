import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Translator from './pages/Translator';
import Practice from './pages/Practice';
import Guide from './pages/Guide';
import About from './pages/About';
import CameraPage from './pages/CameraPage'; // New page
import SignToText from './pages/SignToText';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <div className="header-content">
            <h1>🤟 Sign Language Converter</h1>
            <p>Learn, translate, and practice American Sign Language</p>
          </div>
          
          {/* Navigation Menu */}
          <nav className="main-nav">
            <ul className="nav-list">
              <li><Link to="/" className="nav-link">🏠 Home</Link></li>
              <li><Link to="/translator" className="nav-link">🔤 Translator</Link></li>
              <li>
                <Link to="/camera" className="nav-link camera-link">
                  📸 Camera
                  <span className="camera-badge">NEW</span>
                </Link>
              </li>
              <li><Link to="/sign-to-text" className="nav-link">📝 Sign→Text</Link></li>
              <li><Link to="/practice" className="nav-link">🎯 Practice</Link></li>
              <li><Link to="/guide" className="nav-link">📚 Guide</Link></li>
              <li><Link to="/about" className="nav-link">ℹ️ About</Link></li>
            </ul>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/translator" element={<Translator />} />
            <Route path="/camera" element={<CameraPage />} />
            <Route path="/sign-to-text" element={<SignToText />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/guide" element={<Guide />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <div className="footer-content">
            <p>Made with ❤️ for accessibility and learning</p>
            <div className="footer-links">
              <Link to="/">Home</Link> | 
              <Link to="/camera">Camera</Link> | 
              <Link to="/guide">Guide</Link> | 
              <Link to="/about">About</Link>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
