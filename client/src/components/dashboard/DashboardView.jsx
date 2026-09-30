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

export default function DashboardView({ user = { name: 'Dhruv' }, onLogout }) {
  const [currentTab, setCurrentTab] = useState('overview');

  // --- Tuning State ---
  const [tunings, setTunings] = useState([]);
  const [selectedTuning, setSelectedTuning] = useState(null);
  const [activeStringIndex, setActiveStringIndex] = useState(0);
  const [simulatedPitchDeviation, setSimulatedPitchDeviation] = useState(0);

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
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.8);
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


  // Fetch data
  useEffect(() => {
    fetch('/api/tunings')
      .then(res => res.json())
      .then(data => {
        if (data.tunings) {
          setTunings(data.tunings);
          setSelectedTuning(data.tunings[0]);
        }
      }).catch(console.error);

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

        {/* 2. TUNING TAB */}
        {currentTab === 'tuning' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">Guitar Multi-Tuning Engine</h3>
                <p className="text-xs text-zinc-400">Select any guitar tuning preset and pluck strings for reference pitch.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {tunings.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTuning(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      selectedTuning?.id === t.id
                        ? 'bg-aurora-neon text-black font-bold shadow-[0_0_12px_rgba(225,0,255,0.4)]'
                        : 'bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {selectedTuning && (
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10">
                <span className="text-[10px] font-mono uppercase text-aurora-violet tracking-widest font-semibold">
                  {selectedTuning.category} TUNING
                </span>
                <p className="text-xs text-zinc-300 mt-1">{selectedTuning.description}</p>
              </div>
            )}

            {/* Fretboard / String Visualizer */}
            {selectedTuning && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {selectedTuning.strings.map((str, idx) => {
                  const isSelected = activeStringIndex === idx;
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setActiveStringIndex(idx);
                        playTone(str.freq);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center justify-between relative group ${
                        isSelected 
                          ? 'bg-gradient-to-b from-[#590764]/50 to-transparent border-aurora-neon shadow-[0_0_20px_rgba(225,0,255,0.25)]' 
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <span className="text-[10px] font-mono text-zinc-500 mb-2">STRING {str.string}</span>
                      <div className="w-12 h-12 rounded-full bg-black/60 border border-white/10 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                        <span className="text-xl font-bold font-mono text-white">{str.note}</span>
                      </div>
                      <span className="text-xs font-mono text-aurora-violet font-semibold">{str.freq.toFixed(1)} Hz</span>
                      <button className="mt-3 px-2.5 py-1 rounded bg-white/10 text-[10px] font-mono text-zinc-300 group-hover:bg-aurora-neon group-hover:text-black transition-colors flex items-center gap-1">
                        <Volume2 className="w-3 h-3" />
                        <span>Pluck</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pitch Deviation Meter Simulation */}
            <div className="p-5 rounded-2xl bg-black/50 border border-white/10">
              <div className="flex items-center justify-between mb-3 text-xs font-mono">
                <span className="text-zinc-400">PITCH CENT DETECTOR (FFT HARMONIC LOCK)</span>
                <span className={`font-bold ${
                  Math.abs(simulatedPitchDeviation) <= 3 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {Math.abs(simulatedPitchDeviation) <= 3 
                    ? 'IN TUNE (±0 Cents)' 
                    : `${simulatedPitchDeviation > 0 ? '+' : ''}${simulatedPitchDeviation} Cents`}
                </span>
              </div>
              
              <div className="relative h-4 bg-zinc-900 rounded-full overflow-hidden border border-white/10">
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-emerald-400 -translate-x-1/2 z-10 shadow-[0_0_8px_#34d399]" />
                <div 
                  className="absolute top-0 bottom-0 w-3 rounded-full bg-aurora-neon transition-all duration-150"
                  style={{
                    left: `calc(50% + ${simulatedPitchDeviation * 0.9}%)`,
                    transform: 'translateX(-50%)'
                  }}
                />
              </div>

              <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-2">
                <span>-50 Cents (Flat)</span>
                <span className="text-emerald-400 font-semibold">0 Cents (Center Lock)</span>
                <span>+50 Cents (Sharp)</span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs text-zinc-400 font-mono">Simulate Detuning:</span>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  value={simulatedPitchDeviation}
                  onChange={(e) => setSimulatedPitchDeviation(parseInt(e.target.value))}
                  className="flex-1 accent-purple-500 cursor-pointer"
                />
                <button 
                  onClick={() => setSimulatedPitchDeviation(0)}
                  className="px-2.5 py-1 text-[11px] font-mono rounded bg-white/10 hover:bg-white/20 text-zinc-300"
                >
                  Reset Center
                </button>
              </div>
            </div>
          </div>
        )}

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
