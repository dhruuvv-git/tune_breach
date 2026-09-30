/**
 * Chord SVG Diagram Generator
 * Renders a clean, minimalistic guitar fretboard diagram for any chord.
 * String 6 (Low E) is on the left. Fret 1 is at the top.
 */
import React from 'react';

/**
 * CHORD_DIAGRAMS: defines each chord's visual representation.
 * frets: array of 6 values for strings 6-1 (low E to high e).
 *   -1 = muted (X), 0 = open (O), N = press at fret N
 * barre: optional { fret, fromString, toString } for barre chord arc
 * startFret: the lowest fret shown (default 1)
 */
export const CHORD_DIAGRAMS = {
  'c-major': {
    label: 'C Major',
    frets: [-1, 3, 2, 0, 1, 0],
    fingers: [null, 3, 2, null, 1, null],
    startFret: 1,
  },
  'g-major': {
    label: 'G Major',
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [3, 2, null, null, null, 4],
    startFret: 1,
  },
  'd-minor': {
    label: 'D Minor',
    frets: [-1, -1, 0, 2, 3, 1],
    fingers: [null, null, null, 2, 3, 1],
    startFret: 1,
  },
  'a-minor': {
    label: 'A Minor',
    frets: [-1, 0, 2, 2, 1, 0],
    fingers: [null, null, 2, 3, 1, null],
    startFret: 1,
  },
  'e-major': {
    label: 'E Major',
    frets: [0, 2, 2, 1, 0, 0],
    fingers: [null, 3, 4, 2, null, null],
    startFret: 1,
  },
  'f-major': {
    label: 'F Major',
    frets: [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    barre: { fret: 1, fromString: 0, toString: 5 },
    startFret: 1,
  },
  'b-minor': {
    label: 'B Minor',
    frets: [-1, 2, 4, 4, 3, 2],
    fingers: [null, 1, 3, 4, 2, 1],
    barre: { fret: 2, fromString: 1, toString: 5 },
    startFret: 2,
  },
  'c-maj7': {
    label: 'C Maj 7',
    frets: [-1, 3, 2, 0, 0, 0],
    fingers: [null, 3, 2, null, null, null],
    startFret: 1,
  },
  'g-7': {
    label: 'G Dom 7',
    frets: [3, 2, 0, 0, 0, 1],
    fingers: [3, 2, null, null, null, 1],
    startFret: 1,
  },
  'd-major': {
    label: 'D Major',
    frets: [-1, -1, 0, 2, 3, 2],
    fingers: [null, null, null, 1, 3, 2],
    startFret: 1,
  },
  'e-minor': {
    label: 'E Minor',
    frets: [0, 2, 2, 0, 0, 0],
    fingers: [null, 2, 3, null, null, null],
    startFret: 1,
  },
  'a-major': {
    label: 'A Major',
    frets: [-1, 0, 2, 2, 2, 0],
    fingers: [null, null, 1, 2, 3, null],
    startFret: 1,
  },
  'd-7': {
    label: 'D Dominant 7',
    frets: [-1, -1, 0, 2, 1, 2],
    fingers: [null, null, null, 2, 1, 3],
    startFret: 1,
  },
};

/**
 * ChordDiagram: renders a single clean SVG fretboard.
 * Props:
 *   chordId - key from CHORD_DIAGRAMS
 *   size - overall width in px (height = width * 1.2)
 */
export default function ChordDiagram({ chordId, size = 240 }) {
  const diagram = CHORD_DIAGRAMS[chordId];
  if (!diagram) return null;

  const { label, frets, fingers, barre, startFret = 1 } = diagram;

  // Layout constants
  const W = size;
  const H = size * 1.25;
  const padTop = 52;        // room for nut/fret number and mute/open markers
  const padLeft = 28;
  const padRight = 18;
  const padBottom = 32;

  const gridW = W - padLeft - padRight;
  const gridH = H - padTop - padBottom;

  const numStrings = 6;     // always 6
  const numFrets = 5;       // show 5 frets

  const stringSpacing = gridW / (numStrings - 1);
  const fretSpacing = gridH / numFrets;

  // helpers
  const sx = i => padLeft + i * stringSpacing;    // x position for string i (0=low E)
  const fy = f => padTop + f * fretSpacing;        // y position for fret f (0 = nut line, 1 = after fret 1)

  const dotColor = '#e100ff';
  const dotBorder = '#590764';
  const openColor = '#a855f7';
  const muteColor = '#71717a';
  const nutColor = '#ffffff';
  const fretColor = 'rgba(255,255,255,0.15)';
  const stringColor = 'rgba(255,255,255,0.25)';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        xmlns="http://www.w3.org/2000/svg"
        style={{ fontFamily: 'JetBrains Mono, monospace' }}
      >
        {/* Background */}
        <rect x={0} y={0} width={W} height={H} fill="#0c0812" rx={12} />

        {/* Chord label */}
        <text
          x={W / 2}
          y={18}
          textAnchor="middle"
          fontSize={13}
          fontWeight="700"
          letterSpacing="0.05em"
          fill="#ffffff"
        >
          {label}
        </text>

        {/* Nut (fret 0 line) or start fret number */}
        {startFret === 1 ? (
          <rect x={padLeft - 2} y={padTop} width={gridW + 4} height={4} fill={nutColor} rx={2} />
        ) : (
          <>
            <rect x={padLeft - 2} y={padTop} width={gridW + 4} height={1.5} fill={fretColor} rx={1} />
            <text x={padLeft - 8} y={padTop + fretSpacing * 0.7} textAnchor="end" fontSize={10} fill="#8b8496" fontWeight="500">
              {startFret}fr
            </text>
          </>
        )}

        {/* Fret lines */}
        {Array.from({ length: numFrets }).map((_, fi) => (
          <line
            key={fi}
            x1={padLeft}
            y1={padTop + (fi + 1) * fretSpacing}
            x2={padLeft + gridW}
            y2={padTop + (fi + 1) * fretSpacing}
            stroke={fretColor}
            strokeWidth={1}
          />
        ))}

        {/* String lines */}
        {Array.from({ length: numStrings }).map((_, si) => (
          <line
            key={si}
            x1={sx(si)}
            y1={padTop}
            x2={sx(si)}
            y2={padTop + gridH}
            stroke={stringColor}
            strokeWidth={1.2}
          />
        ))}

        {/* Barre arc */}
        {barre && (() => {
          const localFret = barre.fret - startFret + 1;
          if (localFret < 1 || localFret > numFrets) return null;
          const barreY = fy(localFret) - fretSpacing / 2;
          const x1 = sx(barre.fromString);
          const x2 = sx(barre.toString);
          return (
            <rect
              x={x1 - 7}
              y={barreY - 9}
              width={x2 - x1 + 14}
              height={18}
              rx={9}
              fill={dotBorder}
              opacity={0.85}
            />
          );
        })()}

        {/* Finger dots and open/mute markers */}
        {frets.map((fret, si) => {
          const x = sx(si);
          const finger = fingers?.[si];

          if (fret === -1) {
            // Muted: draw X above nut
            const cx = x;
            const cy = padTop - 16;
            return (
              <g key={si}>
                <line x1={cx - 5} y1={cy - 5} x2={cx + 5} y2={cy + 5} stroke={muteColor} strokeWidth={1.8} strokeLinecap="round" />
                <line x1={cx + 5} y1={cy - 5} x2={cx - 5} y2={cy + 5} stroke={muteColor} strokeWidth={1.8} strokeLinecap="round" />
              </g>
            );
          }

          if (fret === 0) {
            // Open: draw circle above nut
            return (
              <circle
                key={si}
                cx={x}
                cy={padTop - 16}
                r={5.5}
                fill="none"
                stroke={openColor}
                strokeWidth={1.8}
              />
            );
          }

          // Fretted note
          const localFret = fret - startFret + 1;
          if (localFret < 1 || localFret > numFrets) return null;
          const dotY = fy(localFret) - fretSpacing / 2;

          // Skip rendering individual dot if it's part of a barre (already covered)
          const isBarreString = barre &&
            fret === barre.fret &&
            si >= barre.fromString &&
            si <= barre.toString;

          return (
            <g key={si}>
              {!isBarreString && (
                <circle cx={x} cy={dotY} r={9} fill={dotColor} />
              )}
              {finger && (
                <text
                  x={x}
                  y={dotY + 4}
                  textAnchor="middle"
                  fontSize={9}
                  fontWeight="700"
                  fill="#ffffff"
                >
                  {finger}
                </text>
              )}
            </g>
          );
        })}

        {/* String number labels at bottom: 6 5 4 3 2 1 */}
        {Array.from({ length: numStrings }).map((_, si) => (
          <text
            key={si}
            x={sx(si)}
            y={H - 10}
            textAnchor="middle"
            fontSize={8}
            fill="#52525b"
          >
            {6 - si}
          </text>
        ))}
      </svg>
    </div>
  );
}
