import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  SlidersHorizontal, 
  Music, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Volume2, 
  Play, 
  Pause, 
  RotateCcw,
  Sparkles,
  Disc,
  Radio
} from 'lucide-react';

export default function InteractiveModal({ isOpen, onClose, initialTab = 'tuner' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Tab 1: Tuner State
  const [tunings, setTunings] = useState([]);
  const [selectedTuning, setSelectedTuning] = useState(null);
  const [activeStringIndex, setActiveStringIndex] = useState(0);
  const [simulatedPitchDeviation, setSimulatedPitchDeviation] = useState(0);

  // Tab 2: Chords State
  const [chords, setChords] = useState([]);
  const [selectedRoot, setSelectedRoot] = useState('All');
  const [selectedChord, setSelectedChord] = useState(null);

  // Tab 3: Metronome State
  const [bpm, setBpm] = useState(120);
  const [isPlayingMetronome, setIsPlayingMetronome] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [beatsPerMeasure, setBeatsPerMeasure] = useState(4);
  const [tempoMarkings, setTempoMarkings] = useState([]);
  const metronomeTimerRef = useRef(null);

  // Tab 4: Chord Verifier State
  const [verifierTargetChord, setVerifierTargetChord] = useState('C Major');
  const [verifierPlayedNotes, setVerifierPlayedNotes] = useState(['C', 'E', 'G']);
  const [verifierResult, setVerifierResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Audio Context Ref for WebAudio synth sounds
  const audioCtxRef = useRef(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Initialize WebAudio context
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Play synthesized tone for tuner string
  const playTone = (freq) => {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Natural plucked decay envelope
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.8);
  };

  // Play metronome click
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

  // Play chord triad/notes polyphonically
  const playChordNotes = (notes) => {
    const noteFreqMap = {
      'C': 261.63, 'C#': 277.18, 'D': 293.66, 'Eb': 311.13, 'E': 329.63,
      'F': 349.23, 'F#': 369.99, 'G': 392.00, 'G#': 415.30, 'A': 440.00,
      'Bb': 466.16, 'B': 493.88
    };

    const ctx = getAudioContext();
    if (!ctx) return;

    notes.forEach((note, i) => {
      const freq = noteFreqMap[note] || 440;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.04);
      osc.stop(ctx.currentTime + 1.8);
    });
  };

  // Fetch initial data from backend
  useEffect(() => {
    if (!isOpen) return;

    // Fetch tunings
    fetch('/api/tunings')
      .then(res => res.json())
      .then(data => {
        if (data.tunings) {
          setTunings(data.tunings);
          setSelectedTuning(data.tunings[0]);
        }
      })
      .catch(console.error);

    // Fetch chords
    fetch('/api/chords')
      .then(res => res.json())
      .then(data => {
        if (data.chords) {
          setChords(data.chords);
          setSelectedChord(data.chords[0]);
        }
      })
      .catch(console.error);

    // Fetch metronome info
    fetch('/api/metronome/tempos')
      .then(res => res.json())
      .then(data => {
        if (data.data?.tempoMarkings) {
          setTempoMarkings(data.data.tempoMarkings);
        }
      })
      .catch(console.error);
  }, [isOpen]);

  // Metronome clock
  useEffect(() => {
    if (!isPlayingMetronome) {
      if (metronomeTimerRef.current) clearInterval(metronomeTimerRef.current);
      return;
    }

    const intervalMs = (60 / bpm) * 1000;
    let beat = 0;

    metronomeTimerRef.current = setInterval(() => {
      const isFirst = beat === 0;
      playClick(isFirst);
      setCurrentBeat(beat);
      beat = (beat + 1) % beatsPerMeasure;
    }, intervalMs);

    return () => {
      if (metronomeTimerRef.current) clearInterval(metronomeTimerRef.current);
    };
  }, [isPlayingMetronome, bpm, beatsPerMeasure]);

  // Calculate current tempo marking name
  const currentTempoMarking = tempoMarkings.find(
    m => bpm >= m.minBpm && bpm <= m.maxBpm
  ) || { name: 'Moderato', description: 'Moderately' };

  // Call backend to verify chord
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
      console.error('Verification error:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  // Run verification whenever target or notes change
  useEffect(() => {
    if (activeTab === 'verifier') {
      handleRunVerification();
    }
  }, [verifierTargetChord, verifierPlayedNotes, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-[#0c0812] border border-white/15 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-zinc-200">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#590764] to-[#e100ff] flex items-center justify-center text-white text-xs font-mono font-bold">
              TB
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide font-sans">TuneBreach Studio Suite</h3>
              <p className="text-[11px] font-mono text-zinc-400">Live Acoustic Precision Playground</p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-white/[0.02] overflow-x-auto px-4">
          {[
            { id: 'tuner', label: '01 // GUITAR TUNER', icon: SlidersHorizontal },
            { id: 'chords', label: '02 // CHORD VAULT', icon: Music },
            { id: 'metronome', label: '03 // METRONOME', icon: Activity },
            { id: 'verifier', label: '04 // AI CHORD CHECKER', icon: Sparkles }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-xs font-mono tracking-wider border-b-2 transition-all whitespace-nowrap ${
                  isActive 
                    ? 'border-aurora-neon text-white font-semibold bg-white/[0.04]' 
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-aurora-neon' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: GUITAR TUNER */}
          {activeTab === 'tuner' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg font-bold text-white">Precision Multi-Tuning Engine</h4>
                  <p className="text-xs text-zinc-400">Select any guitar tuning preset and pluck strings for reference pitch.</p>
                </div>
                {/* Tuning selector */}
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
                
                {/* Visual Cent Meter */}
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

          {/* TAB 2: CHORD LIBRARY */}
          {activeTab === 'chords' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg font-bold text-white">Vast Harmonic Chord Vault</h4>
                  <p className="text-xs text-zinc-400">Search and audition thousands of chord variations, fingerings, and notes.</p>
                </div>

                {/* Filter roots */}
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

              {/* Chords List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {chords
                  .filter(c => selectedRoot === 'All' || c.root === selectedRoot)
                  .map(chord => {
                    const isSelected = selectedChord?.id === chord.id;
                    return (
                      <div
                        key={chord.id}
                        onClick={() => {
                          setSelectedChord(chord);
                          playChordNotes(chord.notes);
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
                                playChordNotes(chord.notes);
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
            </div>
          )}

          {/* TAB 3: METRONOME */}
          {activeTab === 'metronome' && (
            <div className="space-y-8 max-w-2xl mx-auto py-4">
              <div className="text-center">
                <span className="text-xs font-mono uppercase text-aurora-neon tracking-[0.2em] font-semibold">
                  TEMPO LEVEL // {currentTempoMarking.name}
                </span>
                <p className="text-xs text-zinc-400 mt-1">{currentTempoMarking.description}</p>
              </div>

              {/* Big BPM Display */}
              <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-black/60 border border-white/10 shadow-inner">
                <span className="text-7xl sm:text-8xl font-black font-mono text-white tracking-tighter drop-shadow-[0_0_30px_rgba(225,0,255,0.3)]">
                  {bpm}
                </span>
                <span className="text-xs font-mono tracking-widest text-zinc-400 mt-2 uppercase">
                  BEATS PER MINUTE
                </span>

                {/* Beat Visualizer Indicators */}
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

              {/* Controls */}
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

                {/* Play / Stop Button */}
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

                  {/* Time signature toggles */}
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

          {/* TAB 4: CHORD VERIFIER */}
          {activeTab === 'verifier' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-bold text-white">AI Acoustic Chord Verifier</h4>
                <p className="text-xs text-zinc-400">
                  Powered by <code className="text-aurora-neon font-mono">POST /api/chords/verify</code>. The system analyses played notes and checks if the chord was struck accurately.
                </p>
              </div>

              {/* Target Chord Selector */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <span className="text-xs font-mono text-zinc-300 font-semibold">1. SELECT TARGET CHORD TO PRACTICE:</span>
                  <div className="flex flex-wrap gap-2">
                    {['C Major', 'G Major', 'D Minor', 'A Minor', 'F Major (Barre)'].map(cName => (
                      <button
                        key={cName}
                        onClick={() => {
                          setVerifierTargetChord(cName);
                          // Auto set matching notes as default
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

                {/* Strum Simulation Presets */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <span className="text-xs font-mono text-zinc-300 font-semibold">2. SIMULATE PLAYED ACOUSTIC INPUT:</span>
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
                        // Missed third note
                        if (verifierTargetChord === 'C Major') setVerifierPlayedNotes(['C', 'G']);
                        if (verifierTargetChord === 'G Major') setVerifierPlayedNotes(['G', 'D']);
                        if (verifierTargetChord === 'D Minor') setVerifierPlayedNotes(['D', 'A']);
                        if (verifierTargetChord === 'A Minor') setVerifierPlayedNotes(['A', 'E']);
                        if (verifierTargetChord === 'F Major (Barre)') setVerifierPlayedNotes(['F', 'C']);
                      }}
                      className="px-3 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono hover:bg-amber-500/30"
                    >
                      Muted String (Missed Note)
                    </button>
                    <button
                      onClick={() => {
                        setVerifierPlayedNotes(['F#', 'G#']);
                      }}
                      className="px-3 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono hover:bg-rose-500/30"
                    >
                      Wrong Chord Strum
                    </button>
                  </div>
                </div>

                {/* Individual Note Toggles */}
                <div className="pt-2">
                  <span className="text-[11px] font-mono text-zinc-500 block mb-2">DETECTED HARMONIC FREQUENCIES:</span>
                  <div className="flex flex-wrap gap-2">
                    {['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'].map(note => {
                      const isIncluded = verifierPlayedNotes.includes(note);
                      return (
                        <button
                          key={note}
                          onClick={() => {
                            if (isIncluded) {
                              setVerifierPlayedNotes(verifierPlayedNotes.filter(n => n !== note));
                            } else {
                              setVerifierPlayedNotes([...verifierPlayedNotes, note]);
                            }
                          }}
                          className={`w-9 h-9 rounded-lg font-mono text-xs font-bold transition-all ${
                            isIncluded
                              ? 'bg-aurora-violet text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                              : 'bg-white/5 text-zinc-500 hover:text-white'
                          }`}
                        >
                          {note}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Verification Result Card */}
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
                          <CheckCircle className="w-6 h-6" />
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
                      <span className="text-[10px] font-mono text-zinc-400 block">HARMONIC SCORE</span>
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

        </div>

      </div>
    </div>
  );
}
