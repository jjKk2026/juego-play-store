/* =====================================================================
   CRIATURAS DEL MUNDO MAYA (Popol Vuh)
   Cada criatura tiene:
   - estadísticas (vida, fuerza, defensa, magia, velocidad, experiencia),
   - debilidades y resistencias (fuego, agua, tierra, viento),
   - ataques, objetos que puede soltar,
   - su texto del bestiario (datos reales y breves) y su dibujo.
   Los seres del inframundo son señores poderosos, no caricaturas.
   ===================================================================== */
'use strict';

(function () {
  const P = G.pixel;
  const U = G.util;

  // ------------------------------------------------------------------
  // DIBUJOS (se pintan con formas simples y luego se les pone borde)
  // ------------------------------------------------------------------
  const FORMAS = {
    murcielago: {
      w: 26, h: 18, cuadros: 2,
      paleta: { cuerpo: '#4b2a6e', cuerpo2: '#2e1747', ala: '#6a3d99', ala2: '#3a1f5c', ojo: '#ff2a6d', diente: '#ffffff' },
      dibujar(ctx, f, c) {
        const arriba = f === 0;
        // alas
        const yAla = arriba ? 1 : 14;
        P.triangulo(ctx, 13, 7, 1, yAla, 9, 12, c.ala);
        P.triangulo(ctx, 13, 7, 25, yAla, 17, 12, c.ala);
        P.triangulo(ctx, 13, 8, 4, yAla + (arriba ? 4 : -2), 9, 12, c.ala2);
        P.triangulo(ctx, 13, 8, 22, yAla + (arriba ? 4 : -2), 17, 12, c.ala2);
        // cuerpo y cabeza
        P.elipse(ctx, 13, 10, 3, 4, c.cuerpo);
        P.elipse(ctx, 13, 6, 3, 3, c.cuerpo);
        P.triangulo(ctx, 10, 5, 10, 1, 12, 4, c.cuerpo2);
        P.triangulo(ctx, 16, 5, 16, 1, 14, 4, c.cuerpo2);
        P.px(ctx, 11, 6, c.ojo); P.px(ctx, 15, 6, c.ojo);
        P.px(ctx, 12, 8, c.diente); P.px(ctx, 14, 8, c.diente);
      }
    },
    jaguar: {
      w: 30, h: 20, cuadros: 2,
      paleta: { cuerpo: '#2b1d3d', cuerpo2: '#1d1330', mancha: '#05d9e8', ojo: '#ffd166', vientre: '#3b2a55' },
      dibujar(ctx, f, c) {
        const p = f === 0 ? 0 : 1;
        // cola
        P.linea(ctx, 6, 9, 2, 4 + p, c.cuerpo, 2);
        P.px(ctx, 1, 3 + p, c.mancha);
        // patas
        P.rect(ctx, 8 + p, 13, 3, 6, c.cuerpo2); P.rect(ctx, 19 - p, 13, 3, 6, c.cuerpo2);
        P.rect(ctx, 11 - p, 13, 3, 6, c.cuerpo); P.rect(ctx, 22 + p, 13, 3, 6, c.cuerpo);
        // cuerpo
        P.elipse(ctx, 15, 10, 10, 5, c.cuerpo);
        P.rect(ctx, 9, 13, 12, 2, c.vientre);
        // cabeza
        P.elipse(ctx, 25, 7, 5, 4, c.cuerpo);
        P.rect(ctx, 26, 8, 4, 3, c.cuerpo);
        P.px(ctx, 22, 3, c.cuerpo); P.px(ctx, 27, 3, c.cuerpo);
        P.px(ctx, 22, 2, c.cuerpo2); P.px(ctx, 27, 2, c.cuerpo2);
        P.rect(ctx, 26, 6, 2, 1, c.ojo);
        P.px(ctx, 29, 10, '#ffffff');
        // manchas (rosetas) que brillan
        [[9, 8], [13, 7], [17, 9], [12, 11], [20, 7], [16, 12], [23, 10]].forEach(([x, y]) => {
          P.px(ctx, x, y, c.mancha); P.px(ctx, x + 1, y, c.mancha);
        });
      }
    },
    esqueleto: {
      w: 22, h: 28, cuadros: 2,
      paleta: { hueso: '#e8dfd0', hueso2: '#b8ad9c', ojo: '#05d9e8', obsidiana: '#1d1330', madera: '#7a4b2a', escudo: '#c4302b', pluma: '#3fd3a8' },
      dibujar(ctx, f, c) {
        const s = f === 0 ? 0 : 1;
        // escudo (chimalli) con plumas
        P.elipse(ctx, 5, 15, 4, 5, c.escudo);
        P.elipse(ctx, 5, 15, 2, 3, U.tono(c.escudo, 0.3));
        P.px(ctx, 2, 21, c.pluma); P.px(ctx, 5, 21, c.pluma); P.px(ctx, 8, 21, c.pluma);
        // cráneo
        P.elipse(ctx, 11, 5, 4, 4, c.hueso);
        P.rect(ctx, 9, 8, 5, 2, c.hueso2);
        P.rect(ctx, 9, 4, 2, 2, '#1a0f1f'); P.rect(ctx, 12, 4, 2, 2, '#1a0f1f');
        P.px(ctx, 9, 4, c.ojo); P.px(ctx, 13, 4, c.ojo);
        P.px(ctx, 10, 9, '#1a0f1f'); P.px(ctx, 12, 9, '#1a0f1f');
        // tocado de plumas
        P.linea(ctx, 9, 1, 7, -2, c.pluma); P.linea(ctx, 13, 1, 15, -2, c.pluma);
        // costillas
        P.rect(ctx, 10, 11, 2, 9, c.hueso2);
        for (let y = 12; y < 18; y += 2) P.rect(ctx, 8, y, 6, 1, c.hueso);
        // brazos y garrote macuahuitl con filos de obsidiana
        P.linea(ctx, 13, 12, 17, 15 - s, c.hueso);
        P.rect(ctx, 16, 2 + s, 2, 14, c.madera);
        for (let y = 3 + s; y < 14 + s; y += 2) { P.px(ctx, 15, y, c.obsidiana); P.px(ctx, 18, y, c.obsidiana); }
        P.linea(ctx, 8, 12, 6, 14, c.hueso);
        // piernas
        P.rect(ctx, 9, 20, 2, 7, c.hueso); P.rect(ctx, 12, 20, 2, 7, c.hueso);
        P.rect(ctx, 8 - s, 26, 3, 2, c.hueso2); P.rect(ctx, 12 + s, 26, 3, 2, c.hueso2);
        P.rect(ctx, 8, 19, 7, 2, c.escudo);
      }
    },
    buho: {
      w: 22, h: 22, cuadros: 2,
      paleta: { pluma: '#6b5a7a', pluma2: '#4a3d58', pecho: '#a89bb5', ojo: '#ffd166', pupila: '#1a0f1f', pico: '#e8b64c' },
      dibujar(ctx, f, c) {
        const abre = f === 1;
        if (abre) {
          P.triangulo(ctx, 6, 9, 0, 16, 7, 17, c.pluma2);
          P.triangulo(ctx, 16, 9, 22, 16, 15, 17, c.pluma2);
        }
        P.elipse(ctx, 11, 13, 7, 8, c.pluma);
        P.elipse(ctx, 11, 15, 4, 5, c.pecho);
        for (let y = 12; y < 19; y += 2) { P.px(ctx, 9, y, c.pluma2); P.px(ctx, 13, y + 1, c.pluma2); }
        P.elipse(ctx, 11, 7, 7, 5, c.pluma);
        // penachos
        P.triangulo(ctx, 5, 4, 3, -1, 8, 3, c.pluma2);
        P.triangulo(ctx, 17, 4, 19, -1, 14, 3, c.pluma2);
        // ojos grandes
        P.elipse(ctx, 8, 7, 2, 2, c.ojo); P.elipse(ctx, 14, 7, 2, 2, c.ojo);
        P.px(ctx, 8, 7, c.pupila); P.px(ctx, 14, 7, c.pupila);
        P.triangulo(ctx, 10, 9, 12, 9, 11, 12, c.pico);
        // patas
        P.rect(ctx, 8, 20, 2, 2, c.pico); P.rect(ctx, 12, 20, 2, 2, c.pico);
        // alas plegadas
        if (!abre) { P.elipse(ctx, 5, 14, 2, 5, c.pluma2); P.elipse(ctx, 17, 14, 2, 5, c.pluma2); }
      }
    },
    // ----------------------------- JEFES -----------------------------
    guacamaya: {
      w: 72, h: 60, cuadros: 2,
      paleta: { rojo: '#d62839', rojo2: '#9b1d2b', amarillo: '#ffcc4d', azul: '#2e86de', azul2: '#1b4f8a', pico: '#e8e8f0', pico2: '#a8a8b8', ojo: '#e8e8f0', joya: '#3fd3a8', rama: '#6b4a2a' },
      dibujar(ctx, f, c) {
        const alto = f === 0;
        // rama
        P.rect(ctx, 6, 50, 60, 4, c.rama);
        P.rect(ctx, 6, 50, 60, 1, U.tono(c.rama, 0.3));
        // cola larga
        P.triangulo(ctx, 34, 38, 28, 60, 36, 60, c.rojo2);
        P.triangulo(ctx, 36, 38, 36, 60, 44, 60, c.azul2);
        P.triangulo(ctx, 35, 38, 32, 60, 40, 60, c.rojo);
        // alas abiertas
        const ya = alto ? 4 : 16;
        [[-1, 14], [1, 58]].forEach(([s, xp]) => {
          P.triangulo(ctx, 36, 22, xp, ya, 36 + s * 6, 40, c.azul2);
          P.triangulo(ctx, 36, 22, xp + s * -2, ya + 6, 36 + s * 5, 36, c.azul);
          P.triangulo(ctx, 36, 22, xp + s * -6, ya + 12, 36 + s * 4, 33, c.amarillo);
          P.triangulo(ctx, 36, 22, xp + s * -12, ya + 16, 36 + s * 3, 30, c.rojo);
        });
        // cuerpo
        P.elipse(ctx, 36, 32, 9, 13, c.rojo);
        P.elipse(ctx, 38, 34, 5, 9, c.rojo2);
        // cabeza
        P.elipse(ctx, 36, 15, 8, 8, c.rojo);
        P.elipse(ctx, 39, 15, 4, 5, '#f4efe6');
        // ojo de plata con brillo
        P.elipse(ctx, 39, 13, 2, 2, c.ojo);
        P.px(ctx, 39, 13, '#1a0f1f');
        P.px(ctx, 40, 12, '#ffffff');
        // pico curvo (dientes de piedras preciosas)
        P.triangulo(ctx, 42, 13, 50, 17, 43, 24, c.pico);
        P.triangulo(ctx, 42, 18, 47, 22, 42, 24, c.pico2);
        P.px(ctx, 44, 19, c.joya); P.px(ctx, 46, 20, c.joya);
        // collar de joyas
        for (let x = 30; x <= 42; x += 3) P.px(ctx, x, 22, c.joya);
        // patas
        P.rect(ctx, 32, 44, 3, 6, '#3a3040'); P.rect(ctx, 38, 44, 3, 6, '#3a3040');
      }
    },
    gigante: {
      w: 64, h: 72, cuadros: 2,
      paleta: { piel: '#5a6b3a', piel2: '#3d4a28', vientre: '#a8a070', roca: '#7a6e5e', roca2: '#4e4538', ojo: '#ffd166', diente: '#efe6d6', taparrabo: '#8a3b2a' },
      dibujar(ctx, f, c) {
        const sube = f === 0 ? 0 : 3;
        // montaña sobre la cabeza
        P.triangulo(ctx, 32, 0 - sube, 8, 22 - sube, 56, 22 - sube, c.roca);
        P.triangulo(ctx, 32, 0 - sube, 8, 22 - sube, 26, 22 - sube, c.roca2);
        P.triangulo(ctx, 32, 0 - sube, 28, 7 - sube, 36, 7 - sube, '#efe6d6');
        P.rect(ctx, 14, 20 - sube, 4, 2, '#4f8a3a'); P.rect(ctx, 44, 18 - sube, 5, 2, '#4f8a3a');
        // brazos levantados
        P.rect(ctx, 10, 20 - sube, 7, 20 + sube, c.piel2);
        P.rect(ctx, 47, 20 - sube, 7, 20 + sube, c.piel2);
        // piernas
        P.rect(ctx, 20, 54, 9, 16, c.piel2); P.rect(ctx, 35, 54, 9, 16, c.piel2);
        P.rect(ctx, 18, 68, 12, 4, c.piel); P.rect(ctx, 34, 68, 12, 4, c.piel);
        // torso
        P.triangulo(ctx, 12, 26, 52, 26, 32, 60, c.piel);
        P.elipse(ctx, 32, 40, 14, 16, c.piel);
        P.elipse(ctx, 32, 44, 8, 10, c.vientre);
        for (let y = 38; y < 54; y += 3) P.rect(ctx, 26, y, 12, 1, U.tono(c.vientre, -0.2));
        P.rect(ctx, 20, 52, 24, 5, c.taparrabo);
        // escamas en hombros
        for (let x = 16; x < 50; x += 4) P.px(ctx, x, 29, c.piel2);
        // cabeza de caimán
        P.elipse(ctx, 32, 26, 9, 6, c.piel);
        P.rect(ctx, 26, 27, 12, 5, c.piel2);
        P.rect(ctx, 27, 31, 10, 1, c.diente);
        for (let x = 27; x < 37; x += 2) P.px(ctx, x, 32, c.diente);
        P.rect(ctx, 26, 22, 3, 2, c.ojo); P.rect(ctx, 35, 22, 3, 2, c.ojo);
        P.px(ctx, 27, 22, '#1a0f1f'); P.px(ctx, 36, 22, '#1a0f1f');
      }
    },
    senor: {
      w: 40, h: 58, cuadros: 2,
      paleta: { manto: '#3a1f5c', manto2: '#24123a', ribete: '#05d9e8', mascara: '#e8dfd0', mascara2: '#b8ad9c', pluma: '#7b2cbf', pluma2: '#05d9e8', jade: '#3fd3a8', oro: '#e8b64c', ojo: '#ff2a6d' },
      dibujar(ctx, f, c) {
        const s = f === 0 ? 0 : 1;
        // gran tocado de plumas
        for (let i = -3; i <= 3; i++) {
          const x = 20 + i * 4;
          P.linea(ctx, 20, 12, x + i * 2, 0 + Math.abs(i) * 2 - s, i % 2 ? c.pluma : c.pluma2, 2);
        }
        P.rect(ctx, 12, 9, 16, 4, c.oro);
        P.rect(ctx, 14, 10, 12, 2, c.jade);
        // manto
        P.triangulo(ctx, 20, 20, 4, 57, 36, 57, c.manto);
        P.triangulo(ctx, 20, 20, 4, 57, 14, 57, c.manto2);
        P.rect(ctx, 4, 55, 33, 2, c.ribete);
        P.linea(ctx, 20, 22, 6, 56, c.ribete);
        P.linea(ctx, 20, 22, 34, 56, c.ribete);
        // pectoral de jade y oro
        P.elipse(ctx, 20, 26, 6, 3, c.oro);
        P.elipse(ctx, 20, 26, 4, 2, c.jade);
        // máscara-rostro (cráneo solemne)
        P.elipse(ctx, 20, 17, 6, 6, c.mascara);
        P.rect(ctx, 16, 20, 9, 3, c.mascara2);
        P.rect(ctx, 16, 15, 3, 3, '#1a0f1f'); P.rect(ctx, 22, 15, 3, 3, '#1a0f1f');
        P.px(ctx, 17, 16, c.ojo); P.px(ctx, 23, 16, c.ojo);
        for (let x = 17; x < 24; x += 2) P.px(ctx, x, 22, '#1a0f1f');
        // orejeras de jade
        P.elipse(ctx, 13, 18, 2, 2, c.jade); P.elipse(ctx, 27, 18, 2, 2, c.jade);
        // bastón de mando
        P.rect(ctx, 34, 8 + s, 2, 46, c.oro);
        P.elipse(ctx, 35, 7 + s, 3, 3, c.mascara);
        P.px(ctx, 34, 7 + s, '#1a0f1f'); P.px(ctx, 36, 7 + s, '#1a0f1f');
        // manos
        P.rect(ctx, 32, 30 + s, 4, 3, c.mascara2);
        P.rect(ctx, 6, 32, 4, 3, c.mascara2);
      }
    },
    // -------- Aliados (solo para el bestiario) --------
    colibriGrande: {
      w: 24, h: 16, cuadros: 1,
      paleta: {},
      dibujar(ctx) { ctx.drawImage(G.arte.colibri(0), 0, 0, 12, 8, 0, 0, 24, 16); }
    },
    aluxGrande: {
      w: 12, h: 12, cuadros: 1, paleta: {},
      dibujar(ctx) { ctx.drawImage(G.arte.alux(1), 0, 0); }
    },
    abuelaGrande: {
      w: 16, h: 25, cuadros: 1, paleta: {},
      dibujar(ctx) { ctx.drawImage(G.arte.personaje('abuela', 0, 0), 0, 0); }
    }
  };

  // Devuelve el dibujo de una criatura (ya con borde) para un cuadro de animación.
  G.arte.criatura = function (id, cuadro) {
    const c = G.mundos.criatura(id);
    const forma = FORMAS[c ? c.arte : id];
    if (!forma) return null;
    const f = (cuadro || 0) % forma.cuadros;
    return P.memo(`criatura:${id}:${f}`, () => {
      const [cv, ctx] = P.lienzo(forma.w + 2, forma.h + 2);
      ctx.translate(1, 1);
      forma.dibujar(ctx, f, Object.assign({}, forma.paleta, (c && c.paleta) || {}));
      return c && c.sinBorde ? cv : P.contorno(cv, '#0a0612');
    });
  };

  // ------------------------------------------------------------------
  // DATOS
  // ataques: tipo fisico/magico, objetivo uno/todos, potencia, prob,
  // aturdir (probabilidad de vaciar la barra del héroe), efecto visual.
  // ------------------------------------------------------------------
  const MORDIDA = { nombre: 'Mordida', tipo: 'fisico', objetivo: 'uno', potencia: 1, prob: 1, efecto: 'garra' };

  const CRIATURAS = {
    // ======== Selva de Ceiba ========
    murcielago: {
      nombre: 'Murciélago de Xibalbá', corto: 'Murciélago', arte: 'murcielago', zona: 'Selva de Ceiba', volador: true,
      vida: 26, fue: 9, def: 4, mag: 6, vel: 15, xp: 12,
      debil: ['fuego'], resiste: ['viento'],
      ataques: [MORDIDA, { nombre: 'Chillido', tipo: 'magico', objetivo: 'uno', potencia: 0.9, prob: 0.4, efecto: 'onda', elemento: 'viento' }],
      suelta: [{ objeto: 'cacao', prob: 0.25 }],
      bestiario: 'En el Popol Vuh, la Casa de los Murciélagos (Zotzi Ha) era una de las pruebas de Xibalbá. "Zotz" significa murciélago en varias lenguas mayas, y un linaje kaqchikel se llamaba Zotz\'il: "gente murciélago".'
    },
    buho: {
      nombre: 'Búho mensajero', corto: 'Búho', arte: 'buho', zona: 'Selva de Ceiba', volador: true,
      vida: 30, fue: 8, def: 5, mag: 10, vel: 11, xp: 14,
      debil: ['agua'], resiste: ['viento'],
      ataques: [{ nombre: 'Picotazo', tipo: 'fisico', objetivo: 'uno', potencia: 1, prob: 1, efecto: 'garra' },
        { nombre: 'Graznido', tipo: 'magico', objetivo: 'todos', potencia: 0.7, prob: 0.35, efecto: 'onda', elemento: 'viento' }],
      suelta: [{ objeto: 'jade', prob: 0.2 }],
      bestiario: 'Los Señores de Xibalbá tenían cuatro búhos mensajeros, los Tucur: Chabi Tucur, Huracán Tucur, Caquix Tucur y Holom Tucur. Con ellos llamaron al juego de pelota al padre y al tío de los gemelos. Muchos pueblos mayas veían al búho como mensajero de la muerte.'
    },
    jaguarSombra: {
      nombre: 'Jaguar sombra', arte: 'jaguar', zona: 'Selva de Ceiba',
      vida: 44, fue: 12, def: 6, mag: 4, vel: 12, xp: 20,
      debil: ['fuego'], resiste: ['tierra'],
      ataques: [{ nombre: 'Zarpazo', tipo: 'fisico', objetivo: 'uno', potencia: 1.1, prob: 1, efecto: 'garra' },
        { nombre: 'Salto nocturno', tipo: 'fisico', objetivo: 'uno', potencia: 1.4, prob: 0.25, efecto: 'garra' }],
      suelta: [{ objeto: 'cacao', prob: 0.3 }],
      bestiario: 'El jaguar ("balam") era para los mayas el señor de la noche y del inframundo. Se decía que el sol se volvía jaguar al cruzar Xibalbá por la noche. Los gobernantes usaban su piel como símbolo de poder.'
    },
    // ======== Cuevas de Xibalbá ========
    murcielagoNeon: {
      nombre: 'Murciélago de las cuevas', corto: 'Murciélago azul', arte: 'murcielago', zona: 'Cuevas de Xibalbá', volador: true,
      paleta: { cuerpo: '#1d3a5c', cuerpo2: '#0d1f33', ala: '#05d9e8', ala2: '#027c88', ojo: '#ffd166' },
      vida: 58, fue: 18, def: 9, mag: 13, vel: 19, xp: 44,
      debil: ['fuego'], resiste: ['viento'],
      ataques: [MORDIDA, { nombre: 'Eco de la cueva', tipo: 'magico', objetivo: 'todos', potencia: 0.75, prob: 0.35, efecto: 'onda', elemento: 'viento' }],
      suelta: [{ objeto: 'cacao', prob: 0.3 }, { objeto: 'jade', prob: 0.15 }],
      bestiario: 'Para los mayas, las cuevas eran puertas al inframundo y lugares sagrados donde se hacían ceremonias. En las cuevas de Guatemala y del sur de México todavía viven grandes colonias de murciélagos.'
    },
    esqueleto: {
      nombre: 'Guerrero esqueleto', corto: 'Esqueleto', arte: 'esqueleto', zona: 'Cuevas de Xibalbá',
      vida: 84, fue: 21, def: 14, mag: 6, vel: 11, xp: 58,
      debil: ['tierra'], resiste: ['viento'],
      ataques: [{ nombre: 'Macuahuitl', tipo: 'fisico', objetivo: 'uno', potencia: 1.15, prob: 1, efecto: 'corte' },
        { nombre: 'Golpe de escudo', tipo: 'fisico', objetivo: 'uno', potencia: 0.8, prob: 0.3, aturdir: 0.5, efecto: 'golpe' }],
      suelta: [{ objeto: 'cacao', prob: 0.3 }, { objeto: 'pluma', prob: 0.06 }],
      bestiario: 'Entre los Señores de Xibalbá, Chamiabac y Chamiaholom ("Bastón de hueso" y "Bastón de calavera") tenían el oficio de enflaquecer a la gente hasta dejarla en los huesos. Estos guerreros llevan el macuahuitl, un garrote de madera con filos de obsidiana.'
    },
    buhoObsidiana: {
      nombre: 'Búho de obsidiana', corto: 'Búho negro', arte: 'buho', zona: 'Cuevas de Xibalbá', volador: true,
      paleta: { pluma: '#2a2240', pluma2: '#14101f', pecho: '#5c4f7a', ojo: '#ff2a6d', pico: '#b18cff' },
      vida: 64, fue: 15, def: 10, mag: 21, vel: 13, xp: 50,
      debil: ['agua'], resiste: ['viento'],
      ataques: [{ nombre: 'Picotazo', tipo: 'fisico', objetivo: 'uno', potencia: 1, prob: 1, efecto: 'garra' },
        { nombre: 'Espejo de obsidiana', tipo: 'magico', objetivo: 'uno', potencia: 1.3, prob: 0.4, efecto: 'onda' }],
      suelta: [{ objeto: 'jade', prob: 0.3 }],
      bestiario: 'La obsidiana es un vidrio volcánico negro. Los mayas la usaban para navajas, puntas de lanza y espejos, y la comerciaban desde los volcanes de las tierras altas de Guatemala. Los espejos de obsidiana servían para ver lo oculto.'
    },
    // ======== Casa de los Señores ========
    murcielagoCasa: {
      nombre: 'Murciélago de la Casa', corto: 'Murciélago rojo', arte: 'murcielago', zona: 'Casa de los Señores', volador: true,
      paleta: { cuerpo: '#3d0f24', cuerpo2: '#1f0812', ala: '#ff2a6d', ala2: '#8a0f38', ojo: '#05d9e8' },
      vida: 120, fue: 34, def: 15, mag: 22, vel: 24, xp: 105,
      debil: ['fuego'], resiste: ['viento'],
      ataques: [{ nombre: 'Ala de navaja', tipo: 'fisico', objetivo: 'uno', potencia: 1.15, prob: 1, efecto: 'corte' },
        { nombre: 'Vuelo en picada', tipo: 'fisico', objetivo: 'todos', potencia: 0.7, prob: 0.3, efecto: 'onda' }],
      suelta: [{ objeto: 'cacao', prob: 0.35 }, { objeto: 'pluma', prob: 0.08 }],
      bestiario: 'En la Casa de los Murciélagos, los gemelos durmieron dentro de sus cerbatanas. Cuando Hunahpú se asomó para ver si amanecía, Camazotz, el murciélago de la muerte, le cortó la cabeza. Ixbalanqué la reemplazó con una calabaza tallada.'
    },
    jaguarObsidiana: {
      nombre: 'Jaguar de la Casa', arte: 'jaguar', zona: 'Casa de los Señores',
      paleta: { cuerpo: '#14101f', cuerpo2: '#0a0612', mancha: '#ffd166', ojo: '#ff2a6d', vientre: '#2a2240' },
      vida: 170, fue: 38, def: 18, mag: 10, vel: 16, xp: 125,
      debil: ['agua'], resiste: ['fuego'],
      ataques: [{ nombre: 'Zarpazo', tipo: 'fisico', objetivo: 'uno', potencia: 1.15, prob: 1, efecto: 'garra' },
        { nombre: 'Rugido', tipo: 'magico', objetivo: 'todos', potencia: 0.7, prob: 0.3, aturdir: 0.3, efecto: 'onda' }],
      suelta: [{ objeto: 'cacao', prob: 0.35 }],
      bestiario: 'En la Casa de los Jaguares, las fieras querían devorar a los gemelos. Ellos les lanzaron huesos para que se entretuvieran royéndolos, y así pasaron la noche sanos y salvos.'
    },
    esqueletoNoble: {
      nombre: 'Guerrero de Xibalbá', corto: 'Guerrero', arte: 'esqueleto', zona: 'Casa de los Señores',
      paleta: { hueso: '#d8cfe0', hueso2: '#9a8fb0', ojo: '#ff2a6d', escudo: '#3a1f5c', pluma: '#e8b64c', madera: '#3d2a10' },
      vida: 160, fue: 35, def: 22, mag: 12, vel: 13, xp: 130,
      debil: ['tierra'], resiste: ['viento', 'agua'],
      ataques: [{ nombre: 'Macuahuitl', tipo: 'fisico', objetivo: 'uno', potencia: 1.2, prob: 1, efecto: 'corte' },
        { nombre: 'Golpe de escudo', tipo: 'fisico', objetivo: 'uno', potencia: 0.8, prob: 0.3, aturdir: 0.5, efecto: 'golpe' }],
      suelta: [{ objeto: 'jade', prob: 0.3 }, { objeto: 'pluma', prob: 0.08 }],
      bestiario: 'Xibalbá significa "lugar del miedo". Sus doce señores tenían cada uno un oficio: causar heridas, enfermedad, hambre o miedo. Se llegaba bajando escalones muy empinados y cruzando ríos.'
    },
    buhoTucur: {
      nombre: 'Tucur mayor', arte: 'buho', zona: 'Casa de los Señores', volador: true,
      paleta: { pluma: '#5c1439', pluma2: '#3a0b24', pecho: '#e8b64c', ojo: '#05d9e8', pico: '#ffd166' },
      vida: 140, fue: 26, def: 16, mag: 38, vel: 17, xp: 120,
      debil: ['agua'], resiste: ['viento', 'fuego'],
      ataques: [{ nombre: 'Picotazo', tipo: 'fisico', objetivo: 'uno', potencia: 1, prob: 1, efecto: 'garra' },
        { nombre: 'Mensaje de la noche', tipo: 'magico', objetivo: 'todos', potencia: 0.8, prob: 0.4, efecto: 'onda' }],
      suelta: [{ objeto: 'jade', prob: 0.35 }],
      bestiario: 'Los búhos Tucur fueron enviados a quitarle el corazón a Ixquic, la madre de los gemelos. Se apiadaron de ella y llevaron a los Señores la savia roja de un árbol en lugar de su corazón. Así Ixquic pudo escapar.'
    },
    // ======== JEFES ========
    vucubCaquix: {
      nombre: 'Vucub Caquix', arte: 'guacamaya', zona: 'Selva de Ceiba', jefe: true,
      titulo: 'El ave que se creía el sol',
      vida: 560, fue: 19, def: 9, mag: 17, vel: 13, xp: 200,
      debil: ['viento'], resiste: ['fuego'],
      ataques: [
        { nombre: 'Picotazo de plata', tipo: 'fisico', objetivo: 'uno', potencia: 1.15, prob: 1, efecto: 'garra' },
        { nombre: 'Aleteo', tipo: 'magico', objetivo: 'todos', potencia: 0.75, prob: 0.4, efecto: 'onda', elemento: 'viento' },
        { nombre: 'Brillo falso', tipo: 'magico', objetivo: 'todos', potencia: 0.9, prob: 0.3, aturdir: 0.35, efecto: 'destello', elemento: 'fuego', frase: '¡Mírenme! ¡Yo soy el sol!' }
      ],
      suelta: [{ objeto: 'pluma', prob: 1 }],
      bestiario: 'Siete Guacamaya. Antes de que existiera el sol verdadero, presumía ser el sol y la luna porque sus ojos eran de plata y sus dientes de piedras preciosas. Los gemelos le dispararon con la cerbatana mientras comía de su árbol de nance. Algunos estudiosos lo relacionan con la Osa Mayor.'
    },
    zipacna: {
      nombre: 'Zipacná', arte: 'gigante', zona: 'Cuevas de Xibalbá', jefe: true,
      titulo: 'El que hace las montañas',
      vida: 920, fue: 31, def: 17, mag: 20, vel: 11, xp: 700,
      debil: ['agua'], resiste: ['tierra'],
      ataques: [
        { nombre: 'Puño de montaña', tipo: 'fisico', objetivo: 'uno', potencia: 1.3, prob: 1, efecto: 'golpe' },
        { nombre: 'Lanzar el cerro', tipo: 'fisico', objetivo: 'todos', potencia: 0.85, prob: 0.4, efecto: 'roca', elemento: 'tierra', frase: '¡Yo hago las montañas!' },
        { nombre: 'Pisotón', tipo: 'fisico', objetivo: 'todos', potencia: 0.65, prob: 0.3, aturdir: 0.4, efecto: 'temblor' }
      ],
      suelta: [{ objeto: 'pluma', prob: 1 }],
      bestiario: 'Hijo de Vucub Caquix. Decía que él hacía las montañas. Venció a los Cuatrocientos Muchachos, que subieron al cielo como las estrellas de las Pléyades. Los gemelos lo engañaron con un cangrejo hecho de flores y hojas, y una montaña le cayó encima.'
    },
    hunCame: {
      nombre: 'Hun Camé', arte: 'senor', zona: 'Casa de los Señores', jefe: true,
      titulo: 'Uno Muerte, señor de Xibalbá',
      vida: 780, fue: 28, def: 20, mag: 29, vel: 15, xp: 0,
      debil: ['fuego'], resiste: ['agua'],
      ataques: [
        { nombre: 'Mirada de obsidiana', tipo: 'magico', objetivo: 'uno', potencia: 1.25, prob: 1, efecto: 'onda' },
        { nombre: 'Juicio de Xibalbá', tipo: 'magico', objetivo: 'todos', potencia: 0.85, prob: 0.4, efecto: 'destello', frase: 'Aquí abajo, nosotros juzgamos.' }
      ],
      suelta: [],
      bestiario: 'Hun Camé ("Uno Muerte") y Vucub Camé ("Siete Muerte") eran los señores principales de Xibalbá y jueces de los demás. Sus nombres son días del calendario sagrado de 260 días. Los gemelos los vencieron con astucia, disfrazados de magos danzantes.'
    },
    vucubCame: {
      nombre: 'Vucub Camé', arte: 'senor', zona: 'Casa de los Señores', jefe: true,
      titulo: 'Siete Muerte, señor de Xibalbá',
      paleta: { manto: '#5c1439', manto2: '#3a0b24', ribete: '#e8b64c', pluma: '#d62839', pluma2: '#e8b64c', ojo: '#05d9e8' },
      vida: 780, fue: 32, def: 20, mag: 26, vel: 14, xp: 0,
      debil: ['agua'], resiste: ['fuego'],
      ataques: [
        { nombre: 'Golpe de bastón', tipo: 'fisico', objetivo: 'uno', potencia: 1.25, prob: 1, efecto: 'golpe' },
        { nombre: 'Sombra de murciélagos', tipo: 'fisico', objetivo: 'todos', potencia: 0.8, prob: 0.4, efecto: 'onda', frase: 'Nadie le roba nada a Xibalbá.' }
      ],
      suelta: [],
      bestiario: 'Vucub Camé ("Siete Muerte") gobernaba Xibalbá junto a Hun Camé. En el Popol Vuh, los gemelos fingieron sacrificarse y revivir ante ellos. Los señores, maravillados, pidieron que les hicieran lo mismo... pero ellos ya no revivieron.'
    },
    // ======== Aliados (aparecen en el bestiario) ========
    tzunun: {
      nombre: "Tz'unun, colibrí de luz", arte: 'colibriGrande', zona: 'Aliado', aliado: true, sinBorde: true,
      bestiario: "Tz'unun significa colibrí en k'iche'. En un relato maya q'eqchi', el Sol se transformó en colibrí para acercarse a la Luna. Los mayas admiraban al colibrí por su valentía y por el brillo de sus plumas."
    },
    alux: {
      nombre: 'Alux', arte: 'aluxGrande', zona: 'Aliado', aliado: true, sinBorde: true,
      bestiario: 'En la tradición maya de la península de Yucatán, los aluxes son espíritus pequeños que cuidan la milpa y el monte. La gente les deja ofrendas para que protejan los cultivos; si se les ofende, hacen travesuras.'
    },
    ixmucane: {
      nombre: 'Abuela Ixmucané', arte: 'abuelaGrande', zona: 'Aliada', aliado: true, sinBorde: true,
      bestiario: 'Ixmucané es la abuela de los gemelos. En el Popol Vuh también es una de las abuelas creadoras: molió el maíz amarillo y blanco con el que se formó a las primeras personas.'
    }
  };

  G.mundoMaya = G.mundoMaya || {};
  G.mundoMaya.criaturas = CRIATURAS;
})();
