/* =====================================================================
   ARTE DE LAS CRIATURAS (Gemelos del Sol 2)
   Diseños nuevos con volumen: cada criatura se arma con esferas,
   cápsulas y polígonos sombreados (ver js/juego/volumen.js), tiene
   4 cuadros de animación y ojos/marcas que brillan.
   Los jefes purificados se vuelven espíritus luminosos.
   ===================================================================== */
'use strict';

(function () {
  const V = G.volumen;
  const P = G.pixel;
  const U = G.util;
  const S = (f) => Math.sin(f / 4 * Math.PI * 2);   // onda de animación (4 cuadros)
  const C = (f) => Math.cos(f / 4 * Math.PI * 2);
  const NEON = '#b18cff';

  const FORMAS = {
    // -------------------------------- MURCIÉLAGO --------------------------------
    murcielago: {
      w: 44, h: 32, cuadros: 4,
      paleta: { cuerpo: '#5a3a7a', ala: '#4a2a6e', hueso: '#2a1844', ojo: '#ff2a6d', diente: '#f4efe6', borde: NEON },
      dibujar(ctx, f, c) {
        const alas = S(f) * 9;
        const op = { borde: c.borde };
        // alas: membrana con "dedos"
        [[-1, 4], [1, 40]].forEach(([s, xp]) => {
          const yPunta = 8 - alas;
          const pts = [[22, 14], [22 + s * 8, 9 - alas * 0.5], [xp, yPunta], [22 + s * 15, 19 + alas * 0.2], [22 + s * 11, 17], [22 + s * 7, 21]];
          V.poligono(ctx, pts, c.ala, { luz: 0.5 });
          P.linea(ctx, 22 + s * 4, 13, xp, yPunta, c.hueso);
          P.linea(ctx, 22 + s * 6, 13, 22 + s * 15, 19 + alas * 0.2, c.hueso);
          P.linea(ctx, 22 + s * 5, 14, 22 + s * 11, 17, c.hueso);
        });
        V.esfera(ctx, 22, 19, 5, 6, c.cuerpo, op);
        V.esfera(ctx, 22, 11, 5, 4, c.cuerpo, op);
        V.poligono(ctx, [[18, 9], [17, 2], [21, 8]], c.cuerpo);
        V.poligono(ctx, [[26, 9], [27, 2], [23, 8]], c.cuerpo);
        V.capsula(ctx, 20, 25, 19, 29, 1, 1, c.hueso);
        V.capsula(ctx, 24, 25, 25, 29, 1, 1, c.hueso);
        ctx.fillStyle = c.diente; ctx.fillRect(20, 14, 1, 2); ctx.fillRect(23, 14, 1, 2);
      },
      brillo(ctx, f, c) { V.brilla(ctx, 19, 10, c.ojo, 2); V.brilla(ctx, 24, 10, c.ojo, 2); }
    },
    // -------------------------------- JAGUAR --------------------------------
    jaguar: {
      w: 52, h: 34, cuadros: 4,
      paleta: { cuerpo: '#3b2a55', vientre: '#5a4878', mancha: '#05d9e8', ojo: '#ffd166', borde: '#ff2a6d' },
      dibujar(ctx, f, c) {
        const p = S(f) * 2.5, q = C(f) * 1;
        const op = { borde: c.borde };
        // cola ondulada
        for (let i = 0; i < 6; i++) V.capsula(ctx, 10 - i * 1.5, 14 - i * 1.2 + Math.sin(i + f) * 1.5, 8 - i * 1.5, 12 - i * 1.4 + Math.sin(i + 1 + f) * 1.5, 2, 2, c.cuerpo);
        // patas de atrás
        V.capsula(ctx, 14, 20, 12 + p, 31, 3, 2, U.tono(c.cuerpo, -0.15));
        V.capsula(ctx, 36, 20, 38 - p, 31, 3, 2, U.tono(c.cuerpo, -0.15));
        // cuerpo
        V.capsula(ctx, 15, 17 + q * 0.3, 35, 16, 8, 8, c.cuerpo, op);
        V.esfera(ctx, 25, 21, 9, 4, c.vientre);
        // patas de adelante
        V.capsula(ctx, 18, 21, 17 - p, 31, 3, 2, c.cuerpo);
        V.capsula(ctx, 33, 21, 34 + p, 31, 3, 2, c.cuerpo);
        // cabeza
        V.esfera(ctx, 42, 12 + q * 0.5, 7, 6, c.cuerpo, op);
        V.esfera(ctx, 47, 15 + q * 0.5, 4, 3, c.vientre);
        V.poligono(ctx, [[37, 8], [38, 3], [41, 7]], c.cuerpo);
        V.poligono(ctx, [[43, 6], [46, 2], [46, 7]], c.cuerpo);
        ctx.fillStyle = '#f4efe6'; ctx.fillRect(48, 17, 1, 2); ctx.fillRect(46, 17, 1, 2);
      },
      brillo(ctx, f, c) {
        // rosetas que brillan como estrellas
        [[14, 13], [19, 11], [24, 13], [29, 11], [33, 14], [21, 17], [28, 17]].forEach(([x, y], i) => {
          const on = (i + f) % 4 !== 0;
          ctx.fillStyle = on ? c.mancha : U.tono(c.mancha, -0.5);
          ctx.fillRect(x, y, 2, 1); ctx.fillRect(x - 1, y + 1, 1, 1); ctx.fillRect(x + 2, y + 1, 1, 1);
        });
        V.brilla(ctx, 44, 10 + C(f) * 0.5, c.ojo, 2);
      }
    },
    // -------------------------------- GUERRERO ESQUELETO --------------------------------
    esqueleto: {
      w: 36, h: 48, cuadros: 4,
      paleta: { hueso: '#e8dfd0', madera: '#7a4b2a', obsidiana: '#2a1d3d', escudo: '#c4302b', pluma: '#3fd3a8', ojo: '#05d9e8', tela: '#8a3b2a', borde: NEON },
      dibujar(ctx, f, c) {
        const b = Math.round(S(f)), sw = S(f) * 2;
        const op = { borde: c.borde };
        // tocado de plumas
        [[-6, -9], [-2, -11], [2, -11], [6, -9]].forEach(([dx, dy], i) => V.poligono(ctx, [[17 + dx * 0.5, 8 + b], [17 + dx - 1, 8 + dy + b], [17 + dx + 2, 8 + dy + 1 + b]], i % 2 ? c.pluma : c.escudo));
        // piernas
        V.capsula(ctx, 14, 31 + b, 13, 46, 2, 1.5, c.hueso);
        V.capsula(ctx, 20, 31 + b, 21, 46, 2, 1.5, c.hueso);
        V.esfera(ctx, 13, 46, 3, 1, c.hueso); V.esfera(ctx, 22, 46, 3, 1, c.hueso);
        // taparrabo
        V.poligono(ctx, [[11, 28 + b], [24, 28 + b], [21, 36 + b], [14, 36 + b]], c.tela);
        // columna y costillas
        V.capsula(ctx, 17, 15 + b, 17, 29 + b, 1.5, 1.5, c.hueso);
        for (let i = 0; i < 4; i++) {
          const y = 17 + i * 3 + b;
          V.capsula(ctx, 12 + i * 0.5, y, 22 - i * 0.5, y, 1, 1, c.hueso);
        }
        // brazo con escudo (chimalli)
        V.capsula(ctx, 12, 17 + b, 8, 25 + b, 1.5, 1.5, c.hueso);
        V.esfera(ctx, 7, 25 + b, 6, 7, c.escudo, op);
        V.esfera(ctx, 7, 25 + b, 3, 4, U.tono(c.escudo, 0.25));
        [[3, 33], [7, 34], [11, 33]].forEach(([x, y]) => V.poligono(ctx, [[x - 1, y + b - 1], [x + 1, y + b - 1], [x, y + b + 4]], c.pluma));
        // brazo con macuahuitl (garrote con filos de obsidiana)
        V.capsula(ctx, 22, 17 + b, 27, 23 + b, 1.5, 1.5, c.hueso);
        const cx = 28 + sw, cy = 22 + b;
        V.capsula(ctx, cx, cy, cx + 1, cy - 18, 2, 2.5, c.madera);
        for (let i = 0; i < 6; i++) {
          const y = cy - 3 - i * 3;
          V.poligono(ctx, [[cx - 2, y], [cx - 4, y - 1], [cx - 2, y - 2]], c.obsidiana);
          V.poligono(ctx, [[cx + 3, y], [cx + 5, y - 1], [cx + 3, y - 2]], c.obsidiana);
        }
        // cráneo
        V.esfera(ctx, 17, 9 + b, 6, 6, c.hueso, op);
        V.esfera(ctx, 17, 14 + b, 4, 2, U.tono(c.hueso, -0.15));
        ctx.fillStyle = '#1a0f1f';
        ctx.fillRect(13, 8 + b, 3, 3); ctx.fillRect(19, 8 + b, 3, 3); ctx.fillRect(16, 12 + b, 2, 1);
        for (let x = 14; x < 21; x += 2) ctx.fillRect(x, 15 + b, 1, 1);
      },
      brillo(ctx, f, c) { const b = Math.round(S(f)); V.brilla(ctx, 14, 9 + b, c.ojo, 1); V.brilla(ctx, 20, 9 + b, c.ojo, 1); }
    },
    // -------------------------------- BÚHO --------------------------------
    buho: {
      w: 38, h: 40, cuadros: 4,
      paleta: { pluma: '#7a6a8a', pecho: '#c4b8cf', disco: '#a89bb5', ojo: '#ffd166', pico: '#e8b64c', borde: NEON },
      dibujar(ctx, f, c) {
        const abre = Math.max(0, S(f)) * 6;
        const op = { borde: c.borde };
        // alas (se abren un poco)
        V.poligono(ctx, [[10, 16], [3 - abre, 26 + abre * 0.3], [8, 34], [13, 30]], U.tono(c.pluma, -0.2));
        V.poligono(ctx, [[28, 16], [35 + abre, 26 + abre * 0.3], [30, 34], [25, 30]], U.tono(c.pluma, -0.2));
        // cuerpo esponjoso
        V.esfera(ctx, 19, 25, 11, 12, c.pluma, op);
        V.esfera(ctx, 19, 28, 7, 8, c.pecho);
        // plumas del pecho (escamas)
        for (let y = 23; y < 35; y += 3) for (let x = 14 + (y % 2); x < 25; x += 3) { ctx.fillStyle = U.tono(c.pecho, -0.3); ctx.fillRect(x, y, 2, 1); }
        // cabeza y disco facial
        V.esfera(ctx, 19, 11, 11, 9, c.pluma, op);
        V.esfera(ctx, 14, 11, 5, 5, c.disco);
        V.esfera(ctx, 24, 11, 5, 5, c.disco);
        // penachos
        V.poligono(ctx, [[10, 6], [6, -1], [13, 4]], U.tono(c.pluma, -0.25));
        V.poligono(ctx, [[28, 6], [32, -1], [25, 4]], U.tono(c.pluma, -0.25));
        // ojos grandes
        V.esfera(ctx, 14, 11, 3, 3, c.ojo);
        V.esfera(ctx, 24, 11, 3, 3, c.ojo);
        V.poligono(ctx, [[17, 14], [21, 14], [19, 19]], c.pico);
        // patas
        V.capsula(ctx, 16, 36, 15, 39, 1, 1, c.pico); V.capsula(ctx, 22, 36, 23, 39, 1, 1, c.pico);
      },
      brillo(ctx, f, c) {
        const parpadea = f === 3;
        ctx.fillStyle = '#1a0f1f';
        if (parpadea) { ctx.fillRect(12, 11, 5, 1); ctx.fillRect(22, 11, 5, 1); return; }
        ctx.fillRect(14, 10, 2, 3); ctx.fillRect(24, 10, 2, 3);
        V.brilla(ctx, 14, 10, '#ffffff', 1); V.brilla(ctx, 24, 10, '#ffffff', 1);
      }
    },

    // ================================ JEFES ================================
    // Vucub Caquix: la guacamaya que se creía el sol.
    guacamaya: {
      w: 76, h: 66, cuadros: 4,
      paleta: { rojo: '#d62839', azul: '#2e86de', amarillo: '#ffcc4d', verde: '#2ec27e', pico: '#e8e8f0', cara: '#f4efe6', joya: '#3fd3a8', rama: '#6b4a2a', ojo: '#e8f4ff', borde: '#ffd166' },
      dibujar(ctx, f, c) {
        const a = S(f) * 7;
        const op = { borde: c.borde };
        // rama
        V.capsula(ctx, 4, 58, 72, 57, 3, 3, c.rama);
        // cola larga
        V.poligono(ctx, [[34, 42], [30, 66], [36, 66]], c.azul);
        V.poligono(ctx, [[37, 42], [37, 66], [43, 66]], c.rojo);
        V.poligono(ctx, [[36, 42], [33, 66], [39, 66]], c.amarillo);
        // alas en capas (rojo, amarillo, verde, azul)
        [[-1, 10], [1, 66]].forEach(([s, xp]) => {
          const capas = [[c.azul, 0], [c.verde, 5], [c.amarillo, 10], [c.rojo, 16]];
          capas.forEach(([col, k]) => {
            V.poligono(ctx, [[38, 22], [xp - s * k, 6 + k - a], [38 + s * (20 - k * 0.6), 34 - k * 0.3], [38 + s * 4, 36]], col, { luz: 0.6 - k * 0.01 });
          });
          for (let k = 0; k < 4; k++) P.linea(ctx, 38 + s * 4, 26, xp - s * (k * 5), 8 + k * 5 - a, U.tono(c.azul, -0.5));
        });
        // cuerpo
        V.esfera(ctx, 38, 36, 10, 14, c.rojo, op);
        V.esfera(ctx, 39, 40, 5, 8, U.tono(c.rojo, -0.1));
        // patas
        V.capsula(ctx, 34, 48, 33, 56, 2, 1.5, '#5a5060'); V.capsula(ctx, 42, 48, 43, 56, 2, 1.5, '#5a5060');
        // cabeza
        V.esfera(ctx, 38, 17, 9, 9, c.rojo, op);
        V.esfera(ctx, 42, 17, 5, 6, c.cara);
        for (let i = 0; i < 3; i++) P.linea(ctx, 40, 14 + i * 3, 45, 14 + i * 3, U.tono(c.cara, -0.25));
        // pico curvo con dientes de piedras preciosas
        V.poligono(ctx, [[46, 14], [55, 17], [53, 24], [47, 26], [45, 20]], c.pico, { luz: 0.75 });
        V.poligono(ctx, [[46, 21], [51, 24], [46, 27]], U.tono(c.pico, -0.35));
        // collar de jade
        for (let x = 30; x <= 46; x += 3) V.esfera(ctx, x, 25 + Math.abs(x - 38) * 0.12, 1, 1, c.joya);
      },
      brillo(ctx, f, c) {
        V.brilla(ctx, 42, 15, c.ojo, 2);
        [[49, 22], [51, 21], [52, 19]].forEach(([x, y], i) => V.brilla(ctx, x, y, (i + f) % 2 ? c.joya : '#ffffff', 1));
      }
    },
    // Camazotz: el murciélago de la muerte, señor de la Casa de los Murciélagos.
    camazotz: {
      w: 76, h: 66, cuadros: 4,
      paleta: { piel: '#3d1f4a', ala: '#2a1240', vena: '#ff2a6d', pelo: '#5a3070', hueso: '#e8dfd0', obsidiana: '#14101f', ojo: '#ff2a6d', oro: '#e8b64c', borde: '#05d9e8' },
      dibujar(ctx, f, c) {
        const a = S(f) * 6;
        const op = { borde: c.borde };
        // alas inmensas con venas de neón
        [[-1, 2], [1, 74]].forEach(([s, xp]) => {
          const pts = [[38, 22], [38 + s * 12, 8 - a * 0.5], [xp, 4 - a], [xp - s * 4, 30], [38 + s * 26, 36 + a * 0.2], [38 + s * 18, 40], [38 + s * 10, 46]];
          V.poligono(ctx, pts, c.ala, { luz: 0.45 });
          [[xp, 4 - a], [xp - s * 4, 30], [38 + s * 26, 36], [38 + s * 18, 40]].forEach(([x, y]) => P.linea(ctx, 38 + s * 9, 20, x, y, c.vena));
        });
        // piernas
        V.capsula(ctx, 33, 46, 31, 62, 3, 2, c.piel); V.capsula(ctx, 43, 46, 45, 62, 3, 2, c.piel);
        // cuerpo musculoso con pelaje
        V.esfera(ctx, 38, 36, 11, 13, c.pelo, op);
        V.esfera(ctx, 38, 38, 7, 8, c.piel);
        // faja y pectoral de oro
        V.capsula(ctx, 28, 45, 48, 45, 2, 2, c.oro);
        V.esfera(ctx, 38, 29, 5, 2, c.oro);
        // brazo con cuchillo de pedernal
        V.capsula(ctx, 47, 30, 55, 38 + a * 0.3, 2.5, 2, c.piel);
        V.poligono(ctx, [[54, 38 + a * 0.3], [62, 30 + a * 0.3], [60, 40 + a * 0.3]], c.obsidiana, { luz: 0.8 });
        // cabeza de murciélago con orejas enormes y hoja nasal
        V.poligono(ctx, [[31, 14], [26, -1], [35, 10]], c.pelo);
        V.poligono(ctx, [[45, 14], [50, -1], [41, 10]], c.pelo);
        V.esfera(ctx, 38, 16, 8, 8, c.pelo, op);
        V.poligono(ctx, [[36, 15], [38, 9], [40, 15]], c.piel, { luz: 0.7 });
        V.esfera(ctx, 38, 20, 4, 2, c.piel);
        ctx.fillStyle = c.hueso; ctx.fillRect(35, 21, 1, 3); ctx.fillRect(40, 21, 1, 3);
      },
      brillo(ctx, f, c) { V.brilla(ctx, 33, 14, c.ojo, 2); V.brilla(ctx, 41, 14, c.ojo, 2); }
    },
    // Zipacná: el gigante caimán que levanta montañas.
    gigante: {
      w: 70, h: 78, cuadros: 4,
      paleta: { piel: '#5a7a3a', vientre: '#b8b07a', roca: '#8a7e6e', nieve: '#efe6d6', pasto: '#4f8a3a', ojo: '#ffd166', diente: '#f4efe6', tela: '#8a3b2a', borde: '#ffd166' },
      dibujar(ctx, f, c) {
        const sube = Math.round((S(f) + 1) * 1.5);
        const op = { borde: c.borde };
        // montaña sobre la cabeza
        V.poligono(ctx, [[35, 0 - sube], [8, 24 - sube], [62, 24 - sube]], c.roca, { luz: 0.6 });
        V.poligono(ctx, [[35, 0 - sube], [29, 8 - sube], [41, 8 - sube]], c.nieve, { luz: 0.9 });
        for (let i = 0; i < 5; i++) V.esfera(ctx, 14 + i * 10, 23 - sube, 3, 2, c.pasto);
        // brazos sosteniendo la montaña
        V.capsula(ctx, 18, 34, 13, 22 - sube, 5, 4, c.piel);
        V.capsula(ctx, 52, 34, 57, 22 - sube, 5, 4, c.piel);
        // piernas
        V.capsula(ctx, 27, 58, 25, 74, 6, 5, U.tono(c.piel, -0.1));
        V.capsula(ctx, 43, 58, 45, 74, 6, 5, U.tono(c.piel, -0.1));
        // torso
        V.esfera(ctx, 35, 46, 17, 17, c.piel, op);
        V.esfera(ctx, 35, 50, 10, 11, c.vientre);
        for (let y = 43; y < 60; y += 3) { ctx.fillStyle = U.tono(c.vientre, -0.3); ctx.fillRect(28, y, 15, 1); }
        V.poligono(ctx, [[23, 58], [47, 58], [44, 66], [26, 66]], c.tela);
        // escamas en los hombros
        for (let x = 20; x < 52; x += 4) V.esfera(ctx, x, 32 + Math.abs(x - 35) * 0.1, 1, 1, U.tono(c.piel, 0.2));
        // cabeza de caimán
        V.esfera(ctx, 35, 29, 9, 6, c.piel, op);
        V.capsula(ctx, 30, 33, 44, 33, 4, 3, U.tono(c.piel, -0.1));
        for (let x = 31; x < 44; x += 2) { ctx.fillStyle = c.diente; ctx.fillRect(x, 35, 1, 2); }
      },
      brillo(ctx, f, c) { V.brilla(ctx, 30, 26, c.ojo, 2); V.brilla(ctx, 39, 26, c.ojo, 2); }
    },
    // Ixbalanqué bajo el Sello de Camazotz (mismo cuerpo del héroe, oscurecido).
    poseido: {
      w: 18, h: 27, cuadros: 4, sinVolumen: true,
      paleta: {},
      dibujar(ctx, f) {
        const img = G.arte.personaje('ixbalanque', 1, f % 2 ? 0 : 0);
        ctx.drawImage(img, 1, 1 + (f === 1 ? 1 : 0));
        // sombra de la posesión sobre el cuerpo
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(60,20,110,0.55)';
        ctx.fillRect(0, 0, 18, 27);
        ctx.globalCompositeOperation = 'source-over';
        // venas del sello
        ctx.fillStyle = '#b18cff';
        [[6, 15], [7, 16], [10, 14], [11, 17], [8, 19]].forEach(([x, y]) => ctx.fillRect(x, y + (f === 1 ? 1 : 0), 1, 1));
      },
      brillo(ctx, f) { const b = f === 1 ? 1 : 0; V.brilla(ctx, 5, 9 + b, '#e040ff', 1); V.brilla(ctx, 9, 9 + b, '#e040ff', 1); }
    },
    // Avatar de la Noche Eterna: Hun Camé y Vucub Camé fusionados.
    avatar: {
      w: 80, h: 76, cuadros: 4,
      paleta: { manto: '#1d1330', estrella: '#ffffff', mascaraA: '#e8dfd0', mascaraB: '#efe0c8', a: '#05d9e8', b: '#ff2a6d', oro: '#e8b64c', jade: '#3fd3a8', borde: '#e040ff' },
      dibujar(ctx, f, c) {
        const r = S(f) * 2;
        const op = { borde: c.borde };
        // corona de plumas en dos colores
        for (let i = -4; i <= 4; i++) {
          const col = i < 0 ? c.a : i > 0 ? c.b : c.oro;
          V.poligono(ctx, [[40 + i * 3, 14], [40 + i * 7 - 2, 0 + Math.abs(i) * 2 - r], [40 + i * 7 + 2, 1 + Math.abs(i) * 2 - r]], col, { luz: 0.6 });
        }
        // manto cósmico
        V.poligono(ctx, [[40, 18], [6, 76], [74, 76]], c.manto, { luz: 0.35 });
        // cuatro brazos con bastones
        [[-1, 14], [1, 66]].forEach(([s, x]) => {
          V.capsula(ctx, 40 + s * 10, 28, x, 40 + r * s, 3, 2.5, '#2a2045');
          V.capsula(ctx, 40 + s * 12, 40, x + s * 4, 56 - r * s, 3, 2.5, '#2a2045');
          V.capsula(ctx, x, 20 + r * s, x, 64 + r * s, 1.5, 1.5, c.oro);
          V.esfera(ctx, x, 19 + r * s, 3, 3, s < 0 ? c.mascaraA : c.mascaraB);
        });
        // dos máscaras-rostro: Uno Muerte (izquierda) y Siete Muerte (derecha)
        V.esfera(ctx, 33, 22, 7, 7, c.mascaraA, op);
        V.esfera(ctx, 47, 22, 7, 7, c.mascaraB, op);
        ctx.fillStyle = '#1a0f1f';
        [[29, 20], [34, 20], [43, 20], [48, 20]].forEach(([x, y]) => ctx.fillRect(x, y, 3, 3));
        for (let x = 30; x < 37; x += 2) ctx.fillRect(x, 27, 1, 1);
        for (let x = 44; x < 51; x += 2) ctx.fillRect(x, 27, 1, 1);
        // pectoral de jade y oro
        V.esfera(ctx, 40, 34, 8, 3, c.oro);
        V.esfera(ctx, 40, 34, 5, 2, c.jade);
      },
      brillo(ctx, f, c) {
        // estrellas que titilan en el manto
        for (let i = 0; i < 26; i++) {
          const x = 14 + (i * 37) % 52, y = 36 + (i * 23) % 38;
          if ((i + f) % 3 === 0) continue;
          if (Math.abs(x - 40) > (y - 18) * 0.58) continue;
          ctx.fillStyle = i % 5 ? '#9b8fb0' : c.estrella;
          ctx.fillRect(x, y, 1, 1);
        }
        [[30, 21], [35, 21]].forEach(([x, y]) => V.brilla(ctx, x, y, c.a, 1));
        [[44, 21], [49, 21]].forEach(([x, y]) => V.brilla(ctx, x, y, c.b, 1));
      }
    },
    // Señores de Xibalbá (para las escenas de cómic)
    senor: {
      w: 44, h: 62, cuadros: 4,
      paleta: { manto: '#3a1f5c', mascara: '#e8dfd0', pluma: '#7b2cbf', pluma2: '#05d9e8', jade: '#3fd3a8', oro: '#e8b64c', ojo: '#ff2a6d', borde: '#05d9e8' },
      dibujar(ctx, f, c) {
        const r = S(f);
        for (let i = -3; i <= 3; i++) V.poligono(ctx, [[22, 13], [22 + i * 6 - 2, 1 + Math.abs(i) * 2 - r], [22 + i * 6 + 2, 2 + Math.abs(i) * 2 - r]], i % 2 ? c.pluma : c.pluma2);
        V.poligono(ctx, [[22, 20], [4, 61], [40, 61]], c.manto, { luz: 0.45 });
        V.capsula(ctx, 37, 10 + r, 37, 58 + r, 1.5, 1.5, c.oro);
        V.esfera(ctx, 37, 9 + r, 3, 3, c.mascara);
        V.esfera(ctx, 22, 28, 7, 3, c.oro); V.esfera(ctx, 22, 28, 4, 2, c.jade);
        V.esfera(ctx, 22, 18, 7, 7, c.mascara, { borde: c.borde });
        ctx.fillStyle = '#1a0f1f'; ctx.fillRect(18, 16, 3, 3); ctx.fillRect(24, 16, 3, 3);
        V.esfera(ctx, 14, 19, 2, 2, c.jade); V.esfera(ctx, 30, 19, 2, 2, c.jade);
      },
      brillo(ctx, f, c) { V.brilla(ctx, 19, 17, c.ojo, 1); V.brilla(ctx, 25, 17, c.ojo, 1); }
    },
    // Aliados (bestiario)
    colibriGrande: { w: 24, h: 16, cuadros: 1, sinVolumen: true, paleta: {}, dibujar(ctx) { ctx.drawImage(G.arte.colibri(0), 0, 0, 12, 8, 0, 0, 24, 16); } },
    aluxGrande: { w: 12, h: 12, cuadros: 1, sinVolumen: true, paleta: {}, dibujar(ctx) { ctx.drawImage(G.arte.alux(1), 0, 0); } },
    abuelaGrande: { w: 16, h: 25, cuadros: 1, sinVolumen: true, paleta: {}, dibujar(ctx) { ctx.drawImage(G.arte.personaje('abuela', 0, 0), 0, 0); } }
  };

  // Dibujo final de una criatura (con borde de color y brillos) para un cuadro.
  G.arte.criatura = function (id, cuadro, op) {
    const c = G.mundos.criatura(id);
    const forma = FORMAS[c ? c.arte : id];
    if (!forma) return null;
    const f = (cuadro || 0) % forma.cuadros;
    const espiritu = op && op.espiritu;
    return P.memo(`criatura2:${id}:${f}:${espiritu ? 1 : 0}`, () => {
      const pal = Object.assign({}, forma.paleta, (c && c.paleta) || {});
      const [cv, ctx] = P.lienzo(forma.w + 2, forma.h + 2);
      ctx.translate(1, 1);
      forma.dibujar(ctx, f, pal);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      let final = forma.sinVolumen ? P.contorno(cv, '#0a0612') : V.contorno(cv);
      const fctx = final.getContext('2d');
      fctx.translate(1, 1);
      forma.brillo && forma.brillo(fctx, f, pal);
      fctx.setTransform(1, 0, 0, 1, 0, 0);
      if (espiritu) final = V.espiritu(final, c && c.colorEspiritu);
      return final;
    });
  };
  G.arte.FORMAS = FORMAS;
})();
