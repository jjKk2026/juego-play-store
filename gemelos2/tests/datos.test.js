// Pruebas de Gemelos del Sol 2: datos del mundo y reglas del combate
// (Personaje, SistemaCombate: límite, defender, purificar, Sello Oscuro, duelo).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { cargar } = require('./cargar-juego.js');

const G = cargar();
const D = G.datos;
const mundo = G.mundos.obtener('maya2');
const fuenteMundo = fs.readFileSync(path.join(__dirname, '../js/mundos/maya2/mundo.js'), 'utf8');

// Crea una pelea de prueba (así se instancia un combate sin pantalla).
function pelea(op) {
  const heroes = (op.heroes || ['hunahpu']).map((id) => G.Personaje.deHeroe(G.reglas.crearHeroe(id, op.nivel || 5)));
  const enemigos = op.grupo.map((id) => G.Personaje.deCriatura(id));
  return new G.SistemaCombate({ heroes, enemigos, modo: op.modo || 'normal', inventario: op.inventario || {}, espiritus: op.espiritus || [], azar: () => 0.5 });
}

test('todos los mapas: salidas, criaturas, eventos y diálogos existen', () => {
  for (const [id, m] of Object.entries(mundo.mapas)) {
    const ancho = Math.max(...m.filas.map((f) => f.length));
    m.filas.forEach((f, y) => assert.strictEqual(f.length, ancho, `${id} fila ${y} mide ${f.length}`));
    for (const [letra, d] of Object.entries(m.leyenda || {})) {
      const usada = m.filas.some((f) => f.includes(letra));
      assert.ok(usada, `${id}: la letra ${letra} no aparece en el mapa`);
      if (d.tipo === 'salida') assert.ok(mundo.mapas[d.a], `${id}: salida a ${d.a} que no existe`);
      if (d.grupo && Array.isArray(d.grupo)) d.grupo.forEach((c) => assert.ok(G.mundos.criatura(c), `${id}: criatura ${c} no existe`));
      if (d.criatura) assert.ok(G.mundos.criatura(d.criatura), `${id}: criatura ${d.criatura} no existe`);
      if (d.evento) assert.ok(mundo.eventos[d.evento], `${id}: evento ${d.evento} no existe`);
      if (d.dialogo) assert.ok(mundo.dialogos[d.dialogo], `${id}: diálogo ${d.dialogo} no existe`);
      if (d.contenido && d.contenido.objeto) assert.ok(D.OBJETOS[d.contenido.objeto], `${id}: objeto ${d.contenido.objeto}`);
    }
    if (m.alEntrar) assert.ok(mundo.eventos[m.alEntrar], `${id}: alEntrar ${m.alEntrar}`);
  }
});

test('las tres reliquias se pueden conseguir y los cómics existen', () => {
  const comics = [...fuenteMundo.matchAll(/comic\('(\w+)'\)/g)].map((x) => x[1]);
  comics.concat(['intro']).forEach((c) => assert.ok(mundo.historia[c], 'Falta el cómic ' + c));
  const enCofre = Object.values(mundo.mapas).flatMap((m) => Object.values(m.leyenda || {})).filter((d) => d.contenido && D.RELIQUIAS[d.contenido.especial]).map((d) => d.contenido.especial);
  const enEventos = [...fuenteMundo.matchAll(/darReliquia\(p, '(\w+)'\)/g)].map((x) => x[1]);
  assert.strictEqual(JSON.stringify([...enCofre, ...enEventos].sort()), JSON.stringify(Object.keys(D.RELIQUIAS).sort()));
  Object.keys(mundo.pistas).length && Object.values(mundo.pistas).forEach((p) => assert.ok(typeof p === 'string'));
});

test('cada jefe purificable da un espíritu que existe', () => {
  const jefes = Object.entries(mundo.criaturas).filter(([, c]) => c.purificable);
  assert.strictEqual(jefes.length, 3);
  jefes.forEach(([id, c]) => {
    assert.ok(D.ESPIRITUS[c.espiritu], id);
    assert.strictEqual(D.ESPIRITUS[c.espiritu].de, id);
  });
  // los enemigos normales no se purifican
  Object.values(mundo.criaturas).filter((c) => !c.jefe).forEach((c) => assert.ok(!c.purificable, c.nombre));
});

test('magias y técnicas límite de los héroes existen', () => {
  Object.values(D.HEROES).forEach((h) => {
    h.magias.forEach(([m]) => assert.ok(D.MAGIAS[m], m));
    assert.ok(D.LIMITES[h.limite], h.limite);
  });
});

test('el límite sube 15% al recibir daño y 5% al atacar; Defender reduce a la mitad', () => {
  const s = pelea({ grupo: ['buho'] });
  const [h] = s.heroes;
  const [e] = s.enemigos;
  e.vida = e.vidaMax = 9999;
  s.ejecutar(h, { tipo: 'atacar', objetivo: e });
  assert.strictEqual(h.limite, D.LIMITE_AL_ATACAR);
  const plan = { actor: e, ataque: e.ataques[0], objetivos: [h] };
  let antes = h.vida;
  s.aplicarEnemigo(plan);
  const normal = antes - h.vida;
  assert.strictEqual(h.limite, D.LIMITE_AL_ATACAR + D.LIMITE_AL_RECIBIR);
  s.ejecutar(h, { tipo: 'defender' });
  antes = h.vida;
  s.aplicarEnemigo(plan);
  const defendido = antes - h.vida;
  assert.ok(Math.abs(defendido - Math.round(normal / 2)) <= 1, `normal ${normal}, defendiendo ${defendido}`);
});

