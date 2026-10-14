// Simulador de combates: juega muchas batallas con las mismas reglas del
// juego para comprobar que los jefes se pueden vencer al nivel esperado.
'use strict';

function simular(G, op) {
  const R = G.reglas, D = G.datos;
  const rnd = Math.random;
  const heroes = ['hunahpu', 'ixbalanque'].map((id) => {
    const ref = R.crearHeroe(id, op.nivel);
    return { tipo: 'heroe', id, ref, s: R.stats(ref), atb: 30 + rnd() * 40, escudoT: 0 };
  });
  const objetos = Object.assign({ cacao: 0, jade: 0, pluma: 0 }, op.objetos);
  const enemigos = op.grupo.map((id) => {
    const c = G.mundos.criatura(id);
    return { tipo: 'enemigo', id, def: c, vida: c.vida, vidaMax: c.vida, s: { fue: c.fue, def: c.def, mag: c.mag, vel: c.vel }, debil: c.debil || [], resiste: c.resiste || [], atb: rnd() * 50, furia: false, fase: 0 };
  });
  const vivosH = () => heroes.filter((h) => h.ref.vida > 0);
  const vivosE = () => enemigos.filter((e) => e.vida > 0);
  const pPreciso = op.preciso === undefined ? 0.5 : op.preciso;
  let t = 0;

  const golpear = (a, d, o) => {
    const critico = o.puedeCritico && rnd() < R.PROB_CRITICO;
    const def = d.tipo === 'heroe' ? { def: d.s.def, escudo: d.escudoT > 0 ? 1.6 : 0 } : { def: d.s.def, debil: d.debil, resiste: d.resiste };
    let n = R.danio(a.s, def, { tipo: o.tipo, potencia: o.potencia, elementos: o.elementos, preciso: o.preciso, critico }).danio;
    if (a.tipo === 'enemigo' && a.furia) n = Math.round(n * 1.2);
    if (d.tipo === 'heroe') { d.ref.vida = Math.max(0, d.ref.vida - n); if (d.ref.vida <= 0) { d.atb = 0; d.escudoT = 0; } }
    else {
      d.vida = Math.max(0, d.vida - n);
      if (d.vida <= 0 && op.jefe) vivosE().forEach((x) => { x.furia = true; });
      else if (op.jefe && d.fase === 0 && d.vida < d.vidaMax * 0.5) { d.fase = 1; d.furia = true; }
    }
  };

  const turnoHeroe = (h) => {
    const otro = heroes.find((x) => x !== h);
    const vivos = vivosE();
    if (otro.ref.vida <= 0 && objetos.pluma > 0) { objetos.pluma--; otro.ref.vida = Math.round(otro.s.vida * 0.5); otro.atb = 0; return; }
    const herido = vivosH().find((x) => x.ref.vida < x.s.vida * 0.4);
    if (herido) {
      if (h.id === 'ixbalanque' && R.tecnicasDe(h.ref).includes('aguaLuna') && h.ref.energia >= 5) {
        h.ref.energia -= 5; herido.ref.vida = Math.min(herido.s.vida, herido.ref.vida + R.curacion(h.s.mag, 2.4)); return;
      }
      if (objetos.cacao > 0) { objetos.cacao--; herido.ref.vida = Math.min(herido.s.vida, herido.ref.vida + 60); return; }
    }
    if (h.ref.energia < 4 && objetos.jade > 0) { objetos.jade--; h.ref.energia = Math.min(h.s.energia, h.ref.energia + 20); return; }
    const objetivo = vivos.reduce((a, b) => (a.vida < b.vida ? a : b));
    const debil = (els, e) => (els || []).some((x) => e.debil.includes(x));
    if (otro.ref.vida > 0 && otro.atb >= 100) {
      const iH = heroes.indexOf(h);
      const dobles = R.doblesDisponibles(heroes.map((x) => x.ref)).filter((id) => {
        const tt = D.DOBLES[id];
        return h.ref.energia >= tt.costo[iH] && otro.ref.energia >= tt.costo[1 - iH];
      }).sort((a, b) => D.DOBLES[b].potencia - D.DOBLES[a].potencia);
      if (dobles.length) {
        const tt = D.DOBLES[dobles[0]];
        h.ref.energia -= tt.costo[iH]; otro.ref.energia -= tt.costo[1 - iH]; otro.atb = 0;
        const objs = tt.objetivo === 'enemigos' ? vivos : [objetivo];
        objs.forEach((u) => golpear(h, u, { tipo: tt.tipo, potencia: tt.potencia, elementos: tt.elemento }));
        if (tt.curaAliados) vivosH().forEach((x) => { x.ref.vida = Math.min(x.s.vida, x.ref.vida + Math.round(x.s.vida * tt.curaAliados)); });
        return;
      }
    }
    const tecs = R.tecnicasDe(h.ref).map((id) => D.TECNICAS[id]).filter((tt) => (tt.objetivo === 'enemigo' || tt.objetivo === 'enemigos') && h.ref.energia >= tt.costo);
    const buena = tecs.filter((tt) => (tt.objetivo === 'enemigos' && vivos.length > 1) || debil(tt.elemento, objetivo)).sort((a, b) => b.potencia - a.potencia)[0];
    if (buena) {
      h.ref.energia -= buena.costo;
      (buena.objetivo === 'enemigos' ? vivos : [objetivo]).forEach((u) => golpear(h, u, { tipo: buena.tipo, potencia: buena.potencia, elementos: buena.elemento }));
      return;
    }
    if (h.id === 'ixbalanque' && h.ref.energia >= 4 && !vivosH().every((x) => x.escudoT > 0) && rnd() < 0.25) {
      h.ref.energia -= 4; vivosH().forEach((x) => { x.escudoT = 18; }); return;
    }
    golpear(h, objetivo, { tipo: 'fisico', potencia: 1, preciso: rnd() < pPreciso, puedeCritico: true });
  };

  const turnoEnemigo = (e) => {
    const vivos = vivosH();
    if (!vivos.length) return;
    const lista = e.def.ataques;
    let r = rnd() * lista.reduce((a, x) => a + x.prob, 0);
    let at = lista[0];
    for (const a of lista) { r -= a.prob; if (r <= 0) { at = a; break; } }
    const objs = at.objetivo === 'todos' ? vivos : [rnd() < 0.35 ? vivos.reduce((a, b) => (a.ref.vida < b.ref.vida ? a : b)) : vivos[Math.floor(rnd() * vivos.length)]];
    objs.forEach((u) => {
      golpear(e, u, { tipo: at.tipo, potencia: at.potencia, elementos: at.elemento ? [at.elemento] : [] });
      if (at.aturdir && u.ref.vida > 0 && rnd() < at.aturdir) u.atb = 0;
    });
  };

  const dt = 0.05;
  while (t < 600) {
    t += dt;
    heroes.forEach((h) => { if (h.escudoT > 0) h.escudoT -= dt; });
    for (const h of heroes) {
      if (h.ref.vida <= 0) continue;
      h.atb += R.velocidadATB(h.s.vel) * dt;
      if (h.atb >= 100) { h.atb = 0; turnoHeroe(h); if (!vivosE().length) return { gana: true, t }; }
    }
    for (const e of vivosE()) {
      e.atb += R.velocidadATB(e.s.vel * (e.furia ? 1.25 : 1)) * dt * (op.jefe ? 0.85 : 0.8);
      if (e.atb >= 100) { e.atb = 0; turnoEnemigo(e); if (!vivosH().length) return { gana: false, t }; }
    }
  }
  return { gana: false, t };
}

function tasa(G, op, n) {
  let g = 0, tt = 0;
  for (let i = 0; i < (n || 400); i++) { const r = simular(G, op); if (r.gana) { g++; tt += r.t; } }
  return { victorias: g / (n || 400), tiempo: g ? tt / g : 0 };
}

module.exports = { simular, tasa };
