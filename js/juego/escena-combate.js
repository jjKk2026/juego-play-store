/* =====================================================================
   COMBATE (por turnos con barra de tiempo activa)
   - Cada personaje tiene una barra que se llena según su velocidad.
     Cuando se llena, puede actuar.
   - Opciones: Atacar, Técnicas, Objetos y Huir.
   - Golpe preciso: al atacar aparece un anillo que se cierra; si tocas A
     cuando coincide con el círculo dorado, el golpe hace más daño.
   - Técnicas dobles: cuando las barras de los dos gemelos están llenas.
   - Golpe final: cámara lenta, vibración y onomatopeya de cómic.
   ===================================================================== */
'use strict';

(function () {
  const P = G.pixel;
  const U = G.util;
  const R = () => G.reglas;
  const D = () => G.datos;
  const COL = G.ui.COL;
  const ESC = 2; // en combate todo se dibuja al doble de tamaño

  const ONOS_GOLPE = ['¡PAF!', '¡ZAS!', '¡PUM!', '¡TOC!', '¡CRAC!'];
  const ONOS_ELEM = { fuego: '¡FUSH!', agua: '¡SPLASH!', tierra: '¡BRUM!', viento: '¡FIUU!' };
  const COLOR_ELEM = { fuego: '#ff7a3d', agua: '#4cc9f0', tierra: '#c49a6c', viento: '#b8f2a1' };

  // ------------------------- FONDOS DE COMBATE -------------------------
  function fondo(tipo) {
    return P.memo('fondoCombate:' + tipo, () => {
      const [c, ctx] = P.lienzo(G.ANCHO, G.ALTO);
      const W = G.ANCHO, H = G.ALTO;
      const grad = (a, b, y0, y1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0); };
      const rnd = U.semilla(tipo.length * 77);
      if (tipo === 'selva' || tipo === 'templo') {
        grad(tipo === 'selva' ? '#9fdc8c' : '#6b7a5a', tipo === 'selva' ? '#3f8f3a' : '#3a4a2e', 0, 110);
        for (let x = -10; x < W + 20; x += 16 + rnd() * 12) {
          const r = 16 + rnd() * 16;
          P.elipse(ctx, x, 70 - r * 0.4, r, r * 0.9, tipo === 'selva' ? '#2f7a35' : '#3d4a33');
          P.rect(ctx, x - 2, 70, 4, 40, '#5a4a3a');
        }
        if (tipo === 'templo') {
          for (let x = 0; x < W; x += 32) { P.rect(ctx, x, 20, 30, 70, '#8a8f7a'); P.rect(ctx, x, 20, 30, 3, '#a8ad96'); P.rect(ctx, x + 10, 40, 10, 10, '#565a4a'); P.rect(ctx, x + 2, 26, 6, 40, '#4f8a3a'); }
        }
        grad(tipo === 'selva' ? '#4a9c40' : '#5c5a48', tipo === 'selva' ? '#2f6e2e' : '#3a382c', 100, H);
        for (let i = 0; i < 90; i++) P.px(ctx, rnd() * W, 100 + rnd() * (H - 100), tipo === 'selva' ? '#6cc35a' : '#7a7860');
        ctx.globalAlpha = 0.13; ctx.fillStyle = '#fff3b0';
        for (let i = 0; i < 4; i++) { const x = 40 + i * 100; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 24, 0); ctx.lineTo(x - 40, H); ctx.lineTo(x - 64, H); ctx.fill(); }
        ctx.globalAlpha = 1;
      } else if (tipo === 'cueva') {
        grad('#05020a', '#24123a', 0, 110);
        for (let x = 0; x < W; x += 18 + rnd() * 14) {
          const h = 20 + rnd() * 40;
          P.triangulo(ctx, x, 0, x + 12, 0, x + 6, h, '#1d1330');
        }
        for (let i = 0; i < 7; i++) {
          const x = rnd() * W, cc = ['#05d9e8', '#ff2a6d', '#b18cff'][i % 3];
          P.triangulo(ctx, x, 74, x - 6, 104, x + 6, 104, U.tono(cc, -0.3));
          P.triangulo(ctx, x, 74, x - 2, 104, x + 1, 104, cc);
        }
        P.rect(ctx, 0, 96, W, 6, '#0d3b66');
        for (let x = 0; x < W; x += 9) P.rect(ctx, x, 96, 4, 1, '#05d9e8');
        grad('#2a2238', '#120c1e', 102, H);
        for (let i = 0; i < 70; i++) P.px(ctx, rnd() * W, 104 + rnd() * (H - 104), '#3b3052');
      } else {
        // palacio de los Señores
        grad('#110a1a', '#2e2044', 0, 110);
        for (let x = 6; x < W; x += 58) {
          P.rect(ctx, x, 6, 18, 100, '#2e2044');
          P.rect(ctx, x, 6, 4, 100, '#4a3a5e');
          P.rect(ctx, x - 3, 4, 24, 5, '#e8b64c');
          P.rect(ctx, x + 5, 30, 8, 8, '#ff2a6d');
          P.rect(ctx, x + 7, 32, 4, 4, '#2e2044');
        }
        P.rect(ctx, 0, 104, W, 1, '#e8b64c');
        grad('#1e1727', '#0a0612', 105, H);
        ctx.globalAlpha = 0.25;
        for (let y = 110; y < H; y += 10) { ctx.fillStyle = '#e8b64c'; ctx.fillRect(0, y, W, 1); }
        ctx.globalAlpha = 1;
      }
      return c;
    });
  }

  class EscenaCombate {
    /**
     * op: { grupo: [ids], fondo, jefe, musica, sinHuir, alTerminar(resultado) }
     */
    constructor(op) {
      this.op = op;
      this.t = 0;
      this.estado = 'entrada';
      this.heroes = [];
      this.enemigos = [];
      this.listos = [];      // héroes con la barra llena esperando orden
      this.cola = [];        // acciones por ejecutar
      this.gen = null;       // acción en curso
      this.espera = 0; this.cond = null;
      this.visuales = [];
      this.menu = null;      // { tipo, heroe, menu, ... }
      this.banner = null;
      this.mensajes = [];
      this.anillo = null;    // golpe preciso
      this.esJefe = !!op.jefe;
      this.resultado = null;
    }

    entrar() {
      G.fx.limpiar();
      G.audio.musica(this.op.musica || (this.esJefe ? 'jefe' : 'batalla'));
      // Héroes (usan los mismos datos de la partida: lo que pase aquí queda guardado)
      const pos = [[318, 112], [348, 148]];
      G.partida.heroes().forEach((h, i) => {
        const s = R().stats(h);
        this.heroes.push({
          tipo: 'heroe', id: h.id, ref: h, nombre: G.partida.nombre(h.id), s,
          atb: 30 + Math.random() * 40, x: pos[i][0], y: pos[i][1], dx: 0, dy: 0,
          escudoT: 0, flash: 0, cuadro: 0
        });
      });
      // Enemigos
      const g = this.op.grupo;
      const posiciones = this.esJefe
        ? (g.length === 1 ? [[118, 156]] : [[84, 156], [196, 156]])
        : [[[110, 140]], [[78, 124], [156, 152]], [[66, 106], [150, 116], [104, 150]]][Math.min(3, g.length) - 1];
      g.forEach((id, i) => {
        const c = G.mundos.criatura(id);
        const p = posiciones[i] || [60 + i * 40, 140];
        this.enemigos.push({
          tipo: 'enemigo', id, def: c, nombre: c.nombre,
          vida: c.vida, vidaMax: c.vida, s: { fue: c.fue, def: c.def, mag: c.mag, vel: c.vel },
          debil: c.debil || [], resiste: c.resiste || [],
          atb: Math.random() * 50, x: p[0] - 160, y: p[1], x0: p[0], dx: 0, dy: 0, flash: 0, muriendo: 0, muerto: false,
          fase: 0, frases: {}
        });
        G.guardado.marcarBestiario(id, 'visto');
      });
    }

    // ---------------- utilidades ----------------
    vivosH() { return this.heroes.filter((h) => h.ref.vida > 0); }
    vivosE() { return this.enemigos.filter((e) => !e.muerto && e.vida > 0); }
    centro(u) {
      if (u.tipo === 'heroe') return [u.x + u.dx, u.y + u.dy - 24];
      const img = G.arte.criatura(u.id, 0);
      return [u.x + u.dx, u.y + u.dy - (img ? img.height * ESC / 2 : 24)];
    }
    arriba(u) {
      if (u.tipo === 'heroe') return [u.x + u.dx, u.y + u.dy - 52];
      const img = G.arte.criatura(u.id, 0);
      return [u.x + u.dx, u.y + u.dy - (img ? img.height * ESC : 40) - 4];
    }
    visual(dur, fn) { this.visuales.push({ t: 0, dur, fn }); }
    decir(texto) { this.banner = { texto, t: 0 }; }

    // ---------------- ciclo ----------------
    actualizar(dt) {
      this.t += dt;
      this.heroes.forEach((h) => { h.flash = Math.max(0, h.flash - dt); if (h.escudoT > 0) h.escudoT -= dt; });
      this.enemigos.forEach((e) => {
        e.flash = Math.max(0, e.flash - dt);
        if (e.muriendo > 0) { e.muriendo += dt; if (e.muriendo > 0.7) e.muerto = true; }
      });
      for (let i = this.visuales.length - 1; i >= 0; i--) {
        const v = this.visuales[i];
        v.t += dt;
        if (v.t >= v.dur) this.visuales.splice(i, 1);
      }
      if (this.banner) { this.banner.t += dt; if (this.banner.t > 1.4) this.banner = null; }

      if (this.estado === 'entrada') {
        const k = U.suave(Math.min(1, this.t / 0.7));
        this.enemigos.forEach((e) => { e.x = e.x0 - 160 * (1 - k); });
        if (this.t > 0.9) { this.estado = 'tiempo'; this.decir(this.esJefe ? '¡' + this.enemigos.map((e) => e.nombre).join(' y ') + '!' : '¡Combate!'); }
        return;
      }
      if (this.estado === 'victoria') return this.actualizarVictoria(dt);
      if (this.estado === 'derrota') { this.derrotaT += dt; if (this.derrotaT > 1.8) this.terminar('derrota'); return; }
      if (this.estado === 'fin') return;

      this.ejecutar(dt);
      this.actualizarMenu(dt);

      // Barras de tiempo
      const pausado = this.gen || (G.opciones.modoBatalla === 'espera' && this.menu);
      if (!pausado && this.estado === 'tiempo') {
        this.heroes.forEach((h) => {
          if (h.ref.vida <= 0) { h.atb = 0; return; }
          if (h.atb < 100) {
            h.atb = Math.min(100, h.atb + R().velocidadATB(h.s.vel) * dt);
            if (h.atb >= 100 && !this.listos.includes(h)) { this.listos.push(h); G.audio.efecto('cursor'); }
          }
        });
        this.vivosE().forEach((e) => {
          if (e.enCola) return;
          e.atb += R().velocidadATB(e.s.vel * (e.furia ? 1.25 : 1)) * dt * (this.esJefe ? 0.85 : 0.8);
          if (e.atb >= 100) { e.atb = 0; e.enCola = true; this.cola.push(() => this.accionEnemigo(e)); }
        });
      }
      // Abrir menú para el primer héroe listo
      if (!this.menu && this.listos.length && this.estado === 'tiempo') {
        const h = this.listos[0];
        if (h.ref.vida <= 0) this.listos.shift(); else this.abrirMenu(h);
      }
      // Sacar la siguiente acción de la cola
      if (!this.gen && this.cola.length && this.estado === 'tiempo') {
        const fabrica = this.cola.shift();
        this.gen = fabrica();
        this.espera = 0; this.cond = null;
      }
    }

    // Corre la acción actual (una "corrutina": espera tiempos o condiciones).
    ejecutar(dt) {
      if (!this.gen) return;
      if (this.espera > 0) { this.espera -= dt; return; }
      if (this.cond) { if (!this.cond()) return; this.cond = null; }
      for (let i = 0; i < 50; i++) {
        const r = this.gen.next();
        if (r.done) { this.gen = null; this.revisarFin(); return; }
        if (typeof r.value === 'number') { this.espera = r.value; return; }
        if (typeof r.value === 'function') { if (!r.value()) { this.cond = r.value; return; } }
      }
    }

    revisarFin() {
      if (this.estado !== 'tiempo') return;
      if (!this.vivosE().length) this.iniciarVictoria();
      else if (!this.vivosH().length) this.derrota();
    }

    // ---------------- MENÚ DE COMANDOS ----------------
    abrirMenu(h) {
      const tieneTecnicas = R().tecnicasDe(h.ref).length > 0;
      const ops = [
        { texto: 'Atacar', valor: 'atacar' },
        { texto: 'Técnicas', valor: 'tecnicas', deshabilitado: !tieneTecnicas },
        { texto: 'Objetos', valor: 'objetos' },
        { texto: 'Huir', valor: 'huir', deshabilitado: this.esJefe || this.op.sinHuir }
      ];
      this.menu = { tipo: 'comando', heroe: h, menu: new G.ui.Menu(ops, { x: 4, y: 158, ancho: 92, altoFila: 12, titulo: h.nombre, cancelable: false }) };
    }

    cerrarMenu(h, accion) {
      this.menu = null;
      this.listos = this.listos.filter((x) => x !== h);
      if (accion) { h.enCola = true; this.cola.push(accion); }
    }

    actualizarMenu(dt) {
      const m = this.menu;
      if (!m) return;
      const E = G.entrada;
      // Cambiar entre héroes listos con X
      if (m.tipo === 'comando' && E.presionado('x') && this.listos.length > 1) {
        this.listos.push(this.listos.shift());
        this.menu = null;
        G.audio.efecto('cursor');
        return;
      }
      if (m.tipo === 'objetivo') return this.actualizarObjetivo(dt);
      const r = m.menu.actualizar(dt);
      if (!r) return;
      const h = m.heroe;
      if (m.tipo === 'comando') {
        if (r.tipo !== 'elegir') return;
        const v = r.opcion.valor;
        if (v === 'atacar') this.elegirObjetivo(h, 'enemigo', (obj) => () => this.accionAtacar(h, obj), m);
        else if (v === 'tecnicas') this.abrirTecnicas(h, m);
        else if (v === 'objetos') this.abrirObjetos(h, m);
        else if (v === 'huir') this.cerrarMenu(h, () => this.accionHuir(h, false));
      } else if (m.tipo === 'tecnicas') {
        if (r.tipo === 'cancelar') { this.menu = m.anterior; return; }
        const op = r.opcion;
        if (op.doble) {
          const otro = this.heroes.find((x) => x !== h);
          const tec = D().DOBLES[op.valor];
          this.elegirObjetivo(h, tec.objetivo, (obj) => () => this.accionDoble(h, otro, op.valor, obj), m, () => {
            this.listos = this.listos.filter((x) => x !== otro);
            otro.enCola = true;
          });
        } else {
          const tec = D().TECNICAS[op.valor];
          this.elegirObjetivo(h, tec.objetivo, (obj) => () => this.accionTecnica(h, op.valor, obj), m);
        }
      } else if (m.tipo === 'objetos') {
        if (r.tipo === 'cancelar') { this.menu = m.anterior; return; }
        const id = r.opcion.valor;
        const ob = D().OBJETOS[id];
        if (ob.uso === 'huir') { this.cerrarMenu(h, () => this.accionHuir(h, true)); G.partida.quitar('copal'); return; }
        this.elegirObjetivo(h, ob.objetivo, (obj) => () => this.accionObjeto(h, id, obj), m);
      }
    }

    abrirTecnicas(h, anterior) {
      const ops = R().tecnicasDe(h.ref).map((id) => {
        const t = D().TECNICAS[id];
        return { texto: t.nombre, valor: id, detalle: t.costo + ' E', deshabilitado: h.ref.energia < t.costo, desc: t.desc };
      });
      const otro = this.heroes.find((x) => x !== h);
      const otroListo = otro && otro.ref.vida > 0 && otro.atb >= 100 && !otro.enCola;
      R().doblesDisponibles(G.partida.heroes()).forEach((id) => {
        const t = D().DOBLES[id];
        const iH = this.heroes.indexOf(h);
        const costoH = t.costo[iH], costoO = t.costo[1 - iH];
        const puede = otroListo && h.ref.energia >= costoH && otro.ref.energia >= costoO;
        ops.push({ texto: '★ ' + t.nombre, valor: id, doble: true, detalle: t.costo.join('+') + ' E', deshabilitado: !puede, color: '#ffd166', desc: t.desc + (otroListo ? '' : ' (Necesitas las dos barras llenas.)') });
      });
      const menu = new G.ui.Menu(ops, { x: 4, y: 158 - Math.min(6, ops.length) * 12 - 10, ancho: 168, altoFila: 12, visibles: 6, titulo: 'Técnicas' });
      menu.alCambiar = () => {};
      this.menu = { tipo: 'tecnicas', heroe: h, menu, anterior };
    }

    abrirObjetos(h, anterior) {
      const ids = Object.keys(D().OBJETOS).filter((id) => G.partida.cuantos(id) > 0);
      if (!ids.length) { G.audio.efecto('error'); G.ui.aviso('No tienes objetos'); return; }
      const ops = ids.map((id) => {
        const o = D().OBJETOS[id];
        const dis = o.uso === 'huir' && (this.esJefe || this.op.sinHuir);
        return { texto: o.nombre, valor: id, detalle: 'x' + G.partida.cuantos(id), deshabilitado: dis, desc: o.desc };
      });
      this.menu = { tipo: 'objetos', heroe: h, menu: new G.ui.Menu(ops, { x: 4, y: 158 - ops.length * 12 - 10, ancho: 150, altoFila: 12, titulo: 'Objetos' }), anterior };
    }

    // Selección de objetivo: flechas para cambiar, A para confirmar, B para volver.
    elegirObjetivo(h, tipo, crear, anterior, alConfirmar) {
      let lista;
      if (tipo === 'enemigo' || tipo === 'enemigos') lista = this.vivosE();
      else if (tipo === 'caido') lista = this.heroes.filter((x) => x.ref.vida <= 0);
      else if (tipo === 'aliado' || tipo === 'aliados') lista = this.vivosH();
      else lista = [h];
      if (!lista.length) { G.audio.efecto('error'); return; }
      const todos = tipo === 'enemigos' || tipo === 'aliados';
      this.menu = { tipo: 'objetivo', heroe: h, lista, sel: 0, todos, crear, anterior, alConfirmar, t: 0 };
    }

    actualizarObjetivo(dt) {
      const m = this.menu;
      m.t += dt;
      const E = G.entrada;
      m.lista = m.lista.filter((u) => (u.tipo === 'enemigo' ? !u.muerto && u.vida > 0 : true));
      if (!m.lista.length) { this.menu = m.anterior; return; }
      if (!m.todos) {
        if (E.repetido('abajo') || E.repetido('derecha')) { m.sel = (m.sel + 1) % m.lista.length; G.audio.efecto('cursor'); }
        if (E.repetido('arriba') || E.repetido('izquierda')) { m.sel = (m.sel + m.lista.length - 1) % m.lista.length; G.audio.efecto('cursor'); }
      }
      m.sel = Math.min(m.sel, m.lista.length - 1);
      const tq = E.toque();
      if (tq) {
        // tocar directamente al objetivo
        let elegido = -1;
        m.lista.forEach((u, i) => { const [cx, cy] = this.centro(u); if (Math.abs(tq.x - cx) < 30 && Math.abs(tq.y - cy) < 34) elegido = i; });
        if (elegido >= 0) { E.consumirToque(); m.sel = elegido; return this.confirmarObjetivo(); }
      }
      if (E.presionado('a')) return this.confirmarObjetivo();
      if (E.presionado('b')) { G.audio.efecto('cancelar'); this.menu = m.anterior; }
    }
    confirmarObjetivo() {
      const m = this.menu;
      G.audio.efecto('aceptar');
      const obj = m.todos ? m.lista.slice() : m.lista[m.sel];
      m.alConfirmar && m.alConfirmar();
      this.cerrarMenu(m.heroe, m.crear(obj));
    }

    // ---------------- DAÑO Y CURACIÓN ----------------
    golpear(atacante, objetivo, op) {
      if (objetivo.tipo === 'enemigo' && (objetivo.muerto || objetivo.vida <= 0)) return 0;
      if (objetivo.tipo === 'heroe' && objetivo.ref.vida <= 0) return 0;
      const critico = op.puedeCritico && Math.random() < R().PROB_CRITICO;
      const defensor = objetivo.tipo === 'heroe'
        ? { def: objetivo.s.def, escudo: objetivo.escudoT > 0 ? 1.6 : 0 }
        : { def: objetivo.s.def, debil: objetivo.debil, resiste: objetivo.resiste };
      const res = R().danio(atacante.s, defensor, { tipo: op.tipo, potencia: op.potencia, elementos: op.elementos, preciso: op.preciso, critico });
      let n = res.danio;
      if (atacante.tipo === 'enemigo' && atacante.furia) n = Math.round(n * 1.2);
      const [cx, cy] = this.centro(objetivo);
      // números y palabras flotantes
      G.fx.flotante(String(n), cx, cy - 6, critico ? '#ffd166' : '#ffffff', { escala: critico ? 2 : 1 });
      if (res.elemento === 'debil') G.fx.flotante('¡DÉBIL!', cx, cy - 22, '#ff8a4c', { vida: 1.1 });
      if (res.elemento === 'resiste') G.fx.flotante('resiste', cx, cy - 22, '#9b8fb0');
      if (op.preciso) G.fx.flotante('¡PRECISO!', cx, cy - 34, '#7ef2c8', { vida: 1.1 });
      objetivo.flash = 0.18;
      objetivo.dx += objetivo.tipo === 'heroe' ? 6 : -6;
      G.fx.emitir(cx, cy, { n: critico ? 18 : 8, color: op.color || ['#ffffff', '#ffd166'], vel: 80, vida: 0.4 });
      if (critico) { G.fx.rgb(0.35); G.fx.temblor(5, 0.3); G.audio.efecto('critico'); G.fx.onomatopeya('¡KRAK!', cx, cy - 20, { escala: 2, fondo: '#ff2a6d' }); }
      else { G.audio.efecto(op.preciso ? 'golpeFuerte' : 'golpe'); G.fx.temblor(op.preciso ? 4 : 2, 0.2); }
      if (!critico && op.ono) G.fx.onomatopeya(op.ono, cx + U.azar(-10, 10), cy - 22, { escala: 2, vida: 0.7, fondo: op.fondoOno || '#ffd23f' });
      if (objetivo.tipo === 'heroe') {
        objetivo.ref.vida = Math.max(0, objetivo.ref.vida - n);
        if (objetivo.ref.vida <= 0) this.caeHeroe(objetivo);
      } else {
        objetivo.vida = Math.max(0, objetivo.vida - n);
        if (objetivo.vida <= 0) this.muereEnemigo(objetivo, atacante);
        else this.revisarFase(objetivo);
      }
      return n;
    }

    curar(objetivo, n) {
      const s = objetivo.s;
      objetivo.ref.vida = Math.min(s.vida, objetivo.ref.vida + n);
      const [cx, cy] = this.centro(objetivo);
      G.fx.flotante('+' + n, cx, cy - 6, '#7ef2c8');
      G.fx.emitir(cx, cy + 10, { n: 14, color: ['#7ef2c8', '#ffffff', '#a6ffe4'], vel: 30, angulo: -Math.PI / 2, abanico: 1.2, vida: 0.8, brillo: true });
    }

    caeHeroe(h) {
      h.atb = 0;
      h.escudoT = 0;
      this.listos = this.listos.filter((x) => x !== h);
      if (this.menu && this.menu.heroe === h) this.menu = null;
      G.audio.efecto('muerte');
      G.fx.flotante('¡Cayó!', h.x, h.y - 50, '#ff5d73', { vida: 1.2 });
    }

    muereEnemigo(e, atacante) {
      e.muriendo = 0.001;
      e.enCola = true;
      G.guardado.marcarBestiario(e.id, 'vencido');
      const [cx, cy] = this.centro(e);
      G.fx.emitir(cx, cy, { n: 26, color: ['#b18cff', '#05d9e8', '#ffffff', '#ff2a6d'], vel: 90, vida: 0.9, tam: 2 });
      // ¿Era el último? -> golpe final en cámara lenta
      if (!this.vivosE().length) {
        G.fx.camaraLenta(0.18, 1.1);
        G.fx.lineas(cx, cy, 0.9);
        G.fx.rgb(0.7);
        G.fx.temblor(7, 0.6);
        G.fx.destello('#ffffff', 0.25);
        G.fx.onomatopeya(this.esJefe ? '¡KABUM!' : U.elegir(['¡ZAS!', '¡PUM!', '¡CRAC!']), cx, cy - 28, { escala: 3, vida: 1.4, fondo: '#ffd23f', puntas: 14 });
        G.audio.efecto('golpeFuerte');
      } else if (this.esJefe) {
        // el otro señor se enfurece
        this.vivosE().forEach((o) => {
          o.furia = true;
          this.cola.push(() => this.fraseJefe(o, o.id === 'hunCame' ? '¡Vucub Camé! ...Pagarán por esto.' : '¡Hun Camé! ...Xibalbá no perdona.'));
        });
      }
    }

    revisarFase(e) {
      if (!this.esJefe || e.fase > 0) return;
      if (e.vida < e.vidaMax * 0.5) {
        e.fase = 1;
        e.furia = true;
        const frases = {
          vucubCaquix: '¡Mi brillo es más fuerte que cualquier sol!',
          zipacna: '¡Ninguna montaña es demasiado pesada para mí!',
          hunCame: 'Ustedes, niños del juego de pelota... ¿creen que pueden vencernos?',
          vucubCame: 'La luz del sol se queda en Xibalbá.'
        };
        if (frases[e.id]) this.cola.unshift(() => this.fraseJefe(e, frases[e.id]));
      }
    }

    *fraseJefe(e, texto) {
      if (e.muerto) return;
      const [cx, cy] = this.arriba(e);
      this.visual(1.8, (ctx, k) => {
        const lineas = G.fuente.envolver(texto, 150);
        const w = Math.max(...lineas.map((l) => G.fuente.ancho(l))) + 12, h = lineas.length * 11 + 6;
        const x = U.limitar(cx - w / 2, 4, G.ANCHO - w - 4), y = U.limitar(cy - h - 6, 4, 200);
        ctx.fillStyle = '#0a0612'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
        ctx.fillStyle = '#fff3b0'; ctx.fillRect(x, y, w, h);
        lineas.forEach((l, i) => G.fuente.texto(ctx, l, x + 6, y + 4 + i * 11, '#5c1439'));
      });
      G.fx.rgb(0.3);
      yield 1.9;
    }

    // ---------------- ACCIONES DE LOS HÉROES ----------------
    *moverA(u, tx, ty, dur) {
      const x0 = u.dx, y0 = u.dy;
      let t = 0;
      while (t < dur) {
        t += 1 / 60;
        const k = U.suave(t / dur);
        u.dx = U.lerp(x0, tx, k); u.dy = U.lerp(y0, ty, k);
        u.cuadro = Math.floor(t * 10) % 3;
        yield 1 / 60;
      }
      u.dx = tx; u.dy = ty; u.cuadro = 0;
    }

    *accionAtacar(h, obj) {
      h.enCola = false;
      if (h.ref.vida <= 0) return;
      if (obj.muerto || obj.vida <= 0) obj = this.vivosE()[0];
      if (!obj) return;
      const [cx] = this.centro(obj);
      yield* this.moverA(h, cx - h.x + 28, obj.y - h.y + 4, 0.22);
      // Anillo del golpe preciso
      this.anillo = { obj, t: 0, dur: 0.62, presionado: false, preciso: false };
      G.entrada.limpiar();
      yield () => {
        const a = this.anillo;
        a.t += 1 / 60;
        const r = this.radioAnillo();
        if (!a.presionado && (G.entrada.presionado('a') || G.entrada.consumirToque())) {
          a.presionado = true;
          a.preciso = r >= 7 && r <= 17;
          if (a.preciso) G.audio.efecto('preciso'); else G.audio.efecto('fallo');
        }
        return a.presionado || a.t >= a.dur;
      };
      const preciso = this.anillo.preciso;
      this.anillo = null;
      h.cuadro = 1;
      this.golpear(h, obj, { tipo: 'fisico', potencia: 1, preciso, puedeCritico: true, ono: U.elegir(ONOS_GOLPE) });
      this.visual(0.25, (ctx, k) => this.dibujarCorte(ctx, obj, k, '#ffffff'));
      yield 0.3;
      yield* this.moverA(h, 0, 0, 0.25);
      h.atb = 0;
    }
    radioAnillo() { const a = this.anillo; return a ? U.lerp(40, 3, a.t / a.dur) : 0; }

    gastarEnergia(h, n) { h.ref.energia = Math.max(0, h.ref.energia - n); }

    *accionTecnica(h, id, obj) {
      h.enCola = false;
      if (h.ref.vida <= 0) return;
      const t = D().TECNICAS[id];
      if (h.ref.energia < t.costo) { G.audio.efecto('error'); h.atb = 0; return; }
      this.gastarEnergia(h, t.costo);
      this.decir(t.nombre);
      yield* this.lanzar(h, t, obj, false);
      h.atb = 0;
    }

    *accionDoble(h, otro, id, obj) {
      h.enCola = false; otro.enCola = false;
      const t = D().DOBLES[id];
      if (h.ref.vida <= 0 || otro.ref.vida <= 0) { h.atb = 0; return; }
      const iH = this.heroes.indexOf(h);
      this.gastarEnergia(h, t.costo[iH]);
      this.gastarEnergia(otro, t.costo[1 - iH]);
      this.decir('★ ' + t.nombre + ' ★');
      G.audio.efecto('escudo');
      // los dos se iluminan
      [h, otro].forEach((x) => this.visual(0.6, (ctx, k) => P.brillo(ctx, x.x, x.y - 24, 30 + k * 20, x.id === 'hunahpu' ? '#ff8a4c' : '#3fd3a8', 0.6 * (1 - k))));
      yield 0.6;
      yield* this.lanzar(h, t, obj, true, otro);
      h.atb = 0; otro.atb = 0;
    }

    objetivos(obj) {
      const lista = Array.isArray(obj) ? obj : [obj];
      return lista.filter((u) => (u.tipo === 'enemigo' ? !u.muerto && u.vida > 0 : true));
    }

    // Animación y efecto de cada técnica.
    *lanzar(h, t, obj, doble, otro) {
      let objs = this.objetivos(obj);
      if ((t.objetivo === 'enemigo' || t.objetivo === 'enemigos') && !objs.length) objs = t.objetivo === 'enemigos' ? this.vivosE() : this.vivosE().slice(0, 1);
      const el = t.elemento || [];
      const color = COLOR_ELEM[el[0]] || '#ffffff';
      const ono = ONOS_ELEM[el[0]] || '¡ZAS!';
      // aura de carga
      this.visual(0.4, (ctx, k) => { P.brillo(ctx, h.x + h.dx, h.y - 24, 24, color, 0.7 * (1 - k)); });
      G.fx.emitir(h.x, h.y - 10, { n: 12, color: [color, '#ffffff'], vel: 25, angulo: -Math.PI / 2, abanico: 1.5, vida: 0.5 });
      yield 0.35;
      const golpe = (u, extra) => this.golpear(h, u, Object.assign({ tipo: t.tipo, potencia: t.potencia, elementos: el, color: [color, '#ffffff'], ono, fondoOno: color }, extra || {}));

      switch (t.efecto) {
        case 'dardo': case 'fuego': {
          G.audio.efecto('dardo');
          const u = objs[0];
          yield* this.proyectil(h, u, t.efecto === 'fuego' ? '#ff7a3d' : '#efe6d6', 0.22);
          if (t.efecto === 'fuego') { G.audio.efecto('fuego'); this.explosion(u, '#ff7a3d'); }
          golpe(u);
          yield 0.4;
          break;
        }
        case 'lluvia': {
          for (let i = 0; i < 3; i++) {
            G.audio.efecto('dardo');
            objs.forEach((u) => this.visual(0.2, (ctx, k) => this.dibujarDardo(ctx, h, u, k, '#efe6d6')));
            yield 0.12;
          }
          objs.forEach((u) => golpe(u));
          yield 0.5;
          break;
        }
        case 'alba': {
          G.audio.efecto('fuego');
          G.fx.destello('#fff3b0', 0.4);
          objs.forEach((u) => this.visual(0.7, (ctx, k) => {
            const [cx, cy] = this.centro(u);
            ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = '#ffd166';
            ctx.fillRect(cx - 10 + k * 6, 0, 20 - k * 12, cy + 20);
            ctx.restore();
            P.brillo(ctx, cx, cy, 40, '#ffd166', 0.6 * (1 - k));
          }));
          yield 0.4;
          objs.forEach((u) => golpe(u));
          yield 0.5;
          break;
        }
        case 'jaguar': {
          G.audio.efecto('rugido');
          const u = objs[0];
          this.visual(0.5, (ctx, k) => this.dibujarCorte(ctx, u, k, '#e0a43a', 3));
          G.fx.emitir(this.centro(u)[0], u.y, { n: 16, color: ['#c49a6c', '#8a6a4a'], vel: 70, angulo: -Math.PI / 2, abanico: 1.4, gravedad: 200, vida: 0.7, tam: 2 });
          yield 0.2;
          golpe(u);
          yield 0.4;
          break;
        }
        case 'agua': {
          G.audio.efecto('agua');
          this.visual(0.8, (ctx, k) => {
            const x = G.ANCHO - k * (G.ANCHO + 120);
            ctx.save(); ctx.globalAlpha = 0.7;
            ctx.fillStyle = '#4cc9f0'; ctx.fillRect(x, 90, 70, 80);
            ctx.fillStyle = '#bfe9ff'; for (let y = 90; y < 170; y += 6) ctx.fillRect(x + Math.sin(y + k * 20) * 6, y, 8, 2);
            ctx.restore();
          });
          yield 0.45;
          objs.forEach((u) => golpe(u));
          yield 0.5;
          break;
        }
        case 'terremoto': {
          G.audio.efecto('tierra');
          G.fx.temblor(8, 0.8);
          objs.forEach((u) => G.fx.emitir(this.centro(u)[0], u.y, { n: 18, color: ['#c49a6c', '#5a4a3a', '#efe6d6'], vel: 110, angulo: -Math.PI / 2, abanico: 1, gravedad: 260, vida: 0.8, tam: 2 }));
          yield 0.4;
          objs.forEach((u) => golpe(u));
          yield 0.5;
          break;
        }
        case 'escudo': {
          G.audio.efecto('escudo');
          this.vivosH().forEach((x) => { x.escudoT = 18; this.visual(0.8, (ctx, k) => this.dibujarEscudo(ctx, x, 1 - k)); G.fx.flotante('Escudo', x.x, x.y - 56, '#7ef2c8'); });
          yield 0.8;
          break;
        }
        case 'cura': {
          G.audio.efecto('curar');
          objs.forEach((u) => this.curar(u, R().curacion(h.s.mag, t.potencia)));
          yield 0.7;
          break;
        }
        case 'pelota': {
          // la pelota de hule va de un gemelo al otro y luego al enemigo
          G.audio.efecto('viento');
          const u = objs[0];
          const pts = [[h.x, h.y - 30], [otro.x, otro.y - 30], [h.x, h.y - 50], this.centro(u)];
          for (let i = 0; i < pts.length - 1; i++) {
            const a = pts[i], b = pts[i + 1];
            this.visual(0.2, (ctx, k) => {
              const x = U.lerp(a[0], b[0], k), y = U.lerp(a[1], b[1], k) - Math.sin(k * Math.PI) * 20;
              P.elipse(ctx, x, y, 5, 5, '#1a0f1f'); P.elipse(ctx, x, y, 4, 4, '#3a2a2a'); P.px(ctx, x - 1, y - 2, '#8a7a7a');
            });
            G.audio.efecto('golpe');
            yield 0.2;
          }
          G.fx.lineas(this.centro(u)[0], this.centro(u)[1], 0.4);
          golpe(u, { ono: '¡BOING!' });
          yield 0.5;
          break;
        }
        case 'eclipse': {
          G.audio.efecto('fuego');
          this.visual(1.0, (ctx, k) => {
            const cx = 130, cy = 70;
            P.brillo(ctx, cx, cy, 60, '#ffd166', 0.7 * Math.sin(k * Math.PI));
            P.elipse(ctx, cx + (1 - k) * 30 - 10, cy, 18, 18, '#0a0612');
          });
          yield 0.6;
          objs.forEach((u) => golpe(u));
          if (t.curaAliados) this.vivosH().forEach((x) => this.curar(x, Math.round(x.s.vida * t.curaAliados)));
          yield 0.5;
          break;
        }
        case 'solLuna': {
          G.audio.efecto('nivel');
          G.fx.destello('#ffffff', 0.5);
          this.visual(1.0, (ctx, k) => {
            const cx = 130, cy = 80, d = (1 - k) * 80;
            P.elipse(ctx, cx - d, cy - 20, 12, 12, '#ffd166'); P.brillo(ctx, cx - d, cy - 20, 30, '#ff8a4c', 0.6);
            P.elipse(ctx, cx + d, cy - 20, 10, 10, '#e8f4ff'); P.brillo(ctx, cx + d, cy - 20, 30, '#3fd3a8', 0.6);
          });
          yield 0.9;
          G.fx.temblor(8, 0.5);
          objs.forEach((u) => golpe(u, { ono: '¡BRILLO!' }));
          yield 0.6;
          break;
        }
        default: {
          objs.forEach((u) => golpe(u));
          yield 0.4;
        }
      }
    }

    *proyectil(h, u, color, dur) {
      this.visual(dur, (ctx, k) => this.dibujarDardo(ctx, h, u, k, color));
      yield dur;
    }
    explosion(u, color) {
      const [cx, cy] = this.centro(u);
      this.visual(0.45, (ctx, k) => {
        P.elipse(ctx, cx, cy, 6 + k * 22, 6 + k * 22, k < 0.5 ? '#fff3b0' : color);
        P.brillo(ctx, cx, cy, 40, color, 0.7 * (1 - k));
      });
      G.fx.emitir(cx, cy, { n: 20, color: [color, '#ffd166', '#ffffff'], vel: 100, vida: 0.6, tam: 2 });
    }

    *accionObjeto(h, id, obj) {
      h.enCola = false;
      if (h.ref.vida <= 0) return;
      const o = D().OBJETOS[id];
      if (G.partida.cuantos(id) <= 0) { h.atb = 0; return; }
      const u = Array.isArray(obj) ? obj[0] : obj;
      this.decir(o.nombre);
      G.partida.quitar(id);
      yield 0.3;
      if (o.uso === 'cura') { G.audio.efecto('curar'); this.curar(u, o.valor); }
      else if (o.uso === 'energia') {
        G.audio.efecto('curar');
        u.ref.energia = Math.min(u.s.energia, u.ref.energia + o.valor);
        G.fx.flotante('+' + o.valor + ' E', u.x, u.y - 30, '#4cc9f0');
      } else if (o.uso === 'revivir') {
        if (u.ref.vida > 0) { G.fx.flotante('No hace falta', u.x, u.y - 40, '#9b8fb0'); G.partida.dar(id); }
        else {
          G.audio.efecto('revivir');
          u.ref.vida = Math.max(1, Math.round(u.s.vida * o.valor));
          u.atb = 0;
          G.fx.emitir(u.x, u.y - 10, { n: 24, color: ['#2ec27e', '#ffffff', '#1a7f8e'], vel: 50, angulo: -Math.PI / 2, abanico: 1.2, vida: 1, brillo: true });
          G.fx.flotante('¡Revivió!', u.x, u.y - 50, '#7ef2c8');
        }
      }
      yield 0.6;
      h.atb = 0;
    }

    *accionHuir(h, conCopal) {
      h.enCola = false;
      const velH = this.vivosH().reduce((a, x) => a + x.s.vel, 0) / Math.max(1, this.vivosH().length);
      const velE = this.vivosE().reduce((a, x) => a + x.s.vel, 0) / Math.max(1, this.vivosE().length);
      const ok = conCopal || Math.random() < R().probHuir(velH, velE);
      if (conCopal) {
        this.decir('Copal');
        this.visual(1, (ctx, k) => { ctx.save(); ctx.globalAlpha = 0.6 * Math.sin(k * Math.PI); ctx.fillStyle = '#d9d4e0'; ctx.fillRect(0, 0, G.ANCHO, G.ALTO); ctx.restore(); });
        yield 0.6;
      }
      if (!ok) {
        G.audio.efecto('error');
        this.decir('¡No pudieron huir!');
        h.atb = 0;
        yield 0.8;
        return;
      }
      G.audio.efecto('huir');
      this.estado = 'huyendo';
      this.heroes.forEach((x) => { x.cuadro = 1; });
      yield* this.moverA(this.heroes[0], 100, 0, 0.4);
      this.terminar('huida');
    }

    // ---------------- ACCIONES DE LOS ENEMIGOS ----------------
    elegirAtaque(e) {
      const lista = e.def.ataques;
      const total = lista.reduce((a, x) => a + x.prob, 0);
      let r = Math.random() * total;
      for (const a of lista) { r -= a.prob; if (r <= 0) return a; }
      return lista[0];
    }

    *accionEnemigo(e) {
      e.enCola = false;
      if (e.muerto || e.vida <= 0) return;
      const vivos = this.vivosH();
      if (!vivos.length) return;
      const at = this.elegirAtaque(e);
      if (at.frase && !e.frases[at.nombre]) { e.frases[at.nombre] = true; yield* this.fraseJefe(e, at.frase); }
      this.decir(at.nombre);
      let objs = at.objetivo === 'todos' ? vivos : [Math.random() < 0.35 ? vivos.reduce((a, b) => (a.ref.vida < b.ref.vida ? a : b)) : U.elegir(vivos)];
      // embestida
      yield* this.moverA(e, 26, 0, 0.18);
      const op = { tipo: at.tipo, potencia: at.potencia, elementos: at.elemento ? [at.elemento] : [], puedeCritico: false };
      switch (at.efecto) {
        case 'onda':
          G.audio.efecto(at.elemento === 'viento' ? 'viento' : 'camara');
          this.visual(0.5, (ctx, k) => { const [cx, cy] = this.centro(e); ctx.strokeStyle = '#ff2a6d'; ctx.globalAlpha = 1 - k; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cx, cy, 10 + (k + i * 0.2) * 120, -0.6, 0.6); ctx.stroke(); } ctx.globalAlpha = 1; });
          yield 0.4; break;
        case 'destello':
          G.audio.efecto('fuego'); G.fx.destello('#fff3b0', 0.5); yield 0.3; break;
        case 'roca':
          G.audio.efecto('tierra');
          objs.forEach((u) => this.visual(0.4, (ctx, k) => { const [cx, cy] = this.centro(u); P.elipse(ctx, cx, U.lerp(-20, cy, k), 9, 8, '#7a6e5e'); P.elipse(ctx, cx - 2, U.lerp(-22, cy - 2, k), 4, 3, '#a89c88'); }));
          yield 0.4; G.fx.temblor(6, 0.4); break;
        case 'temblor':
          G.audio.efecto('tierra'); G.fx.temblor(8, 0.6); yield 0.3; break;
        default:
          objs.forEach((u) => this.visual(0.25, (ctx, k) => this.dibujarCorte(ctx, u, k, '#ff2a6d')));
          yield 0.1;
      }
      objs.forEach((u) => {
        this.golpear(e, u, Object.assign({}, op, { ono: at.efecto === 'garra' ? '¡ÑAC!' : (at.efecto === 'roca' ? '¡BRUM!' : null), fondoOno: '#ff5d73' }));
        if (at.aturdir && u.ref.vida > 0 && Math.random() < at.aturdir) {
          u.atb = 0;
          this.listos = this.listos.filter((x) => x !== u);
          if (this.menu && this.menu.heroe === u) this.menu = null;
          G.fx.flotante('¡Aturdido!', u.x, u.y - 62, '#ffd166', { vida: 1.1 });
        }
      });
      yield 0.3;
      yield* this.moverA(e, 0, 0, 0.2);
    }

    // ---------------- VICTORIA / DERROTA ----------------
    iniciarVictoria() {
      this.estado = 'victoria';
      this.menu = null;
      this.cola = [];
      this.tv = 0;
      const xp = this.enemigos.reduce((a, e) => a + (e.def.xp || 0), 0);
      const lineas = [];
      const premios = {};
      this.enemigos.forEach((e) => (e.def.suelta || []).forEach((s) => { if (Math.random() < s.prob) premios[s.objeto] = (premios[s.objeto] || 0) + 1; }));
      Object.keys(premios).forEach((id) => { G.partida.dar(id, premios[id]); });
      if (xp > 0) lineas.push(`Experiencia ganada: *${xp}*`);
      Object.keys(premios).forEach((id) => lineas.push(`Obtuviste: *${D().OBJETOS[id].nombre}* x${premios[id]}`));
      this.heroes.forEach((h) => {
        const ev = R().ganarXP(h.ref, xp);
        ev.forEach((x) => {
          lineas.push({ texto: `¡${h.nombre} subió al nivel *${x.nivel}*!`, sonido: 'nivel' });
          x.nuevas.forEach((t) => lineas.push({ texto: `${h.nombre} aprendió *${D().TECNICAS[t].nombre}*.`, sonido: 'cofre' }));
        });
        h.s = R().stats(h.ref);
      });
      // nuevas técnicas dobles
      if (!lineas.length) lineas.push('¡Victoria!');
      this.lineasVictoria = lineas;
      this.dialogoVictoria = null;
    }

    actualizarVictoria(dt) {
      this.tv += dt;
      this.heroes.forEach((h) => { if (h.ref.vida > 0) h.dy = -Math.abs(Math.sin(this.tv * 6)) * 6 * Math.max(0, 1 - (this.tv - 1.2)); });
      if (this.tv < 1.2) return;
      if (!this.dialogoVictoria) {
        G.audio.musica('victoria');
        this.dialogoVictoria = new G.ui.Dialogo(this.lineasVictoria.map((l) => (typeof l === 'string' ? { texto: l, quien: '¡Victoria!' } : Object.assign({ quien: '¡Victoria!' }, l))), () => this.terminar('victoria'));
      }
      this.dialogoVictoria.actualizar(dt);
    }

    derrota() {
      this.estado = 'derrota';
      this.menu = null;
      this.cola = [];
      this.derrotaT = 0;
      G.audio.musica('derrota');
      this.visual(9, (ctx, k) => { ctx.fillStyle = '#0a0612'; ctx.globalAlpha = Math.min(0.7, k * 3); ctx.fillRect(0, 0, G.ANCHO, G.ALTO); ctx.globalAlpha = 1; });
    }

    terminar(resultado) {
      if (this.resultado) return;
      this.resultado = resultado;
      this.estado = 'fin';
      G.fx.limpiar();
      // Al terminar (ganando o huyendo), los gemelos caídos se levantan con 1 de vida.
      if (resultado !== 'derrota') this.heroes.forEach((h) => { if (h.ref.vida <= 0) h.ref.vida = 1; });
      G.motor.quitar({ fundido: true, resultado, dur: 0.35 });
      this.op.alTerminar && this.op.alTerminar(resultado);
    }

    // ---------------- DIBUJO ----------------
    dibujar(ctx) {
      const tipo = this.op.fondo || 'selva';
      ctx.drawImage(fondo(tipo), 0, 0);
      // brillos animados del fondo
      if (tipo === 'cueva' || tipo === 'palacio') {
        for (let i = 0; i < 6; i++) P.brillo(ctx, (i * 67 + 20) % G.ANCHO, 90, 18, tipo === 'cueva' ? ['#05d9e8', '#ff2a6d', '#b18cff'][i % 3] : '#ff2a6d', 0.25 + Math.sin(this.t * 2 + i) * 0.1);
      } else {
        for (let i = 0; i < 8; i++) {
          const x = (i * 53 + Math.sin(this.t * 0.6 + i) * 20) % G.ANCHO, y = 30 + (i * 29) % 70 + Math.cos(this.t + i) * 6;
          const a = 0.5 + Math.sin(this.t * 3 + i) * 0.5;
          if (a > 0.3) { P.brillo(ctx, x, y, 5, '#e9ff70', 0.5 * a); P.px(ctx, x, y, '#fffbd0'); }
        }
      }
      // sombras y personajes ordenados por altura
      const todos = this.enemigos.filter((e) => !e.muerto).concat(this.heroes).sort((a, b) => a.y - b.y);
      todos.forEach((u) => (u.tipo === 'heroe' ? this.dibujarHeroe(ctx, u) : this.dibujarEnemigo(ctx, u)));
      this.visuales.forEach((v) => { ctx.save(); v.fn(ctx, Math.min(1, v.t / v.dur), v.t); ctx.restore(); });
      G.fx.dibujarParticulas(ctx);
      if (this.anillo) this.dibujarAnillo(ctx);
      G.fx.dibujarFlotantes(ctx);
      this.dibujarHUD(ctx);
      if (this.banner) {
        const w = G.fuente.ancho(this.banner.texto) + 24;
        const a = Math.min(1, this.banner.t / 0.1) * (this.banner.t > 1.2 ? Math.max(0, (1.4 - this.banner.t) / 0.2) : 1);
        ctx.globalAlpha = a;
        G.ui.ventana(ctx, (G.ANCHO - w) / 2, 6, w, 16, { borde: COL.oro });
        G.fuente.texto(ctx, this.banner.texto, G.ANCHO / 2, 10, COL.oro, { alinear: 'centro', sombra: COL.sombra });
        ctx.globalAlpha = 1;
      }
      if (this.estado === 'victoria' && this.dialogoVictoria) this.dialogoVictoria.dibujar(ctx);
    }

    dibujarHeroe(ctx, h) {
      const caido = h.ref.vida <= 0;
      let img = G.arte.personaje(h.id, 1, h.cuadro);
      if (h.flash > 0 && Math.floor(h.flash * 30) % 2 === 0) img = P.silueta(img, '#ffffff');
      // sombra
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      P.elipse(ctx, h.x + h.dx, h.y + 2, 12, 3, 'rgba(0,0,0,0.3)');
      if (h.dx !== 0 && !this.gen && h.flash <= 0) h.dx *= 0.8;
      if (caido) {
        ctx.save();
        ctx.translate(Math.round(h.x), Math.round(h.y - 8));
        ctx.rotate(-Math.PI / 2);
        ctx.globalAlpha = 0.85;
        ctx.drawImage(img, -16, -24, 32, 50);
        ctx.restore();
        return;
      }
      const respira = Math.round(Math.sin(this.t * 3 + (h.id === 'hunahpu' ? 0 : 1.5)));
      const x = Math.round(h.x + h.dx - 16), y = Math.round(h.y + h.dy - 50 + (this.gen ? 0 : respira * 0.5));
      if (h.atb >= 100 && !h.enCola) P.brillo(ctx, h.x + h.dx, h.y - 24, 26, h.id === 'hunahpu' ? '#ff8a4c' : '#3fd3a8', 0.25 + Math.sin(this.t * 6) * 0.1);
      ctx.drawImage(img, x, y, 32, 50);
      if (h.escudoT > 0) this.dibujarEscudo(ctx, h, 0.35);
      // flecha del héroe que elige
      if (this.menu && this.menu.heroe === h && this.menu.tipo !== 'objetivo') {
        G.fuente.texto(ctx, '▼', h.x + h.dx, y - 10 + Math.sin(this.t * 8) * 2, COL.oro, { alinear: 'centro', sombra: COL.sombra });
      }
      this.dibujarCursorObjetivo(ctx, h);
    }

    dibujarEnemigo(ctx, e) {
      const cuadro = Math.floor(this.t * (e.def.volador ? 6 : 3));
      let img = G.arte.criatura(e.id, cuadro);
      if (!img) return;
      const w = img.width * ESC, hh = img.height * ESC;
      const flota = e.def.volador ? Math.round(Math.sin(this.t * 3 + e.x0) * 3) - 10 : 0;
      if (e.dx !== 0 && !this.gen && e.flash <= 0 && e.muriendo === 0) e.dx *= 0.8;
      const x = Math.round(e.x + e.dx - w / 2), y = Math.round(e.y + e.dy - hh + flota);
      P.elipse(ctx, e.x + e.dx, e.y + 2, w * 0.32, 4, 'rgba(0,0,0,0.3)');
      if (e.muriendo > 0) {
        // se desvanece en tiras (como una imagen que se rompe)
        const k = Math.min(1, e.muriendo / 0.7);
        const blanco = P.silueta(img, '#ffffff');
        for (let i = 0; i < img.height; i += 2) {
          const off = (i % 4 === 0 ? 1 : -1) * k * 30;
          ctx.globalAlpha = 1 - k;
          ctx.drawImage(k < 0.3 ? blanco : img, 0, i, img.width, 2, x + off, y + i * ESC, w, 2 * ESC);
        }
        ctx.globalAlpha = 1;
        return;
      }
      if (e.flash > 0) img = P.silueta(img, '#ffffff');
      if (e.furia && this.esJefe) P.brillo(ctx, e.x + e.dx, y + hh / 2, w * 0.6, '#ff2a6d', 0.2 + Math.sin(this.t * 5) * 0.08);
      ctx.drawImage(img, x, y, w, hh);
      // barra de vida bajo sus pies (la de los jefes va en el recuadro de abajo)
      if (!this.esJefe && e.vida < e.vidaMax) {
        const bw = Math.min(70, w * 0.6);
        G.ui.barra(ctx, Math.round(e.x + e.dx - bw / 2), e.y + 6, bw, 2, e.vida, e.vidaMax, '#ff5d73');
      }
      this.dibujarCursorObjetivo(ctx, e);
    }

    dibujarCursorObjetivo(ctx, u) {
      const m = this.menu;
      if (!m || m.tipo !== 'objetivo') return;
      const sel = m.todos ? m.lista.includes(u) : m.lista[m.sel] === u;
      if (!sel) return;
      const [cx, cy] = this.arriba(u);
      G.fuente.texto(ctx, '▼', cx, cy - 8 + Math.sin(this.t * 8) * 2, COL.oro, { alinear: 'centro', borde: COL.sombra });
      const nombre = u.tipo === 'enemigo' ? u.nombre : u.nombre;
      if (!m.todos || u === m.lista[0]) {
        const txt = m.todos ? (u.tipo === 'enemigo' ? 'Todos los enemigos' : 'Los dos gemelos') : nombre;
        const w = G.fuente.ancho(txt) + 16;
        G.ui.ventana(ctx, 4, 4, w, 15, { borde: COL.borde2 });
        G.fuente.texto(ctx, txt, 12, 7, COL.texto);
      }
    }

    dibujarAnillo(ctx) {
      const a = this.anillo;
      const [cx, cy] = this.centro(a.obj);
      const r = this.radioAnillo();
      ctx.save();
      ctx.strokeStyle = '#ffd166';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.stroke();
      const cerca = r >= 7 && r <= 17;
      ctx.strokeStyle = a.presionado ? (a.preciso ? '#7ef2c8' : '#ff5d73') : (cerca ? '#ffffff' : '#ff8a4c');
      ctx.lineWidth = cerca ? 3 : 2;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      if (!a.presionado) G.fuente.texto(ctx, G.entrada.usaTactil() ? '¡Toca A!' : '¡' + G.entrada.etiqueta('a') + '!', cx, cy + 22, '#ffd166', { alinear: 'centro', borde: COL.sombra });
    }

    dibujarCorte(ctx, u, k, color, n) {
      const [cx, cy] = this.centro(u);
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      for (let i = 0; i < (n || 1); i++) {
        const o = (i - ((n || 1) - 1) / 2) * 8;
        ctx.beginPath();
        ctx.moveTo(cx - 16 + o, cy - 16);
        ctx.lineTo(cx - 16 + o + 32 * Math.min(1, k * 3), cy - 16 + 32 * Math.min(1, k * 3));
        ctx.stroke();
      }
      ctx.restore();
    }

    dibujarDardo(ctx, h, u, k, color) {
      const ax = h.x + h.dx - 12, ay = h.y - 30;
      const [bx, by] = this.centro(u);
      const x = U.lerp(ax, bx, k), y = U.lerp(ay, by, k);
      P.linea(ctx, x, y, x + 8, y + (ay - by) / Math.max(1, Math.abs(ax - bx)) * 8, color, 2);
      if (color === '#ff7a3d') P.brillo(ctx, x, y, 10, '#ff7a3d', 0.7);
    }

    dibujarEscudo(ctx, h, alfa) {
      ctx.save();
      ctx.globalAlpha = alfa;
      ctx.strokeStyle = '#3fd3a8';
      ctx.lineWidth = 2;
      const cx = h.x + h.dx, cy = h.y - 24;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = i / 6 * Math.PI * 2 + this.t;
        const x = cx + Math.cos(a) * 22, y = cy + Math.sin(a) * 28;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    }

    dibujarHUD(ctx) {
      const x0 = 100, y0 = 158, w = G.ANCHO - x0 - 4;
      G.ui.ventana(ctx, x0, y0, w, 54);
      this.heroes.forEach((h, i) => {
        const y = y0 + 5 + i * 25;
        const caido = h.ref.vida <= 0;
        const elige = this.menu && this.menu.heroe === h;
        if (elige) { ctx.fillStyle = COL.seleccion; ctx.fillRect(x0 + 3, y - 2, w - 6, 23); }
        G.fuente.texto(ctx, h.nombre, x0 + 8, y, caido ? COL.rojo : (elige ? COL.oro : COL.texto), { sombra: COL.sombra });
        G.fuente.texto(ctx, `Vida ${h.ref.vida}/${h.s.vida}`, x0 + 72, y, h.ref.vida < h.s.vida * 0.3 ? COL.rojo : COL.texto, { sombra: COL.sombra });
        G.fuente.texto(ctx, `E ${h.ref.energia}`, x0 + 160, y, '#4cc9f0', { sombra: COL.sombra });
        G.ui.barra(ctx, x0 + 72, y + 13, 80, 3, h.ref.vida, h.s.vida, h.ref.vida < h.s.vida * 0.3 ? '#ff5d73' : '#7ef2c8');
        G.ui.barra(ctx, x0 + 160, y + 13, 28, 3, h.ref.energia, h.s.energia, '#4cc9f0');
        // barra de tiempo
        const lleno = h.atb >= 100;
        G.ui.barra(ctx, x0 + 200, y + 3, w - 210, 6, h.atb, 100, lleno ? (Math.floor(this.t * 8) % 2 ? '#ffd166' : '#fff3b0') : '#e8b64c');
        G.fuente.texto(ctx, 'Tiempo', x0 + 200, y + 11, COL.tenue);
        if (h.escudoT > 0) G.fuente.texto(ctx, '★', x0 + 62, y, '#3fd3a8');
      });
      // menú y descripción
      if (this.menu && this.menu.menu) {
        this.menu.menu.dibujar(ctx);
        const sel = this.menu.menu.opciones[this.menu.menu.sel];
        if (sel && sel.desc) {
          const lineas = G.fuente.envolver(sel.desc, 194);
          const hh = lineas.length * 11 + 8;
          G.ui.ventana(ctx, 120, 4, 206, hh, { borde: COL.borde2 });
          lineas.forEach((l, i) => G.fuente.texto(ctx, l, 126, 8 + i * 11, COL.texto, { sombra: COL.sombra }));
        }
      } else if (!this.menu || this.menu.tipo !== 'objetivo') {
        G.ui.ventana(ctx, 4, 158, 92, 54);
        const vivos = this.vivosE();
        vivos.slice(0, 4).forEach((e, i) => {
          const nombre = G.fuente.ancho(e.nombre) > 80 ? (e.def.corto || e.nombre.split(' ')[0]) : e.nombre;
          if (this.esJefe) {
            G.fuente.texto(ctx, nombre, 10, 163 + i * 24, COL.oro, { sombra: COL.sombra });
            G.ui.barra(ctx, 10, 175 + i * 24, 78, 3, e.vida, e.vidaMax, '#ff5d73');
          } else G.fuente.texto(ctx, nombre, 10, 163 + i * 12, COL.texto, { sombra: COL.sombra });
        });
      }
      if (this.listos.length > 1 && this.menu && this.menu.tipo === 'comando') {
        G.fuente.texto(ctx, G.entrada.etiqueta('x') + ': cambiar', 6, 148, COL.tenue, { sombra: COL.sombra });
      }
    }
  }

  G.EscenaCombate = EscenaCombate;
})();