test('un jefe vencido queda debilitado y al purificarlo se vuelve espíritu', () => {
  const s = pelea({ grupo: ['vucubCaquix'], modo: 'jefe' });
  const [h] = s.heroes;
  const [j] = s.enemigos;
  j.vida = 1;
  s.ejecutar(h, { tipo: 'atacar', objetivo: j });
  assert.strictEqual(j.estado, 'debilitado');
  assert.ok(!s.resultado, 'la pelea sigue hasta purificarlo');
  // ya no se le puede hacer daño
  s.ejecutar(h, { tipo: 'atacar', objetivo: j });
  assert.strictEqual(j.estado, 'debilitado');
  const op = s.opciones(h).espiritu.find((x) => x.modo === 'purificar');
  assert.ok(op && op.puede, 'Purificar está disponible');
  s.ejecutar(h, { tipo: 'espiritu', modo: 'purificar', objetivo: j });
  s.ejecutar(h, { tipo: 'espiritu', modo: 'purificar', objetivo: j });
  assert.strictEqual(j.estado, 'purificado');
  assert.strictEqual(s.resultado, 'victoria');
  assert.strictEqual(JSON.stringify(s.recompensas().espiritus), '["guacamaya"]');
});

test('Sello Oscuro: herir a tu hermano hasta 0 es derrota; bajar el sello a 0 es victoria', () => {
  let s = pelea({ grupo: ['ixbalanquePoseido'], modo: 'sello' });
  s.enemigos[0].vida = 1;
  s.ejecutar(s.heroes[0], { tipo: 'atacar', objetivo: s.enemigos[0] });
  assert.strictEqual(s.resultado, 'derrota');
  assert.strictEqual(s.motivo, 'heriste');

  s = pelea({ grupo: ['ixbalanquePoseido'], modo: 'sello', inventario: { reliquiaLuz: 3 } });
  const [h] = s.heroes, [ix] = s.enemigos;
  s.ejecutar(h, { tipo: 'objeto', id: 'reliquiaLuz', objetivo: ix });
  assert.strictEqual(ix.sello, 100 - D.RELIQUIA_SELLO);
  h.limite = 100;
  s.ejecutar(h, { tipo: 'espiritu', modo: 'purificar', objetivo: ix });
  assert.strictEqual(h.limite, 50);
  assert.strictEqual(ix.sello, 100 - D.RELIQUIA_SELLO - D.PURIFICAR_SELLO);
  s.ejecutar(h, { tipo: 'objeto', id: 'reliquiaLuz', objetivo: ix });
  s.ejecutar(h, { tipo: 'objeto', id: 'reliquiaLuz', objetivo: ix });
  assert.strictEqual(ix.sello, 0);
  assert.strictEqual(s.resultado, 'selloRoto');
});

test('duelo: la chispa de luz hace retroceder a la sombra', () => {
  const s = pelea({ grupo: ['ixbalanqueDuelo'], modo: 'duelo', inventario: { chispa: 1 } });
  s.ejecutar(s.heroes[0], { tipo: 'objeto', id: 'chispa' });
  assert.strictEqual(s.resultado, 'retirada');
});

test('la técnica gemela necesita los dos límites llenos', () => {
  const s = pelea({ grupo: ['avatar'], modo: 'final', heroes: ['hunahpu', 'ixbalanque'], nivel: 12 });
  const [a, b] = s.heroes;
  a.limite = 100;
  assert.ok(!s.opciones(a).espiritu.find((x) => x.modo === 'gemela' && x.puede));
  b.limite = 100;
  b.atb = 100;   // el hermano también debe tener su turno listo
  assert.ok(s.opciones(a).espiritu.find((x) => x.modo === 'gemela' && x.puede));
  const vida = s.enemigos[0].vida;
  s.ejecutar(a, { tipo: 'espiritu', modo: 'gemela', id: 'tecnicaGemela', objetivo: s.enemigos });
  assert.ok(s.enemigos[0].vida < vida);
  assert.strictEqual(a.limite + b.limite, 0);
});

test('partida nueva: Hunahpú viaja solo y su hermano se une al nivel de él', () => {
  const p = G.partida;
  p.nueva('maya2');
  assert.strictEqual(JSON.stringify(p.equipo().map((h) => h.id)), '["hunahpu"]');
  const h = p.heroe('hunahpu');
  for (let i = 0; i < 6; i++) G.reglas.ganarXP(h, G.reglas.xpSiguiente(h.nivel));
  p.unirAlEquipo('ixbalanque');
  assert.strictEqual(JSON.stringify(p.equipo().map((x) => x.nivel)), JSON.stringify([h.nivel, h.nivel]));
});
