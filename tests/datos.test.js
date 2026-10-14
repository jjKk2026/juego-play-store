// Pruebas de los datos del juego: mapas, salidas, llaves, textos y reglas.
// Uso: node --test tests/
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { cargar } = require('./cargar-juego.js');

const raiz = path.resolve(__dirname, '..');
const G = cargar();
const mundo = G.mundos.obtener('maya');
const TILES = new Set(['.', ',', '"', ':', 'T', '#', '~', '=', 'r', 'b', 'v', 'n', 'h', 'F', 'w']);
const SOLIDOS = new Set(['T', '#', '~', 'r', 'b', 'v', 'n', 'F']);

test('todos los archivos de index.html existen y están en sw.js (para jugar sin internet)', () => {
  const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(raiz, 'sw.js'), 'utf8');
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(scripts.length > 20);
  for (const s of scripts.concat(['css/juego.css', 'manifest.json'])) {
    assert.ok(fs.existsSync(path.join(raiz, s)), 'Falta ' + s);
    assert.ok(sw.includes("'./" + s + "'"), s + ' no está en sw.js');
  }
  for (const m of [...sw.matchAll(/'\.\/([^']+)'/g)].map((x) => x[1])) {
    assert.ok(fs.existsSync(path.join(raiz, m)), 'sw.js menciona un archivo que no existe: ' + m);
  }
});

test('cada mapa es rectangular y sus letras están definidas', () => {
  for (const [id, m] of Object.entries(mundo.mapas)) {
    const w = m.filas[0].length;
    m.filas.forEach((f, y) => assert.strictEqual(f.length, w, `${id}: la fila ${y} mide ${f.length} y debería medir ${w}`));
    const ley = m.leyenda || {};
    m.filas.forEach((f, y) => [...f].forEach((c, x) => {
      assert.ok(TILES.has(c) || ley[c], `${id}: la letra "${c}" en (${x},${y}) no está definida`);
    }));
    assert.ok(mundo.zonas[m.zona], `${id}: zona desconocida ${m.zona}`);
    assert.ok(G.musica[m.musica], `${id}: música desconocida ${m.musica}`);
  }
});

function objetos(mapaId) {
  const m = mundo.mapas[mapaId];
  const r = [];
  m.filas.forEach((f, y) => [...f].forEach((c, x) => { if (m.leyenda && m.leyenda[c]) r.push(Object.assign({ x, y, marca: c }, m.leyenda[c])); }));
  return r;
}

test('las salidas llevan a lugares que existen y se pueden pisar', () => {
  for (const id of Object.keys(mundo.mapas)) {
    for (const o of objetos(id).filter((x) => x.tipo === 'salida')) {
      const destino = mundo.mapas[o.a];
      assert.ok(destino, `${id}: la salida (${o.x},${o.y}) va a un mapa que no existe: ${o.a}`);
      const c = destino.filas[o.y] && destino.filas[o.y][o.x];
      assert.ok(c !== undefined, `${id} -> ${o.a}: llegada fuera del mapa (${o.x},${o.y})`);
      const def = destino.leyenda[c];
      assert.ok(!SOLIDOS.has(c), `${id} -> ${o.a}: se llega a una pared en (${o.x},${o.y})`);
      assert.ok(!def || (def.tipo !== 'salida' && def.tipo !== 'cofre'), `${id} -> ${o.a}: se llega encima de "${def && def.tipo}"`);
    }
  }
  const ini = mundo.inicio;
  assert.ok(!SOLIDOS.has(mundo.mapas[ini.mapa].filas[ini.y][ini.x]), 'El inicio está en una pared');
});

test('las referencias de los mapas existen (criaturas, diálogos, eventos, objetos)', () => {
  for (const id of Object.keys(mundo.mapas)) {
    for (const o of objetos(id)) {
      const donde = `${id} (${o.x},${o.y}) "${o.marca}"`;
      if (o.tipo === 'enemigo') o.grupo.forEach((c) => assert.ok(G.mundos.criatura(c), `${donde}: criatura ${c}`));
      if (o.tipo === 'jefe') { assert.ok(G.mundos.criatura(o.criatura), donde); assert.ok(mundo.eventos[o.evento], `${donde}: evento ${o.evento}`); }
      if (o.dialogo) assert.ok(Array.isArray(o.dialogo) || mundo.dialogos[o.dialogo], `${donde}: diálogo ${o.dialogo}`);
      if (o.evento) assert.ok(mundo.eventos[o.evento], `${donde}: evento ${o.evento}`);
      if (o.tipo === 'cofre') {
        const c = o.contenido;
        assert.ok(c.llave || c.llaveJefe || c.mapa || c.especial || G.datos.OBJETOS[c.objeto], `${donde}: cofre sin contenido válido`);
      }
      if (o.tipo === 'guardian') assert.ok(G.mundos.criatura(o.criatura), donde);
    }
    if (mundo.mapas[id].alEntrar) assert.ok(mundo.eventos[mundo.mapas[id].alEntrar], `${id}: evento al entrar`);
  }
});

