// Prueba de dificultad de Gemelos del Sol 2: simula cientos de combates con el
// SistemaCombate real y comprueba que cada jefe se vence al nivel esperado.
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./cargar-juego.js');
const { tasa } = require('./simulador.js');

const G = cargar();
const ganar = (r, k) => (r.cuenta[k] || 0);

// jefe, modo, nivel esperado y lo que normalmente lleva el jugador a esa altura
const CASOS = [
  { grupo: ['vucubCaquix'], modo: 'jefe', nivel: 4, objetos: { cacao: 3, pluma: 1, jade: 2 }, gana: 'victoria' },
  { grupo: ['camazotz'], modo: 'jefe', nivel: 7, objetos: { cacao: 4, pluma: 2, jade: 3 }, espiritus: ['guacamaya'], gana: 'victoria' },
  { grupo: ['zipacna'], modo: 'jefe', nivel: 9, objetos: { cacao: 5, pluma: 2, jade: 4 }, espiritus: ['guacamaya', 'murcielago'], gana: 'victoria' },
  { grupo: ['ixbalanquePoseido'], modo: 'sello', nivel: 10, objetos: { cacao: 6, pluma: 2, jade: 4, reliquiaLuz: 3 }, espiritus: ['guacamaya', 'murcielago', 'montana'], gana: 'selloRoto' },
  { grupo: ['avatar'], modo: 'final', heroes: ['hunahpu', 'ixbalanque'], nivel: 12, objetos: { cacao: 6, pluma: 2, jade: 4 }, espiritus: ['guacamaya', 'murcielago', 'montana'], gana: 'victoria' }
];

for (const c of CASOS) {
  test(`${c.grupo[0]} (${c.modo}) se puede ganar al nivel ${c.nivel}`, () => {
    const r = tasa(G, c, 200);
    assert.ok(ganar(r, c.gana) >= 0.8, `Solo ${(ganar(r, c.gana) * 100).toFixed(0)}%: ${JSON.stringify(r.cuenta)}`);
  });
  test(`${c.grupo[0]} (${c.modo}) es un reto 3 niveles antes`, () => {
    const r = tasa(G, Object.assign({}, c, { nivel: c.nivel - 3 }), 200);
    assert.ok(ganar(r, c.gana) <= 0.7, `Demasiado fácil: ${(ganar(r, c.gana) * 100).toFixed(0)}%`);
  });
}

test('el duelo se supera resistiendo o con la chispa de luz', () => {
  const r = tasa(G, { grupo: ['ixbalanqueDuelo'], modo: 'duelo', nivel: 4, objetos: { cacao: 3, chispa: 1 }, chispa: true }, 150);
  assert.ok(ganar(r, 'retirada') >= 0.9, JSON.stringify(r.cuenta));
});

test('los enemigos comunes no son imposibles en su zona', () => {
  const grupos = [[['buho', 'murcielago'], 2], [['jaguarSombra'], 2], [['esqueleto', 'buhoObsidiana'], 6], [['murcielagoNeon', 'murcielagoNeon'], 6], [['esqueleto', 'esqueleto'], 8], [['esqueletoNoble', 'buhoObsidiana'], 10]];
  for (const [g, n] of grupos) {
    const r = tasa(G, { grupo: g, nivel: n, objetos: { cacao: 1 } }, 150);
    assert.ok(ganar(r, 'victoria') >= 0.9, `${g.join('+')} en nivel ${n}: ${JSON.stringify(r.cuenta)}`);
  }
});
