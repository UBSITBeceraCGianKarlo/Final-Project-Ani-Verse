/**
 * Lightweight Express API for Ani-Verse comments and bookmarks.
 * Persists to JSON files under ./data (no Mongo required for local dev).
 */

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const DATA_DIR = path.join(__dirname, 'data');
const COMMENTS_PATH = path.join(DATA_DIR, 'comments.json');
const BOOKMARKS_PATH = path.join(DATA_DIR, 'bookmarks.json');

function ensureDataFiles() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(COMMENTS_PATH)) {
    fs.writeFileSync(COMMENTS_PATH, JSON.stringify([]), 'utf8');
  }
  if (!fs.existsSync(BOOKMARKS_PATH)) {
    fs.writeFileSync(BOOKMARKS_PATH, JSON.stringify([]), 'utf8');
  }
}

function readJson(file) {
  const raw = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

ensureDataFiles();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// --- Comments CRUD ---
app.post('/comments', (req, res) => {
  const { animeId, username, content } = req.body || {};
  if (animeId == null || !String(username || '').trim() || !String(content || '').trim()) {
    return res.status(400).json({ error: 'animeId, username, and content are required' });
  }
  const comments = readJson(COMMENTS_PATH);
  const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
  const row = {
    id,
    animeId: String(animeId),
    username: String(username).trim(),
    content: String(content).trim(),
    date: new Date().toISOString(),
  };
  comments.push(row);
  writeJson(COMMENTS_PATH, comments);
  res.status(201).json(row);
});

app.get('/comments', (req, res) => {
  const animeId = req.query.animeId;
  if (animeId == null || animeId === '') {
    return res.status(400).json({ error: 'animeId query is required' });
  }
  const comments = readJson(COMMENTS_PATH).filter((c) => String(c.animeId) === String(animeId));
  res.json(comments);
});

app.put('/comments/:id', (req, res) => {
  const { id } = req.params;
  const { content } = req.body || {};
  if (!String(content || '').trim()) {
    return res.status(400).json({ error: 'content is required' });
  }
  const comments = readJson(COMMENTS_PATH);
  const idx = comments.findIndex((c) => String(c.id) === String(id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  comments[idx].content = String(content).trim();
  writeJson(COMMENTS_PATH, comments);
  res.json(comments[idx]);
});

app.delete('/comments/:id', (req, res) => {
  const { id } = req.params;
  const comments = readJson(COMMENTS_PATH);
  const next = comments.filter((c) => String(c.id) !== String(id));
  if (next.length === comments.length) {
    return res.status(404).json({ error: 'Comment not found' });
  }
  writeJson(COMMENTS_PATH, next);
  res.status(204).end();
});

// --- Bookmarks CRUD ---
app.post('/bookmarks', (req, res) => {
  const { animeId, title, image } = req.body || {};
  if (animeId == null || !String(title || '').trim()) {
    return res.status(400).json({ error: 'animeId and title are required' });
  }
  const bookmarks = readJson(BOOKMARKS_PATH);
  if (bookmarks.some((b) => String(b.animeId) === String(animeId))) {
    return res.status(409).json({ error: 'Bookmark already exists for this anime' });
  }
  const id = String(Date.now()) + Math.random().toString(36).slice(2, 8);
  const row = {
    id,
    animeId: String(animeId),
    title: String(title).trim(),
    image: image ? String(image) : '',
  };
  bookmarks.push(row);
  writeJson(BOOKMARKS_PATH, bookmarks);
  res.status(201).json(row);
});

app.get('/bookmarks', (_req, res) => {
  res.json(readJson(BOOKMARKS_PATH));
});

app.delete('/bookmarks/:id', (req, res) => {
  const { id } = req.params;
  const bookmarks = readJson(BOOKMARKS_PATH);
  const next = bookmarks.filter((b) => String(b.id) !== String(id));
  if (next.length === bookmarks.length) {
    return res.status(404).json({ error: 'Bookmark not found' });
  }
  writeJson(BOOKMARKS_PATH, next);
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Ani-Verse API listening on http://localhost:${PORT}`);
});
