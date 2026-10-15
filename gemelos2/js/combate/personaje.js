/* =====================================================================
   PERSONAJE (clase de combate)
   Representa a cualquiera que pelea: un gemelo o una criatura.
   Guarda su vida, PE (Puntos de Espíritu), barra de tiempo (ATB),
   barra de límite, si está defendiendo y, en los jefes especiales,
   la barra del Sello Oscuro o de corrupción.
   No dibuja nada: solo números (así se puede probar sin pantalla).
   ===================================================================== */
'use strict';

(function (raiz) {
  const G = raiz.G = raiz.G || {};

  class Personaje {
    constructor(def) {
      Object.assign(this, {
        id: '', nombre: '', equipo: 'enemigos',
        vida: 1, vidaMax: 1, pe: 0, peMax: 0,
        fue: 1, def: 1, mag: 1, vel: 10,
        debil: [], resiste: [], ataques: [],
        atb: 0, limite: 0, defendiendo: false, escudoT: 0,
        estado: 'normal',      // normal, caido, debilitado, purificado, retirado
        jefe: false, purificable: false,
        sello: null, selloMax: 100,   // Sello Oscuro (solo Ixbalanqué poseído)
        corrupcion: null,             // corrupción de un jefe vencido (se purifica)
        furia: false, plumaUsada: false, enCola: false
      }, def);
    }

    // Crea el personaje a partir de un gemelo guardado en la partida.
    static deHeroe(h, nombre) {
      const s = G.reglas.stats(h);
      return new Personaje({
        id: h.id, ref: h, nombre: nombre || G.datos.HEROES[h.id].nombre, equipo: 'heroes',
        vida: h.vida, vidaMax: s.vida, pe: h.energia, peMax: s.energia,
        fue: s.fue, def: s.def, mag: s.mag, vel: s.vel,
        limite: h.limite || 0, nivel: h.nivel,
        estado: h.vida > 0 ? 'normal' : 'caido',
        atb: 30 + Math.random() * 40
      });
    }

    // Crea el personaje a partir de una criatura del mundo.
    static deCriatura(id) {
      const c = G.mundos.criatura(id);
      if (!c) throw new Error('No existe la criatura ' + id);
      return new Personaje({
        id, def_: c, nombre: c.nombre, equipo: 'enemigos',
        vida: c.vida, vidaMax: c.vida, pe: 0, peMax: 0,
        fue: c.fue, def: c.def, mag: c.mag, vel: c.vel,
        debil: c.debil || [], resiste: c.resiste || [], ataques: c.ataques || [],
        jefe: !!c.jefe, purificable: !!c.purificable,
        sello: c.sello ? 100 : null,
        atb: Math.random() * 50
      });
    }

    get esHeroe() { return this.equipo === 'heroes'; }
    get vivo() { return this.vida > 0 && this.estado !== 'retirado' && this.estado !== 'purificado'; }
    // ¿Puede actuar? (los jefes vencidos esperando purificación no actúan)
    get activo() { return this.vivo && this.estado === 'normal'; }
    get stats() { return { fue: this.fue, def: this.def, mag: this.mag, vel: this.vel }; }

    subirLimite(n) { if (this.esHeroe) this.limite = Math.min(100, this.limite + n); }

    // Escribe la vida, PE y límite de vuelta en la partida guardada.
    guardar() {
      if (!this.ref) return;
      this.ref.vida = Math.max(0, this.vida);
      this.ref.energia = this.pe;
      this.ref.limite = this.limite;
    }
  }

  G.Personaje = Personaje;
})(typeof window !== 'undefined' ? window : globalThis);
