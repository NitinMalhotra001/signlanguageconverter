import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Translator = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState('');
  const [aslInput, setAslInput] = useState('');
  const [aslToTextResult, setAslToTextResult] = useState('');

  const handleConvert = () => {
    // Simple placeholder: convert to uppercase and separate characters
    const converted = text.toUpperCase().split('').join(' ');
    setResult(converted);
  };

  const handleClear = () => {
    setText('');
    setResult('');
  };

  const handleASLToText = () => {
   
    let input = aslInput.toUpperCase().trim();
    if (!input) {
      setAslToTextResult('');
      return;
    }

   
    if (input.includes('/')) {
      const words = input.split('/').map(part => {
        const letters = part.replace(/[^A-Z\s]/g, '').split(/\s+/).filter(Boolean);
        // If single token of contiguous letters, split into characters
        if (letters.length === 1 && letters[0].length > 1) {
          return letters[0].split('').join('');
        }
        return letters.join('');
      });
      setAslToTextResult(words.join(' '));
      return;
    }

    // Otherwise, treat spaces as letter separators when present
    const tokens = input.split(/\s+/).filter(Boolean);
    if (tokens.length > 1 && tokens.every(t => /^[A-Z]$/.test(t))) {
      setAslToTextResult(tokens.join(''));
      return;
    }

    // Single token (possibly contiguous letters)
    const cleaned = input.replace(/[^A-Z]/g, '');
    setAslToTextResult(cleaned);
  };

  return (
    <div className="translator-page">
      <header className="page-header">
        <h2>🔤 Translator</h2>
        <p>Type text and convert it into a simple ASL-style sequence.</p>
      </header>

      <div className="translator-controls">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type text to convert..."
          rows={4}
        />

        <div className="button-group">
          <button onClick={handleConvert} className="btn convert-btn">
            <span className="btn-icon">🤟</span>
            Convert to ASL
          </button>
          <button onClick={handleClear} className="btn clear-btn">
            <span className="btn-icon">🗑️</span>
            Clear
          </button>
          <Link to="/camera" className="btn camera-btn">
            <span className="btn-icon">📸</span>
            Open Camera
          </Link>
        </div>

        <div className="translation-result">
          <h3>Result</h3>
          <div className="result-box">{result || 'No translation yet'}</div>
        </div>

        <div className="asl-to-text">
          <h3>ASL → Text</h3>
          <p className="muted">Enter ASL letters (e.g. "H E L L O" or "HELLO"). Use '/' to separate words.</p>
          <textarea
            value={aslInput}
            onChange={(e) => setAslInput(e.target.value)}
            placeholder="Enter ASL letters (e.g. H E L L O  or H E L L O / W O R L D)"
            rows={3}
          />
          <div className="button-group">
            <button onClick={handleASLToText} className="btn convert-btn">
              <span className="btn-icon">🔁</span>
              Convert ASL to Text
            </button>
            <button onClick={() => { setAslInput(''); setAslToTextResult(''); }} className="btn clear-btn">
              <span className="btn-icon">🗑️</span>
              Clear
            </button>
          </div>

          <div className="translation-result">
            <h4>ASL Conversion</h4>
            <div className="result-box">{aslToTextResult || 'No ASL conversion yet'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Translator;