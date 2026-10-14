/* =====================================================================
   UTILIDADES
   Este archivo crea el "espacio de nombres" G: una caja donde vive todo
   el juego (G.motor, G.audio, G.datos...). Así ningún archivo pisa a otro.
   ===================================================================== */
'use strict';

var G = window.G || {};
window.G = G;

// Tamaño interno de la pantalla en píxeles (luego se agranda sin perder nitidez).
G.ANCHO = 384;
G.ALTO = 216;
G.TILE = 16;

G.util = {
  limitar(v, min, max) { return v < min ? min : v > max ? max : v; },
  lerp(a, b, t) { return a + (b - a) * t; },
  azar(min, max) { return min + Math.random() * (max - min); },
  azarEntero(min, max) { return Math.floor(min + Math.random() * (max - min + 1)); },
  elegir(lista) { return lista[Math.floor(Math.random() * lista.length)]; },
  distancia(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); },
  // Suavizado "sale rápido, llega lento".
  suave(t) { return 1 - Math.pow(1 - G.util.limitar(t, 0, 1), 3); },
  rebote(t) {
    t = G.util.limitar(t, 0, 1);
    const n = 7.5625, d = 2.75;
    if (t < 1 / d) return n * t * t;
    if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
    if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
    return n * (t -= 2.625 / d) * t + 0.984375;
  },
  // Generador de números "al azar" pero repetibles (mismo dibujo cada vez).
  semilla(s) {
    let x = (s >>> 0) || 1;
    return function () {
      x ^= x << 13; x >>>= 0;
      x ^= x >> 17;
      x ^= x << 5; x >>>= 0;
      return x / 4294967296;
    };
  },
  // Ruido simple por coordenada (para variar pasto, piedras, etc.).
  ruido(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + (s || 0) * 982451653) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return ((h >>> 0) % 10000) / 10000;
  },
  copiar(obj) { return JSON.parse(JSON.stringify(obj)); },
  // Convierte "#rrggbb" en [r,g,b].
  rgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  },
  hex(r, g, b) {
    const c = (v) => G.util.limitar(Math.round(v), 0, 255).toString(16).padStart(2, '0');
    return '#' + c(r) + c(g) + c(b);
  },
  // Aclara (f > 0) u oscurece (f < 0) un color.
  tono(hex, f) {
    const [r, g, b] = G.util.rgb(hex);
    if (f >= 0) return G.util.hex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f);
    return G.util.hex(r * (1 + f), g * (1 + f), b * (1 + f));
  },
  mezclar(a, b, t) {
    const x = G.util.rgb(a), y = G.util.rgb(b);
    return G.util.hex(G.util.lerp(x[0], y[0], t), G.util.lerp(x[1], y[1], t), G.util.lerp(x[2], y[2], t));
  },
  crearLienzo(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return [c, ctx];
  }
};

// Direcciones: 0 abajo, 1 izquierda, 2 derecha, 3 arriba.
G.DIRS = [
  { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: -1 }
];
