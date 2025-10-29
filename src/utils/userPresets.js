const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), '.local');
const PRESETS_FILE = path.join(DATA_DIR, 'presets.json');

function ensureDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {}
}

function loadPresets() {
  ensureDir();
  try {
    if (!fs.existsSync(PRESETS_FILE)) return {};
    const raw = fs.readFileSync(PRESETS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function savePresets(presets) {
  ensureDir();
  fs.writeFileSync(PRESETS_FILE, JSON.stringify(presets, null, 2), 'utf-8');
}

function upsertPreset(userId, title, preset) {
  const all = loadPresets();
  if (!all[userId]) all[userId] = {};
  all[userId][title] = preset;
  savePresets(all);
}

function getPreset(userId, title) {
  const all = loadPresets();
  return all[userId]?.[title] || null;
}

function listPresetTitles(userId) {
  const all = loadPresets();
  return Object.keys(all[userId] || {});
}

function deletePreset(userId, title) {
  const all = loadPresets();
  if (all[userId] && all[userId][title]) {
    delete all[userId][title];
    savePresets(all);
    return true;
  }
  return false;
}

module.exports = {
  loadPresets,
  savePresets,
  upsertPreset,
  getPreset,
  listPresetTitles,
  deletePreset,
  PRESETS_FILE,
};