test('hay suficientes llaves para las puertas de cada zona', () => {
  const zonas = {};
  for (const [id, m] of Object.entries(mundo.mapas)) {
    const z = zonas[m.zona] = zonas[m.zona] || { llaves: 0, puertas: 0, jefe: 0, llaveJefe: 0 };
    for (const o of objetos(id)) {
      if (o.tipo === 'cofre' && o.contenido.llave) z.llaves++;
      if (o.tipo === 'cofre' && o.contenido.llaveJefe) z.llaveJefe++;
      if (o.tipo === 'puerta' && o.clase === 'llave') z.puertas++;
      if (o.tipo === 'puerta' && o.clase === 'jefe') z.jefe++;
    }
  }
  for (const [z, d] of Object.entries(zonas)) {
    assert.ok(d.llaves >= d.puertas, `Zona ${z}: ${d.puertas} puertas y solo ${d.llaves} llaves`);
    assert.ok(d.jefe === 0 || d.llaveJefe > 0, `Zona ${z}: puerta roja sin llave del guardián`);
  }
});

test('las rejas tienen interruptores y los cristales en orden están completos', () => {
  for (const id of Object.keys(mundo.mapas)) {
    const objs = objetos(id);
    for (const b of objs.filter((o) => o.tipo === 'barrera')) {
      const piezas = objs.filter((o) => o.grupo === b.grupo && ['placa', 'diana', 'brasero'].includes(o.tipo));
      assert.ok(piezas.length, `${id}: la reja del grupo ${b.grupo} no tiene interruptores`);
      const ordenes = piezas.filter((p) => p.orden).map((p) => p.orden).sort();
      if (ordenes.length) assert.deepStrictEqual(ordenes, ordenes.map((_, i) => i + 1), `${id}: orden de cristales incompleto`);
    }
    const luc = objs.filter((o) => o.tipo === 'luciernaga').length;
    if (mundo.mapas[id].luciernagas) assert.strictEqual(luc, mundo.mapas[id].luciernagas, `${id}: cantidad de luciérnagas`);
  }
  // tres sellos para la puerta del trono
  const sellos = Object.keys(mundo.mapas).reduce((a, id) => a + objetos(id).filter((o) => o.tipo === 'cofre' && o.contenido.especial === 'sellos').length, 0);
  assert.strictEqual(sellos, 3);
});

test('las criaturas tienen nombre, ataques y texto del bestiario', () => {
  for (const c of G.mundos.todasLasCriaturas()) {
    assert.ok(c.nombre && c.bestiario && c.bestiario.length > 60, c.id);
    if (!c.aliado) {
      assert.ok(c.vida > 0 && c.ataques.length > 0, c.id);
      [...(c.debil || []), ...(c.resiste || [])].forEach((e) => assert.ok(G.datos.ELEMENTOS[e], `${c.id}: elemento ${e}`));
    }
  }
});

test('todas las letras de los textos existen en la fuente del juego', () => {
  const textos = [];
  const juntar = (v) => {
    if (typeof v === 'string') textos.push(v);
    else if (Array.isArray(v)) v.forEach(juntar);
    else if (v && typeof v === 'object') Object.values(v).forEach(juntar);
  };
  juntar(mundo.historia); juntar(mundo.dialogos); juntar(mundo.pistas); juntar(mundo.fragmentos);
  G.mundos.todasLasCriaturas().forEach((c) => juntar([c.nombre, c.bestiario, c.titulo, (c.ataques || []).map((a) => [a.nombre, a.frase])]));
  juntar(G.datos);
  // textos de los eventos (dentro del código del mundo)
  const codigo = fs.readFileSync(path.join(raiz, 'js/mundos/maya/mundo.js'), 'utf8');
  [...codigo.replace(/\\'/g, "’").matchAll(/'([^'\n]{8,})'/g)].forEach((m) => textos.push(m[1]));
  const malas = new Set();
  textos.forEach((t) => [...t].forEach((c) => { if (!G.fuente.soporta(c)) malas.add(c); }));
  assert.deepStrictEqual([...malas], [], 'Letras sin dibujo: ' + [...malas].join(' '));
});

test('las escenas de cómic usan personajes que existen', () => {
  const validos = new Set(['hunahpu', 'ixbalanque', 'abuela', 'sombra', 'colibri', 'alux']);
  for (const [id, h] of Object.entries(mundo.historia)) {
    h.paginas.forEach((p) => p.vinetas.forEach((v) => (v.actores || []).forEach((a) => {
      assert.ok(validos.has(a.id) || G.mundos.criatura(a.id), `${id}: actor ${a.id}`);
    })));
  }
});

test('reglas: experiencia, técnicas y daño', () => {
  for (let n = 1; n < 30; n++) assert.ok(G.reglas.xpSiguiente(n + 1) > G.reglas.xpSiguiente(n));
  for (const h of Object.values(G.datos.HEROES)) h.tecnicas.forEach(([t]) => assert.ok(G.datos.TECNICAS[t], t));
  for (const d of Object.values(G.datos.DOBLES)) d.requiere.forEach((t) => assert.ok(G.datos.TECNICAS[t], t));
  const h = G.reglas.crearHeroe('hunahpu', 1);
  const ev = G.reglas.ganarXP(h, 10000);
  assert.ok(h.nivel > 10 && ev.length > 0);
  const base = G.reglas.danio({ fue: 20, mag: 10 }, { def: 5 }, { tipo: 'fisico', potencia: 1, azar: 1 }).danio;
  const debil = G.reglas.danio({ fue: 20, mag: 10 }, { def: 5, debil: ['fuego'] }, { tipo: 'fisico', potencia: 1, elementos: ['fuego'], azar: 1 });
  const preciso = G.reglas.danio({ fue: 20, mag: 10 }, { def: 5 }, { tipo: 'fisico', potencia: 1, preciso: true, azar: 1 }).danio;
  assert.strictEqual(debil.elemento, 'debil');
  assert.ok(debil.danio > base && preciso > base);
});
