/* =====================================================================
   LOSETAS DEL MAPA (los cuadritos de 16x16 que forman el mundo)
   Cada "tema" (selva, cueva, palacio) pinta los mismos símbolos con
   colores y formas distintas. Los mapas se escriben con letras:

   .  suelo            ,  suelo decorado (pasto alto, musgo...)
   "  flores/hongos    :  camino
   T  árbol/columna    #  muro          ~  agua      =  puente
   r  roca             b  arbusto       v  abismo    n  cristal de neón
   h  huesos           F  fuego fijo    w  agua poco profunda (se camina)
   Cualquier otra letra es un objeto definido en la "leyenda" del mapa.
   ===================================================================== */
'use strict';

(function () {
  const P = G.pixel;
  const U = G.util;
  const T = G.TILE;

  const TEMAS = {
    selva: {
      suelo: ['#3f8f3a', '#4a9c40', '#367f33'], sueloLuz: '#6cc35a', camino: ['#b08850', '#9c7643', '#c49a5e'],
      agua: ['#2a7fb8', '#3a95cf', '#1f6798'], espuma: '#bfe9ff',
      muroCara: '#8a8f7a', muroCara2: '#6f7462', muroTope: '#4b5a3a', muroLinea: '#565a4a', musgo: '#4f8a3a',
      tronco: '#8c8a7a', tronco2: '#6b685b', copa: ['#2f7a35', '#3f9a42', '#5cbf55'], flor: ['#ff7aa2', '#ffd166', '#ffffff', '#c58cff'],
      roca: '#8b8778', abismo: '#0b1a12', neon: '#7ef2c8', hueso: '#efe6d6', puente: '#9c6b3d'
    },
    cueva: {
      suelo: ['#2a2238', '#2f263f', '#251e33'], sueloLuz: '#3b3052', camino: ['#3d3550', '#463c5c', '#352e47'],
      agua: ['#0d3b66', '#124a7d', '#0a2f52'], espuma: '#05d9e8',
      muroCara: '#2e2445', muroCara2: '#251c3a', muroTope: '#120c1e', muroLinea: '#3d2f5c', musgo: '#7b2cbf',
      tronco: '#3d3352', tronco2: '#2a2240', copa: ['#3d3352', '#4b4066', '#5c4f7a'], flor: ['#05d9e8', '#ff2a6d', '#b18cff', '#7ef2c8'],
      roca: '#4b4066', abismo: '#05020a', neon: '#05d9e8', hueso: '#d8cfe0', puente: '#5c4f7a'
    },
    templo: {
      suelo: ['#5f6656', '#676e5d', '#575e4f'], sueloLuz: '#7a8268', camino: ['#7a7560', '#857f68', '#6e6956'],
      agua: ['#2a7fb8', '#3a95cf', '#1f6798'], espuma: '#bfe9ff',
      muroCara: '#8a8f7a', muroCara2: '#6f7462', muroTope: '#2f3a26', muroLinea: '#565a4a', musgo: '#4f8a3a',
      tronco: '#8c8a7a', tronco2: '#6b685b', copa: ['#2f7a35', '#3f9a42', '#5cbf55'], flor: ['#ff7aa2', '#ffd166', '#ffffff', '#c58cff'],
      roca: '#8b8778', abismo: '#0b1a12', neon: '#7ef2c8', hueso: '#efe6d6', puente: '#9c6b3d'
    },
    palacio: {
      suelo: ['#221a2c', '#262033', '#1e1727'], sueloLuz: '#3a2d4a', camino: ['#3a2a1e', '#45321f', '#33251a'],
      agua: ['#4a0f2e', '#5c1439', '#3a0b24'], espuma: '#ff2a6d',
      muroCara: '#3a2852', muroCara2: '#2e2044', muroTope: '#110a1a', muroLinea: '#e8b64c', musgo: '#ff2a6d',
      tronco: '#4a3a5e', tronco2: '#33284a', copa: ['#e8b64c', '#ffd166', '#b8862c'], flor: ['#ff2a6d', '#e8b64c', '#05d9e8', '#b18cff'],
      roca: '#4a3a5e', abismo: '#05020a', neon: '#ff2a6d', hueso: '#efe6d6', puente: '#6b4a2a'
    }
  };

  const BLOQUEA = new Set(['T', '#', '~', 'r', 'b', 'v', 'n', 'F']);
  const ALTAS = new Set(['T', 'n', 'F', 'r', 'b']); // se dibujan ordenadas con los personajes

  function tema(t) { return TEMAS[t] || TEMAS.selva; }

  // ---------------- Suelo ----------------
  function suelo(tm, v, deco) {
    return P.memo(`suelo:${tm}:${v}:${deco}`, () => {
      const th = tema(tm);
      const [c, ctx] = P.lienzo(T, T);
      const rnd = U.semilla(v * 97 + 13 + (deco ? 500 : 0));
      ctx.fillStyle = th.suelo[0];
      ctx.fillRect(0, 0, T, T);
      for (let i = 0; i < 26; i++) {
        P.px(ctx, rnd() * T, rnd() * T, th.suelo[1 + Math.floor(rnd() * 2)]);
      }
      if (tm === 'selva') {
        for (let i = 0; i < 5; i++) { const x = rnd() * 14, y = 2 + rnd() * 13; P.px(ctx, x, y, th.sueloLuz); P.px(ctx, x + 1, y - 1, th.sueloLuz); }
      } else if (tm === 'templo') {
        ctx.fillStyle = '#4a5043';
        ctx.fillRect(0, 0, T, 1); ctx.fillRect(0, 0, 1, T); ctx.fillRect(8, 8, 8, 1); ctx.fillRect(8, 8, 1, 8);
        if (v % 3 === 0) { P.rect(ctx, 2 + v % 5, 3, 3, 1, '#4f8a3a'); P.rect(ctx, 10, 11, 2, 1, '#4f8a3a'); }
      } else if (tm === 'palacio') {
        ctx.fillStyle = '#16101e';
        ctx.fillRect(0, 0, T, 1); ctx.fillRect(0, 0, 1, T);
        if (v % 4 === 0) { ctx.fillStyle = 'rgba(232,182,76,0.25)'; ctx.fillRect(7, 7, 2, 2); }
      } else {
        for (let i = 0; i < 3; i++) { const x = rnd() * 14, y = rnd() * 14; P.rect(ctx, x, y, 2, 1, th.sueloLuz); }
      }
      return c;
    });
  }

  // Pasto alto que se mece con el viento (cuadro 0..3).
  function pastoAlto(tm, v, cuadro) {
    return P.memo(`pasto:${tm}:${v % 3}:${cuadro}`, () => {
      const th = tema(tm);
      const [c, ctx] = P.lienzo(T, T);
      ctx.drawImage(suelo(tm, v, true), 0, 0);
      const rnd = U.semilla(v * 31 + 7);
      const mece = [0, 1, 0, -1][cuadro];
      for (let i = 0; i < 7; i++) {
        const x = 1 + rnd() * 13, h = 4 + rnd() * 5, y = 6 + rnd() * 9;
        const col = tm === 'selva' ? (rnd() > 0.5 ? '#5cbf55' : '#2f6e2e') : th.musgo;
        P.linea(ctx, x, y, x + mece * (h / 5), y - h, col);
        P.px(ctx, x + mece * (h / 5), y - h, tm === 'selva' ? '#8fe07a' : th.flor[0]);
      }
      return c;
    });
  }

  function flores(tm, v, cuadro) {
    return P.memo(`flores:${tm}:${v % 4}:${cuadro % 2}`, () => {
      const th = tema(tm);
      const [c, ctx] = P.lienzo(T, T);
      ctx.drawImage(suelo(tm, v), 0, 0);
      const rnd = U.semilla(v * 53 + 3);
      for (let i = 0; i < 4; i++) {
        const x = 2 + Math.floor(rnd() * 11), y = 2 + Math.floor(rnd() * 11);
        const col = th.flor[Math.floor(rnd() * th.flor.length)];
        if (tm === 'selva' || tm === 'templo') {
          P.px(ctx, x, y + 1, '#2f6e2e');
          P.px(ctx, x - 1, y, col); P.px(ctx, x + 1, y, col); P.px(ctx, x, y - 1, col); P.px(ctx, x, y + 1, col);
          P.px(ctx, x, y, '#fff3b0');
        } else {
          // hongos brillantes
          P.rect(ctx, x, y, 1, 2, '#d8cfe0');
          P.rect(ctx, x - 1, y - 1, 3, 1, col);
          if (cuadro % 2) P.px(ctx, x, y - 2, '#ffffff');
        }
      }
      return c;
    });
  }

  function camino(tm, v) {
    return P.memo(`camino:${tm}:${v}`, () => {
      const th = tema(tm);
      const [c, ctx] = P.lienzo(T, T);
      ctx.fillStyle = th.camino[0];
      ctx.fillRect(0, 0, T, T);
      const rnd = U.semilla(v * 71 + 5);
      for (let i = 0; i < 18; i++) P.px(ctx, rnd() * T, rnd() * T, th.camino[1 + Math.floor(rnd() * 2)]);
      for (let i = 0; i < 3; i++) { const x = rnd() * 13, y = rnd() * 13; P.rect(ctx, x, y, 2, 2, th.camino[1]); P.px(ctx, x, y, th.camino[2]); }
      if (tm === 'palacio') {
        ctx.fillStyle = '#e8b64c';
        ctx.globalAlpha = 0.5;
        ctx.fillRect(0, 0, T, 1); ctx.fillRect(0, 15, T, 1);
        ctx.globalAlpha = 1;
      }
      return c;
    });
  }

  // Agua animada; los bordes (orillas) se agregan según las losetas vecinas.
  function agua(tm, cuadro, bordes, poca) {
    return P.memo(`agua:${tm}:${cuadro}:${bordes}:${poca ? 1 : 0}`, () => {
      const th = tema(tm);
      const [c, ctx] = P.lienzo(T, T);
      ctx.fillStyle = poca ? U.mezclar(th.agua[0], th.suelo[0], 0.35) : th.agua[0];
      ctx.fillRect(0, 0, T, T);
      for (let y = 0; y < T; y += 4) {
        for (let x = 0; x < T; x += 1) {
          const ola = Math.sin((x + cuadro * 2) * 0.8 + y * 1.3);
          if (ola > 0.75) P.px(ctx, x, y + ((x + cuadro) % 2), th.agua[1]);
          if (ola < -0.9) P.px(ctx, x, y + 2, th.agua[2]);
        }
      }
      if ((cuadro + 1) % 4 === 0) { P.px(ctx, 4, 5, th.espuma); P.px(ctx, 11, 11, th.espuma); }
      // bordes: bit 1 arriba, 2 abajo, 4 izquierda, 8 derecha
      ctx.fillStyle = th.espuma;
      ctx.globalAlpha = tm === 'selva' ? 0.8 : 1;
      if (bordes & 1) { ctx.fillRect(0, 0, T, 1); for (let x = (cuadro % 2); x < T; x += 3) ctx.fillRect(x, 1, 1, 1); }
      if (bordes & 2) ctx.fillRect(0, T - 1, T, 1);
      if (bordes & 4) ctx.fillRect(0, 0, 1, T);
      if (bordes & 8) ctx.fillRect(T - 1, 0, 1, T);
      ctx.globalAlpha = 1;
      if (bordes & 1) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 2, T, 2); }
      return c;
    });
  }

  function puente(tm, vertical) {
    return P.memo(`puente:${tm}:${vertical ? 1 : 0}`, () => {
      const th = tema(tm);
      const [c, ctx] = P.lienzo(T, T);
      ctx.drawImage(agua(tm, 0, 0), 0, 0);
      const madera = th.puente, oscuro = U.tono(madera, -0.35), claro = U.tono(madera, 0.25);
      if (vertical) {
        for (let y = 0; y < T; y += 4) { P.rect(ctx, 1, y, 14, 3, madera); P.rect(ctx, 1, y, 14, 1, claro); P.rect(ctx, 1, y + 3, 14, 1, oscuro); }
        P.rect(ctx, 0, 0, 1, T, oscuro); P.rect(ctx, 15, 0, 1, T, oscuro);
      } else {
        for (let x = 0; x < T; x += 4) { P.rect(ctx, x, 1, 3, 14, madera); P.rect(ctx, x, 1, 1, 14, claro); P.rect(ctx, x + 3, 1, 1, 14, oscuro); }
        P.rect(ctx, 0, 0, T, 1, oscuro); P.rect(ctx, 0, 15, T, 1, oscuro);
      }
      return c;
    });
  }

  // Muro con vista 3/4: si debajo no hay muro, se ve la "cara" tallada.
  function muro(tm, cara, v, abajoCara) {
    return P.memo(`muro:${tm}:${cara ? 1 : 0}:${v % 6}:${abajoCara ? 1 : 0}`, () => {
      const th = tema(tm);
      const [c, ctx] = P.lienzo(T, T);
      const rnd = U.semilla(v * 41 + 9);
      if (!cara) {
        ctx.fillStyle = th.muroTope;
        ctx.fillRect(0, 0, T, T);
        for (let i = 0; i < 8; i++) P.px(ctx, rnd() * T, rnd() * T, U.tono(th.muroTope, 0.12));
        return c;
      }
      ctx.fillStyle = th.muroCara;
      ctx.fillRect(0, 0, T, T);
      if (tm === 'cueva') {
        // roca irregular con vetas de neón
        for (let i = 0; i < 20; i++) P.rect(ctx, rnd() * 15, rnd() * 15, 2, 1, th.muroCara2);
        if (v % 3 === 0) { P.linea(ctx, 2, 3, 6, 9, th.musgo); P.linea(ctx, 6, 9, 5, 14, th.musgo); }
        if (v % 5 === 1) { P.linea(ctx, 12, 1, 10, 7, '#05d9e8'); }
        P.rect(ctx, 0, 0, T, 2, th.muroTope);
      } else {
        // bloques de piedra tallada
        ctx.fillStyle = th.muroLinea;
        ctx.globalAlpha = tm === 'palacio' ? 0.35 : 1;
        ctx.fillRect(0, 7, T, 1);
        ctx.fillRect(((v % 2) * 8) + 3, 0, 1, 7);
        ctx.fillRect(((v % 2) * 8) + 7, 8, 1, 8);
        ctx.globalAlpha = 1;
        ctx.fillStyle = th.muroCara2;
        ctx.fillRect(0, T - 2, T, 2);
        if ((tm === 'selva' || tm === 'templo') && v % 3 !== 2) {
          for (let i = 0; i < 5; i++) P.rect(ctx, rnd() * 14, rnd() * 4, 2, 1 + rnd() * 3, th.musgo);
        }
        if (tm === 'palacio' && v % 4 === 0) {
          // greca dorada
          ctx.fillStyle = '#e8b64c';
          ctx.fillRect(3, 3, 10, 1); ctx.fillRect(3, 3, 1, 3); ctx.fillRect(3, 5, 6, 1); ctx.fillRect(8, 5, 1, -1);
        }
        P.rect(ctx, 0, 0, T, 1, U.tono(th.muroCara, 0.2));
      }
      return c;
    });
  }

  function abismo(tm, bordeArriba) {
    return P.memo(`abismo:${tm}:${bordeArriba ? 1 : 0}`, () => {
      const th = tema(tm);
      const [c, ctx] = P.lienzo(T, T);
      ctx.fillStyle = th.abismo;
      ctx.fillRect(0, 0, T, T);
      if (bordeArriba) {
        ctx.fillStyle = U.tono(th.suelo[0], -0.3);
        ctx.fillRect(0, 0, T, 4);
        ctx.fillStyle = U.tono(th.suelo[0], -0.55);
        ctx.fillRect(0, 4, T, 3);
      }
      P.px(ctx, 5, 10, '#ffffff22');
      return c;
    });
  }

  // ---------------- Cosas altas (se ordenan con los personajes) ----------------
  function arbol(tm, v, cuadro) {
    return P.memo(`arbol:${tm}:${v % 4}:${cuadro % 4}`, () => {
      const th = tema(tm);
      const [c, ctx] = P.lienzo(24, 32);
      const rnd = U.semilla(v * 13 + 1);
      if (tm === 'palacio') {
        // columna con cabeza tallada
        P.rect(ctx, 6, 8, 12, 22, th.tronco);
        P.rect(ctx, 6, 8, 3, 22, U.tono(th.tronco, 0.2));
        P.rect(ctx, 15, 8, 3, 22, th.tronco2);
        P.rect(ctx, 4, 4, 16, 5, th.copa[2]);
        P.rect(ctx, 4, 4, 16, 1, th.copa[1]);
        P.rect(ctx, 4, 28, 16, 3, th.copa[2]);
        for (let y = 12; y < 26; y += 5) P.rect(ctx, 9, y, 6, 2, '#ff2a6d55');
        return P.contorno(c, '#0a0612');
      }
      if (tm === 'cueva') {
        // estalagmita
        P.triangulo(ctx, 12, 2, 3, 31, 21, 31, th.copa[1]);
        P.triangulo(ctx, 12, 2, 3, 31, 10, 31, th.copa[2]);
        P.triangulo(ctx, 12, 2, 16, 31, 21, 31, th.copa[0]);
        if (v % 2) { P.linea(ctx, 12, 8, 14, 22, '#05d9e8'); }
        return P.contorno(c, '#0a0612');
      }
      // árbol de selva con copa redonda que se mece
      const mece = [0, 1, 0, -1][cuadro % 4] * 0.5;
      P.rect(ctx, 10, 18, 5, 13, th.tronco);
      P.rect(ctx, 10, 18, 1, 13, U.tono(th.tronco, 0.2));
      P.rect(ctx, 13, 18, 2, 13, th.tronco2);
      P.rect(ctx, 8, 29, 9, 2, th.tronco2);
      P.elipse(ctx, 12 + mece, 12, 11, 10, th.copa[0]);
      P.elipse(ctx, 11 + mece, 10, 9, 8, th.copa[1]);
      P.elipse(ctx, 9 + mece, 7, 5, 4, th.copa[2]);
      for (let i = 0; i < 8; i++) P.px(ctx, 4 + rnd() * 16 + mece, 4 + rnd() * 14, i % 2 ? th.copa[2] : th.copa[0]);
      if (v % 3 === 0) { P.px(ctx, 15, 14, '#ff7aa2'); P.px(ctx, 6, 11, '#ffd166'); }
      return P.contorno(c, '#10240f');
    });
  }

  function roca(tm, v) {
    return P.memo(`roca:${tm}:${v % 3}`, () => {
      const th = tema(tm);
      const [c, ctx] = P.lienzo(T, T);
      P.elipse(ctx, 8, 9, 7, 6, U.tono(th.roca, -0.2));
      P.elipse(ctx, 7, 8, 6, 5, th.roca);
      P.elipse(ctx, 6, 6, 3, 2, U.tono(th.roca, 0.25));
      if (v % 3 === 1 && tm === 'selva') P.rect(ctx, 3, 4, 4, 1, '#4f8a3a');
      return P.contorno(c, '#0a0612');
    });
  }

  function arbusto(tm, v, cuadro) {
    return P.memo(`arbusto:${tm}:${v % 3}:${cuadro % 2}`, () => {
      const th = tema(tm);
      const [c, ctx] = P.lienzo(T, T);
      const m = cuadro % 2;
      P.elipse(ctx, 8, 9, 7, 6, th.copa[0]);
      P.elipse(ctx, 7 + m, 8, 5, 4, th.copa[1]);
      P.px(ctx, 5 + m, 6, th.copa[2]); P.px(ctx, 10, 8, th.copa[2]);
      if (v % 2) { P.px(ctx, 4, 10, '#ff4d6d'); P.px(ctx, 11, 6, '#ff4d6d'); }
      return P.contorno(c, '#10240f');
    });
  }

  function cristal(tm, v, cuadro) {
    return P.memo(`cristal:${tm}:${v % 3}:${cuadro % 4}`, () => {
      const [c, ctx] = P.lienzo(T, 24);
      const cols = [['#05d9e8', '#7ff6ff', '#027c88'], ['#ff2a6d', '#ff8fb1', '#8a0f38'], ['#b18cff', '#e2d4ff', '#5a3aa0']][v % 3];
      P.triangulo(ctx, 8, 2, 3, 23, 13, 23, cols[0]);
      P.triangulo(ctx, 8, 2, 3, 23, 7, 23, cols[1]);
      P.triangulo(ctx, 4, 10, 0, 23, 6, 23, cols[2]);
      P.triangulo(ctx, 12, 12, 10, 23, 16, 23, cols[0]);
      if (cuadro % 4 === 0) P.px(ctx, 7, 6, '#ffffff');
      return P.contorno(c, '#0a0612');
    });
  }

  function huesos(tm, v) {
    return P.memo(`huesos:${tm}:${v % 3}`, () => {
      const th = tema(tm);
      const [c, ctx] = P.lienzo(T, T);
      ctx.drawImage(suelo(tm, v), 0, 0);
      P.linea(ctx, 3, 11, 10, 8, th.hueso);
      P.px(ctx, 2, 10, th.hueso); P.px(ctx, 2, 12, th.hueso); P.px(ctx, 11, 7, th.hueso); P.px(ctx, 11, 9, th.hueso);
      if (v % 2) { P.elipse(ctx, 11, 12, 2, 2, th.hueso); P.px(ctx, 10, 12, '#1a0f1f'); P.px(ctx, 12, 12, '#1a0f1f'); }
      return c;
    });
  }

  // Brasero o fuego (encendido o apagado).
  function fuego(cuadro, encendido, color) {
    return P.memo(`fuego:${cuadro % 4}:${encendido ? 1 : 0}:${color || ''}`, () => {
      const [c, ctx] = P.lienzo(T, 24);
      // base de piedra
      P.rect(ctx, 3, 14, 10, 8, '#6b6070');
      P.rect(ctx, 2, 13, 12, 3, '#8a7f8f');
      P.rect(ctx, 4, 20, 8, 3, '#4a4250');
      P.rect(ctx, 5, 17, 6, 1, '#e8b64c');
      if (encendido) {
        const f = cuadro % 4;
        const col = color === 'azul' ? ['#05d9e8', '#7ff6ff', '#ffffff'] : ['#ff5d2a', '#ffb03a', '#fff3b0'];
        P.elipse(ctx, 8, 9, 4, 5 + (f % 2), col[0]);
        P.elipse(ctx, 8 + (f === 1 ? 1 : f === 3 ? -1 : 0), 9, 2, 4, col[1]);
        P.elipse(ctx, 8, 11, 1, 2, col[2]);
        P.px(ctx, 6 + f, 3 - (f % 2), col[1]);
      } else {
        P.rect(ctx, 5, 12, 6, 2, '#2a2230');
      }
      return P.contorno(c, '#0a0612');
    });
  }

  // ---------------- Objetos interactivos ----------------
  function cofre(abierto, grande) {
    return P.memo(`cofre:${abierto ? 1 : 0}:${grande ? 1 : 0}`, () => {
      const [c, ctx] = P.lienzo(T, T);
      const m = grande ? '#5c1f2a' : '#8a4b22', m2 = grande ? '#3d1018' : '#5e3014', o = grande ? '#ff2a6d' : '#ffcc4d';
      P.rect(ctx, 1, 6, 14, 9, m);
      P.rect(ctx, 1, 13, 14, 2, m2);
      P.rect(ctx, 1, 6, 1, 9, o); P.rect(ctx, 14, 6, 1, 9, o);
      if (abierto) {
        P.rect(ctx, 1, 2, 14, 4, m2);
        P.rect(ctx, 2, 6, 12, 2, '#1a0f1f');
      } else {
        P.rect(ctx, 1, 3, 14, 4, m);
        P.rect(ctx, 1, 3, 14, 1, U.tono(m, 0.25));
        P.rect(ctx, 1, 6, 14, 1, o);
        P.rect(ctx, 7, 6, 2, 3, o);
        P.px(ctx, 7, 7, '#1a0f1f');
      }
      return P.contorno(c, '#1a0f1f');
    });
  }

  function puerta(tm, tipo) {
    // tipo: 'llave' | 'jefe' | 'barrera' | 'sello'
    return P.memo(`puerta:${tm}:${tipo}`, () => {
      const th = tema(tm);
      const [c, ctx] = P.lienzo(T, T);
      ctx.drawImage(muro(tm, true, 1), 0, 0);
      if (tipo === 'barrera') {
        ctx.fillStyle = th.muroTope;
        ctx.fillRect(0, 0, T, T);
        for (let x = 1; x < T; x += 4) { P.rect(ctx, x, 0, 2, T, '#7b2cbf'); P.rect(ctx, x, 0, 1, T, '#b18cff'); }
        P.rect(ctx, 0, 6, T, 3, '#3a2852');
        P.rect(ctx, 6, 5, 4, 5, '#05d9e8');
        return c;
      }
      const madera = tipo === 'jefe' ? '#3d1018' : '#6b3d1f';
      P.rect(ctx, 2, 2, 12, 14, madera);
      P.rect(ctx, 2, 2, 12, 1, U.tono(madera, 0.3));
      for (let x = 4; x < 14; x += 3) P.rect(ctx, x, 3, 1, 13, U.tono(madera, -0.3));
      if (tipo === 'jefe') {
        P.rect(ctx, 5, 5, 6, 6, '#ff2a6d');
        P.rect(ctx, 6, 6, 4, 4, '#3d1018');
        P.rect(ctx, 7, 7, 2, 2, '#7ef2c8');
      } else if (tipo === 'sello') {
        P.elipse(ctx, 8, 9, 4, 4, '#ffcc4d');
        P.elipse(ctx, 8, 9, 2, 2, '#3fd3a8');
      } else {
        P.rect(ctx, 6, 7, 4, 5, '#ffcc4d');
        P.rect(ctx, 7, 8, 2, 2, '#1a0f1f');
        P.px(ctx, 7, 10, '#1a0f1f');
      }
      return c;
    });
  }

  function bloque(tm) {
    return P.memo(`bloque:${tm}`, () => {
      const [c, ctx] = P.lienzo(T, T);
      const base = tm === 'cueva' ? '#5c4f7a' : tm === 'palacio' ? '#5a4a6e' : '#9a9580';
      P.rect(ctx, 0, 0, T, T, U.tono(base, -0.35));
      P.rect(ctx, 1, 1, 14, 11, base);
      P.rect(ctx, 1, 1, 14, 1, U.tono(base, 0.3));
      // cara de jaguar tallada (indica que solo Ixbalanqué puede moverlo)
      P.rect(ctx, 4, 4, 2, 2, '#1a0f1f'); P.rect(ctx, 10, 4, 2, 2, '#1a0f1f');
      P.rect(ctx, 6, 8, 4, 1, '#1a0f1f');
      P.px(ctx, 3, 2, '#e0a43a'); P.px(ctx, 12, 2, '#e0a43a');
      return c;
    });
  }

  function placa(activa) {
    return P.memo(`placa:${activa ? 1 : 0}`, () => {
      const [c, ctx] = P.lienzo(T, T);
      P.rect(ctx, 2, 2, 12, 12, '#3a3040');
      P.rect(ctx, 3, 3, 10, 10, activa ? '#3fd3a8' : '#8a7f8f');
      P.rect(ctx, 3, 3, 10, 1, activa ? '#a6ffe4' : '#b0a6b5');
      P.rect(ctx, 6, 6, 4, 4, activa ? '#ffffff' : '#5c5266');
      return c;
    });
  }

  // Diana de cristal: Hunahpú la activa con su cerbatana.
  function diana(activa, cuadro) {
    return P.memo(`diana:${activa ? 1 : 0}:${cuadro % 4}`, () => {
      const [c, ctx] = P.lienzo(T, 20);
      P.rect(ctx, 6, 13, 4, 6, '#6b6070');
      P.rect(ctx, 4, 17, 8, 3, '#4a4250');
      const col = activa ? ['#3fd3a8', '#a6ffe4'] : ['#ff2a6d', '#ff8fb1'];
      const sube = [0, 1, 1, 0][cuadro % 4];
      P.elipse(ctx, 8, 7 - sube, 5, 5, col[0]);
      P.elipse(ctx, 7, 6 - sube, 2, 2, col[1]);
      P.px(ctx, 6, 5 - sube, '#ffffff');
      return P.contorno(c, '#0a0612');
    });
  }

  function altar(cuadro) {
    return P.memo(`altar:${cuadro % 4}`, () => {
      const [c, ctx] = P.lienzo(T, 24);
      P.rect(ctx, 1, 14, 14, 9, '#8a7f8f');
      P.rect(ctx, 1, 14, 14, 2, '#b0a6b5');
      P.rect(ctx, 3, 18, 10, 1, '#e8b64c');
      P.rect(ctx, 6, 17, 4, 4, '#3fd3a8');
      // llama de copal azul-verde
      const f = cuadro % 4;
      P.elipse(ctx, 8, 9, 3, 4 + (f % 2), '#3fd3a8');
      P.elipse(ctx, 8, 10, 1, 2, '#e9fff7');
      P.px(ctx, 7 + (f % 3), 3, '#a6ffe4');
      return P.contorno(c, '#0a0612');
    });
  }

  function escalera(tm, baja) {
    return P.memo(`escalera:${tm}:${baja ? 1 : 0}`, () => {
      const th = tema(tm);
      const [c, ctx] = P.lienzo(T, T);
      ctx.fillStyle = '#05020a';
      ctx.fillRect(0, 0, T, T);
      for (let i = 0; i < 4; i++) {
        const y = baja ? i * 4 : 12 - i * 4;
        P.rect(ctx, 1 + i, y, 14 - i * 2, 3, U.tono(th.muroCara, 0.1 - i * 0.12));
        P.rect(ctx, 1 + i, y, 14 - i * 2, 1, U.tono(th.muroCara, 0.3 - i * 0.12));
      }
      return c;
    });
  }

  function estela(tm) {
    return P.memo(`estela:${tm}`, () => {
      const [c, ctx] = P.lienzo(T, 24);
      const base = tm === 'cueva' ? '#4b4066' : tm === 'palacio' ? '#3a2852' : '#a39c88';
      P.rect(ctx, 3, 2, 10, 21, base);
      P.rect(ctx, 3, 2, 10, 1, U.tono(base, 0.3));
      P.rect(ctx, 2, 21, 12, 3, U.tono(base, -0.3));
      // glifos tallados
      const g = U.tono(base, -0.35);
      P.rect(ctx, 5, 5, 6, 4, g); P.rect(ctx, 6, 6, 4, 2, base); P.px(ctx, 7, 6, g);
      P.rect(ctx, 5, 11, 2, 2, g); P.rect(ctx, 9, 11, 2, 2, g); P.rect(ctx, 5, 15, 6, 1, g); P.rect(ctx, 5, 17, 6, 1, g);
      if (tm !== 'selva') { P.px(ctx, 7, 5, '#05d9e8'); P.px(ctx, 8, 12, '#05d9e8'); }
      return P.contorno(c, '#0a0612');
    });
  }

  function pilaHuesos(tomada) {
    return P.memo(`pilaHuesos:${tomada ? 1 : 0}`, () => {
      const [c, ctx] = P.lienzo(T, T);
      if (tomada) { P.elipse(ctx, 8, 12, 5, 2, '#00000055'); return c; }
      P.elipse(ctx, 8, 12, 6, 3, '#00000066');
      const h = '#efe6d6';
      P.linea(ctx, 2, 11, 12, 7, h); P.linea(ctx, 4, 6, 13, 11, h); P.linea(ctx, 7, 4, 7, 12, '#d8cfc0');
      P.elipse(ctx, 8, 9, 2, 2, h); P.px(ctx, 7, 9, '#1a0f1f'); P.px(ctx, 9, 9, '#1a0f1f');
      return P.contorno(c, '#1a0f1f');
    });
  }

  G.losetas = {
    TEMAS, BLOQUEA, ALTAS, tema,
    suelo, pastoAlto, flores, camino, agua, puente, muro, abismo,
    arbol, roca, arbusto, cristal, huesos, fuego,
    cofre, puerta, bloque, placa, diana, altar, escalera, estela, pilaHuesos
  };
})();
