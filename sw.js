/* Garden Wonder — service worker.

   The job here is offline play, NOT speed, and the difference matters. This game
   ships without a build step, so `game.js` keeps the same URL forever and a
   cache-first worker would serve a player the same stale build until the end of
   time. So every same-origin request goes to the network FIRST and only falls
   back to the cache when the network fails or stalls.

   Video is the exception. `<video>` streams with byte-range requests; routing
   those through network-first (or caching partial 206 responses) stalls playback.
   Range requests pass straight to the network/CDN. Full-file fetches are
   cache-first in a separate video bucket so repeat views are instant offline. */

const VERSION = 30;
const CACHE = `gw-v${VERSION}`;
const VIDEO_CACHE = `gw-video-v${VERSION}`;
const FONTS = 'gw-fonts';
const NET_TIMEOUT = 4000;   // slow network -> fall back to cache rather than hang

const VIDEOS = [
  './art/video/bg/spring.mp4', './art/video/bg/summer.mp4',
  './art/video/bg/fall.mp4', './art/video/bg/winter.mp4',
  './art/video/bg/generic-laugh.mp4', './art/video/bg/generic-aha.mp4',
  './art/video/flower/spring-idle1.mp4',
  './art/video/flower/idle-2.mp4',
  './art/video/flower/idle-3.mp4',
  './art/video/flower/spring-powerup-1.mp4',
  './art/video/flower/speech-batch-1/hello-friend.mp4',
  './art/video/flower/speech-batch-1/hello-there2.mp4',
  './art/video/flower/speech-batch-1/you-came-back.mp4',
  './art/video/flower/speech-batch-1/the-soil-missed-you.mp4',
  './art/video/flower/speech-batch-1/ready-to-grow-something.mp4',
  './art/video/flower/speech-batch-1/ooh-do-that-again.mp4',
  './art/video/flower/speech-batch-1/tickles.mp4',
  './art/video/flower/speech-batch-1/cheater.mp4',
  './art/video/flower/speech-batch-2/keep-it-coming.mp4',
  './art/video/flower/speech-batch-2/that-is%20the-spirit.mp4',
  './art/video/flower/speech-batch-2/more-petals-please.mp4',
  './art/video/flower/speech-batch-2/beautiful-harvest.mp4',
  './art/video/flower/speech-batch-2/wow-critical-blooom.mp4',
  './art/video/flower/speech-batch-2/new-ground-to-grow-on.mp4',
  './art/video/flower/speech-batch-2/save-up-a-few-coins.mp4',
  './art/video/flower/speech-batch-2/rain-the-garden-loves-this.mp4',
  './art/video/flower/speech-batch-2/wonder.mp4',
  './art/video/flower/speech-batch-2/a-l-bloomed.mp4',
  './art/video/flower/speech-batch-2/swipe%20down%20fopr%20the%20wild%20meadow.mp4',
  './art/video/plant/sunflower-grow.mp4',
  './art/video/plant/sunflower-finish-loop.mp4'
];

const CORE = [
  './', './index.html', './style.css', './style-art.css', './manifest.json',
  './data.js', './flora.js', './critters.js', './customers.js', './hollow.js', './meadow.js', './fall.js', './icons.js',
  './audio.js', './fx.js', './game.js',
  './ui-shared.js', './ui-scenery.js', './ui-weather.js', './ui-sheet.js', './ui-hollow.js', './ui-meadow.js', './ui-fall.js',
  './ui-news.js', './ui-menu.js', './ui-events.js', './ui-perf.js', './ui.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './art/announcements/garden-year.png',
  './art/images/planter-spring.png', './art/images/planter-summer.png',
  './art/images/planter-fall.png', './art/images/planter-winter.png',
  './art/images/soil-spring.png', './art/images/soil-summer.png',
  './art/images/soil-fall.png', './art/images/soil-winter.png',
  './art/images/fb-spring.png', './art/images/fb-summer.png',
  './art/images/fb-fall.png', './art/images/fb-winter.png',
  './art/images/bg-spring.jpg', './art/images/bg-summer.jpg',
  './art/images/bg-fall.jpg', './art/images/bg-winter.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const videoCache = await caches.open(VIDEO_CACHE);
    // Individually, so one 404 can't fail the whole install.
    await Promise.allSettled([
      ...CORE.map((u) => cache.add(new Request(u, { cache: 'reload' }))),
      ...VIDEOS.map((u) => videoCache.add(new Request(u, { cache: 'reload' })))
    ]);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keep = new Set([CACHE, VIDEO_CACHE, FONTS]);
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (keep.has(k) ? null : caches.delete(k))));
    await self.clients.claim();
  })());
});

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

function isVideoPath(pathname) {
  return pathname.endsWith('.mp4');
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
    if (req.mode === 'navigate') {
      const shell = await cache.match('./index.html') || await cache.match('./');
      if (shell) return shell;
    }
    throw err;
  }
}

/* Cache-first for whole clips; byte-range streaming stays on the network. */
async function video(req) {
  if (req.headers.get('range')) return fetch(req);

  const cache = await caches.open(VIDEO_CACHE);
  const hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;

  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const fallback = await cache.match(req, { ignoreSearch: true });
    if (fallback) return fallback;
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

  if (url.origin !== self.location.origin) return;

  if (isVideoPath(url.pathname) || req.destination === 'video') {
    e.respondWith(video(req));
    return;
  }

  e.respondWith(fresh(req, CACHE));
});
