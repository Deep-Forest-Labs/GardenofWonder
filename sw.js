/* Garden Wonder — service worker.

   The job here is offline play, NOT speed, and the difference matters. This game
   ships without a build step, so `game.js` keeps the same URL forever and a
   cache-first worker would serve a player the same stale build until the end of
   time. So every same-origin request goes to the network FIRST and only falls
   back to the cache when the network fails or stalls.

   The upshot: an online player is always on the current build, an offline player
   still gets to garden, and forgetting to bump VERSION below strands nobody — the
   version only controls when old caches get swept up. */

const VERSION = 5;
const CACHE = `gw-v${VERSION}`;
const FONTS = 'gw-fonts';
const NET_TIMEOUT = 4000;   // slow network -> fall back to cache rather than hang

const CORE = [
  './', './index.html', './style.css', './manifest.json',
  './data.js', './flora.js', './critters.js', './customers.js', './overworld.js', './hollow.js', './meadow.js', './fall.js', './icons.js',
  './audio.js', './fx.js', './game.js',
  './ui-shared.js', './ui-scenery.js', './ui-sheet.js', './ui-hollow.js', './ui-map.js', './ui-meadow.js', './ui-fall.js',
  './ui-events.js', './ui.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Individually, so one 404 can't fail the whole install.
    await Promise.allSettled(CORE.map((u) => cache.add(new Request(u, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k === CACHE || k === FONTS ? null : caches.delete(k))));
    await self.clients.claim();
  })());
});

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

/* Network first, cache as the safety net. */
async function fresh(req, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const res = await Promise.race([fetch(req), timeout(NET_TIMEOUT)]);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    // A navigation with nothing cached for that exact URL still deserves the shell.
    if (req.mode === 'navigate') {
      const shell = await cache.match('./index.html') || await cache.match('./');
      if (shell) return shell;
    }
    throw err;
  }
}

/* The webfont never changes, so it is the one thing worth serving cache first —
   it keeps the offline game looking like the online one. */
async function font(req) {
  const cache = await caches.open(FONTS);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(font(req).catch(() => fetch(req)));
    return;
  }

  if (url.origin !== self.location.origin) return;   // anything else: browser's problem

  e.respondWith(fresh(req, CACHE));
});
