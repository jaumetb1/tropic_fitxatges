const CACHE_NAME = 'tropic-cache-v1.2';
const FILES_TO_CACHE = [
  '/tropic_fitxatges/index.html',
  '/tropic_fitxatges/manifest.json',
  '/tropic_fitxatges/icons/icon-192.png',
  '/tropic_fitxatges/icons/icon-512.png',
  '/tropic_fitxatges/styles.css',        // canvia segons el teu projecte
  '/tropic_fitxatges/main.js',        // idem
  // afegeix aquí qualsevol altre fitxer JS, CSS o imatges que vulguis cachejar
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instal·lant i cachejant...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activat');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((nom) => {
          if (nom !== CACHE_NAME) {
            console.log('[Service Worker] Esborrem la cau antiga:', nom);
            return caches.delete(nom);
          }
        })
      );
    })
  );
});


self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((resposta) => {
      return resposta || fetch(event.request);
    })
  );
});

