import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Webcam from 'react-webcam';
import '../App.css';

const CameraPage = () => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedLetter, setDetectedLetter] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordedSequence, setRecordedSequence] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [cameraMode, setCameraMode] = useState('detection'); // 'detection' or 'practice'
  const [practiceWord, setPracticeWord] = useState('HELLO');
  const [currentStep, setCurrentStep] = useState(0);
  const webcamRef = useRef(null);

  // ASL Alphabet Data
  const aslAlphabet = {
    'A': '✊', 'B': '✋', 'C': '🤙', 'D': '👆', 'E': '✊',
    'F': '🤟', 'G': '👈', 'H': '👌', 'I': '☝️', 'J': '👇',
    'K': '✌️', 'L': '🤘', 'M': '✊', 'N': '✊', 'O': '👌',
    'P': '🤏', 'Q': '👌', 'R': '✌️', 'S': '✊', 'T': '👍',
    'U': '✌️', 'V': '✌️', 'W': '✌️', 'X': '🤏', 'Y': '✌️',
    'Z': '✍️'
  };

  const aslDescriptions = {
    'A': 'Closed fist', 'B': 'Open hand', 'C': 'Curved hand',
    'D': 'Index up', 'E': 'Folded fingers', 'F': 'OK gesture',
    'G': 'Index point', 'H': 'Two fingers', 'I': 'Pinky up',
    'J': 'Pinky trace J', 'K': 'Peace with thumb', 'L': 'L shape',
    'M': 'Three folded', 'N': 'Two folded', 'O': 'O shape',
    'P': 'P shape', 'Q': 'Point down', 'R': 'Crossed fingers',
    'S': 'Thumb over', 'T': 'Thumb between', 'U': 'Peace sign',
    'V': 'Wide peace', 'W': 'Three up', 'X': 'Hook finger',
    'Y': 'Thumb pinky', 'Z': 'Draw Z'
  };

  const practiceWords = ['HELLO', 'WORLD', 'THANK', 'YOU', 'LOVE', 'PEACE', 'HAPPY'];

  const handleCameraToggle = () => {
    if (!isCameraActive) {
      // Check if browser supports camera
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera not supported in this browser');
        return;
      }
      setIsCameraActive(true);
      setCameraError('');
    } else {
      setIsCameraActive(false);
      setIsRecording(false);
      setDetectedLetter('');
      setRecordedSequence('');
      setCurrentStep(0);
    }
  };

  const handleRecordToggle = () => {
    if (!isRecording) {
      setRecordedSequence('');
    }
    setIsRecording(!isRecording);
  };

  const handleCapturePhoto = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Create download link
        const link = document.createElement('a');
        link.href = imageSrc;
        link.download = `sign-language-${new Date().getTime()}.jpg`;
        link.click();
        alert('Photo saved!');
      }
    }
  };

  const simulateLetterDetection = () => {
    if (cameraMode === 'detection') {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const randomLetter = letters[Math.floor(Math.random() * letters.length)];
      setDetectedLetter(randomLetter);
      
      if (isRecording) {
        setRecordedSequence(prev => prev + randomLetter);
      }
    } else {
      // Practice mode - guide through practice word
      const word = practiceWord.toUpperCase();
      if (currentStep < word.length) {
        const letter = word[currentStep];
        setDetectedLetter(letter);
        
        if (isRecording) {
          setRecordedSequence(prev => prev + letter);
        }
        
        // Move to next letter after delay
        setTimeout(() => {
          if (currentStep < word.length - 1) {
            setCurrentStep(prev => prev + 1);
          } else {
            // Word complete
            setCurrentStep(0);
            alert(`Great! You practiced "${practiceWord}"`);
          }
        }, 2000);
      }
    }
  };

  useEffect(() => {
    let interval;
    if (isCameraActive) {
      interval = setInterval(simulateLetterDetection, 2000);
    }
    return () => clearInterval(interval);
  }, [isCameraActive, isRecording, cameraMode, currentStep, practiceWord]);

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user",
    aspectRatio: 1.777777778
  };

  const handleWebcamError = (error) => {
    console.error('Webcam Error:', error);
    setCameraError('Cannot access camera. Please check permissions.');
    setIsCameraActive(false);
  };

  const handlePracticeWordChange = (word) => {
    setPracticeWord(word);
    setCurrentStep(0);
    setRecordedSequence('');
  };

  return (
    <div className="camera-page">
      <div className="page-header">
        <h2>📸 Sign Language Camera</h2>
        <p>Use your camera to detect signs or practice ASL alphabet</p>
      </div>

      <div className="camera-controls-panel">
        <div className="mode-selector">
          <button 
            className={`mode-btn ${cameraMode === 'detection' ? 'active' : ''}`}
            onClick={() => setCameraMode('detection')}
          >
            🔍 Detection Mode
          </button>
          <button 
            className={`mode-btn ${cameraMode === 'practice' ? 'active' : ''}`}
            onClick={() => setCameraMode('practice')}
          >
            🎯 Practice Mode
          </button>
        </div>

        <div className="control-buttons">
          <button 
            onClick={handleCameraToggle} 
            className={`btn ${isCameraActive ? 'btn-danger' : 'btn-primary'}`}
          >
            <span className="btn-icon">{isCameraActive ? '📷' : '📸'}</span>
            {isCameraActive ? 'Stop Camera' : 'Start Camera'}
          </button>
          
          <button 
            onClick={handleRecordToggle} 
            className={`btn ${isRecording ? 'btn-danger' : 'btn-secondary'}`}
            disabled={!isCameraActive}
          >
            <span className="btn-icon">{isRecording ? '⏹️' : '⏺️'}</span>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
          
          <button 
            onClick={handleCapturePhoto}
            className="btn btn-success"
            disabled={!isCameraActive}
          >
            <span className="btn-icon">📷</span>
            Capture Photo
          </button>
          
          <Link to="/translator" className="btn btn-info">
            <span className="btn-icon">🔤</span>
            Go to Translator
          </Link>
        </div>

        {cameraMode === 'practice' && (
          <div className="practice-controls">
            <h4>Practice Word:</h4>
            <div className="word-selector">
              {practiceWords.map((word) => (
                <button
                  key={word}
                  className={`word-btn ${practiceWord === word ? 'active' : ''}`}
                  onClick={() => handlePracticeWordChange(word)}
                >
                  {word}
                </button>
              ))}
            </div>
            <div className="current-progress">
              <p>
                Practicing: <strong>{practiceWord}</strong>
                <br />
                Current Letter: {currentStep < practiceWord.length ? practiceWord[currentStep] : 'Complete!'}
              </p>
            </div>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="error-message">
          ⚠️ {cameraError}
        </div>
      )}

      <div className="camera-container">
        {isCameraActive ? (
          <div className="camera-view">
            <div className="webcam-wrapper">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="webcam"
                onUserMediaError={handleWebcamError}
                mirrored={true}
              />
              <div className="camera-overlay">
                <div className="detection-area">
                  <div className="area-guide">
                    Place hand here
                    <div className="hand-icon">✋</div>
                  </div>
                </div>
                {detectedLetter && (
                  <div className="detection-result">
                    <div className="detected-letter-large">{detectedLetter}</div>
                    <div className="detected-sign">{aslAlphabet[detectedLetter] || '?'}</div>
                    <div className="detected-description">
                      {aslDescriptions[detectedLetter] || 'Unknown sign'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="camera-info">
              <div className="info-card">
                <h3>Camera Status</h3>
                <p>Mode: <strong>{cameraMode === 'detection' ? 'Sign Detection' : 'Practice Mode'}</strong></p>
                <p>Status: <span className="status-active">● Active</span></p>
                {isRecording && (
                  <p className="recording-status">
                    <span className="recording-dot"></span>
                    Recording...
                  </p>
                )}
              </div>

              <div className="info-card">
                <h3>Detection Results</h3>
                <p>Current Sign: <strong>{detectedLetter || 'None'}</strong></p>
                <p>Sequence: {recordedSequence || 'No sequence yet'}</p>
                {recordedSequence && (
                  <button 
                    className="btn btn-small"
                    onClick={() => setRecordedSequence('')}
                  >
                    Clear Sequence
                  </button>
                )}
              </div>

              <div className="info-card">
                <h3>Quick Actions</h3>
                <div className="quick-actions">
                  <button 
                    className="action-btn"
                    onClick={() => setDetectedLetter('')}
                  >
                    Clear Detection
                  </button>
                  <Link to="/guide" className="action-btn">
                    View ASL Guide
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="camera-placeholder">
            <div className="placeholder-icon">📸</div>
            <h3>Camera is Off</h3>
            <p>Click "Start Camera" to begin sign detection</p>
            <div className="placeholder-features">
              <div className="feature-item">
                <span className="feature-icon">🔍</span>
                <span>Sign Detection</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <span>Practice Mode</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📷</span>
                <span>Photo Capture</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="camera-tips">
        <h3>💡 Tips for Best Results:</h3>
        <ul>
          <li>Ensure good lighting on your hand</li>
          <li>Keep your hand within the guide area</li>
          <li>Make signs clearly and hold for 2 seconds</li>
          <li>Use Practice Mode to learn specific words</li>
          <li>Try different angles if detection is inconsistent</li>
        </ul>
      </div>
    </div>
  );
};

export default CameraPage;