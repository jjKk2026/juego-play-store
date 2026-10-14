/* =====================================================================
   INTERFAZ: ventanas, menús, cajas de diálogo y avisos.
   Las ventanas tienen esquinas escalonadas inspiradas en las grecas mayas
   y bordes de jade y oro.
   ===================================================================== */
'use strict';

(function () {
  const COL = {
    fondo: '#170b26',
    fondo2: '#24123a',
    borde: '#e8b64c',
    borde2: '#3fd3a8',
    sombra: '#07030d',
    texto: '#f6ecd9',
    tenue: '#9b8fb0',
    resalte: '#7ef2c8',
    oro: '#ffd166',
    rojo: '#ff5d73',
    seleccion: '#3a1f5c'
  };

  function ventana(ctx, x, y, w, h, op) {
    op = op || {};
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const borde = op.borde || COL.borde;
    ctx.globalAlpha = op.alfa === undefined ? 0.94 : op.alfa;
    ctx.fillStyle = COL.sombra;
    ctx.fillRect(x + 2, y + 2, w, h);
    ctx.fillStyle = op.fondo || COL.fondo;
    ctx.fillRect(x, y, w, h);
    // degradado sutil
    ctx.fillStyle = COL.fondo2;
    ctx.fillRect(x, y, w, Math.min(6, h));
    ctx.globalAlpha = 1;
    // marco
    ctx.fillStyle = borde;
    ctx.fillRect(x + 3, y, w - 6, 1); ctx.fillRect(x + 3, y + h - 1, w - 6, 1);
    ctx.fillRect(x, y + 3, 1, h - 6); ctx.fillRect(x + w - 1, y + 3, 1, h - 6);
    // esquinas escalonadas (greca)
    [[x, y, 1, 1], [x + w - 3, y, -1, 1], [x, y + h - 3, 1, -1], [x + w - 3, y + h - 3, -1, -1]].forEach(([cx, cy]) => {
      ctx.fillRect(cx + 1, cy + 1, 1, 1);
      ctx.fillRect(cx + (cx === x ? 2 : 0), cy + 1, 1, 1);
      ctx.fillRect(cx + 1, cy + (cy === y ? 2 : 0), 1, 1);
    });
    ctx.fillStyle = op.borde2 || COL.borde2;
    ctx.fillRect(x + 3, y + 2, w - 6, 1);
    if (op.titulo) {
      const tw = G.fuente.ancho(op.titulo) + 10;
      ctx.fillStyle = borde;
      ctx.fillRect(x + 6, y - 5, tw, 11);
      ctx.fillStyle = COL.fondo;
      ctx.fillRect(x + 7, y - 4, tw - 2, 9);
      G.fuente.texto(ctx, op.titulo, x + 11, y - 5, COL.oro);
    }
  }

  function barra(ctx, x, y, w, h, valor, max, color, fondo) {
    const f = max > 0 ? G.util.limitar(valor / max, 0, 1) : 0;
    ctx.fillStyle = COL.sombra;
    ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = fondo || '#2c1b40';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, Math.round(w * f), h);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(x, y, Math.round(w * f), 1);
  }

  function cursor(ctx, x, y, t) {
    const dx = Math.round(Math.sin(t * 8) * 1.5);
    G.fuente.texto(ctx, '▶', x + dx, y, COL.oro, { sombra: COL.sombra });
  }

  // --------------------------- MENÚ ---------------------------
  class Menu {
    constructor(opciones, op) {
      op = op || {};
      this.opciones = opciones;
      this.x = op.x || 0; this.y = op.y || 0;
      this.ancho = op.ancho || 100;
      this.altoFila = op.altoFila || 13;
      this.visibles = op.visibles || opciones.length;
      this.titulo = op.titulo;
      this.sel = op.sel || 0;
      this.scroll = 0;
      this.t = 0;
      this.marco = op.marco !== false;
      this.cancelable = op.cancelable !== false;
      this.alCambiar = op.alCambiar;
      this.ajustarScroll();
    }
    get alto() { return Math.min(this.visibles, this.opciones.length) * this.altoFila + 8; }
    ajustarScroll() {
      if (this.sel < this.scroll) this.scroll = this.sel;
      if (this.sel >= this.scroll + this.visibles) this.scroll = this.sel - this.visibles + 1;
    }
    mover(d) {
      const n = this.opciones.length;
      if (!n) return;
      this.sel = (this.sel + d + n) % n;
      this.ajustarScroll();
      G.audio.efecto('cursor');
      this.alCambiar && this.alCambiar(this.opciones[this.sel]);
    }
    // Devuelve {tipo:'elegir', opcion} o {tipo:'cancelar'} o null.
    actualizar(dt) {
      this.t += dt;
      const E = G.entrada;
      if (E.repetido('abajo')) this.mover(1);
      if (E.repetido('arriba')) this.mover(-1);
      const tq = E.toque();
      if (tq) {
        const fila = Math.floor((tq.y - this.y - 4) / this.altoFila);
        if (tq.x >= this.x && tq.x <= this.x + this.ancho && fila >= 0 && fila < Math.min(this.visibles, this.opciones.length)) {
          E.consumirToque();
          this.sel = this.scroll + fila;
          return this.elegir();
        }
        // flechas de desplazamiento al tocar arriba/abajo de la lista
      }
      if (E.presionado('a')) return this.elegir();
      if (this.cancelable && E.presionado('b')) { G.audio.efecto('cancelar'); return { tipo: 'cancelar' }; }
      return null;
    }
    elegir() {
      const o = this.opciones[this.sel];
      if (!o) return null;
      if (o.deshabilitado) { G.audio.efecto('error'); return null; }
      G.audio.efecto('aceptar');
      return { tipo: 'elegir', opcion: o, indice: this.sel };
    }
    dibujar(ctx) {
      if (this.marco) ventana(ctx, this.x, this.y, this.ancho, this.alto, { titulo: this.titulo });
      const fin = Math.min(this.opciones.length, this.scroll + this.visibles);
      for (let i = this.scroll; i < fin; i++) {
        const o = this.opciones[i];
        const yy = this.y + 4 + (i - this.scroll) * this.altoFila;
        if (i === this.sel) {
          ctx.fillStyle = COL.seleccion;
          ctx.fillRect(this.x + 3, yy, this.ancho - 6, this.altoFila - 1);
          cursor(ctx, this.x + 4, yy + 1, this.t);
        }
        const color = o.deshabilitado ? COL.tenue : (o.color || COL.texto);
        G.fuente.texto(ctx, o.texto, this.x + 13, yy + 1, color, { sombra: COL.sombra });
        if (o.detalle) G.fuente.texto(ctx, o.detalle, this.x + this.ancho - 6, yy + 1, o.colorDetalle || COL.tenue, { alinear: 'der', sombra: COL.sombra });
      }
      if (this.scroll > 0) G.fuente.texto(ctx, '▼', this.x + this.ancho / 2, this.y - 1, COL.oro, { alinear: 'centro' }) ;
      if (fin < this.opciones.length) G.fuente.texto(ctx, '▼', this.x + this.ancho / 2, this.y + this.alto - 6, COL.oro, { alinear: 'centro' });
    }
  }

  // ------------------------ CAJA DE DIÁLOGO ------------------------
  // lineas: [{ quien: 'Tz\'unun', texto: '...', retrato: 'colibri' }]
  class Dialogo {
    constructor(lineas, alTerminar) {
      this.lineas = lineas.filter(Boolean).map((l) => (typeof l === 'string' ? { texto: l } : l));
      this.i = 0;
      this.letras = 0;
      this.t = 0;
      this.alTerminar = alTerminar;
      this.terminado = false;
      this.prepararLinea();
    }
    prepararLinea() {
      const l = this.lineas[this.i];
      if (!l) return;
      const anchoTexto = l.retrato ? G.ANCHO - 16 - 72 : G.ANCHO - 16 - 22;
      this.envuelto = G.fuente.envolver(l.texto, anchoTexto);
      this.total = this.envuelto.reduce((a, s) => a + G.fuente.largo(s), 0);
      this.letras = 0;
      if (l.sonido) G.audio.efecto(l.sonido);
    }
    velocidad() { return [0, 22, 45, 90, 9999][G.opciones.velocidadTexto] || 45; }
    actualizar(dt) {
      if (this.terminado) return;
      this.t += dt;
      const antes = Math.floor(this.letras);
      this.letras = Math.min(this.total, this.letras + this.velocidad() * dt);
      if (Math.floor(this.letras) !== antes && Math.floor(this.letras) % 3 === 0) G.audio.efecto('texto');
      const E = G.entrada;
      const tq = E.consumirToque();
      if (E.presionado('a') || E.presionado('b') || tq) {
        if (this.letras < this.total) this.letras = this.total;
        else {
          this.i++;
          if (this.i >= this.lineas.length) {
            this.terminado = true;
            E.limpiar();
            this.alTerminar && this.alTerminar();
          } else this.prepararLinea();
        }
      }
    }
    dibujar(ctx) {
      if (this.terminado) return;
      const l = this.lineas[this.i];
      const h = 62, y = G.ALTO - h - 6, x = 8, w = G.ANCHO - 16;
      ventana(ctx, x, y, w, h, { titulo: l.quien });
      let tx = x + 10;
      if (l.retrato && G.arte && G.arte.retrato) {
        const r = G.arte.retrato(l.retrato);
        if (r) {
          ctx.fillStyle = '#0d0618';
          ctx.fillRect(x + 7, y + 9, 46, 46);
          ctx.drawImage(r, x + 8, y + 10, 44, 44);
          tx = x + 60;
        }
      }
      let restante = Math.floor(this.letras);
      this.envuelto.slice(0, 4).forEach((s, i) => {
        const n = G.fuente.largo(s);
        G.fuente.texto(ctx, s, tx, y + 10 + i * 12, COL.texto, { sombra: COL.sombra, hasta: Math.max(0, restante) });
        restante -= n;
      });
      if (this.letras >= this.total && Math.floor(this.t * 3) % 2 === 0) {
        G.fuente.texto(ctx, '▼', x + w - 12, y + h - 11, COL.oro);
      }
    }
  }

  // ------------------------ AVISOS ------------------------
  const avisos = [];
  function aviso(texto, color) {
    avisos.push({ texto, color: color || COL.texto, t: 0, vida: 2.4 });
    if (avisos.length > 3) avisos.shift();
  }
  function dibujarAvisos(ctx, dt) {
    avisos.forEach((a, i) => {
      a.t += dt;
      const w = G.fuente.ancho(a.texto) + 20;
      const y = 8 + i * 18 - (a.t < 0.2 ? (1 - a.t / 0.2) * 10 : 0);
      ctx.globalAlpha = a.t > a.vida - 0.3 ? Math.max(0, (a.vida - a.t) / 0.3) : 1;
      ventana(ctx, (G.ANCHO - w) / 2, y, w, 15, { borde: COL.borde2, borde2: COL.borde });
      G.fuente.texto(ctx, a.texto, G.ANCHO / 2, y + 3, a.color, { alinear: 'centro', sombra: COL.sombra });
      ctx.globalAlpha = 1;
    });
    for (let i = avisos.length - 1; i >= 0; i--) if (avisos[i].t > avisos[i].vida) avisos.splice(i, 1);
  }

  G.ui = { COL, ventana, barra, cursor, Menu, Dialogo, aviso, dibujarAvisos };
})();
