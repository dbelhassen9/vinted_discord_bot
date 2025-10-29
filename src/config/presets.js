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

const PRESETS = {
  reshiram: {
    label: 'Reshiram (Flamme Blanche)',
    searches: {
      bundle: { keyword: 'bundle flamme blanche pokemon' },
      etb: { keyword: 'etb reshiram flamme blanche' },
    },
  },
  zekrom: {
    label: 'Zekrom (Foudre Noire)',
    searches: {
      bundle: { keyword: 'bundle foudre noire pokemon' },
      etb: { keyword: 'etb zekrom foudre noire' },
    },
  },
};

module.exports = { PRESETS, DEFAULT_CHANNELS_BY_PRESET };


