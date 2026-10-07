import React, { useState, useEffect, useRef, useCallback } from 'react';
import ChordDiagram, { CHORD_DIAGRAMS } from '../ChordDiagram';
import { 
  Flame, 
  TrendingUp, 
  CheckCircle, 
  ArrowRight, 
  SlidersHorizontal, 
  Music, 
  Activity, 
  Sparkles, 
  LogOut, 
  Calendar, 
  Volume2, 
  Play, 
  Pause, 
  Radio, 
  CheckCircle2, 
  AlertCircle,
  LayoutDashboard,
  Target,
  Clock,
  Award
} from 'lucide-react';

export default function DashboardView({ user = { name: 'User' }, onLogout }) {
  const [currentTab, setCurrentTab] = useState('overview');

  // --- Tuning State ---
  const [activeTuningPreset, setActiveTuningPreset] = useState('standard');
  const [tunerActive, setTunerActive] = useState(false);
  const [tunerStringIndex, setTunerStringIndex] = useState(0);
  const [tunerCents, setTunerCents] = useState(0);
  const [tunerDetectedNote, setTunerDetectedNote] = useState('—');
  const [tunerDetectedFreq, setTunerDetectedFreq] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const [isHoldingPitch, setIsHoldingPitch] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const tunerStreamRef = useRef(null);
  const tunerAnalyserRef = useRef(null);
  const tunerRafRef = useRef(null);
  const tunerAudioCtxRef = useRef(null);
  const tunerStringIndexRef = useRef(0);
  const tunerPresetRef = useRef(null);
  const lastUpdateRef = useRef(0);

  // --- Chords State ---
  const [chords, setChords] = useState([]);
  const [selectedRoot, setSelectedRoot] = useState('All');
  const [selectedChord, setSelectedChord] = useState(null);
  // Instrument & diagram states
  const [selectedInstrument, setSelectedInstrument] = useState('acoustic');
  const [carouselOpen, setCarouselOpen] = useState(false);
  const [carouselStartIndex, setCarouselStartIndex] = useState(0);
  const longPressTimerRef = useRef(null);
  const longPressTriggeredRef = useRef(false);
  const chordSwipeStartRef = useRef(null);

  // --- Metronome State ---
  const [bpm, setBpm] = useState(120);
  const [isPlayingMetronome, setIsPlayingMetronome] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [tempoMarkings, setTempoMarkings] = useState([]);
  const metronomeTimerRef = useRef(null);

  // --- Chord Verifier State ---
  const [verifierTargetChord, setVerifierTargetChord] = useState('C Major');
  const [verifierPlayedNotes, setVerifierPlayedNotes] = useState(['C', 'E', 'G']);
  const [verifierResult, setVerifierResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Audio Context Ref
  const audioCtxRef = useRef(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playTone = (freq) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const sampleRate = ctx.sampleRate;
    const duration = 2.8;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Fractional-delay Karplus-Strong model keeps reference notes on pitch;
    // rounding the delay to a whole sample can shift high strings by several cents.
    const period = Math.max(10, sampleRate / freq);
    const delayLength = Math.ceil(period) + 1;
    const delayLine = new Float32Array(delayLength);

    // Filtered noise burst for realistic pick attack (plectrum striking wound bronze string)
    let lastNoise = 0;
    for (let i = 0; i < delayLength; i++) {
      const white = Math.random() * 2 - 1;
      lastNoise = 0.5 * (lastNoise + white);
      delayLine[i] = lastNoise;
    }

    // Interpolate within the feedback delay instead of using a rounded period.
    const decayFactor = 0.99997;
    for (let i = 0; i < bufferSize; i++) {
      const writeIndex = i % delayLength;
      let readPosition = writeIndex - period;
      while (readPosition < 0) readPosition += delayLength;
      const lowerIndex = Math.floor(readPosition);
      const fraction = readPosition - lowerIndex;
      const delayed = delayLine[lowerIndex] * (1 - fraction) + delayLine[(lowerIndex + 1) % delayLength] * fraction;
      const sample = delayed * decayFactor;
      data[i] = sample;
      delayLine[writeIndex] = sample;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    // Acoustic guitar wooden soundboard formant filter (~180 Hz body resonance)
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'peaking';
    bodyFilter.frequency.value = 180;
    bodyFilter.Q.value = 1.2;
    bodyFilter.gain.value = 4.0;

    // High cut to keep acoustic string warmth
    const toneFilter = ctx.createBiquadFilter();
    toneFilter.type = 'lowpass';
    toneFilter.frequency.value = 4200;

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.7, ctx.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    src.connect(bodyFilter);
    bodyFilter.connect(toneFilter);
    toneFilter.connect(masterGain);
    masterGain.connect(ctx.destination);

    src.start(ctx.currentTime);
  };

  // ── Acoustic Guitar synth ──────────────────────────────────────────────
  const playAcousticNote = (ctx, freq, startTime, masterGain) => {
    // A plucked fundamental with a short pick transient and a warm body resonance.
    const body = ctx.createBiquadFilter();
    body.type = 'lowpass';
    body.frequency.setValueAtTime(2600, startTime);
    body.Q.value = 0.65;
    const bodyResonance = ctx.createBiquadFilter();
    bodyResonance.type = 'peaking';
    bodyResonance.frequency.value = 190;
    bodyResonance.gain.value = 2.5;
    bodyResonance.Q.value = 0.8;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 3200;
    lowpass.Q.value = 0.5;
    const string = ctx.createOscillator();
    const stringGain = ctx.createGain();
    string.type = 'triangle';
    string.frequency.setValueAtTime(freq, startTime);
    stringGain.gain.setValueAtTime(0.0001, startTime);
    stringGain.gain.linearRampToValueAtTime(0.52, startTime + 0.004);
    stringGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.9);
    string.connect(stringGain);
    stringGain.connect(body);
    string.start(startTime);
    string.stop(startTime + 2);

    const upperPartial = ctx.createOscillator();
    const partialGain = ctx.createGain();
    upperPartial.type = 'sine';
    upperPartial.frequency.setValueAtTime(freq * 2.01, startTime);
    partialGain.gain.setValueAtTime(0.0001, startTime);
    partialGain.gain.linearRampToValueAtTime(0.12, startTime + 0.003);
    partialGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.45);
    upperPartial.connect(partialGain);
    partialGain.connect(body);
    upperPartial.start(startTime);
    upperPartial.stop(startTime + 0.5);

    const pickBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.018), ctx.sampleRate);
    const pickData = pickBuffer.getChannelData(0);
    for (let i = 0; i < pickData.length; i++) pickData[i] = (Math.random() * 2 - 1) * (1 - i / pickData.length);
    const pick = ctx.createBufferSource();
    const pickFilter = ctx.createBiquadFilter();
    const pickGain = ctx.createGain();
    pick.buffer = pickBuffer;
    pickFilter.type = 'bandpass';
    pickFilter.frequency.value = Math.min(3200, Math.max(700, freq * 7));
    pickFilter.Q.value = 0.8;
    pickGain.gain.setValueAtTime(0.035, startTime);
    pickGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.018);
    pick.connect(pickFilter);
    pickFilter.connect(pickGain);
    pickGain.connect(body);
    pick.start(startTime);

    body.connect(bodyResonance);
    bodyResonance.connect(lowpass);
    lowpass.connect(masterGain);
  };

  // ── Electric Guitar (clean) synth ─────────────────────────────────────
  const playElectricNote = (ctx, freq, startTime, masterGain) => {
    const oscillator = ctx.createOscillator();
    const inputGain = ctx.createGain();
    const overdrive = ctx.createWaveShaper();
    const cabinet = ctx.createBiquadFilter();
    const presence = ctx.createBiquadFilter();
    const compressor = ctx.createDynamicsCompressor();
    const curve = new Float32Array(2048);
    const drive = 34;
    for (let i = 0; i < curve.length; i++) {
      const x = (i * 2) / (curve.length - 1) - 1;
      curve[i] = (1 + drive) * x / (1 + drive * Math.abs(x));
    }
    overdrive.curve = curve;
    overdrive.oversample = '4x';
    cabinet.type = 'lowpass';
    cabinet.frequency.value = 4200;
    presence.type = 'peaking';
    presence.frequency.value = 1800;
    presence.gain.value = 3;
    presence.Q.value = 0.9;
    compressor.threshold.value = -20;
    compressor.knee.value = 8;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.004;
    compressor.release.value = 0.18;
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(freq, startTime);
    inputGain.gain.setValueAtTime(0.0001, startTime);
    inputGain.gain.linearRampToValueAtTime(0.16, startTime + 0.008);
    inputGain.gain.setValueAtTime(0.12, startTime + 0.08);
    inputGain.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.2);
    oscillator.connect(inputGain);
    inputGain.connect(overdrive);
    overdrive.connect(cabinet);
    cabinet.connect(presence);
    presence.connect(compressor);
    compressor.connect(masterGain);
    oscillator.start(startTime);
    oscillator.stop(startTime + 2.25);
  };

  // ── Piano synth ───────────────────────────────────────────────────────
  const playPianoNote = (ctx, freq, startTime, masterGain) => {
    // Sine fundamental + harmonics shaped like hammer-struck strings
    const partials = [1, 2, 3, 4, 5];
    const amps    = [0.6, 0.18, 0.09, 0.04, 0.02];
    const decays  = [3.5, 2.8, 2.2, 1.6, 1.2];

    partials.forEach((p, i) => {
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq * p, startTime);
      g.gain.setValueAtTime(0.0001, startTime);
      g.gain.linearRampToValueAtTime(amps[i], startTime + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, startTime + decays[i]);
      osc.connect(g);
      g.connect(masterGain);
      osc.start(startTime);
      osc.stop(startTime + decays[i] + 0.1);
    });
  };

  const noteFreqMap = {
    'C': 261.63, 'C#': 277.18, 'Db': 277.18, 'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
    'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99, 'G': 392.00,
    'G#': 415.30, 'Ab': 415.30, 'A': 440.00, 'A#': 466.16, 'Bb': 466.16, 'B': 493.88
  };

  const playChordNotes = useCallback((chordOrNotes, instrument = selectedInstrument) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const guitarStrings = [82.4069, 110, 146.832, 195.998, 246.942, 329.628];
    const notes = Array.isArray(chordOrNotes) ? chordOrNotes : chordOrNotes.notes;
    const stringFrequencies = !Array.isArray(chordOrNotes) && chordOrNotes.frets
      ? chordOrNotes.frets.flatMap((fret, index) => {
          const fretNumber = Number(fret);
          return Number.isFinite(fretNumber) && fretNumber >= 0
            ? [guitarStrings[index] * (2 ** (fretNumber / 12))]
            : [];
        })
      : null;
    const frequencies = instrument === 'piano' || !stringFrequencies
      ? notes.map(note => noteFreqMap[note] || 440)
      : stringFrequencies;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(instrument === 'piano' ? 0.24 : 0.18, ctx.currentTime);
    masterGain.connect(ctx.destination);

    frequencies.forEach((freq, i) => {
      const startTime = ctx.currentTime + i * 0.032; // slight strum stagger

      if (instrument === 'acoustic') {
        playAcousticNote(ctx, freq, startTime, masterGain);
      } else if (instrument === 'electric') {
        playElectricNote(ctx, freq, startTime, masterGain);
      } else {
        playPianoNote(ctx, freq, startTime, masterGain);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedInstrument]);

  const clearChordLongPress = () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  useEffect(() => () => clearChordLongPress(), []);

  const playClick = (isAccent) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isAccent ? 1200 : 800, ctx.currentTime);
    gain.gain.setValueAtTime(isAccent ? 0.35 : 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  };

  // ── Tuning Presets ─────────────────────────────────────────────────────
  const TUNING_PRESETS = {
    standard:    { label: 'Standard (E)',      strings: [{ n:'E2',f:82.41},{ n:'A2',f:110.00},{ n:'D3',f:146.83},{ n:'G3',f:196.00},{ n:'B3',f:246.94},{ n:'E4',f:329.63}] },
    dropD:       { label: 'Drop D',            strings: [{ n:'D2',f:73.42},{ n:'A2',f:110.00},{ n:'D3',f:146.83},{ n:'G3',f:196.00},{ n:'B3',f:246.94},{ n:'E4',f:329.63}] },
    halfDown:    { label: 'Half Step Down',    strings: [{ n:'Eb2',f:77.78},{ n:'Ab2',f:103.83},{ n:'Db3',f:138.59},{ n:'Gb3',f:185.00},{ n:'Bb3',f:233.08},{ n:'Eb4',f:311.13}] },
    fullDown:    { label: 'Full Step Down',    strings: [{ n:'D2',f:73.42},{ n:'G2',f:98.00},{ n:'C3',f:130.81},{ n:'F3',f:174.61},{ n:'A3',f:220.00},{ n:'D4',f:293.66}] },
    openG:       { label: 'Open G',            strings: [{ n:'D2',f:73.42},{ n:'G2',f:98.00},{ n:'D3',f:146.83},{ n:'G3',f:196.00},{ n:'B3',f:246.94},{ n:'D4',f:293.66}] },
    openD:       { label: 'Open D',            strings: [{ n:'D2',f:73.42},{ n:'A2',f:110.00},{ n:'D3',f:146.83},{ n:'F#3',f:185.00},{ n:'A3',f:220.00},{ n:'D4',f:293.66}] },
    openE:       { label: 'Open E',            strings: [{ n:'E2',f:82.41},{ n:'B2',f:123.47},{ n:'E3',f:164.81},{ n:'G#3',f:207.65},{ n:'B3',f:246.94},{ n:'E4',f:329.63}] },
    dadgad:      { label: 'DADGAD',            strings: [{ n:'D2',f:73.42},{ n:'A2',f:110.00},{ n:'D3',f:146.83},{ n:'G3',f:196.00},{ n:'A3',f:220.00},{ n:'D4',f:293.66}] },
    doubleDropD: { label: 'Double Drop D',     strings: [{ n:'D2',f:73.42},{ n:'A2',f:110.00},{ n:'D3',f:146.83},{ n:'G3',f:196.00},{ n:'B3',f:246.94},{ n:'D4',f:293.66}] },
  };

  const currentPreset = TUNING_PRESETS[activeTuningPreset];

  // ── High-Precision Pure YIN Pitch Detection Algorithm ────────────────
  const detectPitch = (buf, sampleRate) => {
    // 1. Calculate RMS with high sensitivity (detects soft finger plucks)
    let sumSq = 0;
    for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i];
    const rms = Math.sqrt(sumSq / buf.length);
    if (rms < 0.0008) return { freq: -1, rms };

    // A longer difference window improves fundamental detection on the wound
    // bass strings while the analyser keeps the same capture size and latency.
    const W = 1024;
    const minPeriod = Math.floor(sampleRate / 450);
    const maxPeriod = Math.min(Math.floor(sampleRate / 65), buf.length - W - 1);

    // Difference function d(tau) - computed from tau=1 so runningSum is mathematically exact
    const d = new Float32Array(maxPeriod + 1);
    for (let tau = 1; tau <= maxPeriod; tau++) {
      let sum = 0;
      for (let j = 0; j < W; j += 2) {
        const delta = buf[j] - buf[j + tau];
        sum += delta * delta;
      }
      d[tau] = sum * 2;
    }

    // Cumulative Mean Normalized Difference Function (CMNDF)
    const cmndf = new Float32Array(maxPeriod + 1);
    cmndf[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau <= maxPeriod; tau++) {
      runningSum += d[tau];
      cmndf[tau] = runningSum === 0 ? 1 : (d[tau] * tau) / runningSum;
    }

    // Absolute thresholding
    // A stricter YIN threshold avoids locking onto a strong harmonic or transient.
    const threshold = 0.12;
    let tauEst = -1;
    for (let tau = minPeriod; tau <= maxPeriod; tau++) {
      if (cmndf[tau] < threshold) {
        while (tau + 1 <= maxPeriod && cmndf[tau + 1] < cmndf[tau]) {
          tau++;
        }
        tauEst = tau;
        break;
      }
    }

    if (tauEst === -1) {
      let minVal = 1000;
      for (let tau = minPeriod; tau <= maxPeriod; tau++) {
        if (cmndf[tau] < minVal) {
          minVal = cmndf[tau];
          tauEst = tau;
        }
      }
      if (minVal > 0.4) return { freq: -1, rms };
    }

    // Parabolic interpolation for sub-cent precision
    let finalTau = tauEst;
    if (tauEst > 1 && tauEst < maxPeriod) {
      const s0 = cmndf[tauEst - 1];
      const s1 = cmndf[tauEst];
      const s2 = cmndf[tauEst + 1];
      const denom = 2 * (2 * s1 - s2 - s0);
      if (denom !== 0) {
        const delta = (s2 - s0) / denom;
        if (Math.abs(delta) < 1) finalTau += delta;
      }
    }

    return { freq: sampleRate / finalTau, rms };
  };

  // Match the measured pitch against actual string targets. The selected string
  // only breaks an exact tie; it must not relabel a different note as itself.
  const matchGuitarString = (detectedFreq, currentPresetStrings, selectedIdx) => {
    if (detectedFreq <= 0 || !currentPresetStrings) return null;
    const selected = currentPresetStrings[selectedIdx];
    if (selected) {
      const candidates = [detectedFreq, detectedFreq / 2, detectedFreq * 2];
      let selectedMatch = candidates[0];
      let selectedCents = 1200 * Math.log2(selectedMatch / selected.f);
      for (const candidate of candidates.slice(1)) {
        const cents = 1200 * Math.log2(candidate / selected.f);
        if (Math.abs(cents) < Math.abs(selectedCents)) {
          selectedMatch = candidate;
          selectedCents = cents;
        }
      }
      // Accept a selected-string fundamental or its second harmonic only when
      // the pitch is plausibly that string; otherwise identify the actual one.
      if (Math.abs(selectedCents) <= 100) {
        return {
          strIdx: selectedIdx,
          strName: selected.n,
          targetFreq: selected.f,
          cents: Math.max(-50, Math.min(50, Math.round(selectedCents))),
          effFreq: selectedMatch
        };
      }
    }

    let best = null;
    for (let i = 0; i < currentPresetStrings.length; i++) {
      const target = currentPresetStrings[i];
      const effFreq = detectedFreq;
      const centsDiff = 1200 * Math.log2(effFreq / target.f);
      const diff = Math.abs(centsDiff);
      if (!best || diff < best.diff) {
        best = { target, index: i, effFreq, centsDiff, diff };
      }
    }

    if (!best) return null;
    return {
      strIdx: best.index,
      strName: best.target.n,
      targetFreq: best.target.f,
      cents: Math.max(-50, Math.min(50, Math.round(best.centsDiff))),
      effFreq: best.effFreq
    };
  };

  const startTuner = async () => {
    setMicPermissionDenied(false);
    tunerPresetRef.current = TUNING_PRESETS[activeTuningPreset];
    tunerStringIndexRef.current = tunerStringIndex;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          // Preserve the microphone's natural envelope; AGC pumping can make
          // repeated pitch frames wander, especially on the G string.
          autoGainControl: false,
        },
        video: false
      });
      tunerStreamRef.current = stream;

      // DO NOT force sampleRate - use system native hardware rate (typically 48000Hz or 44100Hz)
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      tunerAudioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.0;
      tunerAnalyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const buf = new Float32Array(analyser.fftSize);
      let pitchHistory = [];
      let lastSelectedStringIndex = tunerStringIndexRef.current;
      let lastActivePreset = tunerPresetRef.current;
      let lastSoundTime = 0;
      const HOLD_DURATION_MS = 3500; // Hold readings for 3.5s after sound ends
      lastUpdateRef.current = 0;

      const loop = () => {
        tunerRafRef.current = requestAnimationFrame(loop);

        // Throttle to 20 FPS (50ms) for silky 0-lag UI responsiveness
        const now = performance.now();
        if (now - lastUpdateRef.current < 50) return;
        lastUpdateRef.current = now;

        // A changed string or tuning preset starts a fresh pitch window. The
        // previous reading can remain visible for its normal hold duration.
        if (
          lastSelectedStringIndex !== tunerStringIndexRef.current ||
          lastActivePreset !== tunerPresetRef.current
        ) {
          pitchHistory = [];
          lastSelectedStringIndex = tunerStringIndexRef.current;
          lastActivePreset = tunerPresetRef.current;
        }

        analyser.getFloatTimeDomainData(buf);
        const { freq: rawFreq, rms } = detectPitch(buf, ctx.sampleRate);

        // Live mic volume (0-100%)
        const liveVol = Math.min(100, Math.round(rms * 1500));
        setMicLevel(liveVol);

        if (rawFreq > 0) {
          pitchHistory.push(rawFreq);
          if (pitchHistory.length > 5) pitchHistory.shift();

          const sorted = [...pitchHistory].sort((a, b) => a - b);
          const stableFreq = sorted[Math.floor(sorted.length / 2)];

          const match = matchGuitarString(stableFreq, lastActivePreset?.strings, tunerStringIndexRef.current);

          if (match) {
            lastSoundTime = now;
            setTunerDetectedFreq(Math.round(match.effFreq * 10) / 10);
            setTunerDetectedNote(match.strName);
            setTunerCents(match.cents);
            setIsHoldingPitch(false);
          }
        } else {
          // If sound ceased, HOLD the last valid reading for 3.5 seconds!
          if (lastSoundTime > 0 && now - lastSoundTime < HOLD_DURATION_MS) {
            setIsHoldingPitch(true);
          } else {
            // Only clear after 3.5s of silence
            pitchHistory = [];
            setTunerDetectedNote('—');
            setTunerDetectedFreq(0);
            setTunerCents(0);
            setIsHoldingPitch(false);
          }
        }
      };

      loop();
      setTunerActive(true);
    } catch (err) {
      console.error('Mic error:', err);
      setMicPermissionDenied(true);
    }
  };

  const stopTuner = () => {
    if (tunerRafRef.current) cancelAnimationFrame(tunerRafRef.current);
    if (tunerStreamRef.current) tunerStreamRef.current.getTracks().forEach(t => t.stop());
    if (tunerAudioCtxRef.current) tunerAudioCtxRef.current.close();
    tunerRafRef.current = null;
    tunerStreamRef.current = null;
    tunerAudioCtxRef.current = null;
    tunerAnalyserRef.current = null;
    setTunerActive(false);
    setTunerCents(0);
    setTunerDetectedNote('—');
    setTunerDetectedFreq(0);
    setMicLevel(0);
    setIsHoldingPitch(false);
  };

  // Keep refs in sync when state changes so the RAF loop always reads latest values
  useEffect(() => { tunerStringIndexRef.current = tunerStringIndex; }, [tunerStringIndex]);
  useEffect(() => { tunerPresetRef.current = TUNING_PRESETS[activeTuningPreset]; }, [activeTuningPreset]);

  // Cleanup tuner on unmount
  useEffect(() => () => stopTuner(), []);

  // ── Fetch chords and metronome data ────────────────────────────────────
  // Fetch data
  useEffect(() => {
    fetch('/api/chords')
      .then(res => res.json())
      .then(data => {
        if (data.chords) {
          setChords(data.chords);
          setSelectedChord(data.chords[0]);
        }
      }).catch(console.error);

    fetch('/api/metronome/tempos')
      .then(res => res.json())
      .then(data => {
        if (data.data?.tempoMarkings) setTempoMarkings(data.data.tempoMarkings);
      }).catch(console.error);
  }, []);

  // Metronome timer
  useEffect(() => {
    if (!isPlayingMetronome) {
      if (metronomeTimerRef.current) clearInterval(metronomeTimerRef.current);
      return;
    }
    const intervalMs = (60 / bpm) * 1000;
    let beat = 0;
    metronomeTimerRef.current = setInterval(() => {
      playClick(beat === 0);
      setCurrentBeat(beat);
      beat = (beat + 1) % beatsPerMeasure;
    }, intervalMs);
    return () => {
      if (metronomeTimerRef.current) clearInterval(metronomeTimerRef.current);
    };
  }, [isPlayingMetronome, bpm, beatsPerMeasure]);

  const currentTempoMarking = tempoMarkings.find(
    m => bpm >= m.minBpm && bpm <= m.maxBpm
  ) || { name: 'Moderato', description: 'Moderately' };

  // Chord verification
  const handleRunVerification = async () => {
    setIsVerifying(true);
    try {
      const res = await fetch('/api/chords/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chordName: verifierTargetChord,
          playedNotes: verifierPlayedNotes
        })
      });
      const data = await res.json();
      setVerifierResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (currentTab === 'practice') {
      handleRunVerification();
    }
  }, [verifierTargetChord, verifierPlayedNotes, currentTab]);

  return (
    <div className="min-h-screen bg-[#060408] text-zinc-100 flex flex-col md:flex-row antialiased selection:bg-[#e100ff]/30">
      
      {/* SIDEBAR (shadcn b0 aesthetic) */}
      <aside className="w-full md:w-64 bg-[#0a0610] border-r border-white/[0.08] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Header */}
          <div className="p-6 border-b border-white/[0.08] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#590764] to-[#e100ff] p-[1px] flex items-center justify-center shadow-[0_0_12px_rgba(225,0,255,0.3)]">
              <div className="w-full h-full bg-[#0d0714] rounded-lg flex items-center justify-center">
                <span className="text-xs font-black font-mono text-white">TB</span>
              </div>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white font-sans tracking-tight">TuneBreach</h1>
              <p className="text-[10px] font-mono text-zinc-500 uppercase">Studio Engine</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 font-sans">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'tuning', label: 'Tuning', icon: SlidersHorizontal },
              { id: 'metronome', label: 'Metronome', icon: Activity },
              { id: 'chords', label: 'Chord Library', icon: Music },
              { id: 'practice', label: 'Practice Chords', icon: Target }
            ].map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium tracking-wide transition-all ${
                    isActive
                      ? 'bg-white/10 text-white font-semibold shadow-sm border border-white/10'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-aurora-neon' : 'text-zinc-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Footer Profile */}
        <div className="p-4 border-t border-white/[0.08]">
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.05]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#590764] to-[#a855f7] flex items-center justify-center text-xs font-bold text-white font-mono">
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white leading-tight">{user.name || 'User'}</span>
                <span className="text-[10px] font-mono text-emerald-400">● Pro Acoustic</span>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Logout to landing page"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
        
        {/* Top Minimalist Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight">
              Welcome, {user.name || 'User'}
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 font-light mt-1">
              Your acoustic precision workspace is calibrated and ready.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Engine Status: Online</span>
            </span>
          </div>
        </div>

        {/* 1. OVERVIEW (HOME PAGE - MINIMALIST) */}
        {currentTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Top Stat Row: Current Streak */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* CURRENT STREAK CARD */}
              <div className="md:col-span-1 p-6 rounded-2xl bg-[#0d0814] border border-white/[0.08] shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">Current Streak</span>
                    <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
                      <Flame className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black font-mono text-white tracking-tight">7</span>
                    <span className="text-sm font-mono text-zinc-400 uppercase">Days Fire</span>
                  </div>

                  <p className="text-xs text-zinc-400 mt-2">
                    Consistent daily acoustic training. 3 days until next milestone badge.
                  </p>
                </div>

                {/* 7-Day Completion Tracker */}
                <div className="mt-6 pt-4 border-t border-white/[0.06]">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase block mb-2">This Week's Activity</span>
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                      <div key={idx} className="flex flex-col items-center gap-1">
                        <span className="text-[9px] font-mono text-zinc-500">{day}</span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          idx < 6
                            ? 'bg-gradient-to-tr from-[#590764] to-[#e100ff] text-white shadow-[0_0_8px_rgba(225,0,255,0.4)]'
                            : 'bg-white/10 text-white border border-white/20'
                        }`}>
                          {idx < 6 ? '✓' : '•'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PRACTICE METRICS STATS */}
              <div className="md:col-span-2 p-6 rounded-2xl bg-[#0d0814] border border-white/[0.08] shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">Acoustic Clarity Index</span>
                    <span className="text-xs font-mono text-emerald-400">+14% vs last week</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold font-mono text-white">98.4%</span>
                    <span className="text-xs font-mono text-zinc-400">Mean Harmonic Accuracy</span>
                  </div>
                </div>

                {/* LEARNING GRAPH (Interactive SVG) */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-2">
                    <span>LEARNING TRAJECTORY (DAILY PRACTICE VELOCITY)</span>
                    <span className="text-aurora-neon">Pitch Accuracy %</span>
                  </div>

                  <div className="relative h-40 w-full pt-4">
                    {/* SVG Curve */}
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 700 120" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="gradientGraph" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#e100ff" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#590764" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>

                      {/* Fill area */}
                      <path
                        d="M 0 90 Q 116 80, 233 60 T 466 35 T 700 15 L 700 120 L 0 120 Z"
                        fill="url(#gradientGraph)"
                      />

                      {/* Stroke line */}
                      <path
                        d="M 0 90 Q 116 80, 233 60 T 466 35 T 700 15"
                        fill="none"
                        stroke="#e100ff"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                      {/* Data point dots */}
                      {[
                        { x: 0, y: 90, label: 'Mon 88%' },
                        { x: 116, y: 78, label: 'Tue 91%' },
                        { x: 233, y: 60, label: 'Wed 89%' },
                        { x: 350, y: 48, label: 'Thu 94%' },
                        { x: 466, y: 35, label: 'Fri 92%' },
                        { x: 583, y: 22, label: 'Sat 97%' },
                        { x: 700, y: 15, label: 'Sun 98%' }
                      ].map((pt, i) => (
                        <circle
                          key={i}
                          cx={pt.x}
                          cy={pt.y}
                          r="5"
                          className="fill-[#060408] stroke-[#e100ff] stroke-2 hover:r-7 transition-all cursor-pointer"
                        />
                      ))}
                    </svg>

                    <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-2">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span className="text-white font-bold">Today</span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* RECOMMENDATION TASKS (Actionable practice cards) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-aurora-violet" />
                  <h3 className="text-base font-bold text-white font-sans">Recommended Practice Tasks</h3>
                </div>
                <span className="text-xs font-mono text-zinc-500">Based on recent chord audit history</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Task 1 */}
                <div className="p-5 rounded-2xl bg-[#0d0814] border border-white/[0.08] hover:border-aurora-neon/40 transition-all flex flex-col justify-between group">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      CALIBRATION
                    </span>
                    <h4 className="text-sm font-bold text-white mt-2">Standard E Intonation Check</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Verify string harmonic frequencies across strings 1 to 6 before your practice session.
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentTab('tuning')}
                    className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-aurora-violet group-hover:text-aurora-neon transition-colors"
                  >
                    <span>Launch Tuner</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Task 2 */}
                <div className="p-5 rounded-2xl bg-[#0d0814] border border-white/[0.08] hover:border-aurora-neon/40 transition-all flex flex-col justify-between group">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
                      HARMONIC DRILL
                    </span>
                    <h4 className="text-sm font-bold text-white mt-2">F Major Barre Chord Clarity</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Audit fret 1 index finger pressure to ensure the G and B string notes resonate cleanly without buzz.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setVerifierTargetChord('F Major (Barre)');
                      setVerifierPlayedNotes(['F', 'A', 'C']);
                      setCurrentTab('practice');
                    }}
                    className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-aurora-violet group-hover:text-aurora-neon transition-colors"
                  >
                    <span>Practice Chord Verifier</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Task 3 */}
                <div className="p-5 rounded-2xl bg-[#0d0814] border border-white/[0.08] hover:border-aurora-neon/40 transition-all flex flex-col justify-between group">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      TEMPO STABILITY
                    </span>
                    <h4 className="text-sm font-bold text-white mt-2">120 BPM Allegro Synchronizer</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      10-minute steady alternate picking drill with accent click on beat 1 in common 4/4 meter.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setBpm(120);
                      setCurrentTab('metronome');
                    }}
                    className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-aurora-violet group-hover:text-aurora-neon transition-colors"
                  >
                    <span>Start Metronome</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* 2. TUNING TAB — MINIMALISTIC ESCALATOR TUNER */}
        {currentTab === 'tuning' && (() => {
          const inTune = Math.abs(tunerCents) <= 3 && tunerDetectedNote !== '—';
          const slightlyOff = Math.abs(tunerCents) > 3 && Math.abs(tunerCents) <= 15;
          const cursorColor = inTune ? '#34d399' : slightlyOff ? '#fbbf24' : '#f43f5e';
          
          // Escalator vertical position:
          // 0 cents = 50% (dead center)
          // Negative cents (flat) -> moves DOWN (>50%)
          // Positive cents (sharp) -> moves UP (<50%)
          const escalatorTopPct = 50 - (tunerCents / 50) * 42;

          return (
            <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
              
              {/* Top Controls: 6 Strings at Top-Left, Presets & Start at Top-Right */}
              <div className="p-4 rounded-2xl bg-[#0d0814] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* 6 STRINGS ON TOP LEFT */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 block mb-2">
                    SELECT STRING TO TUNE
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {currentPreset.strings.map((str, idx) => {
                      const isActive = tunerStringIndex === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => setTunerStringIndex(idx)}
                          className={`flex items-baseline gap-1.5 px-3 py-2 rounded-xl text-xs font-mono transition-all ${
                            isActive
                              ? 'bg-[#e100ff] text-black font-bold shadow-[0_0_15px_rgba(225,0,255,0.4)] scale-105'
                              : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                          }`}
                        >
                          <span className="font-black text-sm">{str.n}</span>
                          <span className={`text-[10px] ${isActive ? 'text-black/70 font-semibold' : 'text-zinc-500'}`}>
                            {str.f.toFixed(0)}Hz
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* TUNING PRESET & START BUTTON */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <select
                    value={activeTuningPreset}
                    onChange={(e) => {
                      setActiveTuningPreset(e.target.value);
                      setTunerStringIndex(0);
                    }}
                    className="px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-xs font-mono text-zinc-200 outline-none hover:border-white/20 cursor-pointer"
                  >
                    {Object.entries(TUNING_PRESETS).map(([key, preset]) => (
                      <option key={key} value={key} className="bg-[#0d0814] text-white">
                        {preset.label}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => playTone(currentPreset.strings[tunerStringIndex].f)}
                    title="Pluck reference tone"
                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white transition-colors"
                  >
                    <Volume2 className="w-4 h-4 text-[#a855f7]" />
                  </button>

                  <button
                    onClick={tunerActive ? stopTuner : startTuner}
                    className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider transition-all flex items-center gap-2 active:scale-95 ${
                      tunerActive
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]'
                        : 'bg-gradient-to-r from-[#590764] to-[#e100ff] hover:brightness-110 text-white shadow-[0_0_20px_rgba(225,0,255,0.4)]'
                    }`}
                  >
                    {tunerActive ? (
                      <>
                        <span className="w-2 h-2 rounded-sm bg-white" />
                        <span>STOP</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        <span>START TUNER</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {micPermissionDenied && (
                <div className="flex items-center gap-2 text-rose-400 text-xs font-mono bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Microphone blocked. Please allow mic permissions in your browser address bar and click Start Tuner.
                </div>
              )}

              {/* ── THE MINIMALISTIC ESCALATOR TUNER ── */}
              <div className="p-6 md:p-8 rounded-3xl bg-[#0a0610] border border-white/[0.08] shadow-2xl">
                
                <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                  
                  {/* LEFT: THE STRAIGHT LINE ESCALATOR RAIL */}
                  <div className="flex flex-col items-center">
                    
                    <span className="text-[10px] font-mono font-bold tracking-wider text-rose-400 mb-2">
                      ▲ SHARP (TOO HIGH)
                    </span>

                    {/* STRAIGHT VERTICAL RAIL (Height: 340px) */}
                    <div className="relative w-44 h-[340px] rounded-2xl bg-[#060408] border border-white/10 flex justify-center overflow-hidden">
                      
                      {/* Straight vertical guide rail */}
                      <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1.5 bg-zinc-900 border-x border-white/10">
                        <div className="w-0.5 h-full mx-auto bg-gradient-to-b from-rose-500/40 via-emerald-400/80 to-purple-500/40" />
                      </div>

                      {/* Tick Marks on Escalator Rail */}
                      {[
                        { cents: 40, label: '+40¢' },
                        { cents: 20, label: '+20¢' },
                        { cents: 0,  label: '0¢' },
                        { cents: -20, label: '-20¢' },
                        { cents: -40, label: '-40¢' },
                      ].map((rung) => {
                        const topPos = 50 - (rung.cents / 50) * 42;
                        const isCenter = rung.cents === 0;

                        return (
                          <div
                            key={rung.cents}
                            className="absolute left-0 right-0 flex items-center justify-between px-3 pointer-events-none"
                            style={{ top: `${topPos}%`, transform: 'translateY(-50%)' }}
                          >
                            <span className={`text-[9px] font-mono ${isCenter ? 'text-emerald-400 font-bold' : 'text-zinc-600'}`}>
                              {rung.label}
                            </span>
                            <div className={`h-px ${isCenter ? 'w-10 bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'w-4 bg-white/20'}`} />
                            <span className={`text-[9px] font-mono ${isCenter ? 'text-emerald-400 font-bold' : 'text-zinc-600'}`}>
                              {isCenter ? 'LOCK' : ''}
                            </span>
                          </div>
                        );
                      })}

                      {/* Moving Cursor on the Straight Line */}
                      {tunerActive && tunerDetectedNote !== '—' ? (
                        <div
                          className="absolute left-2 right-2 flex items-center justify-between px-3 py-1.5 rounded-lg border backdrop-blur-md shadow-xl transition-all duration-75 pointer-events-none z-10"
                          style={{
                            top: `${escalatorTopPct}%`,
                            transform: 'translateY(-50%)',
                            backgroundColor: inTune ? 'rgba(6, 78, 59, 0.9)' : 'rgba(20, 10, 30, 0.95)',
                            borderColor: cursorColor,
                            boxShadow: `0 0 16px ${cursorColor}88`
                          }}
                        >
                          <span className="text-xs font-black" style={{ color: cursorColor }}>
                            {inTune ? '◆' : tunerCents < 0 ? '▲' : '▼'}
                          </span>
                          <span className="text-xs font-mono font-bold text-white">
                            {inTune ? '0¢' : `${tunerCents > 0 ? '+' : ''}${tunerCents}¢`}
                          </span>
                          <span className="text-[10px] font-mono uppercase font-bold" style={{ color: cursorColor }}>
                            {inTune ? 'LOCKED' : tunerCents < 0 ? 'UP' : 'DOWN'}
                          </span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[10px] font-mono text-zinc-600 tracking-wider text-center px-4">
                            {tunerActive ? 'PLUCK STRING...' : 'TUNER OFF'}
                          </span>
                        </div>
                      )}

                    </div>

                    <span className="text-[10px] font-mono font-bold tracking-wider text-purple-400 mt-2">
                      ▼ FLAT (TOO LOW)
                    </span>

                  </div>

                  {/* RIGHT: MINIMALIST DIGITAL READOUT */}
                  <div className="flex flex-col items-center md:items-start space-y-4">
                    
                    {/* Big Note Badge */}
                    <div className="flex items-baseline gap-4">
                      <span
                        className="text-7xl font-black font-mono tracking-tight transition-colors"
                        style={{ color: tunerActive && tunerDetectedNote !== '—' ? cursorColor : '#3f3f46' }}
                      >
                        {tunerDetectedNote !== '—' ? tunerDetectedNote : currentPreset.strings[tunerStringIndex].n}
                      </span>

                      <div className="flex flex-col">
                        <span className="text-xs font-mono text-zinc-500">TARGET</span>
                        <span className="text-lg font-bold font-mono text-white">
                          {currentPreset.strings[tunerStringIndex].n} ({currentPreset.strings[tunerStringIndex].f.toFixed(1)} Hz)
                        </span>
                        <span className="text-xs font-mono text-zinc-400 mt-0.5">
                          Detected: {tunerDetectedFreq > 0 ? `${tunerDetectedFreq.toFixed(1)} Hz` : '— Hz'}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div
                      className="px-4 py-2 rounded-xl border flex items-center gap-2.5 font-mono text-xs font-bold"
                      style={{
                        backgroundColor: inTune ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                        borderColor: tunerActive && tunerDetectedNote !== '—' ? cursorColor : 'rgba(255, 255, 255, 0.1)',
                        color: tunerActive && tunerDetectedNote !== '—' ? cursorColor : '#71717a'
                      }}
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${isHoldingPitch ? 'opacity-80' : 'animate-pulse'}`}
                        style={{ backgroundColor: cursorColor, boxShadow: `0 0 8px ${cursorColor}` }}
                      />
                      <span>
                        {!tunerActive
                          ? 'CLICK START TUNER'
                          : tunerDetectedNote === '—'
                            ? 'WAITING FOR SOUND...'
                            : inTune
                              ? `PERFECT RESONANCE — IN TUNE ✓ ${isHoldingPitch ? '• [HELD]' : ''}`
                              : tunerCents < 0
                                ? `TUNE UP: TIGHTEN PEG (+${Math.abs(tunerCents)}¢) ${isHoldingPitch ? '• [HELD]' : ''}`
                                : `TUNE DOWN: LOOSEN PEG (-${tunerCents}¢) ${isHoldingPitch ? '• [HELD]' : ''}`}
                      </span>
                    </div>

                    {/* Live Microphone Input Sensitivity Meter (Verifies Sound Input) */}
                    <div className="w-full pt-2 border-t border-white/[0.08] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-zinc-500 flex items-center gap-1.5">
                          <Activity className={`w-3 h-3 ${micLevel > 1 ? 'text-emerald-400 animate-pulse' : 'text-zinc-600'}`} />
                          MIC INPUT LEVEL
                        </span>
                        <span className={micLevel > 1 ? 'text-emerald-400 font-bold' : 'text-zinc-600'}>
                          {tunerActive ? (micLevel > 1 ? `${micLevel}% (ACTIVE)` : '0% (QUIET)') : 'STANDBY'}
                        </span>
                      </div>

                      {/* Real-time VU sensitivity bar */}
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 via-[#e100ff] to-rose-500 transition-all duration-75"
                          style={{ width: `${tunerActive ? micLevel : 0}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-zinc-500 block">
                        Sensitive to faint acoustic plucks. Watch the meter react when you play or speak.
                      </span>
                    </div>

                  </div>

                </div>

              </div>

            </div>
          );
        })()}


        {/* 3. METRONOME TAB */}
        {currentTab === 'metronome' && (
          <div className="space-y-8 max-w-2xl mx-auto py-4 animate-in fade-in duration-300">
            <div className="text-center">
              <span className="text-xs font-mono uppercase text-aurora-neon tracking-[0.2em] font-semibold">
                TEMPO LEVEL // {currentTempoMarking.name}
              </span>
              <p className="text-xs text-zinc-400 mt-1">{currentTempoMarking.description}</p>
            </div>

            <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-black/60 border border-white/10 shadow-inner">
              <span className="text-7xl sm:text-8xl font-black font-mono text-white tracking-tighter drop-shadow-[0_0_30px_rgba(225,0,255,0.3)]">
                {bpm}
              </span>
              <span className="text-xs font-mono tracking-widest text-zinc-400 mt-2 uppercase">
                BEATS PER MINUTE
              </span>

              <div className="flex items-center gap-4 mt-6">
                {Array.from({ length: beatsPerMeasure }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-full transition-all duration-100 ${
                      isPlayingMetronome && currentBeat === i
                        ? i === 0 
                          ? 'bg-aurora-neon scale-125 shadow-[0_0_15px_#e100ff]' 
                          : 'bg-white scale-110 shadow-[0_0_10px_white]'
                        : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-zinc-500">40 BPM</span>
                <input
                  type="range"
                  min="40"
                  max="220"
                  value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value))}
                  className="flex-1 accent-aurora-neon h-2 rounded-lg bg-zinc-800 cursor-pointer"
                />
                <span className="text-xs font-mono text-zinc-500">220 BPM</span>
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => setIsPlayingMetronome(!isPlayingMetronome)}
                  className={`px-8 py-3.5 rounded-2xl font-mono text-sm font-bold tracking-wider transition-all flex items-center gap-2 active:scale-95 ${
                    isPlayingMetronome
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)]'
                      : 'bg-gradient-to-r from-[#590764] to-[#e100ff] hover:brightness-110 text-white shadow-[0_0_25px_rgba(225,0,255,0.4)]'
                  }`}
                >
                  {isPlayingMetronome ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlayingMetronome ? 'STOP PULSE' : 'START METRONOME'}</span>
                </button>

                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/10">
                  {[4, 3, 6].map(beats => (
                    <button
                      key={beats}
                      onClick={() => setBeatsPerMeasure(beats)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                        beatsPerMeasure === beats ? 'bg-white/20 text-white font-bold' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      {beats}/4
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. CHORD LIBRARY TAB */}
        {currentTab === 'chords' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">Vast Harmonic Chord Vault</h3>
                <p className="text-xs text-zinc-400">Search and audition thousands of chord variations, fingerings, and notes.</p>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['All', 'C', 'G', 'D', 'A', 'E', 'F', 'B'].map(r => (
                  <button
                    key={r}
                    onClick={() => setSelectedRoot(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors ${
                      selectedRoot === r 
                        ? 'bg-aurora-violet text-white font-bold' 
                        : 'bg-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <label htmlFor="chord-instrument" className="font-mono">SOUND</label>
              <select
                id="chord-instrument"
                value={selectedInstrument}
                onChange={event => setSelectedInstrument(event.target.value)}
                className="rounded-lg border border-white/10 bg-[#120d18] px-3 py-2 text-white outline-none focus:border-aurora-neon"
              >
                <option value="acoustic">Acoustic guitar</option>
                <option value="electric">Clean electric guitar</option>
                <option value="piano">Piano</option>
              </select>
              <span>Tap to play · hold a chord to view its diagram</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {chords
                .filter(c => selectedRoot === 'All' || c.root === selectedRoot)
                .map(chord => {
                  const isSelected = selectedChord?.id === chord.id;
                  return (
                    <div
                      key={chord.id}
                      onPointerDown={() => {
                        longPressTriggeredRef.current = false;
                        clearChordLongPress();
                        longPressTimerRef.current = setTimeout(() => {
                          const visibleChords = chords.filter(c => selectedRoot === 'All' || c.root === selectedRoot);
                          const diagramIndex = visibleChords.findIndex(c => c.id === chord.id);
                          if (diagramIndex >= 0 && CHORD_DIAGRAMS[chord.id]) {
                            longPressTriggeredRef.current = true;
                            setSelectedChord(chord);
                            setCarouselStartIndex(diagramIndex);
                            setCarouselOpen(true);
                          }
                        }, 2200);
                      }}
                      onPointerUp={clearChordLongPress}
                      onPointerLeave={clearChordLongPress}
                      onPointerCancel={clearChordLongPress}
                      onClick={() => {
                        setSelectedChord(chord);
                        playChordNotes(chord);
                      }}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-gradient-to-br from-[#590764]/40 to-transparent border-aurora-neon shadow-[0_0_20px_rgba(225,0,255,0.2)]'
                          : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xl font-bold text-white font-sans">{chord.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-aurora-violet">
                            {chord.difficulty}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-zinc-400 block mb-2">{chord.type} ({chord.formula})</span>
                        <p className="text-xs text-zinc-300 italic mb-3">"{chord.mood}"</p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1 mb-3">
                          <span className="text-[10px] font-mono text-zinc-500">NOTES:</span>
                          {chord.notes.map((n, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-xs font-mono text-white">
                              {n}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-white/10">
                          <span className="text-[10px] font-mono text-zinc-500">
                            FRETS: {chord.frets.join('-')}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playChordNotes(chord);
                            }}
                            className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-aurora-neon hover:text-black text-xs font-mono transition-colors flex items-center gap-1"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Strum</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {carouselOpen && selectedChord && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setCarouselOpen(false)}>
                <section
                  role="dialog"
                  aria-modal="true"
                  aria-label={`${selectedChord.name} chord diagram`}
                  className="w-full max-w-md rounded-2xl border border-white/10 bg-[#100b16] p-5 shadow-2xl"
                  onClick={event => event.stopPropagation()}
                  onTouchStart={event => { chordSwipeStartRef.current = event.changedTouches[0].clientX; }}
                  onTouchEnd={event => {
                    const startX = chordSwipeStartRef.current;
                    const deltaX = startX == null ? 0 : event.changedTouches[0].clientX - startX;
                    if (Math.abs(deltaX) > 45) {
                      const list = chords.filter(c => selectedRoot === 'All' || c.root === selectedRoot);
                      const next = (carouselStartIndex + (deltaX < 0 ? 1 : -1) + list.length) % list.length;
                      setCarouselStartIndex(next);
                      setSelectedChord(list[next]);
                    }
                    chordSwipeStartRef.current = null;
                  }}
                  onKeyDown={event => {
                    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                    const list = chords.filter(c => selectedRoot === 'All' || c.root === selectedRoot);
                    const next = (carouselStartIndex + (event.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length;
                    setCarouselStartIndex(next);
                    setSelectedChord(list[next]);
                  }}
                  tabIndex={0}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-lg font-bold text-white">{selectedChord.name}</h4>
                    <button type="button" onClick={() => setCarouselOpen(false)} className="rounded-lg px-3 py-1 text-zinc-400 hover:bg-white/10 hover:text-white" aria-label="Close chord diagram">✕</button>
                  </div>
                  {CHORD_DIAGRAMS[selectedChord.id] ? (
                    <ChordDiagram chordId={selectedChord.id} size={220} />
                  ) : (
                    <p className="py-12 text-center text-sm text-zinc-400">No diagram is available for this chord yet.</p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <button type="button" onClick={() => {
                      const list = chords.filter(c => selectedRoot === 'All' || c.root === selectedRoot);
                      const next = (carouselStartIndex - 1 + list.length) % list.length;
                      setCarouselStartIndex(next);
                      setSelectedChord(list[next]);
                    }} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">Previous</button>
                    <span className="text-xs font-mono text-zinc-500">{carouselStartIndex + 1} / {chords.filter(c => selectedRoot === 'All' || c.root === selectedRoot).length}</span>
                    <button type="button" onClick={() => {
                      const list = chords.filter(c => selectedRoot === 'All' || c.root === selectedRoot);
                      const next = (carouselStartIndex + 1) % list.length;
                      setCarouselStartIndex(next);
                      setSelectedChord(list[next]);
                    }} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">Next</button>
                  </div>
                </section>
              </div>
            )}
          </div>
        )}

        {/* 5. PRACTICE CHORDS TAB (AI CHORD VERIFIER) */}
        {currentTab === 'practice' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h3 className="text-xl font-bold text-white">AI Acoustic Chord Practice</h3>
              <p className="text-xs text-zinc-400">
                Powered by the TuneBreach verification endpoint. Audits played notes and provides instant harmonic feedback.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-mono text-zinc-300 font-semibold">1. SELECT CHORD TO PRACTICE:</span>
                <div className="flex flex-wrap gap-2">
                  {['C Major', 'G Major', 'D Minor', 'A Minor', 'F Major (Barre)'].map(cName => (
                    <button
                      key={cName}
                      onClick={() => {
                        setVerifierTargetChord(cName);
                        if (cName === 'C Major') setVerifierPlayedNotes(['C', 'E', 'G']);
                        if (cName === 'G Major') setVerifierPlayedNotes(['G', 'B', 'D']);
                        if (cName === 'D Minor') setVerifierPlayedNotes(['D', 'F', 'A']);
                        if (cName === 'A Minor') setVerifierPlayedNotes(['A', 'C', 'E']);
                        if (cName === 'F Major (Barre)') setVerifierPlayedNotes(['F', 'A', 'C']);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                        verifierTargetChord === cName
                          ? 'bg-aurora-neon text-black font-bold'
                          : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      {cName}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
                <span className="text-xs font-mono text-zinc-300 font-semibold">2. SIMULATE PLAYED INPUT:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      if (verifierTargetChord === 'C Major') setVerifierPlayedNotes(['C', 'E', 'G']);
                      if (verifierTargetChord === 'G Major') setVerifierPlayedNotes(['G', 'B', 'D']);
                      if (verifierTargetChord === 'D Minor') setVerifierPlayedNotes(['D', 'F', 'A']);
                      if (verifierTargetChord === 'A Minor') setVerifierPlayedNotes(['A', 'C', 'E']);
                      if (verifierTargetChord === 'F Major (Barre)') setVerifierPlayedNotes(['F', 'A', 'C']);
                    }}
                    className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono hover:bg-emerald-500/30"
                  >
                    Clean Strum (100%)
                  </button>
                  <button
                    onClick={() => {
                      if (verifierTargetChord === 'C Major') setVerifierPlayedNotes(['C', 'G']);
                      if (verifierTargetChord === 'G Major') setVerifierPlayedNotes(['G', 'D']);
                      if (verifierTargetChord === 'D Minor') setVerifierPlayedNotes(['D', 'A']);
                      if (verifierTargetChord === 'A Minor') setVerifierPlayedNotes(['A', 'E']);
                      if (verifierTargetChord === 'F Major (Barre)') setVerifierPlayedNotes(['F', 'C']);
                    }}
                    className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono hover:bg-amber-500/30"
                  >
                    Muted String
                  </button>
                  <button
                    onClick={() => {
                      setVerifierPlayedNotes(['F#', 'G#']);
                    }}
                    className="px-3 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono hover:bg-rose-500/30"
                  >
                    Incorrect Notes
                  </button>
                </div>
              </div>
            </div>

            {verifierResult && (
              <div className={`p-6 rounded-2xl border transition-all ${
                verifierResult.isAccurate
                  ? 'bg-gradient-to-br from-emerald-950/40 to-[#0c0812] border-emerald-500/40'
                  : 'bg-gradient-to-br from-rose-950/30 to-[#0c0812] border-rose-500/30'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    {verifierResult.isAccurate ? (
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    ) : (
                      <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h5 className="text-base font-bold text-white">
                        {verifierResult.isAccurate ? 'Chord Verified Correct!' : 'Chord Accuracy Warning'}
                      </h5>
                      <p className="text-xs font-mono text-zinc-400">
                        Target: {verifierResult.chord} // Played: [{verifierResult.playedNotes.join(', ') || 'None'}]
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-3xl font-black font-mono text-white">
                      {verifierResult.accuracyScore}%
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 block">HARMONIC ACCURACY</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 font-sans leading-relaxed bg-black/40 p-3 rounded-xl border border-white/5">
                  {verifierResult.feedback}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/10 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500 block mb-1">HARMONIZED NOTES:</span>
                    <span className="text-emerald-400 font-bold">
                      {verifierResult.matchedNotes.length > 0 ? verifierResult.matchedNotes.join(', ') : 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block mb-1">MISSED / INCOMPLETE:</span>
                    <span className="text-rose-400 font-bold">
                      {verifierResult.missedNotes.length > 0 ? verifierResult.missedNotes.join(', ') : 'None'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

    </div>
  );
}
