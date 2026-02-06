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
const HOT_CSV = process.env.HOT_CSV || '';
const H5_CSV = process.env.H5_CSV || '';
const RANK_CSV = process.env.RANK_CSV || '';
const AGENT_CSV = process.env.AGENT_CSV || '';
const STORE_CSV = process.env.STORE_CSV || '';
const PROFILE_CSV = process.env.PROFILE_CSV || '';
const PROFILE_GAMES_CSV = process.env.PROFILE_GAMES_CSV || '';
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

function mapRowToGame(row, index, forcedType) {
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
  const rank = pickValue(normalized, ['rank', 'stt', 'thu hang', 'thu hang', 'xep hang', 'xephang']);
  const category = pickValue(normalized, ['category', 'the loai', 'theloai']);
  const capacity = pickValue(normalized, ['capacity', 'dung luong', 'dungluong']);
  const language = pickValue(normalized, ['language', 'ngon ngu', 'ngonngu']);
  const graphics = pickValue(normalized, ['graphics', 'do hoa', 'dohoa']);
  const vote = pickValue(normalized, ['vote', 'danh gia', 'danhgia', 'rating']);
  const installation = pickValue(normalized, [
    'installation_file',
    'installation file',
    'install',
    'tai game',
    'tai xuong',
    'file cai dat',
    'cai dat',
    'download',
  ]);
  const slogan = pickValue(normalized, ['slogan', 'tagline', 'khau hieu', 'khau hieu game']);
  const description = pickValue(normalized, [
    'mo ta',
    'mota',
    'thong tin',
    'thongtin',
    'info',
    'desc',
    'description',
    'gioi thieu',
    'noi dung',
    'chi tiet',
    'chi tiet game',
  ]);
  const subtitle = pickValue(normalized, ['tom tat', 'summary', 'phu luc']);
  const views = pickValue(normalized, ['luot xem', 'luotxem', 'views', 'view', 'count', 'players']);
  const money = pickValue(normalized, ['money', 'tien', 'so tien', 'sotien', 'amount', 'gia tri', 'giatri', 'value']);
  const platform = pickValue(normalized, ['nen tang', 'nentang', 'platform', 'he dieu hanh', 'device']);
  const tag = pickValue(normalized, ['tag', 'nhan', 'badge', 'hot', 'label']);
  const ctaLink = pickValue(normalized, ['link', 'url', 'href', 'website']) || '#';
  const inferredIsRank = Boolean(rank || installation);
  const inferredIsH5 =
    !inferredIsRank &&
    Boolean(category || capacity || language || graphics || vote || normalized.namegame || normalized.game_image);
  const type = forcedType || (inferredIsRank ? 'rank' : inferredIsH5 ? 'h5' : 'home');
  const isRank = type === 'rank';
  const isH5 = type === 'h5';
  const ctaText =
    pickValue(normalized, ['nut', 'button', 'action', 'cta', 'truy cap']) ||
    (isRank ? 'Chi tiết' : isH5 ? 'Vào game' : 'Truy cập');

  return {
    title,
    image: imageRaw ? toMediaUrl(imageRaw) : '/placeholder.svg',
    rank,
    category,
    capacity,
    language,
    graphics,
    vote,
    installation,
    slogan,
    description,
    subtitle,
    views,
    money,
    platform,
    tag,
    ctaText,
    ctaLink,
    type,
  };
}

function readGamesFromExcel() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const workbook = XLSX.readFile(DATA_FILE);
  const allRows = [];
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    rows.forEach((row) => allRows.push(row));
  });
  return allRows
    .map((row, index) => mapRowToGame(row, index))
    .filter((game) => game && game.title);
}

function readRowsFromFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return [];
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv' || ext === '.tsv') {
    const raw = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
    const firstLine = raw.split(/\r?\n/).find((line) => line.trim().length) || '';
    const commaCount = (firstLine.match(/,/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const semiCount = (firstLine.match(/;/g) || []).length;
    const delimiter = tabCount >= commaCount && tabCount >= semiCount ? '\t' : semiCount > commaCount ? ';' : ',';

    const workbook = XLSX.read(raw, { type: 'string', FS: delimiter, raw: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
  }

  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

function findFirstExisting(paths) {
  for (const candidate of paths) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return '';
}

const HOT_CSV_PATH =
  (HOT_CSV ? normalizeFsPath(HOT_CSV) : '') ||
  findFirstExisting([
    path.join(__dirname, 'dlmau - Trang tính1 (1).csv'),
    path.join(__dirname, 'dlmau - Trang tính1.csv'),
  ]);

const H5_CSV_PATH =
  (H5_CSV ? normalizeFsPath(H5_CSV) : '') ||
  findFirstExisting([
    path.join(__dirname, 'dlmau - Trang tính2 (1).csv'),
    path.join(__dirname, 'dlmau - Trang tính2.csv'),
  ]);

const RANK_CSV_PATH =
  (RANK_CSV ? normalizeFsPath(RANK_CSV) : '') ||
  findFirstExisting([
    path.join(__dirname, 'hang - hang.csv'),
    path.join(__dirname, 'dlmau - Trang tính3 (1).csv'),
    path.join(__dirname, 'dlmau - Trang tính3.csv'),
  ]);

const AGENT_CSV_PATH =
  (AGENT_CSV ? normalizeFsPath(AGENT_CSV) : '') ||
  findFirstExisting([
    path.join(__dirname, 'hang - daily.csv'),
  ]);

const STORE_CSV_PATH =
  (STORE_CSV ? normalizeFsPath(STORE_CSV) : '') ||
  findFirstExisting([
    path.join(__dirname, 'hang - CUAHANG.csv'),
  ]);

const PROFILE_CSV_PATH =
  (PROFILE_CSV ? normalizeFsPath(PROFILE_CSV) : '') ||
  findFirstExisting([
    path.join(__dirname, 'pro5_profile.csv'),
    path.join(__dirname, 'profile.csv'),
  ]);

const PROFILE_GAMES_CSV_PATH =
  (PROFILE_GAMES_CSV ? normalizeFsPath(PROFILE_GAMES_CSV) : '') ||
  findFirstExisting([
    path.join(__dirname, 'pro5_games.csv'),
    path.join(__dirname, 'profile_games.csv'),
  ]);

function readGamesFromSources() {
  const games = [];
  const hotRows = readRowsFromFile(HOT_CSV_PATH);
  const h5Rows = readRowsFromFile(H5_CSV_PATH);
  const rankRows = readRowsFromFile(RANK_CSV_PATH);

  hotRows.forEach((row, index) => games.push(mapRowToGame(row, index, 'home')));
  h5Rows.forEach((row, index) => games.push(mapRowToGame(row, index, 'h5')));
  rankRows.forEach((row, index) => games.push(mapRowToGame(row, index, 'rank')));

  if (!games.length) {
    return readGamesFromExcel();
  }

  return games.filter((game) => game && game.title);
}

function computeCacheKey() {
  const files = [
    HOT_CSV_PATH,
    H5_CSV_PATH,
    RANK_CSV_PATH,
    AGENT_CSV_PATH,
    STORE_CSV_PATH,
    PROFILE_CSV_PATH,
    PROFILE_GAMES_CSV_PATH,
  ].filter(Boolean);
  const parts = [];
  for (const file of files) {
    try {
      const stat = fs.statSync(file);
      parts.push(`${file}:${stat.mtimeMs}`);
    } catch (err) {
      continue;
    }
  }
  if (!parts.length && fs.existsSync(DATA_FILE)) {
    const stat = fs.statSync(DATA_FILE);
    parts.push(`${DATA_FILE}:${stat.mtimeMs}`);
  }
  return parts.join('|');
}

let cache = { key: '', games: [] };
let agentCache = { key: '', agents: [] };
let storeCache = { key: '', items: [] };
let profileCache = { key: '', profile: null };
let playedGamesCache = { key: '', games: [] };

function getGames() {
  try {
    const key = computeCacheKey();
    if (key && key !== cache.key) {
      cache = { key, games: readGamesFromSources() };
    } else if (!key) {
      cache = { key: '', games: [] };
    }
  } catch (err) {
    return [];
  }
  return cache.games;
}

function mapRowToAgent(row, index) {
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[normalizeKey(key)] = value;
  }
  const name =
    pickValue(normalized, ['ten', 'tendaily', 'tendl', 'tendai ly', 'ten dai ly', 'name', 'ten dl']) ||
    pickValue(normalized, ['tengame', 'ten game', 'title']) ||
    `Đại lý ${index + 1}`;
  const imageRaw = pickValue(normalized, ['anh', 'avatar', 'image', 'img', 'logo', 'icon']);
  const info = pickValue(normalized, [
    'thong tin',
    'thongtin',
    'mo ta',
    'mota',
    'description',
    'desc',
    'gioi thieu',
    'note',
  ]);
  return {
    name,
    image: imageRaw ? toMediaUrl(imageRaw) : '/placeholder.svg',
    info,
  };
}

function readAgentsFromSources() {
  const rows = readRowsFromFile(AGENT_CSV_PATH);
  return rows.map((row, index) => mapRowToAgent(row, index)).filter((agent) => agent && agent.name);
}

function getAgents() {
  try {
    const key = computeCacheKey();
    if (key && key !== agentCache.key) {
      agentCache = { key, agents: readAgentsFromSources() };
    } else if (!key) {
      agentCache = { key: '', agents: [] };
    }
  } catch (err) {
    return [];
  }
  return agentCache.agents;
}

function mapRowToStoreItem(row, index) {
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[normalizeKey(key)] = value;
  }
  const name =
    pickValue(normalized, ['ten', 'name', 'item', 'ten vat pham', 'ten vatpham', 'vat pham']) ||
    `Vật phẩm ${index + 1}`;
  const imageRaw = pickValue(normalized, ['anh', 'image', 'img', 'avatar', 'logo', 'icon']);
  const price = pickValue(normalized, ['gia', 'price', 'coin', 'tien']);
  return {
    name,
    image: imageRaw ? toMediaUrl(imageRaw) : '/placeholder.svg',
    price,
  };
}

function readStoreFromSources() {
  const rows = readRowsFromFile(STORE_CSV_PATH);
  return rows
    .map((row, index) => mapRowToStoreItem(row, index))
    .filter((item) => item && item.name);
}

function getStoreItems() {
  try {
    const key = computeCacheKey();
    if (key && key !== storeCache.key) {
      storeCache = { key, items: readStoreFromSources() };
    } else if (!key) {
      storeCache = { key: '', items: [] };
    }
  } catch (err) {
    return [];
  }
  return storeCache.items;
}

function mapRowToProfile(row) {
  const normalized = {};
  for (const [key, value] of Object.entries(row || {})) {
    normalized[normalizeKey(key)] = value;
  }

  const name = pickValue(normalized, ['ten', 'name', 'ten nhan vat', 'ten nhanvat']) || 'Anh Quân';
  const username = pickValue(normalized, ['username', 'user', 'tai khoan', 'taikhoan', 'nick', 'nickname']) || '';
  const uid = pickValue(normalized, ['id', 'uid', 'user id', 'userid']) || '';
  const status = pickValue(normalized, ['status', 'trang thai', 'trangthai', 'xac thuc', 'xacthuc']) || '';
  const vip = pickValue(normalized, ['vip', 'vip level', 'viplevel', 'vip_level']) || '';
  const title = pickValue(normalized, ['danh hieu', 'danhhieu', 'title', 'biet danh', 'bietdanh']) || 'Danh hiệu';
  const level = pickValue(normalized, ['level', 'lv', 'cap', 'cấp', 'rank']) || '';
  const inviteCode = pickValue(normalized, ['ma moi', 'mamoi', 'invite', 'invite code', 'invite_code', 'code']) || '';
  const avatarRaw = pickValue(normalized, ['avatar', 'anh', 'image', 'img', 'hinh', 'logo']);
  const email = pickValue(normalized, ['email', 'mail']) || '';
  const phone = pickValue(normalized, ['sdt', 'so dien thoai', 'số điện thoại', 'phone', 'tel']) || '';
  const address = pickValue(normalized, ['dia chi', 'địa chỉ', 'address']) || '';
  const balance = pickValue(normalized, ['so du', 'sodu', 'balance', 'coin', 'tien ngoc', 'tienngoc', 'ngoc']) || '10000';

  return {
    name,
    username,
    uid,
    status,
    vip,
    title,
    level,
    inviteCode,
    avatar: avatarRaw ? toMediaUrl(avatarRaw) : '',
    email,
    phone,
    address,
    balance,
  };
}

function readProfileFromSources() {
  const rows = readRowsFromFile(PROFILE_CSV_PATH);
  const row = rows[0] || {};
  const profile = mapRowToProfile(row);
  if (!profile.avatar) {
    profile.avatar = pickAnyExistingAvatar();
  }
  return profile;
}

function getProfile() {
  try {
    const key = computeCacheKey();
    if (key && key !== profileCache.key) {
      profileCache = { key, profile: readProfileFromSources() };
    } else if (!key) {
      profileCache = { key: '', profile: mapRowToProfile({}) };
    }
  } catch (err) {
    return mapRowToProfile({});
  }
  return profileCache.profile || mapRowToProfile({});
}

function pickAnyExistingAvatar() {
  const imageKeys = [
    'anh',
    'image',
    'img',
    'avatar',
    'logo',
    'icon',
    'link anh',
    'link image',
    'game_image',
    'game image',
  ];

  const extractFromRow = (row) => {
    const normalized = {};
    for (const [key, value] of Object.entries(row || {})) {
      normalized[normalizeKey(key)] = value;
    }
    return pickValue(normalized, imageKeys);
  };

  const tryFiles = [STORE_CSV_PATH, HOT_CSV_PATH, H5_CSV_PATH, RANK_CSV_PATH, AGENT_CSV_PATH].filter(Boolean);
  for (const file of tryFiles) {
    try {
      const rows = readRowsFromFile(file);
      for (const row of rows) {
        const img = extractFromRow(row);
        if (img) return toMediaUrl(img);
      }
    } catch (err) {
      continue;
    }
  }

  return '/placeholder.svg';
}

function mapRowToPlayedGame(row, index) {
  const normalized = {};
  for (const [key, value] of Object.entries(row || {})) {
    normalized[normalizeKey(key)] = value;
  }
  const title = pickValue(normalized, ['ten game', 'tengame', 'name', 'title', 'game']) || `Game ${index + 1}`;
  const imageRaw = pickValue(normalized, ['image', 'img', 'anh', 'avatar', 'logo', 'icon']);
  const lastPlayed = pickValue(normalized, ['last_played', 'last played', 'lan cuoi', 'lancuoi', 'date', 'ngay']) || '';
  const hours = pickValue(normalized, ['hours', 'gio choi', 'giochoi', 'time']) || '';
  const level = pickValue(normalized, ['level', 'lv', 'cap', 'cấp']) || '';
  return {
    title,
    image: imageRaw ? toMediaUrl(imageRaw) : '/placeholder.svg',
    lastPlayed,
    hours,
    level,
  };
}

function readPlayedGamesFromSources() {
  const rows = readRowsFromFile(PROFILE_GAMES_CSV_PATH);
  return rows.map((row, index) => mapRowToPlayedGame(row, index)).filter((game) => game && game.title);
}

function getPlayedGames() {
  try {
    const key = computeCacheKey();
    if (key && key !== playedGamesCache.key) {
      playedGamesCache = { key, games: readPlayedGamesFromSources() };
    } else if (!key) {
      playedGamesCache = { key: '', games: [] };
    }
  } catch (err) {
    return [];
  }
  return playedGamesCache.games;
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

app.get('/api/agents', (req, res) => {
  const agents = getAgents();
  res.json({
    updatedAt: new Date().toISOString(),
    total: agents.length,
    agents,
  });
});

app.get('/api/store', (req, res) => {
  const items = getStoreItems();
  res.json({
    updatedAt: new Date().toISOString(),
    total: items.length,
    items,
  });
});

app.get('/api/profile', (req, res) => {
  const profile = getProfile();
  res.json({
    updatedAt: new Date().toISOString(),
    profile,
  });
});

app.get('/api/profile/games', (req, res) => {
  const games = getPlayedGames();
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
