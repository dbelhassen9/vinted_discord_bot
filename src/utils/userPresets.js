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

function upsertPreset(title, preset) {
  const presets = loadPresets();
  presets[title] = preset;
  savePresets(presets);
}

function getPreset(title) {
  const presets = loadPresets();
  return presets[title] || null;
}

function listPresetTitles() {
  return Object.keys(loadPresets());
}

module.exports = {
  loadPresets,
  savePresets,
  upsertPreset,
  getPreset,
  listPresetTitles,
  PRESETS_FILE,
};


