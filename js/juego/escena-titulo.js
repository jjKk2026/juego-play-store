/* =====================================================================
   PANTALLA DE TÍTULO (animada) Y CRÉDITOS FINALES
   ===================================================================== */
'use strict';

(function () {
  const P = G.pixel;
  const U = G.util;
  const COL = G.ui.COL;

  // Paisaje del título (se dibuja una vez): pirámide, ceiba y montes.
  function paisaje() {
    return P.memo('tituloPaisaje', () => {
      const [c, ctx] = P.lienzo(G.ANCHO, G.ALTO);
      const W = G.ANCHO, H = G.ALTO;
      // montes lejanos
      const rnd = U.semilla(21);
      ctx.fillStyle = '#2a1a44';
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 12) ctx.lineTo(x, 140 - rnd() * 22);
      ctx.lineTo(W, H); ctx.fill();
      // pirámide escalonada
      const px = 272, base = 168;
      for (let i = 0; i < 6; i++) {
        const w = 96 - i * 14, y = base - (i + 1) * 9;
        P.rect(ctx, px - w / 2, y, w, 9, i % 2 ? '#1d1330' : '#22163a');
        P.rect(ctx, px - w / 2, y, w, 1, '#3a2852');
      }
      P.rect(ctx, px - 6, base - 54, 12, 54, '#2a1d40');
      for (let y = base - 52; y < base; y += 3) P.rect(ctx, px - 5, y, 10, 1, '#3a2852');
      P.rect(ctx, px - 12, base - 66, 24, 12, '#1d1330');
      P.rect(ctx, px - 4, base - 62, 8, 8, '#05020a');
      // ceiba gigante a la izquierda
      const sil = '#1f1433';
      P.triangulo(ctx, 70, 110, 44, 190, 64, 190, sil);
      P.triangulo(ctx, 74, 110, 100, 190, 80, 190, sil);
      P.rect(ctx, 64, 60, 14, 130, sil);
      P.rect(ctx, 30, 58, 82, 4, sil);
      [[71, 50, 50, 16], [40, 56, 22, 9], [102, 56, 22, 9], [71, 36, 32, 12], [60, 28, 14, 6]].forEach(([x, y, rx, ry]) => P.elipse(ctx, x, y, rx, ry, sil));
      for (let i = 0; i < 30; i++) P.px(ctx, 26 + (i * 37) % 92, 26 + (i * 13) % 34, '#2e2044');
      // suelo de la selva
      ctx.fillStyle = '#0f0a1a';
      ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, 178 + Math.sin(x * 0.05) * 4 + rnd() * 3);
      ctx.lineTo(W, H); ctx.fill();
      for (let x = 0; x < W; x += 5) { const h = 3 + rnd() * 7; P.linea(ctx, x, 182, x + 1, 182 - h, '#0f0a1a'); }
      return c;
    });
  }

  class EscenaTitulo {
    constructor() {
      this.t = 0;
      this.fase = 'inicio';
      this.menu = null;
      this.confirmar = null;
    }
    entrar() {
      G.audio.musica('titulo');
      this.crearMenu();
    }
    completada() {
      if (this._completada === undefined) {
        const d = G.guardado.cargarPartida();
        this._completada = !!(d && d.banderas && d.banderas.fin);
      }
      return this._completada;
    }
    crearMenu() {
      const hay = G.guardado.hayPartida();
      this.menu = new G.ui.Menu([
        { texto: 'Continuar', valor: 'continuar', deshabilitado: !hay },
        { texto: 'Nueva partida', valor: 'nueva' },
        { texto: 'Opciones', valor: 'opciones' },
        { texto: 'Bestiario', valor: 'bestiario' }
      ], { x: G.ANCHO / 2 - 60, y: 128, ancho: 120, altoFila: 13, cancelable: false, sel: hay ? 0 : 1 });
    }
    alVolver() { this.crearMenu(); }
    actualizar(dt) {
      this.t += dt;
      const E = G.entrada;
      if (this.fase === 'inicio') {
        if (this.t > 0.5 && (E.presionado('a') || E.presionado('pausa') || E.consumirToque())) {
          G.audio.desbloquear();
          G.audio.musica('titulo');
          G.audio.efecto('aceptar');
          this.fase = 'menu';
        }
        return;
      }
      if (this.confirmar) {
        const r = this.confirmar.actualizar(dt);
        if (!r) return;
        if (r.tipo === 'cancelar' || r.opcion.valor === 'no') { this.confirmar = null; return; }
        this.confirmar = null;
        this.empezar();
        return;
      }
      const r = this.menu.actualizar(dt);
      if (!r || r.tipo !== 'elegir') return;
      switch (r.opcion.valor) {
        case 'continuar':
          if (G.partida.cargar()) G.motor.cambiar(new G.EscenaMapa(G.partida.e.mapa), { dur: 0.6 });
          else G.ui.aviso('No se pudo cargar la partida', COL.rojo);
          break;
        case 'nueva':
          if (G.guardado.hayPartida()) {
            this.confirmar = new G.ui.Menu([
              { texto: 'No, mejor no', valor: 'no' },
              { texto: 'Sí, empezar de nuevo', valor: 'si' }
            ], { x: G.ANCHO / 2 - 80, y: 140, ancho: 160, titulo: '¿Borrar la partida guardada?' });
          } else this.empezar();
          break;
        case 'opciones': G.motor.apilar(new G.EscenaOpciones()); break;
        case 'bestiario': G.motor.apilar(new G.EscenaBestiario()); break;
        default: break;
      }
    }
    empezar() {
      G.guardado.borrarPartida();
      G.EscenaMapa.vencidos.clear();
      const e = G.partida.nueva('maya');
      const m = G.partida.mundo();
      const irAlMapa = () => G.motor.cambiar(new G.EscenaMapa(e.mapa), { dur: 0.6 });
      if (m.inicio.escena) G.motor.cambiar(new G.EscenaComic(m.inicio.escena, irAlMapa), { dur: 0.8 });
      else irAlMapa();
    }
    dibujar(ctx) {
      const W = G.ANCHO, H = G.ALTO, t = this.t;
      // cielo nocturno con un amanecer que quiere llegar
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#05020a'); g.addColorStop(0.55, '#24123a'); g.addColorStop(0.85, '#5c1f4a'); g.addColorStop(1, '#ff8a4c');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 60; i++) {
        const x = (i * 131) % W, y = (i * 47) % 120;
        if (Math.sin(t * 2 + i) > -0.3) P.px(ctx, x, y, i % 7 ? '#9b8fb0' : '#ffffff');
      }
      // el sol robado: un disco oscuro con corona dorada que palpita
      const sx = 272, sy = 64;
      P.brillo(ctx, sx, sy, 70, '#ffd166', 0.35 + Math.sin(t * 1.5) * 0.1);
      P.brillo(ctx, sx, sy, 40, '#ff2a6d', 0.3);
      P.elipse(ctx, sx, sy, 22, 22, '#ffd166');
      P.elipse(ctx, sx, sy, 20, 20, '#120a1c');
      ctx.save(); ctx.strokeStyle = '#05d9e8'; ctx.globalAlpha = 0.5 + Math.sin(t * 3) * 0.3;
      ctx.beginPath(); ctx.arc(sx, sy, 26 + Math.sin(t * 2) * 2, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      ctx.drawImage(paisaje(), 0, 0);
      // gemelos de espaldas mirando el sol
      ctx.drawImage(P.silueta(G.arte.personaje('hunahpu', 3, 0), '#0a0612'), 172, 156, 16, 25);
      ctx.drawImage(P.silueta(G.arte.personaje('ixbalanque', 3, 0), '#0a0612'), 190, 157, 16, 25);
      // luciérnagas
      for (let i = 0; i < 14; i++) {
        const x = (i * 61 + Math.sin(t * 0.5 + i) * 14) % W, y = 150 + (i * 13) % 50 + Math.cos(t + i) * 5;
        const a = 0.5 + Math.sin(t * 3 + i * 1.7) * 0.5;
        if (a > 0.35) { P.brillo(ctx, x, y, 6, '#e9ff70', 0.6 * a); P.px(ctx, x, y, '#fffbd0'); }
      }
      // colibrí volando en forma de ocho
      const cx = 190 + Math.sin(t * 0.9) * 90, cy = 104 + Math.sin(t * 1.8) * 16;
      P.brillo(ctx, cx, cy, 14, '#3fd3a8', 0.5);
      ctx.drawImage(G.arte.colibri(Math.floor(t * 14), Math.cos(t * 0.9) < 0), Math.round(cx - 6), Math.round(cy - 4));
      // trama de cómic encima
      P.trama(ctx, 0, 0, W, H, 'rgba(0,0,0,0.18)', 4, (i, j) => Math.round((1 - j / H) * 2));
      // título con sombra desfasada (rojo/azul) como en el cómic
      const ty = 18 + Math.round(Math.sin(t * 1.2) * 2);
      G.fuente.texto(ctx, 'GEMELOS DEL SOL', W / 2 - 2, ty, '#ff2a6d', { alinear: 'centro', escala: 3 });
      G.fuente.texto(ctx, 'GEMELOS DEL SOL', W / 2 + 2, ty, '#05d9e8', { alinear: 'centro', escala: 3 });
      G.fuente.texto(ctx, 'GEMELOS DEL SOL', W / 2, ty, '#ffd166', { alinear: 'centro', escala: 3, borde: '#1a0f1f' });
      G.fuente.texto(ctx, 'La luz de Xibalbá', W / 2, ty + 32, '#7ef2c8', { alinear: 'centro', escala: 1, borde: '#1a0f1f' });
      if (this.fase === 'inicio') {
        if (Math.floor(t * 2) % 2 === 0) {
          G.fuente.texto(ctx, G.entrada.usaTactil() ? 'Toca la pantalla para empezar' : 'Presiona Z, Enter o toca la pantalla', W / 2, 140, COL.texto, { alinear: 'centro', borde: '#1a0f1f' });
        }
      } else {
        this.menu.dibujar(ctx);
        if (this.confirmar) this.confirmar.dibujar(ctx);
      }
      G.fuente.texto(ctx, 'Inspirado en el Popol Vuh', 6, H - 12, COL.tenue, { sombra: '#000' });
      if (this.completada()) G.fuente.texto(ctx, '★ Aventura completada', W - 6, H - 12, COL.oro, { alinear: 'der', sombra: '#000' });
    }
  }

  // ------------------------------ CRÉDITOS ------------------------------
  class EscenaCreditos {
    constructor() {
      this.t = 0;
      this.lineas = [
        ['GEMELOS DEL SOL', 2, '#ffd166'], ['La luz de Xibalbá', 1, '#7ef2c8'], ['', 1],
        ['Hunahpú e Ixbalanqué devolvieron la luz al mundo.', 1], ['Según el Popol Vuh, los gemelos subieron', 1], ['al cielo: uno se volvió el sol y el otro la luna.', 1], ['', 1],
        ['Inspirado en el Popol Vuh,', 1, '#e8b64c'], ['libro sagrado del pueblo maya k\'iche\'.', 1, '#e8b64c'], ['', 1],
        ['Arte, música y sonidos creados con código.', 1], ['Instrumentos inspirados en flautas, ocarinas,', 1], ['tambores de tronco, sonajas y caracolas.', 1], ['', 1],
        ['Próximas aventuras:', 1, '#ff2a6d'],
        ['Mictlán mexica · Uku Pacha inca', 1], ['Laguna de Guatavita muisca · Tierras mapuche', 1], ['', 1],
        ['¡Gracias por jugar!', 2, '#ffd166']
      ];
    }
    entrar() { G.audio.musica('final'); }
    actualizar(dt) {
      this.t += dt * (G.entrada.mantenido('a') ? 4 : 1);
      if (this.t > 2 && (G.entrada.presionado('b') || G.entrada.presionado('pausa'))) this.t = 999;
      if (this.t > 34 || (this.t > 30 && (G.entrada.presionado('a') || G.entrada.consumirToque()))) G.motor.cambiar(new EscenaTitulo(), { dur: 1 });
    }
    dibujar(ctx) {
      G.comicFondos.amanecer(ctx, G.ANCHO, G.ALTO, this.t);
      ctx.fillStyle = 'rgba(10,6,18,0.55)';
      ctx.fillRect(0, 0, G.ANCHO, G.ALTO);
      let y = G.ALTO - this.t * 14;
      this.lineas.forEach(([txt, esc, col]) => {
        if (y > -30 && y < G.ALTO + 10) G.fuente.texto(ctx, txt, G.ANCHO / 2, y, col || COL.texto, { alinear: 'centro', escala: esc, borde: '#1a0f1f' });
        y += esc === 2 ? 26 : 13;
      });
      // los gemelos convertidos en sol y luna
      P.brillo(ctx, 80, 40, 30, '#ffd166', 0.5);
      P.elipse(ctx, 80, 40, 10, 10, '#fff3b0');
      P.brillo(ctx, 304, 40, 26, '#bfe9ff', 0.4);
      P.elipse(ctx, 304, 40, 8, 8, '#e8f4ff');
    }
  }

  G.EscenaTitulo = EscenaTitulo;
  G.EscenaCreditos = EscenaCreditos;
})();
