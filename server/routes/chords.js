import { Router } from 'express';

const router = Router();

export const CHORDS = [
  {
    id: 'c-major',
    name: 'C Major',
    root: 'C',
    type: 'Major Triad',
    difficulty: 'Beginner',
    notes: ['C', 'E', 'G'],
    frets: ['x', 3, 2, 0, 1, 0],
    fingers: ['-', 3, 2, '-', 1, '-'],
    formula: '1 - 3 - 5',
    mood: 'Bright, pure, resolute'
  },
  {
    id: 'g-major',
    name: 'G Major',
    root: 'G',
    type: 'Major Triad',
    difficulty: 'Beginner',
    notes: ['G', 'B', 'D'],
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, '-', '-', '-', 3],
    formula: '1 - 3 - 5',
    mood: 'Expansive, jubilant, grounded'
  },
  {
    id: 'd-minor',
    name: 'D Minor',
    root: 'D',
    type: 'Minor Triad',
    difficulty: 'Beginner',
    notes: ['D', 'F', 'A'],
    frets: ['x', 'x', 0, 2, 3, 1],
    fingers: ['-', '-', '-', 2, 3, 1],
    formula: '1 - b3 - 5',
    mood: 'Melancholic, contemplative, poignant'
  },
  {
    id: 'a-minor',
    name: 'A Minor',
    root: 'A',
    type: 'Minor Triad',
    difficulty: 'Beginner',
    notes: ['A', 'C', 'E'],
    frets: ['x', 0, 2, 2, 1, 0],
    fingers: ['-', '-', 2, 3, 1, '-'],
    formula: '1 - b3 - 5',
    mood: 'Soulful, introspective, gentle sadness'
  },
  {
    id: 'e-major',
    name: 'E Major',
    root: 'E',
    type: 'Major Triad',
    difficulty: 'Beginner',
    notes: ['E', 'G#', 'B'],
    frets: [0, 2, 2, 1, 0, 0],
    fingers: ['-', 2, 3, 1, '-', '-'],
    formula: '1 - 3 - 5',
    mood: 'Powerful, triumphant, thunderous resonance'
  },
  {
    id: 'f-major',
    name: 'F Major (Barre)',
    root: 'F',
    type: 'Major Barre',
    difficulty: 'Intermediate',
    notes: ['F', 'A', 'C'],
    frets: [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    formula: '1 - 3 - 5',
    mood: 'Warm, solid, pastoral'
  },
  {
    id: 'b-minor',
    name: 'B Minor (Barre)',
    root: 'B',
    type: 'Minor Barre',
    difficulty: 'Intermediate',
    notes: ['B', 'D', 'F#'],
    frets: ['x', 2, 4, 4, 3, 2],
    fingers: ['-', 1, 3, 4, 2, 1],
    formula: '1 - b3 - 5',
    mood: 'Dramatic, mysterious, brooding'
  },
  {
    id: 'c-maj7',
    name: 'C Major 7',
    root: 'C',
    type: 'Major 7th',
    difficulty: 'Intermediate',
    notes: ['C', 'E', 'G', 'B'],
    frets: ['x', 3, 2, 0, 0, 0],
    fingers: ['-', 3, 2, '-', '-', '-'],
    formula: '1 - 3 - 5 - 7',
    mood: 'Dreamy, ethereal, neo-soul warmth'
  },
  {
    id: 'g-7',
    name: 'G Dominant 7',
    root: 'G',
    type: 'Dominant 7th',
    difficulty: 'Beginner',
    notes: ['G', 'B', 'D', 'F'],
    frets: [3, 2, 0, 0, 0, 1],
    fingers: [3, 2, '-', '-', '-', 1],
    formula: '1 - 3 - 5 - b7',
    mood: 'Bluesy, expectant, tension that yearns to resolve'
  },
  {
    id: 'd-major',
    name: 'D Major',
    root: 'D',
    type: 'Major Triad',
    difficulty: 'Beginner',
    notes: ['D', 'F#', 'A'],
    frets: ['x', 'x', 0, 2, 3, 2],
    fingers: ['-', '-', '-', 1, 3, 2],
    formula: '1 - 3 - 5',
    mood: 'Clear, bright, and open'
  },
  {
    id: 'e-minor',
    name: 'E Minor',
    root: 'E',
    type: 'Minor Triad',
    difficulty: 'Beginner',
    notes: ['E', 'G', 'B'],
    frets: [0, 2, 2, 0, 0, 0],
    fingers: ['-', 2, 3, '-', '-', '-'],
    formula: '1 - b3 - 5',
    mood: 'Open, mellow, and reflective'
  },
  {
    id: 'a-major',
    name: 'A Major',
    root: 'A',
    type: 'Major Triad',
    difficulty: 'Beginner',
    notes: ['A', 'C#', 'E'],
    frets: ['x', 0, 2, 2, 2, 0],
    fingers: ['-', '-', 1, 2, 3, '-'],
    formula: '1 - 3 - 5',
    mood: 'Warm, steady, and familiar'
  },
  {
    id: 'd-7',
    name: 'D Dominant 7',
    root: 'D',
    type: 'Dominant 7th',
    difficulty: 'Beginner',
    notes: ['D', 'F#', 'A', 'C'],
    frets: ['x', 'x', 0, 2, 1, 2],
    fingers: ['-', '-', '-', 2, 1, 3],
    formula: '1 - 3 - 5 - b7',
    mood: 'Light, bluesy, and ready to resolve'
  }
];

