// Prueba de dificultad: simula cientos de combates contra cada jefe y
// comprueba que se pueden vencer al nivel esperado (sin ser demasiado fáciles).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { cargar } = require('./cargar-juego.js');
const { tasa } = require('./simulador.js');

const G = cargar();
const CASOS = [
  // jefe, nivel esperado, objetos típicos a esa altura del juego
  { grupo: ['vucubCaquix'], nivel: 4, objetos: { cacao: 3, pluma: 1, jade: 2 } },
  { grupo: ['zipacna'], nivel: 9, objetos: { cacao: 5, pluma: 2, jade: 4 } },
  { grupo: ['hunCame', 'vucubCame'], nivel: 13, objetos: { cacao: 6, pluma: 3, jade: 4 } }
];

for (const c of CASOS) {
  test(`${c.grupo.join(' y ')} se puede vencer al nivel ${c.nivel}`, () => {
    const r = tasa(G, Object.assign({ jefe: true }, c), 250);
    assert.ok(r.victorias >= 0.85, `Solo ${(r.victorias * 100).toFixed(0)}% de victorias`);
  });
  test(`${c.grupo.join(' y ')} es un reto 3 niveles antes`, () => {
    const r = tasa(G, Object.assign({ jefe: true }, c, { nivel: c.nivel - 3 }), 250);
    assert.ok(r.victorias <= 0.6, `Demasiado fácil: ${(r.victorias * 100).toFixed(0)}% de victorias`);
  });
}

test('los enemigos comunes no son imposibles en su zona', () => {
  const grupos = [[['buho', 'murcielago'], 2], [['jaguarSombra'], 2], [['esqueleto', 'buhoObsidiana'], 6], [['murcielagoCasa', 'murcielagoCasa'], 10], [['jaguarObsidiana'], 10]];
  for (const [g, n] of grupos) {
    const r = tasa(G, { grupo: g, nivel: n, objetos: { cacao: 1 } }, 150);
    assert.ok(r.victorias >= 0.9, `${g.join('+')} en nivel ${n}: ${(r.victorias * 100).toFixed(0)}%`);
  }
});
