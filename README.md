# TuneBreach // Redefining Musical Clarity

TuneBreach is an acoustic intelligence platform integrating sub-cent pitch detection, deep harmonic chord exploration, multi-level temporal rhythm control, and real-time chord verification.

---

## 🌟 Architecture & Features

### 1. Level 01: Hero & Reveal
- **WebGL Aurora Integration**: Embedded `<SoftAurora />` powered by `ogl` with custom noise shaders, speed/scale controls, and responsive mouse reaction.
- **Minimalist Reveal**: Clean acoustic typography revealing **TuneBreach**, pulsating audio spectrum visualizers, and zero-drift specs.
- **Left-Side Vertical Level Indicator**: Dynamic vertical bar navigation tracking scroll position across Level 01, Level 02, and Level 03 with smooth click-to-scroll.

### 2. Level 02: Platform & Instrument Gallery
- **Platform Manifesto**: Left-side technical showcase explaining harmonic overtone isolation, sub-cent accuracy (&lt; 0.05 cents), and acoustic engineering.
- **Masonry Layout**: Integrated `<Masonry />` powered by `gsap` displaying real musical instruments (vintage electric guitars, concert grand pianos, dreadnought acoustics, analog synthesizers, and bass fretboards) with hover zoom and dynamic color shifts.

### 3. Level 03: Core Capabilities & ChromaGrid
- **ChromaGrid Integration**: Integrated `<ChromaGrid />` spotlight component highlighting the 4 core TuneBreach capabilities:
  1. **Multi-Tuning Guitar Engine**: Standard, Drop D, DADGAD, Open D, Half Step Down, Drop C with Hz string pitch targets.
  2. **Vast Harmonic Chord Library**: Over 5,000 chord fingerings, fretboard voicings, and musical moods.
  3. **Multi-Level Metronome**: Classical tempo tiers (Largo to Prestissimo), time signatures (4/4, 3/4, 6/8), and sub-divisions.
  4. **AI Real-Time Chord Verifier**: Acoustic note recognition analyzing played chord resonance and providing instant accuracy scores.
- **Early Access Waitlist**: Fully operational subscriber signup connected to the backend.

### 4. Interactive Live Studio Suite
- Click **"Launch Suite"** or any feature card to open the live interactive playground:
  - Pluck guitar strings with real synthesized WebAudio sound.
  - Test simulated pitch deviation (-50 cents to +50 cents).
  - Play and listen to polyphonic guitar chords.
  - Start the interactive audio metronome with accent clicks and tempo slider.
  - Test the AI chord validation against the Express backend API.

---

## 🚀 Quick Start

### 1. Install All Dependencies
```bash
npm run install:all
```
*(or run `npm install` inside both `server/` and `client/`)*

### 2. Start Both Backend & Frontend Concurrently
```bash
npm run dev
```
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

### 3. Build for Production
```bash
npm run build
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health, version, and active capabilities |
| `GET` | `/api/tunings` | List guitar tuning presets (Standard, Drop D, DADGAD, Open D, etc.) |
| `GET` | `/api/chords` | Chord database with notes, frets, fingerings, and difficulty |
| `POST` | `/api/chords/verify` | AI chord verifier endpoint checking played notes against target chord |
| `GET` | `/api/metronome/tempos`| Classical tempo markings and time signatures |
| `POST` | `/api/waitlist` | Early access priority registration |

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons
- **Graphics & Animation**: `ogl` (WebGL Shaders), `gsap` (GreenSock Animation Platform)
- **Backend**: Node.js, Express, CORS, Dotenv
- **Audio Engine**: WebAudio API (Zero-drift oscillators, custom harmonic synthesis)
