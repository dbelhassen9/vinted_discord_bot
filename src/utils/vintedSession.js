const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

function createHttpClient(currentJar) {
  return wrapper(axios.create({
    jar: currentJar,
    withCredentials: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
    },
    timeout: 15000,
  }));
}

// Client axios avec gestion des cookies (session Vinted)
let cookieJar = new CookieJar();
let client = createHttpClient(cookieJar);

let csrfToken = null;

async function initVintedSession() {
  const homepageUrl = 'https://www.vinted.fr/';
  // Pré-configure quelques cookies de préférence (peuvent aider à obtenir une page cohérente)
  try {
    await cookieJar.setCookie('locale=fr; Domain=.vinted.fr; Path=/', homepageUrl);
    await cookieJar.setCookie('currency=EUR; Domain=.vinted.fr; Path=/', homepageUrl);
  } catch (_) {}
  const res = await client.get(homepageUrl);
  const html = typeof res.data === 'string' ? res.data : '';
  
  // 1) Via balise meta
  let token = null;
  const metaMatch = html.match(/name="csrf-token"\s+content="([^"]+)"/i);
  if (metaMatch) {
    token = metaMatch[1];
  }
  
  // 2) Fallback via cookie 'csrf_token'
  if (!token) {
    const cookies = await cookieJar.getCookies(homepageUrl);
    const csrfCookie = cookies.find(c => c && c.key && c.key.toLowerCase() === 'csrf_token');
    if (csrfCookie && csrfCookie.value) {
      token = csrfCookie.value;
    }
  }
  
  if (!token) {
    console.log('CSRF token Vinted non trouvé, tentative sans CSRF (cookies uniquement).');
    csrfToken = null;
    return null;
  }
  
  csrfToken = token;
  return csrfToken;
}

function getApiClient() {
  return client;
}

function buildSearchReferer(config = {}) {
  const params = new URLSearchParams();
  if (config.keyword) params.append('search_text', config.keyword);
  if (config.priceMin) params.append('price_from', config.priceMin);
  if (config.priceMax) params.append('price_to', config.priceMax);
  if (config.categoryId) params.append('catalog_ids', config.categoryId);
  if (config.brandId) params.append('brand_ids', config.brandId);
  if (config.sizeId) params.append('size_ids', config.sizeId);
  params.append('order', 'newest_first');
  params.append('page', '1');
  return `https://www.vinted.fr/vetements?${params.toString()}`;
}

function getApiHeaders(config = {}) {
  return {
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Referer': buildSearchReferer(config),
    'Origin': 'https://www.vinted.fr',
    'X-Requested-With': 'XMLHttpRequest',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-origin',
    ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
  };
}

async function ensureSession() {
  if (!csrfToken) {
    await initVintedSession();
  }
}

async function resetSession() {
  cookieJar = new CookieJar();
  client = createHttpClient(cookieJar);
  csrfToken = null;
  await initVintedSession();
}

module.exports = {
  ensureSession,
  resetSession,
  getApiClient,
  getApiHeaders,
  initVintedSession,
  buildSearchReferer,
};


