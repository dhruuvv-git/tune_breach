import { Router } from 'express';

const router = Router();

export const METRONOME_DATA = {
  tempoMarkings: [
    { name: 'Grave', minBpm: 20, maxBpm: 40, description: 'Extremely slow and solemn' },
    { name: 'Largo', minBpm: 40, maxBpm: 60, description: 'Broadly, slow, and dignified' },
    { name: 'Adagio', minBpm: 66, maxBpm: 76, description: 'Slow and stately (at ease)' },
    { name: 'Andante', minBpm: 76, maxBpm: 108, description: 'At a walking pace, flowing' },
    { name: 'Moderato', minBpm: 108, maxBpm: 120, description: 'Moderately paced' },
    { name: 'Allegro', minBpm: 120, maxBpm: 156, description: 'Fast, quickly, and bright' },
    { name: 'Vivace', minBpm: 156, maxBpm: 176, description: 'Lively and fast' },
    { name: 'Presto', minBpm: 168, maxBpm: 200, description: 'Very, very fast' },
    { name: 'Prestissimo', minBpm: 200, maxBpm: 280, description: 'As fast as possible' }
  ],
  timeSignatures: [
    { label: '4/4', beatsPerMeasure: 4, beatUnit: 4, name: 'Common Time' },
    { label: '3/4', beatsPerMeasure: 3, beatUnit: 4, name: 'Waltz Time' },
    { label: '6/8', beatsPerMeasure: 6, beatUnit: 8, name: 'Compound Duple' },
    { label: '2/4', beatsPerMeasure: 2, beatUnit: 4, name: 'March Time' },
    { label: '5/4', beatsPerMeasure: 5, beatUnit: 4, name: 'Odd Meter' },
    { label: '7/8', beatsPerMeasure: 7, beatUnit: 8, name: 'Complex Meter' }
  ],
  subdivisions: [
    { id: 'quarter', name: 'Quarter Note (1/4)', multiplier: 1 },
    { id: 'eighth', name: 'Eighth Note (1/8)', multiplier: 2 },
    { id: 'triplet', name: 'Eighth Triplet (1/3)', multiplier: 3 },
    { id: 'sixteenth', name: 'Sixteenth Note (1/16)', multiplier: 4 }
  ]
};

router.get('/tempos', (req, res) => {
  res.json({
    success: true,
    data: METRONOME_DATA
  });
});

export default router;
