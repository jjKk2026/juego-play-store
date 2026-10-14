/* =====================================================================
   ARTE DE PERSONAJES E ÍCONOS
   Los personajes se dibujan con "plantillas" de letras: cada letra es un
   color. Así, cambiando la paleta, el mismo cuerpo sirve para Hunahpú,
   Ixbalanqué, la abuela Ixmucané y otros personajes.

   Letras de las plantillas:
   o contorno · p piel · P piel en sombra · h pelo · a cinta/adorno
   A pluma u orejas · g oro · j jade · c ropa · C ropa en sombra
   w taparrabo · b sandalias · i ojos · s manchas de la cara · m boca
   ===================================================================== */
'use strict';

(function () {
  const P = G.pixel;

  // --------- Plantillas (16 de ancho, 24 de alto: torso 19 filas + piernas 5) ---------
  const FRENTE = [
    '......oAAo......',
    '.....ohAAho.....',
    '....oohhhhoo....',
    '...ohhhhhhhho...',
    '..ohhhhhhhhhho..',
    '..oaaaaggaaaao..',
    '..ohppppppppho..',
    '..ohpippppipho..',
    '..oppippppippo..',
    '..opsppppppspo..',
    '...oPppmmppPo...',
    '....ooPPPPoo....',
    '...occjjjjcco...',
    '..opccccccccpo..',
    '..oPccccccccPo..',
    '..oPCccccccCPo..',
    '..opggaaaaggpo..',
    '...owwwaawwwo...',
    '...oPPwaawPPo...'
  ];
  const ESPALDA = [
    '......oAAo......',
    '.....ohAAho.....',
    '....oohhhhoo....',
    '...ohhhhhhhho...',
    '..ohhhhhhhhhho..',
    '..oaaaaaaaaaao..',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '..ohhhhhhhhhho..',
    '...ohhhhhhhho...',
    '....ooPPPPoo....',
    '...occccccccco..',
    '..opccccccccpo..',
    '..oPccccccccPo..',
    '..oPCCccccCCPo..',
    '..opggaaaaggpo..',
    '...owwwwwwwwo...',
    '...oPPwwwwPPo...'
  ];
  const LADO = [
    '.....oAAo.......',
    '....ohAAho......',
    '....oohhhhoo....',
    '...ohhhhhhhho...',
    '..ohhhhhhhhhho..',
    '..oaaaaaaaagao..',
    '..ohhhhhpppppo..',
    '..ohhhhppppipo..',
    '..ohhhpppppipo..',
    '...ohhppppsppo..',
    '...ohPpppppmpo..',
    '....ooPPPPPoo...',
    '.....occjjcco...',
    '.....occccppo...',
    '.....oCcccppo...',
    '.....oCcccPpo...',
    '.....oggaagpo...',
    '.....owwaawo....',
    '.....oPwwPPo....'
  ];
  const PIERNAS = {
    frente: [
      ['....oPPo.oPPo...', '....oppo.oppo...', '....oaao.oaao...', '...obbbo.obbbo..', '...ooooo.ooooo..'],
      ['....oPPo.oPPo...', '....oppo.oaao...', '....oaao.obbbo..', '...obbbo..ooo...', '...ooooo........'],
      ['....oPPo.oPPo...', '....oaao.oppo...', '...obbbo.oaao...', '....ooo..obbbo..', '.........ooooo..']
    ],
    lado: [
      ['.....oPPPPo.....', '.....oppppo.....', '.....oaaaao.....', '.....obbbbbo....', '.....oooooo.....'],
      ['....oPPooPPo....', '...oppo..oppo...', '...oaao..oaao...', '..obbbo..obbbbo.', '..oooo....oooo..'],
      ['.....oPPPPo.....', '.....oppppo.....', '.....oaaaao.....', '.....obbbbbo....', '.....oooooo.....']
    ]
  };

  // --------- Paletas de cada personaje ---------
  const BASE = { o: '#1a0f1f', i: '#1a0f1f', b: '#7a4b2a', m: '#8c4a36', g: '#ffcc4d', j: '#3fd3a8' };
  const PALETAS = {
    hunahpu: Object.assign({}, BASE, {
      p: '#c98a5a', P: '#9c6440', h: '#2a1a26', A: '#e8483b', a: '#c4302b',
      c: '#f2e6cf', C: '#c9b896', w: '#fff3dc', s: '#3b2420'
    }),
    ixbalanque: Object.assign({}, BASE, {
      p: '#b97c50', P: '#8d5a36', h: '#1f1424', A: '#e0a43a', a: '#2a9d8f',
      c: '#e0a43a', C: '#b07a22', w: '#f2d28a', s: '#b97c50', g: '#7ef2c8'
    }),
    abuela: Object.assign({}, BASE, {
      p: '#a8714c', P: '#7d5236', h: '#d9d4e0', A: '#d9d4e0', a: '#b8336a',
      c: '#f4efe6', C: '#c8bfae', w: '#b8336a', s: '#a8714c', j: '#e8483b'
    }),
    sombra: Object.assign({}, BASE, {
      p: '#3b2a55', P: '#2a1d40', h: '#120a1c', A: '#7b2cbf', a: '#05d9e8',
      c: '#2b1d3d', C: '#1d1330', w: '#3b2a55', s: '#3b2a55', g: '#05d9e8', j: '#ff2a6d', b: '#120a1c', m: '#120a1c', i: '#05d9e8'
    })
  };

  // Detalles propios de cada personaje.
  function detalles(id, ctx, dir) {
    if (id === 'ixbalanque') {
      // orejas de jaguar en vez de pluma
      ctx.clearRect(4, 0, 8, 2);
      const pal = PALETAS.ixbalanque;
      const orejas = dir === 2 || dir === 1 ? [[4, 5], [8, 9]] : [[3, 4], [11, 12]];
      orejas.forEach(([x1, x2]) => {
        P.px(ctx, x1, 1, pal.o); P.px(ctx, x2, 1, pal.o);
        P.px(ctx, x1, 2, pal.A); P.px(ctx, x2, 2, pal.A);
        P.px(ctx, x1 + (x2 - x1 > 0 ? 0 : 0), 0, pal.o); P.px(ctx, x2, 0, pal.o);
      });
      // manchas de jaguar sobre la ropa
      const img = ctx.getImageData(0, 0, 16, 24);
      const cRGB = G.util.rgb(pal.c), CRGB = G.util.rgb(pal.C);
      for (let y = 12; y < 19; y++) {
        for (let x = 0; x < 16; x++) {
          const k = (y * 16 + x) * 4;
          const d = img.data;
          const esC = (d[k] === cRGB[0] && d[k + 1] === cRGB[1] && d[k + 2] === cRGB[2]) || (d[k] === CRGB[0] && d[k + 1] === CRGB[1] && d[k + 2] === CRGB[2]);
          if (esC && ((x * 3 + y * 5) % 7 === 0)) { d[k] = 0x5a; d[k + 1] = 0x30; d[k + 2] = 0x10; }
        }
      }
      ctx.putImageData(img, 0, 0);
    }
    if (id === 'abuela') {
      // moño de pelo canoso y rebozo
      ctx.clearRect(0, 0, 16, 2);
      const pal = PALETAS.abuela;
      P.rect(ctx, 6, 0, 4, 1, pal.o); P.rect(ctx, 5, 1, 6, 1, pal.o);
      P.rect(ctx, 6, 1, 4, 1, pal.h);
      if (dir === 0) { P.rect(ctx, 3, 13, 10, 1, '#b8336a'); P.rect(ctx, 4, 15, 8, 1, '#2a9d8f'); }
    }
  }

  function personaje(id, dir, cuadro) {
    return P.memo(`pj:${id}:${dir}:${cuadro}`, () => {
      const pal = PALETAS[id] || PALETAS.hunahpu;
      const tipo = dir === 0 ? 'frente' : dir === 3 ? 'espalda' : 'lado';
      const torso = tipo === 'frente' ? FRENTE : tipo === 'espalda' ? ESPALDA : LADO;
      const piernas = PIERNAS[tipo === 'lado' ? 'lado' : 'frente'][cuadro % 3];
      const sube = cuadro % 3 !== 0 ? 1 : 0; // al caminar el cuerpo sube un píxel
      const filas = torso.concat(piernas);
      const [c, ctx] = P.lienzo(16, 25);
      const img = P.desdeTexto(filas, pal);
      ctx.drawImage(img, 0, 1 - sube);
      const sub = ctx;
      // detalles se dibujan en coordenadas del sprite (corregimos el desplazamiento)
      const [c2, ctx2] = P.lienzo(16, 24);
      ctx2.drawImage(img, 0, 0);
      detalles(id, ctx2, dir);
      sub.clearRect(0, 0, 16, 25);
      sub.drawImage(c2, 0, 1 - sube);
      return dir === 1 ? P.espejo(c) : c;
    });
  }

  // --------- Colibrí de luz (Tz'unun), el guía ---------
  const COLIBRI = [
    [
      '.....ww.....',
      '....wwww....',
      '..ooowwgo...',
      '.ojjjjjjio..',
      'ojjttjjjjggg',
      '.ojjjjjjo...',
      '..oojjjo....',
      '....ooo.....'
    ],
    [
      '............',
      '............',
      '..oooooo....',
      '.ojjjjjjio..',
      'ojjttjjjjggg',
      '.owwjjjjo...',
      '.wwwwjjo....',
      '..ww.oo.....'
    ]
  ];
  const PAL_COLIBRI = { o: '#0b3d3a', j: '#3fd3a8', t: '#ffd166', w: '#c9fff1', g: '#ffcc4d', i: '#1a0f1f' };
  function colibri(cuadro, izquierda) {
    return P.memo(`colibri:${cuadro % 2}:${izquierda ? 1 : 0}`, () => {
      const c = P.desdeTexto(COLIBRI[cuadro % 2], PAL_COLIBRI);
      return izquierda ? P.espejo(c) : c;
    });
  }

  // --------- Alux: espíritu pequeño y amable del monte ---------
  const ALUX = [
    '....ogo.....',
    '...ogggo....',
    '..oggggggo..',
    '.oooooooooo.',
    '..obbbbbbo..',
    '.obeebbeebo.',
    '.obeibbiebo.',
    '.obbbmmbbbo.',
    '..obbbbbbo..',
    '..obobbobo..',
    '...o.oo.o...'
  ];
  function alux(cuadro) {
    return P.memo('alux:' + (cuadro % 2), () => {
      const c = P.desdeTexto(cuadro % 2 ? ALUX : ['............'].concat(ALUX.slice(0, 10)), {
        o: '#0f2e1d', g: '#5fbf4a', b: '#c8e6c0', e: '#fdfdf0', i: '#1b3a2a', m: '#8fbf8a'
      });
      return c;
    });
  }

  // --------- Retratos para los diálogos ---------
  function retrato(id) {
    return P.memo('ret:' + id, () => {
      const [c, ctx] = P.lienzo(22, 22);
      const fondos = { hunahpu: '#5c1f2a', ixbalanque: '#163f3a', abuela: '#3d2140', colibri: '#10333a', alux: '#1d3a1f', sombra: '#1a0c2c' };
      ctx.fillStyle = fondos[id] || '#24123a';
      ctx.fillRect(0, 0, 22, 22);
      P.trama(ctx, 0, 0, 22, 22, 'rgba(255,255,255,0.08)', 3, 1);
      if (id === 'colibri') {
        const s = colibri(0, false);
        ctx.drawImage(s, 0, 0, 12, 8, 2, 4, 18, 12);
        P.brillo(ctx, 11, 10, 12, '#3fd3a8', 0.4);
      } else if (id === 'alux') {
        ctx.drawImage(alux(1), 5, 6);
      } else {
        const s = personaje(id, 0, 0);
        ctx.drawImage(s, 0, 0, 16, 14, 3, 4, 16, 14);
        ctx.drawImage(s, 0, 13, 16, 6, 3, 17, 16, 6);
      }
      return c;
    });
  }

  // --------- Íconos de objetos (12x12) ---------
  const ICONOS = {
    cacao: [['....oo......', '...obbo.....', '..obbbbo....', '.obbBBbbo...', '.obBbbBbo...', 'obbbBBbbbo..', 'obBbbbbBbo..', '.obbBBbbo...', '.obbbbbbo...', '..obbbbo....', '...oooo.....'], { o: '#2a1208', b: '#a0522d', B: '#6b3215' }],
    jade: [['...oooo.....', '..ojjjjo....', '.ojwjjjjo...', 'ojwjjjjjJo..', 'ojjjjjjjJo..', 'ojjjjjjJJo..', '.ojjjjJJo...', '..oJJJJo....', '...oooo.....'], { o: '#0b3d2e', j: '#3fd3a8', J: '#1f8a6c', w: '#d8fff2' }],
    copal: [['....w.w.....', '.....w......', '....w.w.....', '...oooo.....', '..oyyyyo....', '.oyYyyyyo...', '.oyyyyYyo...', '..oyyyyo....', '...oooo.....'], { o: '#3d2a10', y: '#f2d28a', Y: '#c9a24a', w: '#d9d4e0' }],
    pluma: [['........oo..', '.......ogo..', '......oggo..', '.....oggbo..', '....oggbbo..', '...oggbbo...', '..oggbbo....', '..ogbbo.....', '.oobo.......', '.o.oo.......', 'o...........'], { o: '#0b2e1d', g: '#2ec27e', b: '#1a7f8e' }],
    llave: [['..ooo.......', '.oyyyo......', '.oy.yo......', '.oyyyo......', '..oyo.......', '..oyo.......', '..oyyo......', '..oyo.......', '..oyyo......', '...o........'], { o: '#3d2a10', y: '#ffcc4d' }],
    llaveJefe: [['.oooooo.....', 'orrrrrro....', 'orjooojro...', 'orrrrrro....', '.oorroo.....', '...oro......', '...orro.....', '...oro......', '...orrro....', '....ooo.....'], { o: '#2a0a12', r: '#ff2a6d', j: '#7ef2c8' }],
    mapa: [['oooooooooo..', 'oyyyyyyyyo..', 'oyrryyyyyo..', 'oyyyryyyyo..', 'oyyyyrrryo..', 'oyyyyyyyro..', 'oyyyyyyxyo..', 'oyyyyyyyyo..', 'oooooooooo..'], { o: '#3d2a10', y: '#f2d28a', r: '#a0522d', x: '#c4302b' }],
    hueso: [['oo......oo..', 'owo....owo..', '.owoooowo...', '..owwwwo....', '.owoooowo...', 'owo....owo..', 'oo......oo..'], { o: '#4a3a3a', w: '#efe6d6' }],
    luciernaga: [['....yy......', '...yYYy.....', '..oyYYyo....', '..ooyyoo....', '...oooo.....'], { o: '#2a3a10', y: '#e9ff70', Y: '#ffffff' }],
    sello: [['..oooooo....', '.oggggggo...', 'oggjjjjggo..', 'ogjjoojjgo..', 'ogjoggojgo..', 'ogjjoojjgo..', 'oggjjjjggo..', '.oggggggo...', '..oooooo....'], { o: '#3d2a10', g: '#ffcc4d', j: '#3fd3a8' }],
    cofre: [['.oooooooooo.', 'oyrrrrrrrryo', 'orrrrrrrrrro', 'oyyyyooyyyyo', 'orrrrggrrrro', 'orrrrrrrrrro', 'oyrrrrrrrryo', 'oooooooooooo'], { o: '#2a1208', r: '#8a4b22', y: '#ffcc4d', g: '#ffe28a' }]
  };
  function icono(id) {
    return P.memo('ico:' + id, () => {
      const d = ICONOS[id];
      if (!d) return P.lienzo(12, 12)[0];
      return P.desdeTexto(d[0], d[1]);
    });
  }

  G.arte = Object.assign(G.arte || {}, { personaje, colibri, alux, retrato, icono, PALETAS });
})();
