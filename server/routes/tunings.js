import { Router } from 'express';

const router = Router();

export const TUNINGS = [
  {
    id: 'standard',
    name: 'Standard E',
    category: 'Standard',
    description: 'The universal tuning for 6-string guitars across rock, pop, jazz, and classical.',
    strings: [
      { string: 6, note: 'E2', freq: 82.41 },
      { string: 5, note: 'A2', freq: 110.00 },
      { string: 4, note: 'D3', freq: 146.83 },
      { string: 3, note: 'G3', freq: 196.00 },
      { string: 2, note: 'B3', freq: 246.94 },
      { string: 1, note: 'E4', freq: 329.63 }
    ]
  },
  {
    id: 'drop-d',
    name: 'Drop D',
    category: 'Alternate / Heavy',
    description: 'Low E lowered by a whole step to D. Perfect for heavy power chords with one finger.',
    strings: [
      { string: 6, note: 'D2', freq: 73.42 },
      { string: 5, note: 'A2', freq: 110.00 },
      { string: 4, note: 'D3', freq: 146.83 },
      { string: 3, note: 'G3', freq: 196.00 },
      { string: 2, note: 'B3', freq: 246.94 },
      { string: 1, note: 'E4', freq: 329.63 }
    ]
  },
  {
    id: 'dadgad',
    name: 'DADGAD (Celtic)',
    category: 'Modal',
    description: 'Modal Dsus4 tuning famous in Celtic folk, acoustic fingerstyle, and Led Zeppelin.',
    strings: [
      { string: 6, note: 'D2', freq: 73.42 },
      { string: 5, note: 'A2', freq: 110.00 },
      { string: 4, note: 'D3', freq: 146.83 },
      { string: 3, note: 'G3', freq: 196.00 },
      { string: 2, note: 'A3', freq: 220.00 },
      { string: 1, note: 'D4', freq: 293.66 }
    ]
  },
  {
    id: 'open-d',
    name: 'Open D',
    category: 'Open',
    description: 'Strumming all open strings sounds a lush D Major chord. Quintessential slide guitar tuning.',
    strings: [
      { string: 6, note: 'D2', freq: 73.42 },
      { string: 5, note: 'A2', freq: 110.00 },
      { string: 4, note: 'D3', freq: 146.83 },
      { string: 3, note: 'F#3', freq: 185.00 },
      { string: 2, note: 'A3', freq: 220.00 },
      { string: 1, note: 'D4', freq: 293.66 }
    ]
  },
  {
    id: 'half-step-down',
    name: 'Half Step Down (Eb)',
    category: 'Standard Shift',
    description: 'All strings detuned by 1 semitone. Popularized by Jimi Hendrix, SRV, and Nirvana.',
    strings: [
      { string: 6, note: 'Eb2', freq: 77.78 },
      { string: 5, note: 'Ab2', freq: 103.83 },
      { string: 4, note: 'Db3', freq: 138.59 },
      { string: 3, note: 'Gb3', freq: 185.00 },
      { string: 2, note: 'Bb3', freq: 233.08 },
      { string: 1, note: 'Eb4', freq: 311.13 }
    ]
  },
  {
    id: 'drop-c',
    name: 'Drop C',
    category: 'Heavy Metal',
    description: 'Drop D tuned down an additional full step. Ultra deep resonance for modern metal.',
    strings: [
      { string: 6, note: 'C2', freq: 65.41 },
      { string: 5, note: 'G2', freq: 98.00 },
      { string: 4, note: 'C3', freq: 130.81 },
      { string: 3, note: 'F3', freq: 174.61 },
      { string: 2, note: 'A3', freq: 220.00 },
      { string: 1, note: 'D4', freq: 293.66 }
    ]
  }
];

router.get('/', (req, res) => {
  res.json({
    success: true,
    count: TUNINGS.length,
    tunings: TUNINGS
  });
});

router.get('/:id', (req, res) => {
  const tuning = TUNINGS.find(t => t.id === req.params.id);
  if (!tuning) {
    return res.status(404).json({ success: false, message: 'Tuning preset not found' });
  }
  res.json({ success: true, tuning });
});

export default router;
