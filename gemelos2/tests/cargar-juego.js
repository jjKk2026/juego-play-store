// Carga la lógica y los datos del juego en Node (sin navegador) para las pruebas.
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
  ctx.G.pixel = {};
  ctx.G.arte = { PALETAS: {}, personaje() {}, colibri() {}, alux() {} };
  ctx.G.musica = { sil: (n) => Array(n).fill('.').join(' ') };
  ['js/juego/datos.js', 'js/juego/reglas.js', 'js/juego/mundos.js', 'js/juego/musica.js',
    'js/combate/personaje.js', 'js/combate/sistema.js',
    'js/mundos/maya2/criaturas.js', 'js/mundos/maya2/musica.js', 'js/mundos/maya2/historia.js', 'js/mundos/maya2/mapas.js',
    'js/juego/estado.js'].forEach(correr);
  ctx.G.entrada = { usaTactil: () => false, explicacion: () => '', etiqueta: (b) => b };
  if (fs.existsSync(path.join(raiz, 'js/mundos/maya2/mundo.js'))) correr('js/mundos/maya2/mundo.js');
  return ctx.G;
}

module.exports = { cargar };
