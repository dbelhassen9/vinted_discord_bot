const axios = require('axios');
const { sendNotification } = require('./utils/notifications');
const { NotificationQueue } = require('./utils/queue');
const { getItemPrice } = require('./utils/priceHelpers');
const { loadSearchesFromDisk, saveSearchesToDisk } = require('./utils/storage');
const { ensureSession, resetSession, getApiClient, getApiHeaders } = require('./utils/vintedSession');

const searches = new Map();
const seenItems = new Set();
const notificationQueue = new NotificationQueue();

const VINTED_API_URL = 'https://www.vinted.fr/api/v2/catalog/items';
const CHECK_INTERVAL = Number.parseInt(process.env.CHECK_INTERVAL_MS || '5000', 10);

// Charger les recherches persistées au démarrage
(function initializePersistedSearches() {
  const persisted = loadSearchesFromDisk();
  for (const s of persisted) {
    if (s && s.id && s.channelId && s.config) {
      searches.set(s.id, {
        id: s.id,
        channelId: s.channelId,
        config: s.config,
        active: typeof s.active === 'boolean' ? s.active : true,
      });
    }
  }
  if (persisted.length > 0) {
    console.log(`💾 Recherches chargées depuis le disque: ${persisted.length}`);
  }
})();

function persistSearches() {
  const arr = Array.from(searches.values());
  saveSearchesToDisk(arr);
}

function addSearch(channelId, searchConfig) {
  const searchId = `${channelId}_${Date.now()}`;
  searches.set(searchId, {
    id: searchId,
    channelId,
    config: searchConfig,
    active: true,
  });
  console.log(`✅ Nouvelle recherche ajoutée: ${searchId}`);
  persistSearches();
  return searchId;
}

function removeSearch(searchId) {
  const deleted = searches.delete(searchId);
  console.log(deleted ? `✅ Recherche supprimée: ${searchId}` : `❌ Recherche non trouvée: ${searchId}`);
  if (deleted) persistSearches();
  return deleted;
}

function getSearches(channelId = null) {
  if (channelId) {
    return Array.from(searches.values()).filter(s => s.channelId === channelId);
  }
  return Array.from(searches.values());
}

function pauseSearch(searchId) {
  const s = searches.get(searchId);
  if (!s) return false;
  s.active = false;
  searches.set(searchId, s);
  persistSearches();
  return true;
}

function resumeSearch(searchId) {
  const s = searches.get(searchId);
  if (!s) return false;
  s.active = true;
  searches.set(searchId, s);
  persistSearches();
  return true;
}

function buildVintedUrl(config) {
  const params = new URLSearchParams();
  
  if (config.keyword) params.append('search_text', config.keyword);
  if (config.priceMin) params.append('price_from', config.priceMin);
  if (config.priceMax) params.append('price_to', config.priceMax);
  if (config.categoryId) params.append('catalog_ids', config.categoryId);
  if (config.brandId) params.append('brand_ids', config.brandId);
  if (config.sizeId) params.append('size_ids', config.sizeId);
  
  params.append('per_page', '20');
  params.append('order', 'newest_first');
  params.append('page', '1');
  params.append('status_id', '0'); // disponible
  params.append('currency', 'EUR');
  
  return `${VINTED_API_URL}?${params.toString()}`;
}

async function fetchVintedItems(config) {
  await ensureSession();
  const client = getApiClient();
  const url = buildVintedUrl(config);

  const maxAttempts = 3;
  let attempt = 0;
  let lastError = null;
  while (attempt < maxAttempts) {
    try {
      const response = await client.get(url, {
        headers: {
          ...getApiHeaders(),
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        },
        timeout: 15000,
      });
      let items = response.data?.items || [];
      if (!Array.isArray(items) || items.length === 0) {
        // Fallback: extraire les items depuis la page HTML publique
        items = await fetchVintedItemsFromHtml(client, config);
      }
      return items;
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      if (status === 401 || status === 403) {
        // Session expirée → reset + retry
        console.warn('Session Vinted expirée, reinitialisation...');
        await resetSession();
        attempt += 1;
        continue;
      }
      // Backoff exponentiel sur erreurs réseau/5xx
      const isRetryable = !status || status >= 500;
      if (isRetryable) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        await new Promise(r => setTimeout(r, delay));
        attempt += 1;
        continue;
      }
      break;
    }
  }
  if (lastError?.response) {
    console.error(`Erreur API Vinted (${lastError.response.status}): ${lastError.response.statusText}`);
  } else if (lastError) {
    console.error('Erreur lors de la récupération des articles Vinted:', lastError.message);
  }
  return [];
}

