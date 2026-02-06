import express from 'express';
import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'dlmau.xlsx');
const MEDIA_DIR = process.env.MEDIA_DIR || __dirname;

const ALLOWED_MEDIA_ROOTS = [MEDIA_DIR]
  .concat((process.env.EXTRA_MEDIA_ROOTS || '').split(path.delimiter).filter(Boolean));

function normalizeKey(key) {
  return String(key)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeFsPath(input) {
  const value = String(input || '').trim();
  if (!value) return '';
  if (/^[a-zA-Z]:[\\/]/.test(value)) {
    const drive = value[0].toLowerCase();
    const rest = value.slice(3).replace(/\\/g, '/');
    return path.posix.normalize(`/mnt/${drive}/${rest}`);
  }
  return path.resolve(__dirname, value);
}

function isAllowedPath(absPath) {
  if (!absPath) return false;
  const resolved = path.resolve(absPath);
  return ALLOWED_MEDIA_ROOTS.some((root) => {
    const rootResolved = path.resolve(root);
    return resolved === rootResolved || resolved.startsWith(rootResolved + path.sep);
  });
}

function isUrlLike(value) {
  return /^https?:\/\//i.test(value) || /^data:image\//i.test(value);
}

function toMediaUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '/placeholder.svg';
  if (isUrlLike(raw) || raw.startsWith('/')) return raw;
  const abs = normalizeFsPath(raw);
  if (!isAllowedPath(abs)) return '/placeholder.svg';
  return `/media?path=${encodeURIComponent(abs)}`;
}

function pickValue(row, keys) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function mapRowToGame(row, index) {
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[normalizeKey(key)] = value;
  }

  const title = pickValue(normalized, [
    'ten game',
    'tengame',
    'namegame',
    'name game',
    'game',
    'name',
    'title',
    'ten',
  ]) || `Game ${index + 1}`;
  const imageRaw = pickValue(normalized, [
    'image',
    'img',
    'anh',
    'logo',
    'logo game',
    'icon',
    'icon game',
    'hinh',
    'hinh anh',
    'hinh anh game',
    'anh dai dien',
    'avatar',
    'thumbnail',
    'thumb',
    'link anh',
    'link anh game',
    'link image',
    'image link',
    'link hinh',
    'game_image',
    'game image',
  ]);
  const category = pickValue(normalized, ['category', 'the loai', 'theloai']);
  const capacity = pickValue(normalized, ['capacity', 'dung luong', 'dungluong']);
  const language = pickValue(normalized, ['language', 'ngon ngu', 'ngonngu']);
  const graphics = pickValue(normalized, ['graphics', 'do hoa', 'dohoa']);
  const vote = pickValue(normalized, ['vote', 'danh gia', 'danhgia', 'rating']);
  const slogan = pickValue(normalized, ['slogan', 'tagline', 'khau hieu', 'khau hieu game']);
  const description = pickValue(normalized, [
    'mo ta',
    'mota',
    'desc',
    'description',
    'gioi thieu',
    'noi dung',
    'chi tiet',
    'chi tiet game',
  ]);
  const subtitle = pickValue(normalized, ['tom tat', 'summary', 'phu luc']);
  const views = pickValue(normalized, ['luot xem', 'luotxem', 'views', 'view', 'count', 'players']);
  const platform = pickValue(normalized, ['nen tang', 'nentang', 'platform', 'he dieu hanh', 'device']);
  const tag = pickValue(normalized, ['tag', 'nhan', 'badge', 'hot', 'label']);
  const ctaLink = pickValue(normalized, ['link', 'url', 'href', 'website']) || '#';
  const isH5 = Boolean(category || capacity || language || graphics || vote || normalized.namegame || normalized.game_image);
  const ctaText = pickValue(normalized, ['nut', 'button', 'action', 'cta', 'truy cap']) || (isH5 ? 'Vào game' : 'Truy cập');

  return {
    title,
    image: imageRaw ? toMediaUrl(imageRaw) : '/placeholder.svg',
    category,
    capacity,
    language,
    graphics,
    vote,
    slogan,
    description,
    subtitle,
    views,
    platform,
    tag,
    ctaText,
    ctaLink,
    type: isH5 ? 'h5' : 'home',
  };
}

function readGamesFromExcel() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const workbook = XLSX.readFile(DATA_FILE);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return rows
    .map((row, index) => mapRowToGame(row, index))
    .filter((game) => game && game.title);
}

let cache = { mtimeMs: 0, games: [] };

function getGames() {
  try {
    const stat = fs.statSync(DATA_FILE);
    if (stat.mtimeMs !== cache.mtimeMs) {
      cache = { mtimeMs: stat.mtimeMs, games: readGamesFromExcel() };
    }
  } catch (err) {
    return [];
  }
  return cache.games;
}

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/games', (req, res) => {
  const games = getGames();
  res.json({
    updatedAt: new Date().toISOString(),
    total: games.length,
    games,
  });
});

app.get('/media', (req, res) => {
  const raw = req.query.path;
  if (!raw || typeof raw !== 'string') {
    return res.status(400).send('Missing path');
  }
  const abs = normalizeFsPath(raw);
  if (!isAllowedPath(abs)) {
    return res.status(403).send('Forbidden');
  }
  if (!fs.existsSync(abs)) {
    return res.status(404).send('Not found');
  }
  return res.sendFile(abs);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
