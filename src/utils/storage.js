const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'VintedWatcher', '.local');
const SEARCHES_FILE = path.join(DATA_DIR, 'searches.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (error) {
    console.warn('Impossible de créer le dossier de données:', error.message);
  }
}

function loadSearchesFromDisk() {
  ensureDataDir();
  try {
    if (!fs.existsSync(SEARCHES_FILE)) return [];
    const raw = fs.readFileSync(SEARCHES_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (error) {
    console.warn('Erreur lors du chargement des recherches persistées:', error.message);
    return [];
  }
}

function saveSearchesToDisk(searchesArray) {
  ensureDataDir();
  try {
    fs.writeFileSync(SEARCHES_FILE, JSON.stringify(searchesArray, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Erreur lors de la sauvegarde des recherches:', error.message);
  }
}

module.exports = {
  loadSearchesFromDisk,
  saveSearchesToDisk,
  DATA_DIR,
  SEARCHES_FILE,
};