async function fetchVintedItemsFromHtml(client, config) {
  try {
    const q = new URLSearchParams();
    if (config.keyword) q.append('search_text', config.keyword);
    if (config.priceMin) q.append('price_from', config.priceMin);
    if (config.priceMax) q.append('price_to', config.priceMax);
    q.append('order', 'newest_first');
    q.append('page', '1');
    const url = `https://www.vinted.fr/vetements?${q.toString()}`;
    const res = await client.get(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Referer': 'https://www.vinted.fr/',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      timeout: 15000,
    });
    const html = typeof res.data === 'string' ? res.data : '';
    // Cherche un bloc JSON contenant "items":[...]
    const match = html.match(/"items"\s*:\s*\[(\{[\s\S]*?\})\]/);
    if (!match) return [];
    const itemsJson = `[${match[1]}]`;
    try {
      const parsed = JSON.parse(itemsJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  } catch (e) {
    return [];
  }
}

function matchesFilters(item, config) {
  if (config.keyword) {
    // Normalisation (minuscules, suppression des accents et ponctuation simple)
    const normalize = (str) => (str || '')
      .toLowerCase()
      .normalize('NFD').replace(/\p{Diacritic}+/gu, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

    const titleNorm = normalize(item.title);
    const descNorm = normalize(item.description);
    const haystack = `${titleNorm} ${descNorm}`.trim();

    // Mots-clés: on split en tokens et on ajoute quelques synonymes basiques
    const kwNorm = normalize(config.keyword);
    const tokens = kwNorm.split(/\s+/).filter(Boolean);

    // Synonymes légers pour ton cas d'usage
    const synonyms = new Map([
      ['pokemon', ['pokemon', 'pokémon']],
      ['bundle', ['bundle', 'lot', 'coffret']],
      ['boosters', ['boosters', 'booster']],
      ['flamme', ['flamme']],
      ['blanche', ['blanche']],
      ['foudre', ['foudre']],
      ['noire', ['noire']],
    ]);

    // Règle: tous les tokens doivent être présents via eux-mêmes ou un synonyme
    const allTokensPresent = tokens.every((t) => {
      const alts = synonyms.get(t) || [t];
      return alts.some(a => haystack.includes(a));
    });

    if (!allTokensPresent) {
      return false;
    }
  }
  
  const itemPrice = getItemPrice(item);
  
  if (config.priceMin && itemPrice !== null) {
    if (itemPrice < parseFloat(config.priceMin)) {
      return false;
    }
  }
  
  if (config.priceMax && itemPrice !== null) {
    if (itemPrice > parseFloat(config.priceMax)) {
      return false;
    }
  }
  
  // Filtre: nombre minimum d'évaluations du vendeur
  if (config.minEvaluations) {
    const count = item.user?.feedback_count || item.user?.feedbacks_count || 0;
    if (count < parseInt(config.minEvaluations, 10)) {
      return false;
    }
  }
  
  return true;
}

async function checkSearches(client) {
  for (const [searchId, search] of searches) {
    if (!search.active) continue;
    
    try {
      const items = await fetchVintedItems(search.config);
      
      for (const item of items) {
        const itemKey = `${searchId}_${item.id}`;
        
        if (!seenItems.has(itemKey) && matchesFilters(item, search.config)) {
          seenItems.add(itemKey);
          
          // Ajouter à la queue au lieu d'envoyer directement
          await notificationQueue.add(search.channelId, async () => {
            const channel = await client.channels.fetch(search.channelId);
            if (channel) {
              await sendNotification(channel, item, search.config);
            }
          });
        }
      }
      
      // Délai entre chaque recherche pour éviter le rate limiting Vinted
      if (searches.size > 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`Erreur lors de la vérification de la recherche ${searchId}:`, error.message);
    }
  }
}

function startVintedMonitoring(client) {
  console.log(`🔍 Surveillance Vinted démarrée (intervalle: ${CHECK_INTERVAL}ms)`);
  
  setInterval(async () => {
    await checkSearches(client);
  }, CHECK_INTERVAL);
}

module.exports = {
  startVintedMonitoring,
  addSearch,
  removeSearch,
  getSearches,
  pauseSearch,
  resumeSearch,
};
