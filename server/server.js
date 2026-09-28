import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tuningsRouter from './routes/tunings.js';
import chordsRouter from './routes/chords.js';
import metronomeRouter from './routes/metronome.js';
import waitlistRouter from './routes/waitlist.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/tunings', tuningsRouter);
app.use('/api/chords', chordsRouter);
app.use('/api/metronome', metronomeRouter);
app.use('/api/waitlist', waitlistRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'TuneBreach Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    capabilities: [
      'Multi-Tuning Audio Engine',
      'Vast Harmonic Chord Library',
      'Multi-Level Metronome',
      'AI Real-Time Chord Verifier'
    ]
  });
});

app.listen(PORT, () => {
  console.log(`🎵 TuneBreach Backend Server running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
});
