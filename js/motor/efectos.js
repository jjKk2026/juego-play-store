/* =====================================================================
   EFECTOS ESPECIALES
   - temblor de pantalla en los impactos,
   - cámara lenta en el golpe final,
   - destellos, partículas (chispas, hojas, luciérnagas),
   - onomatopeyas estilo cómic ("¡PUM!") con trama de puntos,
   - colores desfasados (rojo/azul separados) en los golpes críticos,
   - líneas de acción.
   ===================================================================== */
'use strict';

(function () {
  G.tiempo = { escala: 1, lentoRestante: 0 };

  let temblorT = 0, temblorFuerza = 0;
  let destelloT = 0, destelloDur = 0, destelloColor = '#fff';
  let rgbT = 0;
  let lineasT = 0, lineasX = 0, lineasY = 0;
  const particulas = [];
  const flotantes = [];
  const onos = [];
  let lienzoRGB = null;

  const FX = {
    temblor(fuerza, dur) {
      if (G.opciones && !G.opciones.vibracion) fuerza *= 0.25;
      temblorFuerza = Math.max(temblorFuerza, fuerza);
      temblorT = Math.max(temblorT, dur || 0.3);
      if (navigator.vibrate && G.opciones && G.opciones.vibracion && fuerza > 3) {
        try { navigator.vibrate(Math.min(120, fuerza * 12)); } catch (e) { /* nada */ }
      }
    },
    destello(color, dur) { destelloColor = color || '#fff'; destelloDur = destelloT = dur || 0.2; },
    camaraLenta(escala, durReal) { G.tiempo.escala = escala; G.tiempo.lentoRestante = durReal; },
    rgb(dur) { rgbT = Math.max(rgbT, dur || 0.3); },
    lineas(x, y, dur) { lineasX = x; lineasY = y; lineasT = dur || 0.4; },

    // Partículas: chispas, polvo, hojas, luciérnagas...
    emitir(x, y, op) {
      const n = op.n || 8;
      for (let i = 0; i < n; i++) {
        const ang = (op.angulo !== undefined ? op.angulo : Math.random() * Math.PI * 2) + (Math.random() - 0.5) * (op.abanico || Math.PI * 2);
        const v = (op.vel || 40) * (0.4 + Math.random() * 0.8);
        particulas.push({
          x, y,
          vx: Math.cos(ang) * v, vy: Math.sin(ang) * v,
          g: op.gravedad || 0,
          vida: (op.vida || 0.6) * (0.6 + Math.random() * 0.6),
          t: 0,
          color: Array.isArray(op.color) ? G.util.elegir(op.color) : (op.color || '#fff'),
          tam: op.tam || 1,
          brillo: op.brillo || false
        });
      }
    },

    // Números o palabras que flotan (daño, "¡PRECISO!", etc.).
    flotante(texto, x, y, color, op) {
      op = op || {};
      flotantes.push({ texto, x, y, color, t: 0, vida: op.vida || 1, escala: op.escala || 1, borde: op.borde || '#120818' });
    },

    // Onomatopeya grande de cómic.
    onomatopeya(texto, x, y, op) {
      op = op || {};
      onos.push({
        texto, x, y, t: 0, vida: op.vida || 0.9,
        escala: op.escala || 2,
        fondo: op.fondo || '#ffd23f',
        color: op.color || '#ffffff',
        borde: op.borde || '#1a0b1f',
        puntas: op.puntas || 12,
        semilla: Math.random() * 1000
      });
    },

    limpiar() {
      particulas.length = 0; flotantes.length = 0; onos.length = 0;
      temblorT = 0; destelloT = 0; rgbT = 0; lineasT = 0;
      G.tiempo.escala = 1; G.tiempo.lentoRestante = 0;
    },

    // dtJuego ya viene con cámara lenta; dtReal es el tiempo verdadero.
    actualizar(dtJuego, dtReal) {
      if (G.tiempo.lentoRestante > 0) {
        G.tiempo.lentoRestante -= dtReal;
        if (G.tiempo.lentoRestante <= 0) G.tiempo.escala = 1;
      }
      temblorT = Math.max(0, temblorT - dtReal);
      if (temblorT <= 0) temblorFuerza = 0;
      destelloT = Math.max(0, destelloT - dtReal);
      rgbT = Math.max(0, rgbT - dtReal);
      lineasT = Math.max(0, lineasT - dtReal);
      for (let i = particulas.length - 1; i >= 0; i--) {
        const p = particulas[i];
        p.t += dtJuego;
        p.vy += p.g * dtJuego;
        p.x += p.vx * dtJuego; p.y += p.vy * dtJuego;
        p.vx *= 0.98; p.vy *= 0.98;
        if (p.t > p.vida) particulas.splice(i, 1);
      }
      for (let i = flotantes.length - 1; i >= 0; i--) {
        const f = flotantes[i];
        f.t += dtJuego;
        if (f.t > f.vida) flotantes.splice(i, 1);
      }
      for (let i = onos.length - 1; i >= 0; i--) {
        const o = onos[i];
        o.t += dtReal; // las onomatopeyas no se ralentizan
        if (o.t > o.vida) onos.splice(i, 1);
      }
    },

    desplazamiento() {
      if (temblorT <= 0) return [0, 0];
      const f = temblorFuerza * Math.min(1, temblorT / 0.15);
      return [Math.round((Math.random() * 2 - 1) * f), Math.round((Math.random() * 2 - 1) * f)];
    },

    dibujarParticulas(ctx, cx, cy) {
      cx = cx || 0; cy = cy || 0;
      particulas.forEach((p) => {
        const a = 1 - p.t / p.vida;
        ctx.globalAlpha = Math.max(0, a);
        if (p.brillo) G.pixel.brillo(ctx, p.x - cx, p.y - cy, 4 + p.tam * 2, p.color, 0.5 * a);
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x - cx), Math.round(p.y - cy), p.tam, p.tam);
      });
      ctx.globalAlpha = 1;
    },

    dibujarFlotantes(ctx, cx, cy) {
      cx = cx || 0; cy = cy || 0;
      flotantes.forEach((f) => {
        const subir = G.util.suave(Math.min(1, f.t / 0.35)) * 14;
        const rebote = f.t < 0.2 ? Math.sin(f.t / 0.2 * Math.PI) * 3 : 0;
        ctx.globalAlpha = f.t > f.vida - 0.25 ? Math.max(0, (f.vida - f.t) / 0.25) : 1;
        G.fuente.texto(ctx, f.texto, f.x - cx, f.y - cy - subir - rebote, f.color, { alinear: 'centro', borde: f.borde, escala: f.escala });
      });
      ctx.globalAlpha = 1;
    },

    // Se dibuja encima de todo.
    dibujarEncima(ctx, lienzo) {
      // Líneas de acción (como en los cómics).
      if (lineasT > 0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, lineasT * 3) * 0.8;
        ctx.fillStyle = '#ffffff';
        const rnd = G.util.semilla(Math.floor(lineasT * 30) + 7);
        for (let i = 0; i < 46; i++) {
          const ang = rnd() * Math.PI * 2;
          const r0 = 60 + rnd() * 70, r1 = 260;
          const w = 0.012 + rnd() * 0.02;
          ctx.beginPath();
          ctx.moveTo(lineasX + Math.cos(ang) * r0, lineasY + Math.sin(ang) * r0);
          ctx.lineTo(lineasX + Math.cos(ang - w) * r1, lineasY + Math.sin(ang - w) * r1);
          ctx.lineTo(lineasX + Math.cos(ang + w) * r1, lineasY + Math.sin(ang + w) * r1);
          ctx.fill();
        }
        ctx.restore();
      }
      onos.forEach((o) => dibujarOno(ctx, o));
      // Colores desfasados: copias roja y azul corridas a los lados.
      if (rgbT > 0 && lienzo) {
        if (!lienzoRGB) lienzoRGB = G.util.crearLienzo(G.ANCHO, G.ALTO);
        const [c2, x2] = lienzoRGB;
        const off = Math.max(1, Math.round(rgbT * 10));
        [['#ff2a6d', -off], ['#05d9e8', off]].forEach(([col, dx]) => {
          x2.globalCompositeOperation = 'source-over';
          x2.clearRect(0, 0, G.ANCHO, G.ALTO);
          x2.drawImage(lienzo, 0, 0);
          x2.globalCompositeOperation = 'multiply';
          x2.fillStyle = col;
          x2.fillRect(0, 0, G.ANCHO, G.ALTO);
          ctx.save();
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = 0.55;
          ctx.drawImage(c2, dx, 0);
          ctx.restore();
        });
      }
      if (destelloT > 0) {
        ctx.globalAlpha = (destelloT / destelloDur) * 0.8;
        ctx.fillStyle = destelloColor;
        ctx.fillRect(0, 0, G.ANCHO, G.ALTO);
        ctx.globalAlpha = 1;
      }
    }
  };

  function dibujarOno(ctx, o) {
    const entrada = Math.min(1, o.t / 0.12);
    const salida = o.t > o.vida - 0.2 ? Math.max(0, (o.vida - o.t) / 0.2) : 1;
    const esc = Math.max(1, Math.round(o.escala * (entrada < 1 ? 0.6 + entrada * 0.6 : 1)));
    const w = G.fuente.ancho(o.texto, esc);
    const h = 9 * esc;
    const rx = w / 2 + 12 + esc * 2, ry = h / 2 + 10 + esc;
    const x = Math.round(o.x), y = Math.round(o.y - (1 - entrada) * 6);
    ctx.save();
    ctx.globalAlpha = salida;
    // estrella de puntas (globo de explosión)
    const rnd = G.util.semilla(Math.floor(o.semilla));
    const pts = [];
    for (let i = 0; i < o.puntas * 2; i++) {
      const a = (i / (o.puntas * 2)) * Math.PI * 2;
      const k = i % 2 === 0 ? 1.15 + rnd() * 0.3 : 0.72;
      pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]);
    }
    const trazar = (dx, dy) => {
      ctx.beginPath();
      pts.forEach(([px, py], i) => (i ? ctx.lineTo(px + dx, py + dy) : ctx.moveTo(px + dx, py + dy)));
      ctx.closePath();
    };
    ctx.fillStyle = o.borde;
    trazar(2, 2); ctx.fill();
    trazar(0, 0); ctx.fill();
    ctx.fillStyle = o.fondo;
    ctx.save();
    ctx.translate(x, y); ctx.scale(0.9, 0.88); ctx.translate(-x, -y);
    trazar(0, 0); ctx.fill();
    ctx.restore();
    // trama de puntos dentro
    ctx.save();
    ctx.translate(x, y); ctx.scale(0.88, 0.86); ctx.translate(-x, -y);
    trazar(0, 0); ctx.clip();
    G.pixel.trama(ctx, x - rx * 1.5, y - ry * 1.5, rx * 3, ry * 3, G.util.tono(o.fondo, -0.25), 4,
      (i, j) => 1 + Math.round(2 * Math.hypot(i - rx * 1.5, j - ry * 1.5) / (rx * 1.5)));
    ctx.restore();
    G.fuente.texto(ctx, o.texto, x, y - h / 2 + esc, o.color, { escala: esc, alinear: 'centro', borde: o.borde });
    ctx.restore();
  }

  G.fx = FX;
})();