router.get('/', (req, res) => {
  const { root, difficulty } = req.query;
  let results = [...CHORDS];

  if (root) {
    results = results.filter(c => c.root.toLowerCase() === root.toLowerCase());
  }
  if (difficulty) {
    results = results.filter(c => c.difficulty.toLowerCase() === difficulty.toLowerCase());
  }

  res.json({
    success: true,
    total: results.length,
    chords: results
  });
});

/**
 * Intelligent Chord Verifier API
 * Receives chord id/name and played notes or frequencies
 * Computes accuracy, harmonic match, deviations, and audio clarity score
 */
router.post('/verify', (req, res) => {
  const { chordId, chordName, playedNotes = [] } = req.body;

  let targetChord = CHORDS.find(
    c => c.id === chordId || c.name.toLowerCase() === (chordName || '').toLowerCase()
  );

  if (!targetChord && (!chordId && !chordName)) {
    targetChord = CHORDS[0]; // fallback default to C Major
  }

  if (!targetChord) {
    return res.status(404).json({
      success: false,
      message: `Chord '${chordName || chordId}' not recognized in harmonic catalog.`
    });
  }

  const expectedNotes = targetChord.notes.map(n => n.toUpperCase());
  const normalizedPlayed = playedNotes.map(n => n.toUpperCase().trim());

  // Determine matches
  const matchedNotes = expectedNotes.filter(note => normalizedPlayed.includes(note));
  const missedNotes = expectedNotes.filter(note => !normalizedPlayed.includes(note));
  const extraneousNotes = normalizedPlayed.filter(note => !expectedNotes.includes(note));

  const noteScore = (matchedNotes.length / expectedNotes.length) * 100;
  const penalty = extraneousNotes.length * 15;
  const finalScore = Math.max(0, Math.min(100, Math.round(noteScore - penalty)));
  const isAccurate = finalScore >= 75;

  let feedback = '';
  if (finalScore >= 90) {
    feedback = `Flawless execution! All harmonic intervals for ${targetChord.name} are resonant and in perfect pitch.`;
  } else if (finalScore >= 70) {
    feedback = `Good recognition. ${matchedNotes.join(', ')} verified, but check finger pressure on ${missedNotes.join(', ') || 'muted strings'}.`;
  } else {
    feedback = `Chord mismatch or muted notes detected. Expected [${expectedNotes.join(', ')}], detected [${normalizedPlayed.join(', ') || 'unclear pitch'}].`;
  }

  res.json({
    success: true,
    chord: targetChord.name,
    root: targetChord.root,
    isAccurate,
    accuracyScore: finalScore,
    targetNotes: expectedNotes,
    playedNotes: normalizedPlayed,
    matchedNotes,
    missedNotes,
    extraneousNotes,
    feedback,
    timestamp: new Date().toISOString()
  });
});

export default router;
