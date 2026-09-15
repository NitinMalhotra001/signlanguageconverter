import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';

const SignToText = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [detectedLetter, setDetectedLetter] = useState('');
  const [sequence, setSequence] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // In-browser sample store for a simple KNN classifier
  const samplesRef = useRef([]); // {label, vector}
  const [labelInput, setLabelInput] = useState('A');
  const [predicting, setPredicting] = useState(true);

  const aslAlphabet = {
    'A': '✊', 'B': '✋', 'C': '🤙', 'D': '👆', 'E': '✊', 'F': '🤟', 'G': '👈', 'H': '👌',
    'I': '☝️', 'J': '👇', 'K': '✌️', 'L': '🤘', 'M': '✊', 'N': '✊', 'O': '👌', 'P': '🤏',
    'Q': '👌', 'R': '✌️', 'S': '✊', 'T': '👍', 'U': '✌️', 'V': '✌️', 'W': '✌️', 'X': '🤏',
    'Y': '✌️', 'Z': '✍️'
  };

  // Normalize landmarks to a scale/translation invariant vector
  const normalizeLandmarks = (landmarks) => {
    if (!landmarks || landmarks.length === 0) return null;
    const pts = landmarks.map(l => [l.x, l.y]);
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const shifted = pts.map(p => [p[0] - cx, p[1] - cy]);
    const maxDist = Math.max(...shifted.map(p => Math.hypot(p[0], p[1])));
    const norm = shifted.map(p => [p[0] / (maxDist || 1), p[1] / (maxDist || 1)]);
    return norm.flat();
  };

  // Helpers for gesture detection
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  const isFingerExtended = (landmarks, tipIdx, pipIdx, wristIdx = 0) => {
    // Compare distance tip->wrist vs pip->wrist; extended when tip is farther from wrist than pip
    const tip = [landmarks[tipIdx].x, landmarks[tipIdx].y];
    const pip = [landmarks[pipIdx].x, landmarks[pipIdx].y];
    const wrist = [landmarks[wristIdx].x, landmarks[wristIdx].y];
    return dist(tip, wrist) > dist(pip, wrist) + 0.01; // small margin
  };

  const wristXHistory = useRef([]);
  const wristYHistory = useRef([]);
  const lastGestureTime = useRef(0);

  const pushWrist = (x, y) => {
    const maxLen = 12;
    wristXHistory.current.push(x);
    wristYHistory.current.push(y);
    if (wristXHistory.current.length > maxLen) wristXHistory.current.shift();
    if (wristYHistory.current.length > maxLen) wristYHistory.current.shift();
  };

  const detectHello = () => {
    // Hello: open palm + horizontal oscillation in wrist X
    const xs = wristXHistory.current;
    if (xs.length < 8) return false;
    const range = Math.max(...xs) - Math.min(...xs);
    return range > 0.06; // significant side-to-side movement
  };

  const detectYes = () => {
    // Yes: closed fist + vertical nodding motion
    const ys = wristYHistory.current;
    if (ys.length < 8) return false;
    const range = Math.max(...ys) - Math.min(...ys);
    return range > 0.05; // vertical movement
  };

  const detectNo = (landmarks) => {
    // No: index+middle tap to thumb (tips close to thumb tip)
    const thumb = [landmarks[4].x, landmarks[4].y];
    const index = [landmarks[8].x, landmarks[8].y];
    const middle = [landmarks[12].x, landmarks[12].y];
    const d1 = dist(thumb, index);
    const d2 = dist(thumb, middle);
    return (d1 < 0.06 && d2 < 0.06);
  };

  const detectILY = (landmarks) => {
    // ILY: thumb, index and pinky extended while middle and ring folded
    const thumbExt = isFingerExtended(landmarks, 4, 3);
    const indexExt = isFingerExtended(landmarks, 8, 6);
    const middleExt = isFingerExtended(landmarks, 12, 10);
    const ringExt = isFingerExtended(landmarks, 16, 14);
    const pinkyExt = isFingerExtended(landmarks, 20, 18);
    return thumbExt && indexExt && pinkyExt && !middleExt && !ringExt;
  };

  const detectI = (landmarks) => {
    // I: pinky extended, others folded
    const thumbExt = isFingerExtended(landmarks, 4, 3);
    const indexExt = isFingerExtended(landmarks, 8, 6);
    const middleExt = isFingerExtended(landmarks, 12, 10);
    const ringExt = isFingerExtended(landmarks, 16, 14);
    const pinkyExt = isFingerExtended(landmarks, 20, 18);
    return !thumbExt && !indexExt && !middleExt && !ringExt && pinkyExt;
  };

  const detectLive = (landmarks) => {
    // LIVE: L shape (thumb and index extended at right angle)
    const thumbExt = isFingerExtended(landmarks, 4, 3);
    const indexExt = isFingerExtended(landmarks, 8, 6);
    const middleExt = isFingerExtended(landmarks, 12, 10);
    const ringExt = isFingerExtended(landmarks, 16, 14);
    const pinkyExt = isFingerExtended(landmarks, 20, 18);
    return thumbExt && indexExt && !middleExt && !ringExt && !pinkyExt;
  };

  const detectIn = (landmarks) => {
    // IN: index finger pointing
    const thumbExt = isFingerExtended(landmarks, 4, 3);
    const indexExt = isFingerExtended(landmarks, 8, 6);
    const middleExt = isFingerExtended(landmarks, 12, 10);
    const ringExt = isFingerExtended(landmarks, 16, 14);
    const pinkyExt = isFingerExtended(landmarks, 20, 18);
    return !thumbExt && indexExt && !middleExt && !ringExt && !pinkyExt;
  };

  const detectIndia = (landmarks) => {
    // INDIA: W shape (thumb tucked, index-middle-ring extended)
    const thumbExt = isFingerExtended(landmarks, 4, 3);
    const indexExt = isFingerExtended(landmarks, 8, 6);
    const middleExt = isFingerExtended(landmarks, 12, 10);
    const ringExt = isFingerExtended(landmarks, 16, 14);
    const pinkyExt = isFingerExtended(landmarks, 20, 18);
    return !thumbExt && indexExt && middleExt && ringExt && !pinkyExt;
  };

  const detectAreYou = (landmarks) => {
    // ARE YOU: R handshape (thumb crosses palm)
    const thumb = [landmarks[4].x, landmarks[4].y];
    const palm = [landmarks[0].x, landmarks[0].y];
    return dist(thumb, palm) < 0.1;
  };

  const detectOkay = (landmarks) => {
    // OKAY: thumb and index touching in circle
    const thumb = [landmarks[4].x, landmarks[4].y];
    const index = [landmarks[8].x, landmarks[8].y];
    return dist(thumb, index) < 0.05;
  };

  const predictLabel = (vector, k = 3) => {
    const samples = samplesRef.current;
    if (!vector || samples.length === 0) return null;
    const dists = samples.map(s => {
      let sum = 0;
      for (let i = 0; i < vector.length; i++) {
        const diff = (vector[i] || 0) - (s.vector[i] || 0);
        sum += diff * diff;
      }
      return { label: s.label, dist: Math.sqrt(sum) };
    });
    dists.sort((a, b) => a.dist - b.dist);
    const top = dists.slice(0, Math.min(k, dists.length));
    const counts = {};
    top.forEach(t => counts[t.label] = (counts[t.label] || 0) + 1);
    const sortedLabels = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return sortedLabels[0] || null;
  };

  const onResults = (results) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(ctx, landmarks, Hands.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2 });
        drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 1 });
      }

      const landmarks = results.multiHandLandmarks[0];
      const vector = normalizeLandmarks(landmarks);
      // push wrist history for motion-based detection
      if (landmarks[0]) pushWrist(landmarks[0].x, landmarks[0].y);

      // gesture detectors (prefer named gestures)
      const now = Date.now();
      const gestureCooldown = 700; // ms
      let named = null;
      // quick rule checks
      try {
        if (detectILY(landmarks)) named = 'I LOVE YOU';
        else if (detectNo(landmarks)) named = 'NO';
        else if (detectI(landmarks)) named = 'I';
        else if (detectLive(landmarks)) named = 'LIVE';
        else if (detectIn(landmarks)) named = 'IN';
        else if (detectIndia(landmarks)) named = 'INDIA';
        else if (detectAreYou(landmarks)) named = 'ARE YOU';
        else if (detectOkay(landmarks)) named = 'OKAY';
        else if (vector) {
          // use motion + open/closed heuristics
          const fingertips = [8,12,16,20].map(i => {
            return dist([landmarks[i].x, landmarks[i].y], [landmarks[0].x, landmarks[0].y]);
          });
          const avgF = fingertips.reduce((s,n) => s+n,0)/fingertips.length;
          const isOpenPalm = avgF > 0.12;
          const isClosedFist = avgF < 0.07;
          if (isOpenPalm && detectHello()) named = 'HELLO';
          else if (isClosedFist && detectYes()) named = 'YES';
        }
      } catch (e) {
        // ignore detection errors
      }

      if (named && now - lastGestureTime.current > gestureCooldown) {
        setDetectedLetter(named);
        lastGestureTime.current = now;
        if (isRecording) {
          setSequence(prev => (prev ? prev + ' ' + named : named));
        }
      }

      if (predicting && vector) {
        const label = predictLabel(vector);
        if (label) {
          // only set KNN label if there isn't a recent named gesture
          if (!named) {
            setDetectedLetter(label);
            if (isRecording) {
              setSequence(prev => (prev && prev.slice(-1) === label ? prev : prev + label));
            }
          }
        } else {
          setDetectedLetter('');
        }
      }
    } else {
      setDetectedLetter('');
    }

    ctx.restore();
  };

  useEffect(() => {
    // Initialize MediaPipe Hands
    const hands = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });
    hands.onResults(onResults);
    handsRef.current = hands;

    return () => {
      if (cameraRef.current) {
        try { cameraRef.current.stop(); } catch (e) {}
      }
      if (handsRef.current) handsRef.current.close();
    };
  }, []);

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera not supported in this browser');
      return;
    }
    setCameraError('');
    setIsCameraActive(true);

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (handsRef.current && videoRef.current) {
          await handsRef.current.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480
    });
    camera.start();
    cameraRef.current = camera;
  };

  const stopCamera = () => {
    setIsCameraActive(false);
    setIsRecording(false);
    setDetectedLetter('');
    if (cameraRef.current) {
      try { cameraRef.current.stop(); } catch (e) {}
      cameraRef.current = null;
    }
  };

  const toggleCamera = () => {
    if (isCameraActive) stopCamera(); else startCamera();
  };

  const toggleRecord = () => {
    if (!isCameraActive) return;
    if (!isRecording) setSequence('');
    setIsRecording(prev => !prev);
  };

  const recordSample = () => {
    if (!handsRef.current || !videoRef.current) return;
    const tmpCallback = (results) => {
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const vector = normalizeLandmarks(results.multiHandLandmarks[0]);
        if (vector) {
          samplesRef.current.push({ label: labelInput.toUpperCase().slice(0,1), vector });
          alert(`Sample recorded for ${labelInput.toUpperCase().slice(0,1)} (total samples: ${samplesRef.current.length})`);
        }
      } else {
        alert('No hand detected — try again');
      }
      handsRef.current.onResults(onResults); // restore
    };

    handsRef.current.onResults(tmpCallback);
    handsRef.current.send({ image: videoRef.current });
  };

  const clearSamples = () => {
    samplesRef.current = [];
    alert('All samples cleared');
  };

  // Demo/sample loader: create approximate normalized vectors for named gestures
  const generateDemoVector = (type) => {
    const vec = new Array(42).fill(0);
    const base = {
      HELLO: 0.22,
      'I LOVE YOU': 0.2,
      YES: 0.04,
      NO: 0.08,
      I: 0.1,
      LIVE: 0.15,
      IN: 0.12,
      INDIA: 0.18,
      'ARE YOU': 0.2,
      OKAY: 0.1
    };
    const scale = base[type] || 0.1;

    for (let p = 0; p < 21; p++) {
      let magnitude = 0.06;
      if ([4,8,12,16,20].includes(p)) magnitude = scale + (Math.random() - 0.5) * 0.02;
      const angle = (p / 21) * Math.PI * 2;
      const x = Math.cos(angle) * magnitude + (Math.random() - 0.5) * 0.01;
      const y = Math.sin(angle) * magnitude + (Math.random() - 0.5) * 0.01;
      vec[p * 2] = x;
      vec[p * 2 + 1] = y;
    }

    let xs = [];
    for (let i = 0; i < 42; i += 2) xs.push(vec[i]);
    const cx = xs.reduce((s, v) => s + v, 0) / xs.length;
    let maxd = 0;
    for (let i = 0; i < 42; i += 2) {
      const dx = vec[i] - cx;
      const dy = vec[i + 1];
      maxd = Math.max(maxd, Math.hypot(dx, dy));
    }
    const inv = 1 / (maxd || 1);
    for (let i = 0; i < 42; i += 2) {
      vec[i] = (vec[i] - cx) * inv;
      vec[i + 1] = vec[i + 1] * inv;
    }
    return vec;
  };

  const loadDemoSamples = () => {
    const labels = ['HELLO', 'I LOVE YOU', 'YES', 'NO', 'I', 'LIVE', 'IN', 'INDIA', 'ARE YOU', 'OKAY'];
    const perLabel = 12;
    const demo = [];
    for (const lbl of labels) {
      for (let i = 0; i < perLabel; i++) {
        const baseVec = generateDemoVector(lbl);
        // add tiny noise
        const noisy = baseVec.map(v => v + (Math.random() - 0.5) * 0.02);
        demo.push({ label: lbl, vector: noisy });
      }
    }
    samplesRef.current = demo;
    alert(`Loaded demo samples for ${labels.join(', ')} (${demo.length} total)`);
  };

  const convertSequenceToText = (seq) => {
    if (!seq) return '';
    return seq.replace(/\s+/g, '').toUpperCase();
  };

  const copyToClipboard = async (text) => {
    try { await navigator.clipboard.writeText(text); alert('Copied to clipboard'); } catch (e) { alert('Unable to copy'); }
  };

  return (
    <div className="sign-to-text-page page-grid">
      <header className="page-header compact">
        <div>
          <h2>🔎 Sign → Text (Live)</h2>
          <p className="muted">Use your camera to detect hand landmarks. Train quickly by recording samples for each letter.</p>
        </div>
        <div className="quick-actions-top">
          <button className={`btn small ${isCameraActive ? 'btn-danger' : 'btn-primary'}`} onClick={toggleCamera}>{isCameraActive ? 'Stop' : 'Start'}</button>
          <button className={`btn small ${isRecording ? 'btn-danger' : 'btn-secondary'}`} onClick={toggleRecord} disabled={!isCameraActive}>{isRecording ? 'Stop Rec' : 'Start Rec'}</button>
          <Link to="/translator" className="btn small">Translator</Link>
        </div>
      </header>

      <main className="sign-main">
        <section className="camera-panel">
          <div className="webcam-wrapper styled">
            <video ref={videoRef} className="webcam" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="camera-overlay" />
          </div>

          {cameraError && <div className="error-message">⚠️ {cameraError}</div>}

          <div className="detection-bar">
            <div className="detected">
              <div className="label">Detected</div>
              <div className="value">{detectedLetter || '—'}</div>
            </div>
            <div className="sequence">
              <div className="label">Sequence</div>
              <div className="value sequence-box">{sequence || '—'}</div>
            </div>
            <div className="controls">
              <button className="btn" onClick={() => setSequence('')}>Clear</button>
              <button className="btn" onClick={() => copyToClipboard(convertSequenceToText(sequence))} disabled={!sequence}>Copy</button>
            </div>
          </div>
        </section>

        <aside className="controls-panel">
          <div className="card">
            <h4>Train Quick Samples</h4>
            <div className="train-row">
              <input value={labelInput} onChange={e => setLabelInput(e.target.value.toUpperCase())} maxLength={1} className="label-input" />
              <button className="btn" onClick={recordSample} disabled={!isCameraActive}>Record Sample</button>
            </div>
            <div className="muted small">Tip: record 8–20 samples per gesture with slight variations.</div>
            <div className="sample-stats">Total samples: <strong>{samplesRef.current.length}</strong></div>
            <div className="sample-breakdown muted small">
              {['HELLO','I LOVE YOU','YES','NO','I','LIVE','IN','INDIA','ARE YOU','OKAY'].map(lbl => (
                <div key={lbl}>{lbl}: <strong>{samplesRef.current.filter(s => s.label===lbl).length}</strong></div>
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <button className="btn" onClick={loadDemoSamples}>Load Demo Samples</button>
              <button className="btn" onClick={clearSamples}>Clear Samples</button>
              <label className="predict-toggle"><input type="checkbox" checked={predicting} onChange={e => setPredicting(e.target.checked)} /> Predict</label>
            </div>
          </div>

          <div className="card">
            <h4>Alphabet Quick View</h4>
            <div className="alphabet-grid">
              {Object.keys(aslAlphabet).map(letter => (
                <div key={letter} className={`alpha-cell ${detectedLetter===letter ? 'active' : ''}`}>
                  <div className="alpha-letter">{letter}</div>
                  <div className="alpha-emoji">{aslAlphabet[letter]}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default SignToText;