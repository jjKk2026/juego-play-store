/* =====================================================================
   FUENTE DE LETRAS EN PIXEL ART
   Cada letra está dibujada a mano con "#" (píxel encendido) y "." (vacío).
   El primer número es la fila donde empieza la letra (para que las
   minúsculas y las que bajan, como g o p, queden alineadas).
   Truco de texto: lo que va entre *asteriscos* se pinta de color resaltado.
   ===================================================================== */
'use strict';

(function () {
  const ALTO_LINEA = 11;
  const D = {
    A: [1, '.###.|#...#|#...#|#####|#...#|#...#|#...#'],
    B: [1, '####.|#...#|#...#|####.|#...#|#...#|####.'],
    C: [1, '.###.|#...#|#....|#....|#....|#...#|.###.'],
    D: [1, '####.|#...#|#...#|#...#|#...#|#...#|####.'],
    E: [1, '#####|#....|#....|####.|#....|#....|#####'],
    F: [1, '#####|#....|#....|####.|#....|#....|#....'],
    G: [1, '.###.|#...#|#....|#.###|#...#|#...#|.####'],
    H: [1, '#...#|#...#|#...#|#####|#...#|#...#|#...#'],
    I: [1, '###|.#.|.#.|.#.|.#.|.#.|###'],
    J: [1, '..###|...#.|...#.|...#.|#..#.|#..#.|.##..'],
    K: [1, '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#'],
    L: [1, '#....|#....|#....|#....|#....|#....|#####'],
    M: [1, '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#'],
    N: [1, '#...#|##..#|#.#.#|#..##|#...#|#...#|#...#'],
    O: [1, '.###.|#...#|#...#|#...#|#...#|#...#|.###.'],
    P: [1, '####.|#...#|#...#|####.|#....|#....|#....'],
    Q: [1, '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#'],
    R: [1, '####.|#...#|#...#|####.|#.#..|#..#.|#...#'],
    S: [1, '.####|#....|#....|.###.|....#|....#|####.'],
    T: [1, '#####|..#..|..#..|..#..|..#..|..#..|..#..'],
    U: [1, '#...#|#...#|#...#|#...#|#...#|#...#|.###.'],
    V: [1, '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..'],
    W: [1, '#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#'],
    X: [1, '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#'],
    Y: [1, '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..'],
    Z: [1, '#####|....#|...#.|..#..|.#...|#....|#####'],
    a: [3, '.##.|...#|.###|#..#|.###'],
    b: [1, '#...|#...|###.|#..#|#..#|#..#|###.'],
    c: [3, '.###|#...|#...|#...|.###'],
    d: [1, '...#|...#|.###|#..#|#..#|#..#|.###'],
    e: [3, '.##.|#..#|####|#...|.###'],
    f: [1, '..##|.#..|####|.#..|.#..|.#..|.#..'],
    g: [3, '.###|#..#|#..#|#..#|.###|...#|.##.'],
    h: [1, '#...|#...|###.|#..#|#..#|#..#|#..#'],
    i: [1, '#|.|#|#|#|#|#'],
    j: [1, '..#|...|..#|..#|..#|..#|..#|#.#|.#.'],
    k: [1, '#...|#...|#..#|#.#.|##..|#.#.|#..#'],
    l: [1, '#.|#.|#.|#.|#.|#.|.#'],
    m: [3, '####.|#.#.#|#.#.#|#.#.#|#.#.#'],
    n: [3, '###.|#..#|#..#|#..#|#..#'],
    o: [3, '.##.|#..#|#..#|#..#|.##.'],
    p: [3, '###.|#..#|#..#|#..#|###.|#...|#...'],
    q: [3, '.###|#..#|#..#|#..#|.###|...#|...#'],
    r: [3, '#.##|##..|#...|#...|#...'],
    s: [3, '.###|#...|.##.|...#|###.'],
    t: [1, '.#..|.#..|####|.#..|.#..|.#..|..##'],
    u: [3, '#..#|#..#|#..#|#..#|.###'],
    v: [3, '#...#|#...#|.#.#.|.#.#.|..#..'],
    w: [3, '#...#|#.#.#|#.#.#|#.#.#|.#.#.'],
    x: [3, '#..#|#..#|.##.|#..#|#..#'],
    y: [3, '#..#|#..#|#..#|#..#|.###|...#|.##.'],
    z: [3, '####|..#.|.#..|#...|####'],
    'í': [0, '.#|#.|..|#.|#.|#.|#.|#.'],
    0: [1, '.##.|#..#|#.##|##.#|#..#|#..#|.##.'],
    1: [1, '.#.|##.|.#.|.#.|.#.|.#.|###'],
    2: [1, '.##.|#..#|...#|..#.|.#..|#...|####'],
    3: [1, '###.|...#|...#|.##.|...#|...#|###.'],
    4: [1, '#..#|#..#|#..#|####|...#|...#|...#'],
    5: [1, '####|#...|###.|...#|...#|#..#|.##.'],
    6: [1, '.##.|#...|#...|###.|#..#|#..#|.##.'],
    7: [1, '####|...#|..#.|..#.|.#..|.#..|.#..'],
    8: [1, '.##.|#..#|#..#|.##.|#..#|#..#|.##.'],
    9: [1, '.##.|#..#|#..#|.###|...#|...#|.##.'],
    '.': [7, '#'],
    ',': [7, '.#|#.'],
    ':': [4, '#|.|.|#'],
    ';': [4, '.#|..|..|.#|#.'],
    '!': [1, '#|#|#|#|#|.|#'],
    '?': [1, '.##.|#..#|...#|..#.|.#..|....|.#..'],
    '¡': [3, '#|.|#|#|#|#|#'],
    '¿': [3, '..#.|....|..#.|.#..|#...|#..#|.##.'],
    '-': [4, '###'],
    '+': [3, '.#.|###|.#.'],
    "'": [1, '#|#'],
    '"': [1, '#.#|#.#'],
    '(': [1, '.#|#.|#.|#.|#.|#.|.#'],
    ')': [1, '#.|.#|.#|.#|.#|.#|#.'],
    '/': [1, '..#|..#|.#.|.#.|.#.|#..|#..'],
    '%': [1, '##..#|##.#.|...#.|..#..|.#...|.#.##|#..##'],
    '*': [2, '#.#|.#.|#.#'],
    '<': [2, '..#|.#.|#..|.#.|..#'],
    '>': [2, '#..|.#.|..#|.#.|#..'],
    '=': [3, '###|...|###'],
    '_': [8, '#####'],
    '·': [4, '#'],
    '#': [2, '.#.#.|#####|.#.#.|#####|.#.#.'],
    '♥': [2, '.#.#.|#####|#####|.###.|..#..'],
    '★': [1, '..#..|..#..|#####|.###.|.#.#.|#...#'],
    '▶': [1, '#...|##..|###.|####|###.|##..|#...'],
    '▼': [3, '#####|.###.|..#..'],
    '⇄': [2, '...#.|#####|.....|#####|.#...'],
    '[': [1, '##|#.|#.|#.|#.|#.|##'],
    ']': [1, '##|.#|.#|.#|.#|.#|##']
  };

  // Letras con tilde: se arman a partir de la letra base.
  const TILDES = {
    'á': ['a', 'aguda'], 'é': ['e', 'aguda'], 'ó': ['o', 'aguda'], 'ú': ['u', 'aguda'],
    'ñ': ['n', 'virgulilla'], 'ü': ['u', 'dieresis'],
    'Á': ['A', 'aguda'], 'É': ['E', 'aguda'], 'Í': ['I', 'aguda'], 'Ó': ['O', 'aguda'],
    'Ú': ['U', 'aguda'], 'Ñ': ['N', 'virgulilla'], 'Ü': ['U', 'dieresis']
  };

  // Convierte la definición en una lista de píxeles {x, y}.
  const glifos = {};
  function preparar(car, def) {
    const filas = def[1].split('|');
    const px = [];
    let ancho = 0;
    filas.forEach((f, y) => {
      ancho = Math.max(ancho, f.length);
      for (let x = 0; x < f.length; x++) if (f[x] === '#') px.push({ x, y: def[0] + y });
    });
    glifos[car] = { px, ancho };
  }
  Object.keys(D).forEach((c) => preparar(c, D[c]));
  Object.keys(TILDES).forEach((c) => {
    const [base, tipo] = TILDES[c];
    const g = glifos[base];
    const px = g.px.slice();
    const mayus = base === base.toUpperCase();
    const y0 = mayus ? -1 : 0; // las mayúsculas usan la fila de arriba
    const cx = Math.floor(g.ancho / 2);
    if (tipo === 'aguda') { px.push({ x: cx, y: y0 }, { x: cx - 1, y: y0 + 1 }); }
    if (tipo === 'dieresis') { px.push({ x: 0, y: y0 + 1 }, { x: g.ancho - 1, y: y0 + 1 }); }
    if (tipo === 'virgulilla') {
      for (let x = 0; x < g.ancho; x++) {
        px.push({ x, y: y0 + ((x % 2 === 0) ? 1 : 0) });
      }
    }
    glifos[c] = { px, ancho: g.ancho };
  });
  glifos[' '] = { px: [], ancho: 2 };

  const REEMPLAZOS = { '—': '-', '–': '-', '…': '...', '“': '"', '”': '"', '‘': "'", '’': "'", 'à': 'á', 'è': 'é', 'ì': 'í', 'ò': 'ó', 'ù': 'ú' };

  // {H}, {I} y {GEMELOS} se cambian por los nombres que eligió el jugador.
  function nombres(texto) {
    if (texto.indexOf('{') < 0) return texto;
    const P = G.partida;
    const n = (id) => (P && P.nombre ? P.nombre(id) : G.datos.HEROES[id].nombre);
    return texto.replace(/\{H\}/g, () => n('hunahpu')).replace(/\{I\}/g, () => n('ixbalanque'))
      .replace(/\{GEMELOS\}/g, () => (P && P.gemelos ? P.gemelos() : n('hunahpu') + ' e ' + n('ixbalanque')));
  }
  function normalizar(texto) {
    let r = '';
    for (const c of nombres(String(texto))) r += REEMPLAZOS[c] !== undefined ? REEMPLAZOS[c] : c;
    return r;
  }
  function glifo(c) { return glifos[c] || glifos['?']; }

  // Hoja de letras por color (se dibuja una vez y luego se copia rápido).
  const CELDA_W = 6, CELDA_H = 13, ORIGEN_Y = 1;
  const lista = Object.keys(glifos);
  const indice = {};
  lista.forEach((c, i) => { indice[c] = i; });
  const hojas = {};
  function hoja(color) {
    if (hojas[color]) return hojas[color];
    const [cv, ctx] = G.util.crearLienzo(lista.length * CELDA_W, CELDA_H);
    ctx.fillStyle = color;
    lista.forEach((c, i) => {
      glifos[c].px.forEach((p) => ctx.fillRect(i * CELDA_W + p.x, p.y + ORIGEN_Y, 1, 1));
    });
    hojas[color] = cv;
    return cv;
  }

  function ancho(texto, escala) {
    escala = escala || 1;
    texto = normalizar(texto);
    let w = 0;
    for (const c of texto) {
      if (c === '*') continue;
      w += glifo(c).ancho + 1;
    }
    return Math.max(0, w - 1) * escala;
  }

  /**
   * Dibuja texto.
   * opciones: sombra (color), escala, alinear ('izq'|'centro'|'der'), resalte (color para *texto*), hasta (cantidad de letras visibles)
   */
  function texto(ctx, str, x, y, color, op) {
    op = op || {};
    const escala = op.escala || 1;
    str = normalizar(str);
    let w = ancho(str, escala);
    if (op.alinear === 'centro') x -= Math.floor(w / 2);
    else if (op.alinear === 'der') x -= w;
    x = Math.round(x); y = Math.round(y);
    if (op.sombra) {
      dibujar(ctx, str, x + escala, y + escala, op.sombra, op.sombra, escala, op.hasta);
    }
    if (op.borde) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) {
        dibujar(ctx, str, x + dx * escala, y + dy * escala, op.borde, op.borde, escala, op.hasta);
      }
    }
    dibujar(ctx, str, x, y, color, op.resalte || '#7ef2c8', escala, op.hasta);
    return w;
  }

  function dibujar(ctx, str, x, y, color, resalte, escala, hasta) {
    let resaltado = false;
    let n = 0;
    const h1 = hoja(color), h2 = hoja(resalte);
    for (const c of str) {
      if (c === '*') { resaltado = !resaltado; continue; }
      if (hasta !== undefined && n >= hasta) break;
      n++;
      const g = glifo(c);
      const i = indice[glifos[c] ? c : '?'];
      if (g.px.length) {
        ctx.drawImage(resaltado ? h2 : h1, i * CELDA_W, 0, CELDA_W, CELDA_H,
          x, y - ORIGEN_Y * escala, CELDA_W * escala, CELDA_H * escala);
      }
      x += (g.ancho + 1) * escala;
    }
  }

  // Parte un texto en líneas que caben en "anchoMax" píxeles.
  function envolver(str, anchoMax, escala) {
    const parrafos = normalizar(str).split('\n');
    const lineas = [];
    parrafos.forEach((p) => {
      const palabras = p.split(' ');
      let linea = '';
      palabras.forEach((pal) => {
        const prueba = linea ? linea + ' ' + pal : pal;
        if (ancho(prueba, escala) > anchoMax && linea) {
          lineas.push(linea);
          linea = pal;
        } else linea = prueba;
      });
      lineas.push(linea);
    });
    return lineas;
  }

  // Cuenta letras visibles (sin asteriscos), útil para el efecto máquina de escribir.
  function largo(str) {
    let n = 0;
    for (const c of normalizar(str)) if (c !== '*') n++;
    return n;
  }

  // ¿Existe el dibujo de esta letra? (lo usan las pruebas para revisar los textos)
  function soporta(c) { const n = normalizar(c); return [...n].every((x) => !!glifos[x] || x === '*' || x === '\n'); }

  G.fuente = { texto, ancho, envolver, largo, normalizar, soporta, ALTO_LINEA };
})();
