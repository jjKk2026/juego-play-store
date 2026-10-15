/* =====================================================================
   ESCENA DE COMBATE (lo que se ve) — Gemelos del Sol 2
   La lógica vive en js/combate/ (Personaje, SistemaCombate, MenuAcciones).
   Esta escena solo:
   - le pide al sistema que avance las barras de tiempo,
   - abre el menú de 5 comandos cuando un héroe está listo,
   - y anima los "eventos" que el sistema devuelve (daño, curas,
     purificación, espíritus, sello roto...).
   Modo "espera": mientras eliges o se anima una acción, el tiempo se detiene.
   ===================================================================== */
'use strict';

(function () {
  const P = G.pixel;
  const U = G.util;
  const COL = G.ui.COL;
  const ESC = 2;
  const ONOS = ['¡PAF!', '¡ZAS!', '¡PUM!', '¡TOC!', '¡CRAC!'];
  const ONO_ELEM = { fuego: '¡FUSH!', agua: '¡SPLASH!', tierra: '¡BRUM!', viento: '¡FIUU!' };
  const COLOR_ELEM = { fuego: '#ff7a3d', agua: '#4cc9f0', tierra: '#c49a6c', viento: '#b8f2a1' };

  // ------------------------- fondos -------------------------
  function fondo(tipo) {
    return P.memo('fondo2:' + tipo, () => {
      const [c, ctx] = P.lienzo(G.ANCHO, G.ALTO);
      const W = G.ANCHO, H = G.ALTO;
      const grad = (a, b, y0, y1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0); };
      const rnd = U.semilla(tipo.length * 91);
      if (tipo === 'selva' || tipo === 'templo') {
        grad(tipo === 'selva' ? '#9fdc8c' : '#6b7a5a', tipo === 'selva' ? '#3f8f3a' : '#3a4a2e', 0, 110);
        for (let x = -10; x < W + 20; x += 16 + rnd() * 12) {
          const r = 16 + rnd() * 16;
          G.volumen.esfera(ctx, x, 66 - r * 0.4, r, r * 0.8, tipo === 'selva' ? '#2f7a35' : '#3d4a33');
          P.rect(ctx, x - 2, 70, 4, 40, '#5a4a3a');
        }
        if (tipo === 'templo') for (let x = 0; x < W; x += 32) { P.rect(ctx, x, 20, 30, 70, '#8a8f7a'); P.rect(ctx, x, 20, 30, 3, '#a8ad96'); P.rect(ctx, x + 10, 40, 10, 10, '#565a4a'); P.rect(ctx, x + 2, 26, 6, 40, '#4f8a3a'); }
        grad(tipo === 'selva' ? '#4a9c40' : '#5c5a48', tipo === 'selva' ? '#2f6e2e' : '#3a382c', 100, H);
        for (let i = 0; i < 90; i++) P.px(ctx, rnd() * W, 100 + rnd() * (H - 100), tipo === 'selva' ? '#6cc35a' : '#7a7860');
        ctx.globalAlpha = 0.13; ctx.fillStyle = '#fff3b0';
        for (let i = 0; i < 4; i++) { const x = 40 + i * 100; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 24, 0); ctx.lineTo(x - 40, H); ctx.lineTo(x - 64, H); ctx.fill(); }
        ctx.globalAlpha = 1;
      } else if (tipo === 'cueva') {
        grad('#05020a', '#24123a', 0, 110);
        for (let x = 0; x < W; x += 18 + rnd() * 14) P.triangulo(ctx, x, 0, x + 12, 0, x + 6, 20 + rnd() * 40, '#1d1330');
        for (let i = 0; i < 7; i++) { const x = rnd() * W, cc = ['#05d9e8', '#ff2a6d', '#b18cff'][i % 3]; G.volumen.poligono(ctx, [[x, 72], [x - 7, 104], [x + 7, 104]], U.tono(cc, -0.2)); }
        P.rect(ctx, 0, 96, W, 6, '#0d3b66');
        for (let x = 0; x < W; x += 9) P.rect(ctx, x, 96, 4, 1, '#05d9e8');
        grad('#2a2238', '#120c1e', 102, H);
      } else {
        grad('#110a1a', '#2e2044', 0, 110);
        for (let x = 6; x < W; x += 58) {
          G.volumen.capsula(ctx, x + 9, 8, x + 9, 104, 9, 9, '#3a2852');
          P.rect(ctx, x - 3, 4, 24, 5, '#e8b64c');
          P.rect(ctx, x + 5, 30, 8, 8, '#ff2a6d'); P.rect(ctx, x + 7, 32, 4, 4, '#2e2044');
        }
        P.rect(ctx, 0, 104, W, 1, '#e8b64c');
        grad('#1e1727', '#0a0612', 105, H);
        ctx.globalAlpha = 0.25; for (let y = 110; y < H; y += 10) { ctx.fillStyle = '#e8b64c'; ctx.fillRect(0, y, W, 1); } ctx.globalAlpha = 1;
      }
      return c;
    });
  }

  class EscenaCombate {
    /** op: { grupo, fondo, modo ('normal'|'jefe'|'sello'|'duelo'|'final'), musica, heroes, sinHuir } */
    constructor(op) {
      this.op = op;
      this.t = 0;
      this.fase = 'entrada';
      this.gen = null; this.espera = 0; this.cond = null;
      this.visuales = [];
      this.menu = null;
      this.banner = null;
      this.anillo = null;
      this.mensajes = null;
      this.resultado = null;
    }

    entrar() {
      G.fx.limpiar();
      const e = G.partida.e;
      const ids = this.op.heroes || e.equipo || ['hunahpu'];
      const heroes = ids.map((id) => {
        const ref = e.heroes.find((h) => h.id === id);
        return G.Personaje.deHeroe(ref, G.partida.nombre(id));
      });
      const enemigos = this.op.grupo.map((id) => G.Personaje.deCriatura(id));
      // inventario del combate: objetos + llaves especiales (chispa y reliquias)
      const inv = Object.assign({}, e.objetos);
      if (G.partida.especial('chispa')) inv.chispa = 1;
      const reliquias = Object.keys(G.datos.RELIQUIAS).filter((r) => G.partida.especial(r)).length;
      if (this.op.modo === 'sello' && reliquias) inv.reliquiaLuz = reliquias;
      this.s = new G.SistemaCombate({ heroes, enemigos, modo: this.op.modo || 'normal', inventario: inv, espiritus: (e.espiritus || []).slice(), turnosDuelo: this.op.turnosDuelo || 5 });
      // posiciones
      const pos = heroes.length === 1 ? [[330, 136]] : [[318, 112], [348, 148]];
      heroes.forEach((h, i) => { h.x = pos[i][0]; h.y = pos[i][1]; h.dx = 0; h.dy = 0; h.flash = 0; h.cuadro = 0; h.vidaVista = h.vida; });
      const jefe = enemigos.some((x) => x.jefe);
      const posE = jefe ? (enemigos.length === 1 ? [[118, 156]] : [[84, 156], [196, 156]])
        : [[[110, 140]], [[78, 124], [156, 152]], [[66, 106], [150, 116], [104, 150]]][Math.min(3, enemigos.length) - 1];
      enemigos.forEach((x, i) => { const p = posE[i] || [60 + i * 40, 140]; x.x0 = p[0]; x.x = p[0] - 160; x.y = p[1]; x.dx = 0; x.dy = 0; x.flash = 0; x.muriendo = 0; x.vidaVista = x.vida; G.guardado.marcarBestiario(x.id, 'visto'); });
      this.esJefe = jefe;
      G.audio.musica(this.op.musica || (jefe ? 'jefe' : 'batalla'));
    }

    // ---------------- utilidades ----------------
    centro(u) {
      if (u.esHeroe) return [u.x + u.dx, u.y + u.dy - 24];
      const img = G.arte.criatura(u.id, 0);
      return [u.x + u.dx, u.y + u.dy - (img ? img.height * ESC / 2 : 24)];
    }
    arriba(u) {
      if (u.esHeroe) return [u.x + u.dx, u.y + u.dy - 52];
      const img = G.arte.criatura(u.id, 0);
      return [u.x + u.dx, u.y + u.dy - (img ? img.height * ESC : 40) - 4];
    }
    visual(dur, fn) { this.visuales.push({ t: 0, dur, fn }); }
    decir(texto) { this.banner = { texto, t: 0 }; }

    // ---------------- ciclo ----------------
    actualizar(dt) {
      this.t += dt;
      const s = this.s;
      [...s.heroes, ...s.enemigos].forEach((u) => {
        u.flash = Math.max(0, (u.flash || 0) - dt);
        u.vidaVista += (u.vida - u.vidaVista) * Math.min(1, dt * 8);
        if (u.muriendo > 0) u.muriendo += dt;
      });
      for (let i = this.visuales.length - 1; i >= 0; i--) { const v = this.visuales[i]; v.t += dt; if (v.t >= v.dur) this.visuales.splice(i, 1); }
      if (this.banner) { this.banner.t += dt; if (this.banner.t > 1.5) this.banner = null; }

      if (this.fase === 'entrada') {
        const k = U.suave(Math.min(1, this.t / 0.7));
        s.enemigos.forEach((e) => { e.x = e.x0 - 160 * (1 - k); });
        if (this.t > 0.9) { this.fase = 'pelea'; this.decir(this.op.titulo || (this.esJefe ? '¡' + s.enemigos.map((e) => G.fuente.normalizar(e.nombre)).join(' y ') + '!' : '¡Combate!')); if (this.op.alEmpezar) this.gen = this.op.alEmpezar(this); }
        return;
      }
      if (this.fase === 'fin') { if (this.mensajes) this.mensajes.actualizar(dt); return; }

      this.ejecutar(dt);
      if (!this.gen && this.menu) {
        const accion = this.menu.actualizar(dt, this);
        if (accion) {
          const h = this.menu.heroe;
          this.menu = null;
          this.gen = this.accionHeroe(h, accion);
        }
      }
      // ¿termina la pelea?
      if (!this.gen && s.resultado) { this.terminarPelea(); return; }
      if (!this.gen && !this.menu && s.listos.length) {
        const h = s.listos[0];
        this.menu = new G.MenuAcciones(s, h);
        G.audio.efecto('cursor');
      }
      if (!this.gen && !this.menu) {
        const e = s.siguienteEnemigo();
        if (e) this.gen = this.accionEnemigo(e);
      }
      // modo espera: el tiempo se detiene al elegir o mientras se anima
      s.pausado = !!this.gen || (!!this.menu && G.opciones.modoBatalla !== 'activo');
      s.actualizar(dt);
    }

    ejecutar(dt) {
      if (!this.gen) return;
      if (this.espera > 0) { this.espera -= dt; return; }
      if (this.cond) { if (!this.cond()) return; this.cond = null; }
      for (let i = 0; i < 80; i++) {
        const r = this.gen.next();
        if (r.done) { this.gen = null; return; }
        if (typeof r.value === 'number') { this.espera = r.value; return; }
        if (typeof r.value === 'function' && !r.value()) { this.cond = r.value; return; }
      }
    }

    *moverA(u, tx, ty, dur) {
      const x0 = u.dx, y0 = u.dy;
      let t = 0;
      while (t < dur) { t += 1 / 60; const k = U.suave(t / dur); u.dx = U.lerp(x0, tx, k); u.dy = U.lerp(y0, ty, k); u.cuadro = Math.floor(t * 10) % 3; yield 1 / 60; }
      u.dx = tx; u.dy = ty; u.cuadro = 0;
    }

    // ---------------- acciones de los héroes ----------------
    *accionHeroe(h, a) {
      const s = this.s;
      if (a.tipo === 'atacar') {
        const t = a.objetivo;
        const [cx] = this.centro(t);
        yield* this.moverA(h, cx - h.x + 28, t.y - h.y + 4, 0.22);
        // anillo del golpe preciso
        this.anillo = { obj: t, t: 0, dur: 0.62, presionado: false, preciso: false };
        G.entrada.limpiar();
        yield () => {
          const an = this.anillo; an.t += 1 / 60;
          const r = this.radioAnillo();
          if (!an.presionado && (G.entrada.presionado('a') || G.entrada.consumirToque())) {
            an.presionado = true; an.preciso = r >= 7 && r <= 17;
            G.audio.efecto(an.preciso ? 'preciso' : 'fallo');
          }
          return an.presionado || an.t >= an.dur;
        };
        a.preciso = this.anillo.preciso;
        this.anillo = null;
        h.cuadro = 1;
        const ev = s.ejecutar(h, a);
        yield* this.mostrar(ev, { ono: U.elegir(ONOS) });
        yield 0.2;
        yield* this.moverA(h, 0, 0, 0.25);
        return;
      }
      if (a.tipo === 'defender') {
        const ev = s.ejecutar(h, a);
        this.decir('Defender');
        G.audio.efecto('escudo');
        yield* this.mostrar(ev);
        yield 0.4;
        return;
      }
      // magia, espíritu y objetos: aura de carga y luego el efecto
      const color = a.tipo === 'espiritu' ? '#7ef2c8' : a.tipo === 'magia' ? '#b18cff' : '#ffd166';
      this.visual(0.45, (ctx, k) => P.brillo(ctx, h.x + h.dx, h.y - 24, 26 + k * 10, color, 0.7 * (1 - k)));
      G.fx.emitir(h.x, h.y - 10, { n: 12, color: [color, '#ffffff'], vel: 25, angulo: -Math.PI / 2, abanico: 1.5, vida: 0.5 });
      yield 0.35;
      const ev = s.ejecutar(h, a);
      yield* this.mostrar(ev);
      yield 0.3;
    }

    // ---------------- acciones de los enemigos ----------------
    *accionEnemigo(e) {
      const s = this.s;
      const plan = s.planEnemigo(e);
      if (!plan) return;
      const at = plan.ataque;
      if (at.frase && !(e.frases || (e.frases = {}))[at.nombre]) { e.frases[at.nombre] = true; yield* this.frase(e, at.frase); }
      this.decir(at.nombre);
      yield* this.moverA(e, 26, 0, 0.18);
      if (at.efecto === 'onda') {
        G.audio.efecto(at.elemento === 'viento' ? 'viento' : 'camara');
        this.visual(0.5, (ctx, k) => { const [cx, cy] = this.centro(e); ctx.strokeStyle = '#ff2a6d'; ctx.globalAlpha = 1 - k; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cx, cy, 10 + (k + i * 0.2) * 120, -0.6, 0.6); ctx.stroke(); } ctx.globalAlpha = 1; });
        yield 0.4;
      } else if (at.efecto === 'destello') { G.audio.efecto('fuego'); G.fx.destello('#fff3b0', 0.5); yield 0.3; }
      else if (at.efecto === 'roca') {
        G.audio.efecto('tierra');
        plan.objetivos.forEach((u) => this.visual(0.4, (ctx, k) => { const [cx, cy] = this.centro(u); G.volumen.esfera(ctx, cx, U.lerp(-20, cy, k), 9, 8, '#7a6e5e'); }));
        yield 0.4; G.fx.temblor(6, 0.4);
      } else if (at.efecto === 'temblor') { G.audio.efecto('tierra'); G.fx.temblor(8, 0.6); yield 0.3; }
      else { plan.objetivos.forEach((u) => this.visual(0.25, (ctx, k) => this.dibujarCorte(ctx, u, k, '#ff2a6d'))); yield 0.1; }
      const ev = s.aplicarEnemigo(plan);
      yield* this.mostrar(ev, { ono: at.efecto === 'garra' ? '¡ÑAC!' : null, fondoOno: '#ff5d73' });
      yield 0.25;
      yield* this.moverA(e, 0, 0, 0.2);
    }

    *frase(e, texto) {
      const [cx, cy] = this.arriba(e);
      this.visual(1.9, (ctx) => {
        const lineas = G.fuente.envolver(texto, 150);
        const w = Math.max(...lineas.map((l) => G.fuente.ancho(l))) + 12, h = lineas.length * 11 + 6;
        const x = U.limitar(cx - w / 2, 4, G.ANCHO - w - 4), y = U.limitar(cy - h - 6, 4, 200);
        ctx.fillStyle = '#0a0612'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
        ctx.fillStyle = '#fff3b0'; ctx.fillRect(x, y, w, h);
        lineas.forEach((l, i) => G.fuente.texto(ctx, l, x + 6, y + 4 + i * 11, '#5c1439'));
      });
      G.fx.rgb(0.3);
      yield 2;
    }

    // ---------------- animar los eventos del sistema ----------------
    *mostrar(eventos, op) {
      op = op || {};
      for (const ev of eventos) {
        const o = ev.objetivo;
        switch (ev.tipo) {
          case 'lanza': {
            this.decir(ev.gemela ? '★ ' + ev.nombre + ' ★' : ev.nombre);
            yield* this.efectoLanzar(ev);
            break;
          }
          case 'danio': {
            const [cx, cy] = this.centro(o);
            const col = ev.critico ? '#ffd166' : '#ffffff';
            G.fx.flotante(String(ev.cantidad), cx, cy - 6, col, { escala: ev.critico ? 2 : 1 });
            if (ev.elemento === 'debil') G.fx.flotante('¡DÉBIL!', cx, cy - 22, '#ff8a4c', { vida: 1.1 });
            if (ev.elemento === 'resiste') G.fx.flotante('resiste', cx, cy - 22, '#9b8fb0');
            if (ev.preciso) G.fx.flotante('¡PRECISO!', cx, cy - 34, '#7ef2c8', { vida: 1.1 });
            if (ev.defendio) G.fx.flotante('defendió', cx, cy - 34, '#4cc9f0');
            o.flash = 0.18;
            o.dx += o.esHeroe ? 6 : -6;
            G.fx.emitir(cx, cy, { n: ev.critico ? 18 : 8, color: ['#ffffff', '#ffd166'], vel: 80, vida: 0.4 });
            if (ev.critico) { G.fx.rgb(0.35); G.fx.temblor(5, 0.3); G.audio.efecto('critico'); G.fx.onomatopeya('¡KRAK!', cx, cy - 20, { escala: 2, fondo: '#ff2a6d' }); }
            else {
              G.audio.efecto(ev.preciso ? 'golpeFuerte' : 'golpe');
              G.fx.temblor(ev.preciso ? 4 : 2, 0.2);
              const ono = op.ono || (ev.efecto && ONO_ELEM[(ev.efecto === 'fuego' || ev.efecto === 'alba') ? 'fuego' : ev.efecto === 'agua' ? 'agua' : ev.efecto === 'terremoto' || ev.efecto === 'roca' ? 'tierra' : ev.efecto === 'viento' ? 'viento' : '']);
              if (ono) G.fx.onomatopeya(ono, cx + U.azar(-10, 10), cy - 22, { escala: 2, vida: 0.7, fondo: op.fondoOno || '#ffd23f' });
            }
            yield 0.12;
            break;
          }
          case 'cura': {
            const [cx, cy] = this.centro(o);
            G.audio.efecto('curar');
            G.fx.flotante('+' + ev.cantidad, cx, cy - 6, '#7ef2c8');
            G.fx.emitir(cx, cy + 10, { n: 14, color: ['#7ef2c8', '#ffffff'], vel: 30, angulo: -Math.PI / 2, abanico: 1.2, vida: 0.8, brillo: true });
            yield 0.15; break;
          }
          case 'pe': G.audio.efecto('curar'); G.fx.flotante('+' + ev.cantidad + ' PE', o.x, o.y - 40, '#4cc9f0'); yield 0.2; break;
          case 'escudo': G.audio.efecto('escudo'); G.fx.flotante('Escudo', o.x, o.y - 56, '#7ef2c8'); this.visual(0.8, (ctx, k) => this.dibujarEscudo(ctx, o, 1 - k)); yield 0.1; break;
          case 'defiende': G.fx.flotante('Defiende', ev.actor.x, ev.actor.y - 56, '#4cc9f0'); break;
          case 'aturdido': G.fx.flotante('¡Aturdido!', o.x, o.y - 62, '#ffd166', { vida: 1.1 }); break;
          case 'revive': {
            G.audio.efecto('revivir');
            G.fx.emitir(o.x, o.y - 10, { n: 24, color: ['#2ec27e', '#ffffff'], vel: 50, angulo: -Math.PI / 2, abanico: 1.2, vida: 1, brillo: true });
            G.fx.flotante(ev.porPluma ? '¡La pluma te levanta!' : '¡Revivió!', o.x - 20, o.y - 50, '#7ef2c8', { vida: 1.4 });
            yield 0.5; break;
          }
          case 'cae': G.audio.efecto('muerte'); G.fx.flotante('¡Cayó!', o.x, o.y - 50, '#ff5d73', { vida: 1.2 }); yield 0.3; break;
          case 'furia': G.fx.flotante('¡Se enfurece!', ...this.arriba(o), '#ff2a6d', { vida: 1.2 }); G.fx.rgb(0.3); break;
          case 'muere': {
            o.muriendo = 0.001;
            G.guardado.marcarBestiario(o.id, 'vencido');
            const [cx, cy] = this.centro(o);
            G.fx.emitir(cx, cy, { n: 26, color: ['#b18cff', '#05d9e8', '#ffffff', '#ff2a6d'], vel: 90, vida: 0.9, tam: 2 });
            if (ev.ultimo) this.golpeFinal(cx, cy, false);
            break;
          }
          case 'debilitado': {
            G.guardado.marcarBestiario(o.id, 'vencido');
            const [cx, cy] = this.centro(o);
            this.golpeFinal(cx, cy, true);
            yield 1.2;
            this.decir('¡Purifícalo! Espíritu → Purificar');
            G.ui.aviso('La sombra lo dejó. ¡Purifica su luz!', '#7ef2c8');
            yield 0.4; break;
          }
          case 'purifica': {
            const [cx, cy] = this.centro(o);
            G.audio.efecto('curar');
            // rayos de luz que bajan sobre la sombra
            this.visual(0.9, (ctx, k) => {
              ctx.save(); ctx.globalAlpha = Math.sin(k * Math.PI) * 0.8;
              ctx.fillStyle = ev.reliquia ? '#ffd166' : '#7ef2c8';
              for (let i = -2; i <= 2; i++) ctx.fillRect(cx + i * 9 - 2, 0, 4, cy + 10);
              ctx.restore();
              P.brillo(ctx, cx, cy, 50, '#7ef2c8', 0.6 * (1 - k));
            });
            G.fx.emitir(cx, cy, { n: 24, color: ['#7ef2c8', '#ffffff', '#ffd166'], vel: 60, vida: 0.9, brillo: true });
            G.fx.flotante((ev.barra === 'sello' ? 'Sello -' : 'Corrupción -') + ev.cantidad, cx, cy - 30, '#b18cff', { vida: 1.3 });
            yield 0.9; break;
          }
          case 'purificado': {
            G.audio.efecto('nivel');
            const [cx, cy] = this.centro(o);
            o.transformando = 0.001;
            G.fx.destello('#e9fff7', 0.6);
            G.fx.emitir(cx, cy, { n: 40, color: ['#7ef2c8', '#ffffff', '#ffd166'], vel: 70, vida: 1.4, brillo: true });
            yield 1.6; break;
          }
          case 'selloRoto': {
            const [cx, cy] = this.centro(o);
            G.fx.camaraLenta(0.2, 1.2); G.fx.lineas(cx, cy, 1); G.fx.rgb(0.8); G.fx.temblor(8, 0.7); G.fx.destello('#ffffff', 0.5);
            G.fx.onomatopeya('¡CRASH!', cx, cy - 30, { escala: 3, vida: 1.5, fondo: '#b18cff', puntas: 16 });
            G.audio.efecto('golpeFuerte'); G.audio.efecto('cristal');
            // pedazos del sello que vuelan como vidrio
            G.fx.emitir(cx, cy, { n: 50, color: ['#b18cff', '#e040ff', '#ffffff'], vel: 140, vida: 1.2, tam: 2 });
            yield 1.6; break;
          }
          case 'invoca': yield* this.efectoInvocar(ev); break;
          case 'chispa': {
            G.audio.efecto('nivel'); G.fx.destello('#fff3b0', 0.8);
            this.visual(1.2, (ctx, k) => P.brillo(ctx, ev.actor.x, ev.actor.y - 30, 30 + k * 200, '#ffd166', 0.8 * (1 - k)));
            yield 1.2; break;
          }
          case 'huye': G.audio.efecto('huir'); yield* this.moverA(this.s.heroes[0], 100, 0, 0.4); break;
          case 'aviso': G.ui.aviso(ev.texto, '#ff5d73'); break;
          case 'texto': this.decir(ev.texto); G.audio.efecto('error'); yield 0.6; break;
          default: break;
        }
      }
    }

    golpeFinal(cx, cy, purificable) {
      G.fx.camaraLenta(0.18, 1.1);
      G.fx.lineas(cx, cy, 0.9);
      G.fx.rgb(0.7);
      G.fx.temblor(7, 0.6);
      G.fx.destello('#ffffff', 0.25);
      G.fx.onomatopeya(purificable ? '¡KABUM!' : U.elegir(['¡ZAS!', '¡PUM!', '¡CRAC!']), cx, cy - 28, { escala: 3, vida: 1.4, fondo: '#ffd23f', puntas: 14 });
      G.audio.efecto('golpeFuerte');
    }

    *efectoLanzar(ev) {
      const h = ev.actor;
      const objs = ev.objetivos && ev.objetivos.length ? ev.objetivos : this.s.enemigos.filter((e) => e.vivo);
      switch (ev.efecto) {
        case 'fuego': case 'viento': {
          G.audio.efecto(ev.efecto === 'fuego' ? 'dardo' : 'viento');
          const col = ev.efecto === 'fuego' ? '#ff7a3d' : '#b8f2a1';
          objs.forEach((u) => this.visual(0.25, (ctx, k) => this.dibujarDardo(ctx, h, u, k, col)));
          yield 0.25;
          if (ev.efecto === 'fuego') { G.audio.efecto('fuego'); objs.forEach((u) => this.explosion(u, '#ff7a3d')); }
          break;
        }
        case 'alba': case 'solLuna': {
          G.audio.efecto(ev.gemela ? 'nivel' : 'fuego');
          G.fx.destello(ev.gemela ? '#ffffff' : '#fff3b0', 0.5);
          if (ev.gemela) {
            const o = ev.companero;
            this.visual(1.1, (ctx, k) => {
              const cx = 140, cy = 70, d = (1 - k) * 90;
              G.volumen.esfera(ctx, cx - d, cy, 12, 12, '#ffd166'); P.brillo(ctx, cx - d, cy, 34, '#ff8a4c', 0.7);
              G.volumen.esfera(ctx, cx + d, cy, 10, 10, '#e8f4ff'); P.brillo(ctx, cx + d, cy, 34, '#3fd3a8', 0.7);
            });
            [h, o].forEach((x) => this.visual(1.1, (ctx, k) => P.brillo(ctx, x.x, x.y - 24, 40, x.id === 'hunahpu' ? '#ff8a4c' : '#3fd3a8', 0.6 * (1 - k))));
            yield 1.0;
            G.fx.lineas(140, 70, 0.8); G.fx.rgb(0.6); G.fx.temblor(9, 0.6);
          } else {
            objs.forEach((u) => this.visual(0.7, (ctx, k) => {
              const [cx, cy] = this.centro(u);
              ctx.save(); ctx.globalAlpha = 1 - k; ctx.fillStyle = '#ffd166'; ctx.fillRect(cx - 10 + k * 6, 0, 20 - k * 12, cy + 20); ctx.restore();
              P.brillo(ctx, cx, cy, 40, '#ffd166', 0.6 * (1 - k));
            }));
            yield 0.45;
          }
          break;
        }
        case 'jaguar': {
          G.audio.efecto('rugido');
          objs.forEach((u) => this.visual(0.5, (ctx, k) => this.dibujarCorte(ctx, u, k, '#e0a43a', 3)));
          yield 0.3; break;
        }
        case 'agua': {
          G.audio.efecto('agua');
          this.visual(0.8, (ctx, k) => {
            const x = G.ANCHO - k * (G.ANCHO + 120);
            ctx.save(); ctx.globalAlpha = 0.7; ctx.fillStyle = '#4cc9f0'; ctx.fillRect(x, 90, 70, 80);
            ctx.fillStyle = '#bfe9ff'; for (let y = 90; y < 170; y += 6) ctx.fillRect(x + Math.sin(y + k * 20) * 6, y, 8, 2); ctx.restore();
          });
          yield 0.5; break;
        }
        case 'terremoto': {
          G.audio.efecto('tierra'); G.fx.temblor(8, 0.8);
          objs.forEach((u) => G.fx.emitir(this.centro(u)[0], u.y, { n: 18, color: ['#c49a6c', '#5a4a3a', '#efe6d6'], vel: 110, angulo: -Math.PI / 2, abanico: 1, gravedad: 260, vida: 0.8, tam: 2 }));
          yield 0.45; break;
        }
        case 'cura': G.audio.efecto('curar'); yield 0.2; break;
        case 'escudo': G.audio.efecto('escudo'); yield 0.2; break;
        default: yield 0.2;
      }
    }

    *efectoInvocar(ev) {
      const esp = G.datos.ESPIRITUS[ev.espiritu];
      const img = G.arte.criatura(esp.de, 0, { espiritu: true });
      this.decir(ev.nombre);
      G.audio.efecto('jefe');
      G.fx.destello(esp.color, 0.4);
      // el espíritu aparece grande y luminoso detrás de los enemigos
      this.visual(1.8, (ctx, k) => {
        if (!img) return;
        const a = Math.sin(Math.min(1, k * 1.4) * Math.PI);
        ctx.save();
        ctx.globalAlpha = Math.max(0, a) * 0.9;
        const w = img.width * 2.2, h = img.height * 2.2;
        P.brillo(ctx, 140, 90, 120, esp.color, 0.5 * a);
        ctx.drawImage(img, 140 - w / 2, 100 - h / 2 - k * 20, w, h);
        ctx.restore();
      });
      yield 1.0;
      G.fx.lineas(130, 100, 0.6);
      G.fx.temblor(5, 0.4);
    }

    explosion(u, color) {
      const [cx, cy] = this.centro(u);
      this.visual(0.45, (ctx, k) => { P.elipse(ctx, cx, cy, 6 + k * 22, 6 + k * 22, k < 0.5 ? '#fff3b0' : color); P.brillo(ctx, cx, cy, 40, color, 0.7 * (1 - k)); });
      G.fx.emitir(cx, cy, { n: 20, color: [color, '#ffd166', '#ffffff'], vel: 100, vida: 0.6, tam: 2 });
    }

    // ---------------- fin de la pelea ----------------
    terminarPelea() {
      const s = this.s;
      this.fase = 'fin';
      this.menu = null;
      s.heroes.forEach((h) => h.guardar());
      // los objetos gastados (sin contar chispa ni reliquias)
      const e = G.partida.e;
      Object.keys(e.objetos).forEach((id) => { e.objetos[id] = s.inventario[id] || 0; });
      if (s.resultado === 'derrota') {
        G.audio.musica('derrota');
        G.partida.e.motivoDerrota = s.motivo;
        this.visual(9, (ctx, k) => { ctx.fillStyle = '#0a0612'; ctx.globalAlpha = Math.min(0.7, k * 3); ctx.fillRect(0, 0, G.ANCHO, G.ALTO); ctx.globalAlpha = 1; });
        setTimeout(() => this.terminar('derrota'), 1800 / ((G.debug && G.debug.velocidad) || 1));
        return;
      }
      if (s.resultado === 'huida') { this.terminar('huida'); return; }
      const lineas = [];
      if (s.resultado === 'victoria') {
        const r = s.recompensas();
        if (r.xp) lineas.push(`Experiencia ganada: *${r.xp}*`);
        Object.keys(r.objetos).forEach((id) => { G.partida.dar(id, r.objetos[id]); lineas.push(`Obtuviste: *${G.datos.OBJETOS[id].nombre}* x${r.objetos[id]}`); });
        r.espiritus.forEach((id) => {
          e.espiritus = e.espiritus || [];
          if (!e.espiritus.includes(id)) e.espiritus.push(id);
          const esp = G.datos.ESPIRITUS[id];
          lineas.push({ texto: `¡Purificado! Ahora es el *${esp.nombre}*. Invócalo con Espíritu: *${esp.invocacion}*.`, sonido: 'cofre' });
        });
        s.heroes.forEach((p) => {
          const ref = p.ref;
          G.reglas.ganarXP(ref, r.xp).forEach((x) => {
            lineas.push({ texto: `¡${p.nombre} subió al nivel *${x.nivel}*!`, sonido: 'nivel' });
            x.nuevas.forEach((t) => lineas.push({ texto: `${p.nombre} aprendió la magia *${G.datos.MAGIAS[t].nombre}*.`, sonido: 'cofre' }));
          });
        });
        if (!lineas.length) lineas.push('¡Victoria!');
        G.audio.musica('victoria');
        s.heroes.forEach((p) => { p.vivo && (p.dy = -4); });
      }
      if (s.resultado === 'selloRoto') lineas.push('El Sello Oscuro se rompió en mil pedazos de luz.');
      if (s.resultado === 'retirada') lineas.push(s.motivo === 'chispa' ? 'La chispa de luz obligó a la sombra a retroceder.' : '¡Resististe! La sombra retrocede.');
      const titulo = s.resultado === 'victoria' ? '¡Victoria!' : s.resultado === 'selloRoto' ? '¡Sello roto!' : 'La sombra se aleja';
      setTimeout(() => {
        this.mensajes = new G.ui.Dialogo(lineas.map((l) => (typeof l === 'string' ? { texto: l, quien: titulo } : Object.assign({ quien: titulo }, l))), () => this.terminar(s.resultado));
      }, 1200 / ((G.debug && G.debug.velocidad) || 1));
    }

    terminar(resultado) {
      if (this.resultado) return;
      this.resultado = resultado;
      // los caídos se levantan con 1 de vida si no se perdió
      if (resultado !== 'derrota') G.partida.heroes().forEach((h) => { if (h.vida <= 0) h.vida = 1; });
      G.fx.limpiar();
      G.motor.quitar({ fundido: true, resultado, dur: 0.35 });
    }

    // ---------------- dibujo ----------------
    radioAnillo() { const a = this.anillo; return a ? U.lerp(40, 3, a.t / a.dur) : 0; }

    dibujar(ctx) {
      const tipo = this.op.fondo || 'selva';
      ctx.drawImage(fondo(tipo), 0, 0);
      if (tipo === 'cueva' || tipo === 'palacio') for (let i = 0; i < 6; i++) P.brillo(ctx, (i * 67 + 20) % G.ANCHO, 90, 18, tipo === 'cueva' ? ['#05d9e8', '#ff2a6d', '#b18cff'][i % 3] : '#ff2a6d', 0.25 + Math.sin(this.t * 2 + i) * 0.1);
      else for (let i = 0; i < 8; i++) { const x = (i * 53 + Math.sin(this.t * 0.6 + i) * 20) % G.ANCHO, y = 30 + (i * 29) % 70 + Math.cos(this.t + i) * 6; const a = 0.5 + Math.sin(this.t * 3 + i) * 0.5; if (a > 0.3) { P.brillo(ctx, x, y, 5, '#e9ff70', 0.5 * a); P.px(ctx, x, y, '#fffbd0'); } }
      const s = this.s;
      const todos = s.enemigos.filter((e) => !(e.muriendo > 0.7)).concat(s.heroes).sort((a, b) => a.y - b.y);
      todos.forEach((u) => (u.esHeroe ? this.dibujarHeroe(ctx, u) : this.dibujarEnemigo(ctx, u)));
      this.visuales.forEach((v) => { ctx.save(); v.fn(ctx, Math.min(1, v.t / v.dur), v.t); ctx.restore(); });
      G.fx.dibujarParticulas(ctx);
      if (this.anillo) this.dibujarAnillo(ctx);
      G.fx.dibujarFlotantes(ctx);
      this.dibujarHUD(ctx);
      if (this.banner) {
        const w = G.fuente.ancho(this.banner.texto) + 24;
        const a = Math.min(1, this.banner.t / 0.1) * (this.banner.t > 1.3 ? Math.max(0, (1.5 - this.banner.t) / 0.2) : 1);
        ctx.globalAlpha = a;
        G.ui.ventana(ctx, (G.ANCHO - w) / 2, 6, w, 16, { borde: COL.oro });
        G.fuente.texto(ctx, this.banner.texto, G.ANCHO / 2, 10, COL.oro, { alinear: 'centro', sombra: COL.sombra });
        ctx.globalAlpha = 1;
      }
      if (this.mensajes) this.mensajes.dibujar(ctx);
    }

    dibujarHeroe(ctx, h) {
      let img = G.arte.personaje(h.id, 1, h.cuadro || 0);
      if (h.flash > 0 && Math.floor(h.flash * 30) % 2 === 0) img = P.silueta(img, '#ffffff');
      P.elipse(ctx, h.x + h.dx, h.y + 2, 12, 3, 'rgba(0,0,0,0.3)');
      if (h.dx !== 0 && !this.gen) h.dx *= 0.8;
      if (h.dy !== 0 && !this.gen) h.dy *= 0.85;
      if (!h.vivo) {
        ctx.save(); ctx.translate(Math.round(h.x), Math.round(h.y - 8)); ctx.rotate(-Math.PI / 2); ctx.globalAlpha = 0.85; ctx.drawImage(img, -16, -24, 32, 50); ctx.restore();
        return;
      }
      const x = Math.round(h.x + h.dx - 16), y = Math.round(h.y + h.dy - 50 + (this.gen ? 0 : Math.round(Math.sin(this.t * 3) * 0.5)));
      if (h.limite >= 100) P.brillo(ctx, h.x + h.dx, h.y - 24, 30, '#7ef2c8', 0.3 + Math.sin(this.t * 8) * 0.12);
      else if (h.atb >= 100) P.brillo(ctx, h.x + h.dx, h.y - 24, 26, h.id === 'hunahpu' ? '#ff8a4c' : '#3fd3a8', 0.25);
      ctx.drawImage(img, x, y, 32, 50);
      if (h.escudoT > 0) this.dibujarEscudo(ctx, h, 0.35);
      if (h.defendiendo) G.fuente.texto(ctx, '★', h.x + 14, y + 4, '#4cc9f0', { borde: COL.sombra });
      if (this.menu && this.menu.heroe === h && !this.menu.objetivo) G.fuente.texto(ctx, '▼', h.x + h.dx, y - 10 + Math.sin(this.t * 8) * 2, COL.oro, { alinear: 'centro', sombra: COL.sombra });
      this.dibujarCursor(ctx, h);
    }

    dibujarEnemigo(ctx, e) {
      const volador = e.def_ && e.def_.volador;
      const cuadro = Math.floor(this.t * (volador ? 8 : 4));
      const purificandose = e.estado === 'purificado';
      let img = G.arte.criatura(e.id, cuadro, { espiritu: purificandose });
      if (!img) return;
      const w = img.width * ESC, hh = img.height * ESC;
      const flota = volador ? Math.round(Math.sin(this.t * 3 + e.x0) * 3) - 10 : 0;
      if (e.dx !== 0 && !this.gen && !(e.flash > 0)) e.dx *= 0.8;
      // el jefe vencido se arrodilla, rodeado de corrupción
      const arrodillado = e.estado === 'debilitado' ? 8 : 0;
      let x = Math.round(e.x + e.dx - w / 2), y = Math.round(e.y + e.dy - hh + flota + arrodillado);
      P.elipse(ctx, e.x + e.dx, e.y + 2, w * 0.32, 4, 'rgba(0,0,0,0.3)');
      if (e.muriendo > 0) {
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
      if (purificandose) {
        // se eleva como espíritu luminoso
        e.transformando = (e.transformando || 0) + 1 / 60;
        const k = Math.min(1, e.transformando / 1.5);
        y -= Math.round(k * 30);
        P.brillo(ctx, e.x, y + hh / 2, w * 0.7, (e.def_ && e.def_.colorEspiritu) || '#7ef2c8', 0.5);
        ctx.globalAlpha = 1 - k * 0.6;
        ctx.drawImage(img, x, y, w, hh);
        ctx.globalAlpha = 1;
        return;
      }
      if (e.estado === 'debilitado') {
        // humo de corrupción que se retuerce
        for (let i = 0; i < 6; i++) P.brillo(ctx, e.x + Math.sin(this.t * 2 + i) * w * 0.3, y + hh * 0.5 + Math.cos(this.t * 3 + i) * hh * 0.3, 18, '#7b2cbf', 0.35 * (e.corrupcion / 100));
        ctx.globalAlpha = 0.75;
      }
      if (e.sello !== null && e.vivo) P.brillo(ctx, e.x + e.dx, y + hh / 2, 40, '#e040ff', 0.25 + Math.sin(this.t * 4) * 0.1);
      if (e.furia && e.estado === 'normal') P.brillo(ctx, e.x + e.dx, y + hh / 2, w * 0.6, '#ff2a6d', 0.2 + Math.sin(this.t * 5) * 0.08);
      if (e.flash > 0) img = P.silueta(img, '#ffffff');
      ctx.drawImage(img, x, y, w, hh);
      ctx.globalAlpha = 1;
      if (!this.esJefe && e.vida < e.vidaMax) {
        const bw = Math.min(70, w * 0.6);
        G.ui.barra(ctx, Math.round(e.x + e.dx - bw / 2), e.y + 6, bw, 2, e.vidaVista, e.vidaMax, '#ff5d73');
      }
      this.dibujarCursor(ctx, e);
    }

    dibujarCursor(ctx, u) {
      if (!this.menu || !this.menu.objetivo) return;
      if (this.menu.objetivoSeleccionado() !== u) return;
      const [cx, cy] = this.arriba(u);
      G.fuente.texto(ctx, '▼', cx, cy - 8 + Math.sin(this.t * 8) * 2, COL.oro, { alinear: 'centro', borde: COL.sombra });
    }

    dibujarAnillo(ctx) {
      const a = this.anillo;
      const [cx, cy] = this.centro(a.obj);
      const r = this.radioAnillo();
      ctx.save();
      ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2; ctx.globalAlpha = 0.9;
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
      ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = color; ctx.lineWidth = 2;
      for (let i = 0; i < (n || 1); i++) {
        const o = (i - ((n || 1) - 1) / 2) * 8;
        ctx.beginPath(); ctx.moveTo(cx - 16 + o, cy - 16); ctx.lineTo(cx - 16 + o + 32 * Math.min(1, k * 3), cy - 16 + 32 * Math.min(1, k * 3)); ctx.stroke();
      }
      ctx.restore();
    }
    dibujarDardo(ctx, h, u, k, color) {
      const ax = h.x + h.dx - 12, ay = h.y - 30;
      const [bx, by] = this.centro(u);
      const x = U.lerp(ax, bx, k), y = U.lerp(ay, by, k);
      P.linea(ctx, x, y, x + 8, y + (ay - by) / Math.max(1, Math.abs(ax - bx)) * 8, color, 2);
      P.brillo(ctx, x, y, 10, color, 0.6);
    }
    dibujarEscudo(ctx, h, alfa) {
      ctx.save(); ctx.globalAlpha = alfa; ctx.strokeStyle = '#3fd3a8'; ctx.lineWidth = 2;
      const cx = h.x + h.dx, cy = h.y - 24;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI * 2 + this.t; const x = cx + Math.cos(a) * 22, y = cy + Math.sin(a) * 28; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
    }

    dibujarJefe(ctx) {
      const jefes = this.s.enemigos.filter((e) => e.jefe && (e.vivo || e.estado === 'purificado'));
      jefes.slice(0, 2).forEach((e, i) => {
        const x = 4, y = 4 + i * 32;
        const nombre = G.fuente.ancho(G.fuente.normalizar(e.nombre)) > 90 ? (e.def_.corto || G.fuente.normalizar(e.nombre).split(' ')[0]) : e.nombre;
        G.ui.ventana(ctx, x, y, 150, e.sello !== null ? 30 : 24, { alfa: 0.85 });
        G.fuente.texto(ctx, nombre, x + 6, y + 4, COL.oro, { sombra: COL.sombra });
        if (e.estado === 'debilitado' || e.estado === 'purificado') {
          G.ui.barra(ctx, x + 6, y + 16, 138, 3, e.corrupcion || 0, 100, '#b18cff');
          G.fuente.texto(ctx, 'Corrupción', x + 144, y + 4, '#b18cff', { alinear: 'der' });
        } else {
          G.ui.barra(ctx, x + 6, y + 16, 138, 3, e.vidaVista, e.vidaMax, '#ff5d73');
          if (e.sello !== null) {
            G.ui.barra(ctx, x + 6, y + 23, 138, 3, e.sello, 100, '#e040ff');
            G.fuente.texto(ctx, 'Sello', x + 144, y + 4, '#e040ff', { alinear: 'der' });
          }
        }
      });
    }

    dibujarHUD(ctx) {
      const s = this.s;
      const x0 = 100, y0 = 150, w = G.ANCHO - x0 - 4, h = 62;
      G.ui.ventana(ctx, x0, y0, w, h);
      const fila = s.heroes.length === 1 ? 30 : 29;
      s.heroes.forEach((p, i) => {
        const y = y0 + 5 + i * fila;
        const elige = this.menu && this.menu.heroe === p;
        if (elige) { ctx.fillStyle = COL.seleccion; ctx.fillRect(x0 + 3, y - 2, w - 6, fila - 2); }
        G.fuente.texto(ctx, p.nombre, x0 + 8, y, !p.vivo ? COL.rojo : (elige ? COL.oro : COL.texto), { sombra: COL.sombra });
        G.fuente.texto(ctx, `Vida ${Math.max(0, Math.round(p.vidaVista))}/${p.vidaMax}`, x0 + 72, y, p.vida < p.vidaMax * 0.3 ? COL.rojo : COL.texto, { sombra: COL.sombra });
        G.fuente.texto(ctx, `PE ${p.pe}`, x0 + 158, y, '#4cc9f0', { sombra: COL.sombra });
        G.ui.barra(ctx, x0 + 72, y + 12, 80, 3, p.vidaVista, p.vidaMax, p.vida < p.vidaMax * 0.3 ? '#ff5d73' : '#7ef2c8');
        G.ui.barra(ctx, x0 + 158, y + 12, 30, 3, p.pe, p.peMax, '#4cc9f0');
        // barra de límite (Espíritu)
        const lleno = p.limite >= 100;
        G.fuente.texto(ctx, lleno ? 'LÍMITE' : 'Límite', x0 + 8, y + 16, lleno ? '#7ef2c8' : COL.tenue);
        G.ui.barra(ctx, x0 + 50, y + 19, 138, 3, p.limite, 100, lleno ? (Math.floor(this.t * 8) % 2 ? '#7ef2c8' : '#e9fff7') : '#3fa88a');
        // barra de tiempo (ATB)
        const listo = p.atb >= 100;
        G.ui.barra(ctx, x0 + 200, y + 3, w - 210, 6, p.atb, 100, listo ? (Math.floor(this.t * 8) % 2 ? '#ffd166' : '#fff3b0') : '#e8b64c');
        G.fuente.texto(ctx, 'Tiempo', x0 + 200, y + 11, COL.tenue);
      });
      // menú o lista de enemigos
      if (this.menu) { this.menu.dibujar(ctx); }
      else {
        G.ui.ventana(ctx, 4, y0, 92, h);
        s.enemigos.filter((e) => e.vivo).slice(0, 4).forEach((e, i) => {
          const nombre = G.fuente.ancho(G.fuente.normalizar(e.nombre)) > 80 ? (e.def_.corto || G.fuente.normalizar(e.nombre).split(' ')[0]) : e.nombre;
          G.fuente.texto(ctx, nombre, 10, y0 + 5 + i * 13, e.jefe ? COL.oro : COL.texto, { sombra: COL.sombra });
        });
      }
      // ventana del jefe (siempre visible): vida, Sello Oscuro o corrupción
      if (this.esJefe) this.dibujarJefe(ctx);
      // ayudas de los modos especiales
      if (s.modo === 'duelo') G.fuente.texto(ctx, `Resiste: ${Math.min(s.turnosHeroe, s.turnosDuelo)}/${s.turnosDuelo} turnos`, G.ANCHO - 8, 26, COL.oro, { alinear: 'der', borde: COL.sombra });
      if (s.modo === 'sello' && !this.menu) G.fuente.texto(ctx, '¡No lo hieras! Baja su Sello con Purificar o la Reliquia', G.ANCHO / 2, 26, '#e040ff', { alinear: 'centro', borde: COL.sombra });
    }
  }

  G.EscenaCombate = EscenaCombate;
})();
