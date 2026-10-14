/* Service worker: guarda el juego en el dispositivo para que funcione sin internet.
   IMPORTANTE: cambia el número de VERSION cada vez que publiques cambios,
   así los jugadores reciben la versión nueva. */
const VERSION = 'gemelos-v2';
const ARCHIVOS = [
  './',
  './index.html',
  './manifest.json',
  './css/juego.css',
  './js/motor/utilidades.js',
  './js/motor/fuente.js',
  './js/motor/pixel.js',
  './js/motor/entrada.js',
  './js/motor/audio.js',
  './js/motor/guardado.js',
  './js/motor/efectos.js',
  './js/motor/ui.js',
  './js/motor/nucleo.js',
  './js/juego/datos.js',
  './js/juego/reglas.js',
  './js/juego/mundos.js',
  './js/juego/arte.js',
  './js/juego/losetas.js',
  './js/juego/musica.js',
  './js/juego/estado.js',
  './js/juego/escena-comic.js',
  './js/juego/escena-combate.js',
  './js/juego/escena-mapa.js',
  './js/juego/escena-pausa.js',
  './js/juego/escena-bestiario.js',
  './js/juego/escena-nombre.js',
  './js/juego/escena-titulo.js',
  './js/mundos/maya/criaturas.js',
  './js/mundos/maya/musica.js',
  './js/mundos/maya/historia.js',
  './js/mundos/maya/mapas.js',
  './js/mundos/maya/mundo.js',
  './js/principal.js',
  './iconos/icono-192.png',
  './iconos/icono-512.png',
  './iconos/maskable-512.png',
  './iconos/apple-touch-icon.png',
  './iconos/favicon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Primero la copia guardada (rápido y sin internet); en segundo plano se actualiza.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const clave = req.mode === 'navigate' ? './index.html' : req;
      const guardado = await cache.match(clave, { ignoreSearch: true });
      const red = fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === 'basic') cache.put(clave, res.clone());
          return res;
        })
        .catch(() => guardado);
      if (guardado) {
        e.waitUntil(red);
        return guardado;
      }
      return red;
    })
  );
});
