/* =====================================================================
   HERRAMIENTAS DE PIXEL ART
   Funciones para "pintar" píxel a píxel: rectángulos, óvalos, líneas,
   bordes automáticos, espejos y dibujos hechos con letras.
   Todo el arte del juego se crea con código: no hay imágenes externas.
   ===================================================================== */
'use strict';

(function () {
  const cache = new Map();

  const P = {
    // Guarda un dibujo ya hecho para no repetir el trabajo.
    memo(clave, fn) {
      if (!cache.has(clave)) cache.set(clave, fn());
      return cache.get(clave);
    },
    lienzo(w, h) { return G.util.crearLienzo(w, h); },

    px(ctx, x, y, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, 1, 1); },
    rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); },

    // Óvalo relleno sin bordes borrosos.
    elipse(ctx, cx, cy, rx, ry, c) {
      ctx.fillStyle = c;
      for (let y = -ry; y <= ry; y++) {
        const k = 1 - (y * y) / ((ry + 0.5) * (ry + 0.5));
        if (k < 0) continue;
        const w = Math.round(Math.sqrt(k) * (rx + 0.5));
        ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1);
      }
    },
    // Línea de píxeles (algoritmo de Bresenham).
    linea(ctx, x0, y0, x1, y1, c, grosor) {
      ctx.fillStyle = c;
      grosor = grosor || 1;
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (let i = 0; i < 2000; i++) {
        ctx.fillRect(x0 - (grosor >> 1), y0 - (grosor >> 1), grosor, grosor);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    },
    // Triángulo relleno (para picos, plumas, etc.).
    triangulo(ctx, ax, ay, bx, by, cx, cy, c) {
      ctx.fillStyle = c;
      const minY = Math.floor(Math.min(ay, by, cy)), maxY = Math.ceil(Math.max(ay, by, cy));
      const lado = (x0, y0, x1, y1, y) => {
        if ((y < y0 && y < y1) || (y > y0 && y > y1) || y0 === y1) return null;
        return x0 + (x1 - x0) * (y - y0) / (y1 - y0);
      };
      for (let y = minY; y <= maxY; y++) {
        const yy = y + 0.5;
        const xs = [lado(ax, ay, bx, by, yy), lado(bx, by, cx, cy, yy), lado(cx, cy, ax, ay, yy)].filter((v) => v !== null);
        if (xs.length < 2) continue;
        const x0 = Math.round(Math.min(...xs)), x1 = Math.round(Math.max(...xs));
        ctx.fillRect(x0, y, Math.max(1, x1 - x0), 1);
      }
    },

    // Dibujo a partir de letras: cada letra es un color de la paleta, "." es vacío.
    desdeTexto(filas, paleta) {
      const h = filas.length, w = Math.max(...filas.map((f) => f.length));
      const [c, ctx] = P.lienzo(w, h);
      filas.forEach((f, y) => {
        for (let x = 0; x < f.length; x++) {
          const col = paleta[f[x]];
          if (col) P.px(ctx, x, y, col);
        }
      });
      return c;
    },

    // Agrega un borde oscuro alrededor del dibujo (le da el look de 16 bits).
    contorno(canvas, color) {
      const w = canvas.width, h = canvas.height;
      const src = canvas.getContext('2d').getImageData(0, 0, w, h).data;
      const [c, ctx] = P.lienzo(w, h);
      ctx.fillStyle = color;
      const lleno = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (lleno(x, y)) continue;
          if (lleno(x - 1, y) || lleno(x + 1, y) || lleno(x, y - 1) || lleno(x, y + 1)) ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.drawImage(canvas, 0, 0);
      return c;
    },

    espejo(canvas) {
      const [c, ctx] = P.lienzo(canvas.width, canvas.height);
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(canvas, 0, 0);
      return c;
    },

    // Silueta de un solo color (para destellos blancos al recibir golpes).
    silueta(canvas, color) {
      const [c, ctx] = P.lienzo(canvas.width, canvas.height);
      ctx.drawImage(canvas, 0, 0);
      ctx.globalCompositeOperation = 'source-in';
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return c;
    },

    // Cambia unos colores por otros (para variantes de enemigos).
    recolorear(canvas, mapa) {
      const w = canvas.width, h = canvas.height;
      const [c, ctx] = P.lienzo(w, h);
      ctx.drawImage(canvas, 0, 0);
      const img = ctx.getImageData(0, 0, w, h);
      const d = img.data;
      const tabla = {};
      Object.keys(mapa).forEach((k) => { tabla[k.toLowerCase()] = G.util.rgb(mapa[k]); });
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;
        const k = G.util.hex(d[i], d[i + 1], d[i + 2]);
        const n = tabla[k];
        if (n) { d[i] = n[0]; d[i + 1] = n[1]; d[i + 2] = n[2]; }
      }
      ctx.putImageData(img, 0, 0);
      return c;
    },

    // Trama de puntos estilo cómic (halftone).
    trama(ctx, x, y, w, h, color, paso, radio) {
      ctx.fillStyle = color;
      paso = paso || 4;
      for (let j = 0; j < h; j += paso) {
        for (let i = ((j / paso) % 2) * (paso / 2); i < w; i += paso) {
          const r = typeof radio === 'function' ? radio(i, j) : (radio || 1);
          if (r <= 0) continue;
          ctx.fillRect(Math.round(x + i - r / 2), Math.round(y + j - r / 2), Math.max(1, Math.round(r)), Math.max(1, Math.round(r)));
        }
      }
    },

    // Brillo suave tipo neón (se suma a la luz).
    brillo(ctx, x, y, r, color, alfa) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const [cr, cg, cb] = G.util.rgb(color);
      g.addColorStop(0, `rgba(${cr},${cg},${cb},${alfa === undefined ? 0.6 : alfa})`);
      g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();
    }
  };

  G.pixel = P;
})();
