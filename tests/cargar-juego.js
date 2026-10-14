// Carga los datos del juego en Node (sin navegador) para las pruebas.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function cargar() {
  const raiz = path.resolve(__dirname, '..');
  const ctx = { console, Math, JSON, Object, Array, Set, Map, Promise, Error, String, Number, setTimeout };
  ctx.window = ctx;
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  const correr = (archivo) => vm.runInContext(fs.readFileSync(path.join(raiz, archivo), 'utf8'), ctx, { filename: archivo });
  correr('js/motor/utilidades.js');
  correr('js/motor/fuente.js');
  // piezas de dibujo vacías: aquí solo importan los números y los datos
  ctx.G.pixel = {};
  ctx.G.arte = { PALETAS: {}, personaje() {}, colibri() {}, alux() {} };
  ctx.G.musica = { sil: (n) => Array(n).fill('.').join(' ') };
  ['js/juego/datos.js', 'js/juego/reglas.js', 'js/juego/mundos.js', 'js/juego/musica.js',
    'js/mundos/maya/criaturas.js', 'js/mundos/maya/musica.js', 'js/mundos/maya/historia.js', 'js/mundos/maya/mapas.js']
    .forEach(correr);
  // mundo.js usa G.entrada solo dentro de los eventos
  ctx.G.entrada = { usaTactil: () => false };
  correr('js/mundos/maya/mundo.js');
  return ctx.G;
}

module.exports = { cargar };
