import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '..', 'data', 'waitlist.json');

// Ensure directory and file exists
function readWaitlist() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading waitlist:', err);
    return [];
  }
}

function writeWaitlist(list) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
  } catch (err) {
    console.error('Error writing waitlist:', err);
  }
}

router.post('/', (req, res) => {
  const { email, role = 'Musician' } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  const list = readWaitlist();
  const existing = list.find(entry => entry.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    return res.json({
      success: true,
      message: 'You are already on the TuneBreach priority waitlist!',
      position: list.indexOf(existing) + 1
    });
  }

  const newEntry = {
    email: email.trim().toLowerCase(),
    role,
    joinedAt: new Date().toISOString()
  };

  list.push(newEntry);
  writeWaitlist(list);

  res.status(201).json({
    success: true,
    message: 'Welcome to TuneBreach. Early access credentials will be delivered to your inbox.',
    position: list.length
  });
});

router.get('/count', (req, res) => {
  const list = readWaitlist();
  res.json({
    success: true,
    count: list.length + 1420 // baseline early community + new signups
  });
});

export default router;
