// Définit les presets et les salons cibles par défaut (par nom)

const DEFAULT_CHANNELS_BY_PRESET = {
  reshiram: {
    bundle: 'bundle_reshiram',
    etb: 'etb_reshiram',
  },
  zekrom: {
    bundle: 'bundle_zekrom',
    etb: 'etb_zekrom',
  },
};

// Définit les mots-clés pour chaque preset/type
const PRESETS = {
  reshiram: {
    label: 'Reshiram (Flamme Blanche)',
    searches: {
      bundle: {
        // Bundle 6 boosters Flamme Blanche
        keyword: 'bundle flamme blanche pokemon',
      },
      etb: {
        // Elite Trainer Box Reshiram (fr: coffret dresseur d’élite)
        keyword: 'etb reshiram flamme blanche',
      },
    },
  },
  zekrom: {
    label: 'Zekrom (Foudre Noire)',
    searches: {
      bundle: {
        keyword: 'bundle foudre noire pokemon',
      },
      etb: {
        keyword: 'etb zekrom foudre noire',
      },
    },
  },
};

module.exports = {
  PRESETS,
  DEFAULT_CHANNELS_BY_PRESET,
};


