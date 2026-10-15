// Simulador: juega muchas batallas con el SistemaCombate real (el mismo del juego)
// usando un jugador automático, para medir la dificultad.
'use strict';

// Jugador automático: cura cuando hace falta, purifica cuando corresponde,
// usa debilidades, límite, espíritus y la técnica gemela.
function elegir(G, s, h, op) {
  const o = s.opciones(h);
  const vivosE = s.enemigos.filter((e) => e.vivo);
  const sello = vivosE.find((e) => e.sello !== null);
  const debil = vivosE.find((e) => e.estado === 'debilitado');
  const pur = o.espiritu.find((x) => x.modo === 'purificar' && x.puede);
  if (debil && pur) return { tipo: 'espiritu', modo: 'purificar', objetivo: debil };
  const herido = s.heroes.filter((x) => x.vivo).find((x) => x.vida < x.vidaMax * 0.4);
  const cura = o.magia.find((m) => m.id === 'aguaLuna' && m.puede);
  if (herido && cura) return { tipo: 'magia', id: 'aguaLuna', objetivo: herido };
  if (herido && (s.inventario.cacao || 0) > 0) return { tipo: 'objeto', id: 'cacao', objetivo: herido };
  if (sello) {
    if (pur) return { tipo: 'espiritu', modo: 'purificar', objetivo: sello };
    if ((s.inventario.reliquiaLuz || 0) > 0) return { tipo: 'objeto', id: 'reliquiaLuz', objetivo: sello };
    const inv = o.espiritu.find((x) => x.modo === 'invocar' && x.puede && x.id === 'guacamaya');
    if (inv && h.vida < h.vidaMax * 0.7) return { tipo: 'espiritu', modo: 'invocar', id: inv.id };
    return { tipo: 'defender' };   // esperar a llenar el límite sin herir a su hermano
  }
  if (s.modo === 'duelo') {
    if (op.chispa && (s.inventario.chispa || 0) > 0 && s.turnosHeroe >= 2) return { tipo: 'objeto', id: 'chispa' };
    return { tipo: 'defender' };
  }
  const gem = o.espiritu.find((x) => x.modo === 'gemela' && x.puede);
  if (gem) return { tipo: 'espiritu', modo: 'gemela', id: 'tecnicaGemela', objetivo: vivosE };
  const lim = o.espiritu.find((x) => x.modo === 'limite' && x.puede);
  const objetivo = vivosE.filter((e) => e.estado === 'normal').sort((a, b) => a.vida - b.vida)[0] || vivosE[0];
  if (!objetivo) return { tipo: 'defender' };
  const inv = o.espiritu.find((x) => x.modo === 'invocar' && x.puede);
  if (inv) return { tipo: 'espiritu', modo: 'invocar', id: inv.id };
  if (lim) return { tipo: 'espiritu', modo: 'limite', objetivo: lim.objetivo === 'enemigos' ? vivosE : objetivo };
  if (h.pe < 5 && (s.inventario.jade || 0) > 0 && s.enemigos.some((e) => e.jefe)) return { tipo: 'objeto', id: 'jade', objetivo: h };
  const magia = o.magia.filter((m) => m.puede && m.objetivo !== 'aliado' && m.objetivo !== 'aliados').map((m) => [m, G.datos.MAGIAS[m.id]])
    .filter(([, d]) => (d.objetivo === 'enemigos' && vivosE.length > 1) || (d.elemento || []).some((x) => (objetivo.debil || []).includes(x)))
    .sort((a, b) => b[1].potencia - a[1].potencia)[0];
  if (magia) return { tipo: 'magia', id: magia[0].id, objetivo: magia[1].objetivo === 'enemigos' ? vivosE : objetivo };
  return { tipo: 'atacar', objetivo, preciso: Math.random() < (op.preciso === undefined ? 0.5 : op.preciso) };
}

function simular(G, op) {
  const heroes = (op.heroes || ['hunahpu']).map((id) => {
    const h = G.reglas.crearHeroe(id, op.nivel);
    return G.Personaje.deHeroe(h);
  });
  const enemigos = op.grupo.map((id) => G.Personaje.deCriatura(id));
  const s = new G.SistemaCombate({ heroes, enemigos, modo: op.modo || 'normal', inventario: Object.assign({}, op.objetos || {}), espiritus: op.espiritus || [] });
  const dt = 0.05;
  for (let t = 0; t < 900 && !s.resultado; t += dt) {
    s.actualizar(dt);
    while (s.listos.length && !s.resultado) { const h = s.listos[0]; s.ejecutar(h, elegir(G, s, h, op)); }
    let e;
    while (!s.resultado && (e = s.siguienteEnemigo())) s.aplicarEnemigo(s.planEnemigo(e));
  }
  return { resultado: s.resultado || 'tiempo', motivo: s.motivo, t: s.tiempo, s };
}

function tasa(G, op, n) {
  const cuenta = {};
  let t = 0;
  for (let i = 0; i < (n || 300); i++) { const r = simular(G, op); cuenta[r.resultado] = (cuenta[r.resultado] || 0) + 1; t += r.t; }
  Object.keys(cuenta).forEach((k) => { cuenta[k] /= (n || 300); });
  return { cuenta, tiempo: t / (n || 300) };
}

module.exports = { simular, tasa, elegir };
