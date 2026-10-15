/* =====================================================================
   SISTEMA DE COMBATE ATB (estilo Final Fantasy) — solo lógica
   - Cada personaje llena su barra de tiempo (ATB) de 0 a 100 según su
     velocidad. Al llegar a 100 puede actuar.
   - 5 comandos: Atacar, Magia (gasta PE), Espíritu (límite, purificar,
     invocar espíritus, técnica gemela), Objeto y Defender.
   - Límite: sube 15% al recibir daño y 5% al atacar.
   - Defender: el daño recibido baja a la mitad hasta tu próximo turno.
   - Modos especiales:
       'jefe'   → al bajar la vida del jefe a 0 queda "debilitado" y hay
                  que PURIFICARLO para que se vuelva un espíritu aliado.
       'sello'  → Ixbalanqué poseído: si su vida llega a 0 pierdes
                  (¡lo heriste!). Ganas bajando su Sello Oscuro a 0.
       'duelo'  → primer encuentro: resiste 5 turnos o usa la Chispa de luz.
       'final'  → batalla normal contra el Avatar (con los dos gemelos).
   Esta clase no dibuja nada: devuelve "eventos" que la escena anima.
   ===================================================================== */
'use strict';

(function (raiz) {
  const G = raiz.G = raiz.G || {};
  const D = () => G.datos;
  const R = () => G.reglas;

  class SistemaCombate {
    /**
     * op: { heroes: [Personaje], enemigos: [Personaje], modo, turnosDuelo,
     *       inventario: {cacao: 3, ...}, espiritus: ['guacamaya', ...], azar: () => número }
     */
    constructor(op) {
      this.heroes = op.heroes;
      this.enemigos = op.enemigos;
      this.modo = op.modo || 'normal';
      this.turnosDuelo = op.turnosDuelo || 5;
      this.inventario = op.inventario || {};
      this.espiritus = op.espiritus || [];
      this.azar = op.azar || Math.random;
      this.esperar = op.esperar !== false;    // modo "espera": el tiempo se detiene al elegir
      this.pausado = false;
      this.listos = [];        // héroes con la barra llena
      this.colaEnemigos = [];  // enemigos con la barra llena
      this.turnosHeroe = 0;
      this.resultado = null;   // 'victoria', 'derrota', 'huida', 'retirada', 'selloRoto'
      this.motivo = '';
      this.tiempo = 0;
      if (this.modo === 'sello') this.enemigos.forEach((e) => { if (e.sello === null) e.sello = 100; });
    }

    // ---------------- consultas ----------------
    vivos(equipo) { return (equipo === 'heroes' ? this.heroes : this.enemigos).filter((p) => p.vivo); }
    enemigosAtacables() { return this.enemigos.filter((e) => e.vivo); }
    terminado() { return !!this.resultado; }

    // ---------------- tiempo (barras ATB) ----------------
    actualizar(dt) {
      if (this.resultado || this.pausado) return;
      this.tiempo += dt;
      this.heroes.forEach((h) => {
        if (h.escudoT > 0) h.escudoT -= dt;
        if (!h.vivo) { h.atb = 0; return; }
        if (h.atb < 100) {
          h.atb = Math.min(100, h.atb + R().velocidadATB(h.vel) * dt);
          if (h.atb >= 100 && !this.listos.includes(h) && !h.enCola) this.listos.push(h);
        }
      });
      this.enemigos.forEach((e) => {
        if (!e.activo || e.enCola) return;
        e.atb += R().velocidadATB(e.vel * (e.furia ? 1.25 : 1)) * dt * (e.jefe ? 0.85 : 0.8);
        if (e.atb >= 100) { e.atb = 0; e.enCola = true; this.colaEnemigos.push(e); }
      });
    }

    // ---------------- opciones del menú ----------------
    // Devuelve lo que un héroe puede hacer ahora (para armar el menú de 5 comandos).
    opciones(h) {
      const magias = R().magiasDe({ id: h.id, nivel: h.nivel || 1 }).map((id) => {
        const m = D().MAGIAS[id];
        return { id, nombre: m.nombre, costo: m.costo, puede: h.pe >= m.costo, desc: m.desc, objetivo: m.objetivo };
      });
      const espiritu = [];
      const lim = D().LIMITES[D().HEROES[h.id].limite];
      espiritu.push({ modo: 'limite', id: D().HEROES[h.id].limite, nombre: lim.nombre, costo: D().COSTO.limite, puede: h.limite >= D().COSTO.limite, desc: lim.desc, objetivo: lim.objetivo });
      const purificable = this.enemigos.some((e) => (e.estado === 'debilitado') || (e.sello !== null && e.vivo));
      if (purificable) {
        const libre = this.enemigos.some((e) => e.estado === 'debilitado');
        espiritu.push({ modo: 'purificar', nombre: 'Purificar', costo: libre ? 0 : D().COSTO.purificar, puede: libre || h.limite >= D().COSTO.purificar, objetivo: 'enemigo',
          desc: libre ? 'Libera la luz del jefe vencido. Se volverá un espíritu aliado.' : 'Ataca la sombra, no el cuerpo: baja el Sello Oscuro sin herir.' });
      }
      this.espiritus.forEach((id) => {
        const e = D().ESPIRITUS[id];
        espiritu.push({ modo: 'invocar', id, nombre: e.invocacion, costo: D().COSTO.invocar, puede: h.limite >= D().COSTO.invocar, desc: e.nombre + ': ' + e.desc, objetivo: 'ninguno' });
      });
      const otro = this.heroes.find((x) => x !== h && x.vivo);
      if (otro && this.modo === 'final') {
        const lista = otro.atb >= 100 && !otro.enCola;
        espiritu.push({ modo: 'gemela', id: 'tecnicaGemela', nombre: '★ Sol y Luna', costo: 100, puede: lista && h.limite >= 100 && otro.limite >= 100, objetivo: 'enemigos',
          desc: D().LIMITES.tecnicaGemela.desc + ' (Los dos necesitan el límite lleno y la barra de tiempo lista.)' });
      }
      const objetos = Object.keys(D().OBJETOS).filter((id) => (this.inventario[id] || 0) > 0).map((id) => {
        const o = D().OBJETOS[id];
        let puede = true;
        if (o.uso === 'huir') puede = !this.enemigos.some((e) => e.jefe) && this.modo === 'normal';
        if (o.uso === 'chispa') puede = this.modo === 'duelo';
        if (o.uso === 'sello') puede = this.modo === 'sello';
        if (o.uso === 'revivir') puede = this.heroes.some((x) => !x.vivo);
        return { id, nombre: o.nombre, cantidad: this.inventario[id], puede, desc: o.desc, objetivo: o.objetivo };
      });
      return { atacar: true, magia: magias, espiritu, objetos, defender: true };
    }

    // ---------------- daño ----------------
    danio(atacante, objetivo, op, eventos) {
      const critico = op.puedeCritico && this.azar() < R().PROB_CRITICO;
      const defensor = { def: objetivo.def, escudo: objetivo.escudoT > 0 ? 1.6 : 0, debil: objetivo.debil, resiste: objetivo.resiste };
      const r = R().danio(atacante.stats, defensor, { tipo: op.tipo, potencia: op.potencia, elementos: op.elementos, preciso: op.preciso, critico, azar: 0.9 + this.azar() * 0.2 });
      let n = r.danio;
      if (atacante.furia) n = Math.round(n * 1.2);
      if (objetivo.defendiendo) n = Math.max(1, Math.round(n / 2));
      // Purificación: la sombra recibe el golpe, no el cuerpo.
      objetivo.vida = Math.max(0, objetivo.vida - n);
      eventos.push({ tipo: 'danio', actor: atacante, objetivo, cantidad: n, elemento: r.elemento, critico, preciso: op.preciso, defendio: objetivo.defendiendo, efecto: op.efecto });
      if (objetivo.esHeroe) { objetivo.subirLimite(D().LIMITE_AL_RECIBIR); }
      this.alCaer(objetivo, eventos);
      return n;
    }

    alCaer(p, eventos) {
      if (p.vida > 0) {
        // los jefes se enfurecen a la mitad de la vida
        if (!p.esHeroe && p.jefe && !p.furia && p.vida < p.vidaMax * 0.5) { p.furia = true; eventos.push({ tipo: 'furia', objetivo: p }); }
        return;
      }
      if (p.esHeroe) {
        // La pluma de quetzal te levanta sola una vez por combate.
        if ((this.inventario.pluma || 0) > 0 && !p.plumaUsada) {
          this.inventario.pluma--;
          p.plumaUsada = true;
          p.vida = Math.round(p.vidaMax * 0.5);
          eventos.push({ tipo: 'revive', objetivo: p, cantidad: p.vida, porPluma: true });
          return;
        }
        p.estado = 'caido'; p.atb = 0; p.escudoT = 0;
        this.listos = this.listos.filter((x) => x !== p);
        eventos.push({ tipo: 'cae', objetivo: p });
        return;
      }
      if (this.modo === 'jefe' && p.purificable && p.estado === 'normal') {
        // El jefe no muere: queda debilitado, con su luz atrapada por la corrupción.
        p.vida = 1; p.estado = 'debilitado'; p.corrupcion = 100; p.atb = 0;
        this.colaEnemigos = this.colaEnemigos.filter((x) => x !== p);
        eventos.push({ tipo: 'debilitado', objetivo: p });
        return;
      }
      if (this.modo === 'sello' && p.sello !== null) { eventos.push({ tipo: 'cae', objetivo: p }); return; }
      p.estado = 'muerto';
      this.colaEnemigos = this.colaEnemigos.filter((x) => x !== p);
      eventos.push({ tipo: 'muere', objetivo: p, ultimo: !this.enemigos.some((e) => e.vivo && e !== p) });
    }

    curar(objetivo, n, eventos) {
      const antes = objetivo.vida;
      objetivo.vida = Math.min(objetivo.vidaMax, objetivo.vida + n);
      eventos.push({ tipo: 'cura', objetivo, cantidad: objetivo.vida - antes });
    }

    // ---------------- acciones de los héroes ----------------
    /**
     * accion = { tipo: 'atacar'|'magia'|'espiritu'|'objeto'|'defender', id, modo, objetivo, preciso }
     * Devuelve la lista de eventos para animar.
     */
    ejecutar(h, accion) {
      const ev = [];
      if (this.resultado || !h.vivo) return ev;
      this.listos = this.listos.filter((x) => x !== h);
      h.enCola = false;
      h.defendiendo = false;          // la defensa dura hasta el próximo turno propio
      h.atb = 0;
      this.turnosHeroe++;
      const objetivos = this.resolverObjetivos(accion);
      const D_ = D();
      switch (accion.tipo) {
        case 'atacar': {
          const t = objetivos[0];
          if (t) this.golpearConPurificacion(h, t, { tipo: 'fisico', potencia: 1, preciso: accion.preciso, puedeCritico: true, efecto: 'golpe' }, ev);
          h.subirLimite(D_.LIMITE_AL_ATACAR);
          break;
        }
        case 'magia': {
          const m = D_.MAGIAS[accion.id];
          if (!m || h.pe < m.costo) { ev.push({ tipo: 'texto', texto: 'No tienes suficientes PE' }); break; }
          h.pe -= m.costo;
          ev.push({ tipo: 'lanza', actor: h, nombre: m.nombre, efecto: m.efecto, objetivos });
          this.aplicarMagia(h, m, objetivos, ev);
          break;
        }
        case 'espiritu': this.espiritu(h, accion, objetivos, ev); break;
        case 'objeto': this.usarObjeto(h, accion, objetivos, ev); break;
        case 'defender':
          h.defendiendo = true;
          ev.push({ tipo: 'defiende', actor: h });
          break;
        default: break;
      }
      this.revisar(ev);
      return ev;
    }

    // Quien ataca el cuerpo de Ixbalanqué poseído solo le hace daño real (¡cuidado!).
    golpearConPurificacion(h, t, op, ev) {
      if (t.estado === 'debilitado') { ev.push({ tipo: 'texto', texto: 'Ya está vencido: ¡purifícalo!' }); return; }
      this.danio(h, t, op, ev);
      if (t.sello !== null && t.vivo) ev.push({ tipo: 'aviso', texto: '¡Estás hiriendo a tu hermano! Usa Espíritu → Purificar.' });
    }

    aplicarMagia(h, m, objetivos, ev) {
      if (m.tipo === 'cura') objetivos.forEach((o) => this.curar(o, R().curacion(h.mag, m.potencia), ev));
      else if (m.tipo === 'escudo') this.vivos('heroes').forEach((o) => { o.escudoT = 20; ev.push({ tipo: 'escudo', objetivo: o }); });
      else objetivos.forEach((o) => { if (o.vivo && o.estado !== 'debilitado') this.danio(h, o, { tipo: m.tipo, potencia: m.potencia, elementos: m.elemento, efecto: m.efecto }, ev); });
    }

    espiritu(h, accion, objetivos, ev) {
      const D_ = D();
      if (accion.modo === 'limite') {
        if (h.limite < D_.COSTO.limite) return ev.push({ tipo: 'texto', texto: 'El límite aún no está lleno' });
        h.limite = 0;
        const l = D_.LIMITES[D_.HEROES[h.id].limite];
        ev.push({ tipo: 'lanza', actor: h, nombre: l.nombre, efecto: l.efecto, objetivos, limite: true });
        const lista = (l.objetivo === 'enemigos' ? this.enemigos : objetivos).filter((e) => e && e.vivo && e.estado === 'normal');
        lista.forEach((o) => this.danio(h, o, { tipo: l.tipo, potencia: l.potencia, elementos: l.elemento, puedeCritico: false, efecto: l.efecto }, ev));
        return;
      }
      if (accion.modo === 'purificar') {
        const t = objetivos[0];
        if (!t) return;
        if (t.estado === 'debilitado') {
          t.corrupcion = Math.max(0, t.corrupcion - 50);
          ev.push({ tipo: 'purifica', actor: h, objetivo: t, cantidad: 50, restante: t.corrupcion, barra: 'corrupcion' });
          if (t.corrupcion <= 0) { t.estado = 'purificado'; ev.push({ tipo: 'purificado', objetivo: t }); }
          return;
        }
        if (t.sello !== null) {
          if (h.limite < D_.COSTO.purificar) return ev.push({ tipo: 'texto', texto: 'Necesitas la mitad del límite para purificar' });
          h.limite -= D_.COSTO.purificar;
          t.sello = Math.max(0, t.sello - D_.PURIFICAR_SELLO);
          ev.push({ tipo: 'purifica', actor: h, objetivo: t, cantidad: D_.PURIFICAR_SELLO, restante: t.sello, barra: 'sello' });
          return;
        }
        ev.push({ tipo: 'texto', texto: 'No hay nada que purificar' });
        return;
      }
      if (accion.modo === 'invocar') {
        if (h.limite < D_.COSTO.invocar) return ev.push({ tipo: 'texto', texto: 'El límite aún no está lleno' });
        h.limite = 0;
        const e = D_.ESPIRITUS[accion.id];
        ev.push({ tipo: 'invoca', actor: h, espiritu: accion.id, nombre: e.invocacion });
        const enemigos = this.enemigos.filter((x) => x.vivo && x.estado === 'normal');
        if (e.tipo === 'curaTodo') this.vivos('heroes').forEach((o) => { this.curar(o, Math.round(o.vidaMax * e.potencia), ev); o.escudoT = Math.max(o.escudoT, 10); });
        if (e.tipo === 'drena') {
          let total = 0;
          enemigos.forEach((o) => { if (o.sello === null) total += this.danio(h, o, { tipo: 'magico', potencia: e.potencia, elementos: e.elemento, efecto: 'onda' }, ev); });
          this.vivos('heroes').forEach((o) => this.curar(o, Math.round(total * 0.35), ev));
        }
        if (e.tipo === 'muralla') {
          enemigos.forEach((o) => { if (o.sello === null) this.danio(h, o, { tipo: 'fisico', potencia: e.potencia, elementos: e.elemento, efecto: 'roca' }, ev); });
          this.vivos('heroes').forEach((o) => { o.escudoT = 20; ev.push({ tipo: 'escudo', objetivo: o }); });
        }
        return;
      }
      if (accion.modo === 'gemela') {
        const otro = this.heroes.find((x) => x !== h && x.vivo);
        if (!otro || h.limite < 100 || otro.limite < 100) return ev.push({ tipo: 'texto', texto: 'Los dos necesitan el límite lleno' });
        h.limite = 0; otro.limite = 0; otro.atb = 0;
        this.listos = this.listos.filter((x) => x !== otro);
        const l = D_.LIMITES.tecnicaGemela;
        ev.push({ tipo: 'lanza', actor: h, companero: otro, nombre: l.nombre, efecto: l.efecto, objetivos, gemela: true });
        this.enemigos.filter((e) => e.vivo).forEach((o) => {
          const a = { stats: { fue: h.fue + otro.fue, mag: (h.mag + otro.mag) / 1.5, def: 0, vel: 0 }, esHeroe: true, furia: false };
          this.danio(a, o, { tipo: l.tipo, potencia: l.potencia, elementos: l.elemento, efecto: l.efecto }, ev);
        });
      }
    }

    usarObjeto(h, accion, objetivos, ev) {
      const o = D().OBJETOS[accion.id];
      if (!o || !(this.inventario[accion.id] > 0)) return ev.push({ tipo: 'texto', texto: 'No te quedan' });
      const t = objetivos[0];
      if (o.uso === 'cura') { this.inventario[accion.id]--; this.curar(t || h, o.valor, ev); }
      else if (o.uso === 'energia') { this.inventario[accion.id]--; const u = t || h; const a = u.pe; u.pe = Math.min(u.peMax, u.pe + o.valor); ev.push({ tipo: 'pe', objetivo: u, cantidad: u.pe - a }); }
      else if (o.uso === 'revivir') {
        const caido = t && !t.vivo ? t : this.heroes.find((x) => !x.vivo);
        if (!caido) return ev.push({ tipo: 'texto', texto: 'Nadie lo necesita' });
        this.inventario[accion.id]--;
        caido.estado = 'normal'; caido.vida = Math.round(caido.vidaMax * o.valor); caido.atb = 0;
        ev.push({ tipo: 'revive', objetivo: caido, cantidad: caido.vida });
      } else if (o.uso === 'huir') {
        if (this.enemigos.some((e) => e.jefe) || this.modo !== 'normal') return ev.push({ tipo: 'texto', texto: '¡No puedes huir de esta pelea!' });
        this.inventario[accion.id]--;
        ev.push({ tipo: 'huye' });
        this.resultado = 'huida';
      } else if (o.uso === 'chispa') {
        if (this.modo !== 'duelo') return ev.push({ tipo: 'texto', texto: 'La chispa no reacciona aquí' });
        ev.push({ tipo: 'chispa', actor: h });
        this.resultado = 'retirada'; this.motivo = 'chispa';
      } else if (o.uso === 'sello') {
        const s = this.enemigos.find((e) => e.sello !== null && e.vivo);
        if (!s) return ev.push({ tipo: 'texto', texto: 'No hay ningún sello aquí' });
        this.inventario[accion.id]--;
        s.sello = Math.max(0, s.sello - D().RELIQUIA_SELLO);
        ev.push({ tipo: 'purifica', actor: h, objetivo: s, cantidad: D().RELIQUIA_SELLO, restante: s.sello, barra: 'sello', reliquia: true });
      }
    }

    resolverObjetivos(accion) {
      const o = accion.objetivo;
      if (Array.isArray(o)) return o.filter(Boolean);
      if (o) return [o];
      return [];
    }

    // ---------------- turno de los enemigos ----------------
    siguienteEnemigo() {
      while (this.colaEnemigos.length) {
        const e = this.colaEnemigos.shift();
        e.enCola = false;
        if (e.activo) return e;
      }
      return null;
    }

    // Elige ataque y objetivos (sin aplicarlo todavía, para animar primero).
    planEnemigo(e) {
      const vivos = this.vivos('heroes');
      if (!vivos.length || !e.activo) return null;
      const lista = e.ataques;
      let r = this.azar() * lista.reduce((a, x) => a + x.prob, 0);
      let at = lista[0];
      for (const a of lista) { r -= a.prob; if (r <= 0) { at = a; break; } }
      const masDebil = vivos.reduce((a, b) => (a.vida < b.vida ? a : b));
      const objetivos = at.objetivo === 'todos' ? vivos : [this.azar() < 0.35 ? masDebil : vivos[Math.floor(this.azar() * vivos.length)]];
      return { actor: e, ataque: at, objetivos };
    }

    aplicarEnemigo(plan) {
      const ev = [];
      if (!plan || this.resultado) return ev;
      const { actor, ataque, objetivos } = plan;
      if (!actor.activo) return ev;
      objetivos.forEach((o) => {
        if (!o.vivo) return;
        this.danio(actor, o, { tipo: ataque.tipo, potencia: ataque.potencia, elementos: ataque.elemento ? [ataque.elemento] : [], efecto: ataque.efecto }, ev);
        if (ataque.aturdir && o.vivo && this.azar() < ataque.aturdir) {
          o.atb = 0; this.listos = this.listos.filter((x) => x !== o);
          ev.push({ tipo: 'aturdido', objetivo: o });
        }
      });
      this.revisar(ev);
      return ev;
    }

    // ---------------- ¿terminó la pelea? ----------------
    revisar(ev) {
      if (this.resultado) return;
      if (!this.vivos('heroes').length) { this.resultado = 'derrota'; this.motivo = 'caidos'; return; }
      if (this.modo === 'sello') {
        const ix = this.enemigos.find((e) => e.sello !== null);
        if (ix && ix.vida <= 0) { this.resultado = 'derrota'; this.motivo = 'heriste'; ev && ev.push({ tipo: 'texto', texto: '¡No! Lo heriste demasiado...' }); return; }
        if (ix && ix.sello <= 0) { this.resultado = 'selloRoto'; ev && ev.push({ tipo: 'selloRoto', objetivo: ix }); return; }
        return;
      }
      if (this.modo === 'duelo') {
        const ix = this.enemigos[0];
        if (this.turnosHeroe >= this.turnosDuelo || (ix && ix.vida < ix.vidaMax * 0.3)) {
          if (ix && ix.vida <= 0) ix.vida = 1;
          this.resultado = 'retirada'; this.motivo = 'resististe';
        }
        return;
      }
      const quedan = this.enemigos.some((e) => e.vivo && e.estado !== 'purificado');
      if (!quedan) this.resultado = 'victoria';
    }

    // Experiencia y objetos al ganar.
    recompensas() {
      const xp = this.enemigos.reduce((a, e) => a + ((e.def_ && e.def_.xp) || 0), 0);
      const objetos = {};
      this.enemigos.forEach((e) => ((e.def_ && e.def_.suelta) || []).forEach((s) => { if (this.azar() < s.prob) objetos[s.objeto] = (objetos[s.objeto] || 0) + 1; }));
      const espiritus = this.enemigos.filter((e) => e.estado === 'purificado' && e.def_ && e.def_.espiritu).map((e) => e.def_.espiritu);
      return { xp, objetos, espiritus };
    }
  }

  G.SistemaCombate = SistemaCombate;
})(typeof window !== 'undefined' ? window : globalThis);
