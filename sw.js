'use strict';

// La preparazione per Pages sostituisce questo valore con l'hash dei file.
// Se si serve direttamente il repository, incrementarlo a ogni rilascio.
const VERSION = 'be9f6d4334aff46592693d8a806a9abbd81a6f05b72397a02405c5aac3890fa6';
// Lo scope nel nome isola altre applicazioni pubblicate sullo stesso dominio.
const CACHE_PREFIX = 'dh-encounter-pwa:' + self.registration.scope + ':';
const CACHE_NAME = CACHE_PREFIX + VERSION;
const APP_URL = new URL('./rpg_dh_gmtools.html', self.registration.scope).href;
const ASSETS = [
  './rpg_dh_gmtools.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
].map(path => new URL(path, self.registration.scope).href);
const PAGES = ['', 'index.html', 'rpg_dh_gmtools.html']
  .map(path => new URL(path, self.registration.scope).href);

self.addEventListener('install', event => {
  // Installazione atomica: se una risorsa manca resta attiva la vecchia versione.
  // Niente skipWaiting: una sessione aperta continua con la propria versione.
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      await cache.addAll(ASSETS.map(url => new Request(url, {cache: 'reload'})));
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    // Nessun clients.claim: il primo documento online resta quello gia caricato.
  })());
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  // Query e frammenti non cambiano il documento. Nessun fallback per URL ignoti.
  url.search = '';
  url.hash = '';
  const key = event.request.mode === 'navigate' && PAGES.includes(url.href)
    ? APP_URL : event.request.url;
  if (!ASSETS.includes(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match(key)) || fetch(event.request);
  })());
});
