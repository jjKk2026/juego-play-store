/* =====================================================================
   VOLUMEN: pixel art con luz y sombra (Gemelos del Sol 2)
   En el primer juego los enemigos se pintaban con colores planos.
   Aquí cada parte del cuerpo (esferas, cápsulas, triángulos) calcula,
   píxel por píxel, cuánta luz le llega desde arriba a la izquierda.
   Con eso elige entre 4 tonos del mismo color y mezcla los bordes con
   una trama ordenada (dithering), como en los juegos de 16 bits.
   También hay "luz de borde" (rim light) de neón para el inframundo
   y un contorno de color (más oscuro que la pieza, no negro).
   ===================================================================== */
'use strict';

(function () {
  const U = G.util;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  const LUZ = (() => { const l = [-0.5, -0.62, 0.6]; const m = Math.hypot(...l); return l.map((v) => v / m); })();

  // 4 tonos a partir de un color base: sombra profunda, sombra, base, luz.
  const cacheTonos = new Map();
  function tonos(base) {
    if (cacheTonos.has(base)) return cacheTonos.get(base);
    // las sombras se enfrían un poco hacia el morado (estilo inframundo)
    const t = [
      U.mezclar(U.tono(base, -0.55), '#1d0f33', 0.25),
      U.mezclar(U.tono(base, -0.28), '#2a1846', 0.12),
      base,
      U.mezclar(U.tono(base, 0.28), '#fff3d0', 0.1)
    ];
    cacheTonos.set(base, t);
    return t;
  }

  // Elige un tono según la intensidad de luz (0..1) con trama ordenada.
  function tonoPara(t, intensidad, x, y) {
    const v = U.limitar(intensidad, 0, 0.999) * 3;
    const i = Math.floor(v);
    const resto = v - i;
    const umbral = BAYER[(y & 3) * 4 + (x & 3)];
    return t[Math.min(3, i + (resto > umbral ? 1 : 0))];
  }

  function iluminar(nx, ny, nz, op) {
    const d = nx * LUZ[0] + ny * LUZ[1] + nz * LUZ[2];
    return (op && op.plano ? 0.35 : 0.18) + Math.max(0, d) * 0.85;
  }

  function borde(ctx, x, y, nx, ny, nz, op) {
    // luz de borde de neón abajo a la derecha
    if (op && op.borde && nz < 0.45 && nx * 0.6 + ny * 0.8 > 0.55) { ctx.fillStyle = op.borde; ctx.fillRect(x, y, 1, 1); return true; }
    return false;
  }

  const V = {
    tonos,
    // Esfera u óvalo sombreado.
    esfera(ctx, cx, cy, rx, ry, base, op) {
      const t = tonos(base);
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const nx = (x + 0.5 - cx) / (rx + 0.5), ny = (y + 0.5 - cy) / (ry + 0.5);
          const q = nx * nx + ny * ny;
          if (q > 1) continue;
          const nz = Math.sqrt(1 - q);
          if (borde(ctx, x, y, nx, ny, nz, op)) continue;
          ctx.fillStyle = tonoPara(t, iluminar(nx, ny, nz, op), x, y);
          ctx.fillRect(x, y, 1, 1);
        }
      }
    },
    // Cápsula (brazo, pierna, cuello, cola) de (x0,y0) a (x1,y1) con grosor r0 → r1.
    capsula(ctx, x0, y0, x1, y1, r0, r1, base, op) {
      const t = tonos(base);
      const dx = x1 - x0, dy = y1 - y0, largo2 = dx * dx + dy * dy || 1;
      const rmax = Math.max(r0, r1);
      for (let y = Math.floor(Math.min(y0, y1) - rmax); y <= Math.ceil(Math.max(y0, y1) + rmax); y++) {
        for (let x = Math.floor(Math.min(x0, x1) - rmax); x <= Math.ceil(Math.max(x0, x1) + rmax); x++) {
          const px = x + 0.5, py = y + 0.5;
          const k = U.limitar(((px - x0) * dx + (py - y0) * dy) / largo2, 0, 1);
          const qx = x0 + dx * k, qy = y0 + dy * k;
          const r = r0 + (r1 - r0) * k;
          const ox = px - qx, oy = py - qy;
          const d = Math.hypot(ox, oy);
          if (d > r + 0.3) continue;
          const nx = ox / (r + 0.5), ny = oy / (r + 0.5);
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          if (borde(ctx, x, y, nx, ny, nz, op)) continue;
          ctx.fillStyle = tonoPara(t, iluminar(nx, ny, nz, op), x, y);
          ctx.fillRect(x, y, 1, 1);
        }
      }
    },
    // Polígono con sombreado según su inclinación (para alas, plumas, picos).
    poligono(ctx, pts, base, op) {
      op = op || {};
      const t = tonos(base);
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const minX = Math.floor(Math.min(...xs)), maxX = Math.ceil(Math.max(...xs));
      const minY = Math.floor(Math.min(...ys)), maxY = Math.ceil(Math.max(...ys));
      const dentro = (x, y) => {
        let c = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
        }
        return c;
      };
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      const w = Math.max(1, maxX - minX), h = Math.max(1, maxY - minY);
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (!dentro(x + 0.5, y + 0.5)) continue;
          // degradado suave dentro de la pieza + inclinación de la pieza
          const gx = (x - cx) / w, gy = (y - cy) / h;
          const intensidad = (op.luz === undefined ? 0.55 : op.luz) - gx * 0.35 - gy * 0.45;
          ctx.fillStyle = tonoPara(t, intensidad, x, y);
          ctx.fillRect(x, y, 1, 1);
        }
      }
    },
    // Ojos y marcas que brillan (se dibujan después del contorno).
    brilla(ctx, x, y, color, tam) {
      tam = tam || 1;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), tam, tam);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    },
    // Contorno de color: cada borde toma el color del píxel vecino, muy oscurecido.
    contorno(canvas, extra) {
      const w = canvas.width, h = canvas.height;
      const src = canvas.getContext('2d').getImageData(0, 0, w, h).data;
      const [c, ctx] = G.util.crearLienzo(w, h);
      const img = ctx.createImageData(w, h);
      const d = img.data;
      const lleno = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 0;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          if (lleno(x, y)) continue;
          let vecino = -1;
          for (const [vx, vy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) if (lleno(x + vx, y + vy)) { vecino = ((y + vy) * w + (x + vx)) * 4; break; }
          if (vecino < 0) continue;
          // abajo el contorno es más oscuro (sombra), arriba conserva algo de color
          const abajo = lleno(x, y - 1);
          const f = abajo ? 0.18 : 0.32;
          d[i] = src[vecino] * f + 10; d[i + 1] = src[vecino + 1] * f + 4; d[i + 2] = src[vecino + 2] * f + 18; d[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
      ctx.drawImage(canvas, 0, 0);
      if (extra) extra(ctx);
      return c;
    },
    // Versión "espíritu" de una criatura: luminosa, en tonos jade, oro y blanco.
    espiritu(canvas, color) {
      const w = canvas.width, h = canvas.height;
      const [c, ctx] = G.util.crearLienzo(w, h);
      ctx.drawImage(canvas, 0, 0);
      const img = ctx.getImageData(0, 0, w, h);
      const d = img.data;
      const claro = U.rgb('#f2fffa'), medio = U.rgb(color || '#3fd3a8'), oscuro = U.rgb('#123c3a');
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue;
        const lum = Math.min(1, (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255 * 1.6);
        // oscuro -> color del espíritu -> casi blanco, según la luz de cada píxel
        const [a, b, k] = lum < 0.5 ? [oscuro, medio, lum / 0.5] : [medio, claro, (lum - 0.5) / 0.5];
        d[i] = a[0] + (b[0] - a[0]) * k; d[i + 1] = a[1] + (b[1] - a[1]) * k; d[i + 2] = a[2] + (b[2] - a[2]) * k;
        d[i + 3] = 225;
      }
      ctx.putImageData(img, 0, 0);
      return c;
    }
  };

  G.volumen = V;
})();
