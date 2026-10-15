/* =====================================================================
   REGLAS (las "matemáticas" del juego)
   Cálculo de daño, experiencia, niveles y técnicas aprendidas.
   No dibuja nada: así se puede probar en la computadora sin abrir el juego.
   ===================================================================== */
'use strict';

(function (raiz) {
  const G = raiz.G = raiz.G || {};
  const D = () => G.datos;

  const R = {
    MULT_DEBIL: 1.75,
    MULT_RESISTE: 0.5,
    MULT_PRECISO: 1.5,
    MULT_CRITICO: 1.6,
    PROB_CRITICO: 0.07,

    // Experiencia que falta para pasar del nivel n al n+1.
    xpSiguiente(n) { return Math.round(12 * Math.pow(n, 1.7) + 12); },

    stats(h) {
      const def = D().HEROES[h.id];
      const n = h.nivel - 1;
      const s = {};
      Object.keys(def.base).forEach((k) => { s[k] = Math.round(def.base[k] + def.crec[k] * n); });
      return s;
    },

    crearHeroe(id, nivel) {
      const h = { id, nivel: nivel || 1, xp: 0, vida: 0, energia: 0 };
      const s = R.stats(h);
      h.vida = s.vida; h.energia = s.energia;
      return h;
    },

    // Magias que el héroe ya aprendió según su nivel.
    magiasDe(h) {
      return D().HEROES[h.id].magias.filter(([, n]) => h.nivel >= n).map(([t]) => t);
    },
    tecnicasDe(h) { return R.magiasDe(h); },

    // Suma experiencia y devuelve lo que pasó (subidas de nivel y técnicas nuevas).
    ganarXP(h, xp) {
      const eventos = [];
      if (h.vida <= 0) return eventos; // los caídos no ganan experiencia
      h.xp += xp;
      while (h.nivel < D().NIVEL_MAX && h.xp >= R.xpSiguiente(h.nivel)) {
        h.xp -= R.xpSiguiente(h.nivel);
        const antes = R.stats(h);
        const sabia = R.tecnicasDe(h);
        h.nivel++;
        const ahora = R.stats(h);
        h.vida += ahora.vida - antes.vida;
        h.energia += ahora.energia - antes.energia;
        const nuevas = R.tecnicasDe(h).filter((t) => !sabia.includes(t));
        eventos.push({ tipo: 'nivel', nivel: h.nivel, nuevas, antes, ahora });
      }
      return eventos;
    },

    // Multiplicador por elemento: busca el mejor elemento del ataque contra el defensor.
    elemento(elementos, debil, resiste) {
      if (!elementos || !elementos.length) return { mult: 1, tipo: null };
      let mejor = { mult: -1, tipo: null };
      elementos.forEach((e) => {
        let m = 1, t = null;
        if (debil && debil.includes(e)) { m = R.MULT_DEBIL; t = 'debil'; }
        else if (resiste && resiste.includes(e)) { m = R.MULT_RESISTE; t = 'resiste'; }
        if (m > mejor.mult) mejor = { mult: m, tipo: t };
      });
      return mejor;
    },

    /**
     * Calcula el daño de un golpe.
     * a: atacante {fue, mag}, d: defensor {def, debil, resiste, escudo}
     * op: {tipo, potencia, elementos, preciso, critico, azar}
     */
    danio(a, d, op) {
      const azar = op.azar !== undefined ? op.azar : (0.9 + Math.random() * 0.2);
      let base;
      const defensa = d.def * (d.escudo ? d.escudo : 1);
      if (op.tipo === 'magico') base = a.mag * op.potencia * 2.4 - defensa * 0.6;
      else base = a.fue * op.potencia * 2.2 - defensa * 1.1;
      const minimo = (op.tipo === 'magico' ? a.mag : a.fue) * op.potencia * 0.35;
      base = Math.max(minimo, base);
      const el = R.elemento(op.elementos, d.debil, d.resiste);
      let total = base * el.mult * azar;
      if (op.preciso) total *= R.MULT_PRECISO;
      if (op.critico) total *= R.MULT_CRITICO;
      return { danio: Math.max(1, Math.round(total)), elemento: el.tipo };
    },

    curacion(mag, potencia) { return Math.round(mag * potencia + 20); },

    // Cuánto se llena la barra de tiempo por segundo (100 = llena).
    velocidadATB(vel) { return (vel + 22) * 1.15; },

    probHuir(velHeroes, velEnemigos) {
      return G.util && G.util.limitar ? G.util.limitar(0.45 + (velHeroes - velEnemigos) * 0.03, 0.2, 0.9)
        : Math.min(0.9, Math.max(0.2, 0.45 + (velHeroes - velEnemigos) * 0.03));
    }
  };

  G.reglas = R;
})(typeof window !== 'undefined' ? window : globalThis);
