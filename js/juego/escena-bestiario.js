/* =====================================================================
   BESTIARIO
   Un dibujo de cada criatura con datos reales y breves sobre ella y la
   cultura de la que viene. Las criaturas que aún no has visto aparecen
   como "???". Lo que descubras se conserva aunque empieces otra partida.
   ===================================================================== */
'use strict';

(function () {
  const P = G.pixel;
  const COL = G.ui.COL;

  class EscenaBestiario {
    constructor() {
      this.transparente = false;
      this.t = 0;
      this.visto = G.guardado.bestiario();
      this.lista = G.mundos.todasLasCriaturas();
      const ops = this.lista.map((c) => {
        const conocido = c.aliado || this.visto[c.id];
        return { texto: conocido ? c.nombre : '???', valor: c.id, color: c.aliado ? COL.resalte : (c.jefe ? COL.oro : undefined) };
      });
      G.mundos.PROXIMOS.forEach((m) => ops.push({ texto: `Próximamente: ${m.nombre}`, valor: 'proximo:' + m.id, color: COL.tenue, proximo: m }));
      this.menu = new G.ui.Menu(ops, { x: 6, y: 20, ancho: 150, altoFila: 12, visibles: 14, titulo: 'Bestiario' });
      this.scrollTexto = 0;
    }
    actualizar(dt) {
      this.t += dt;
      const r = this.menu.actualizar(dt);
      if (r && r.tipo === 'cancelar') { G.motor.quitar(); return; }
      if (G.entrada.presionado('pausa')) { G.motor.quitar(); }
    }
    dibujar(ctx) {
      ctx.fillStyle = '#0d0618';
      ctx.fillRect(0, 0, G.ANCHO, G.ALTO);
      P.trama(ctx, 0, 0, G.ANCHO, G.ALTO, '#1a0f2a', 6, 1);
      this.menu.dibujar(ctx);
      const vistos = this.lista.filter((c) => !c.aliado && this.visto[c.id]).length;
      const total = this.lista.filter((c) => !c.aliado).length;
      G.fuente.texto(ctx, `Descubiertas: ${vistos}/${total}`, 8, G.ALTO - 13, COL.tenue);
      const op = this.menu.opciones[this.menu.sel];
      const x = 162, y = 6, w = G.ANCHO - x - 6, h = G.ALTO - 12;
      G.ui.ventana(ctx, x, y, w, h);
      if (op.proximo) {
        const m = op.proximo;
        G.fuente.texto(ctx, m.nombre, x + w / 2, y + 10, COL.oro, { alinear: 'centro', escala: 2 });
        G.fuente.texto(ctx, 'Cultura ' + m.cultura, x + w / 2, y + 34, COL.resalte, { alinear: 'centro' });
        const lineas = G.fuente.envolver('Un mundo que llegará en una futura aventura de los gemelos. Seres: ' + m.criaturas.join(', ') + '.', w - 20);
        lineas.forEach((l, i) => G.fuente.texto(ctx, l, x + 10, y + 56 + i * 12, COL.texto));
        return;
      }
      const c = G.mundos.criatura(op.valor);
      const conocido = c.aliado || this.visto[c.id];
      // marco del dibujo
      const fx = x + 8, fy = y + 8, fw = w - 16, fh = 70;
      ctx.fillStyle = c.jefe ? '#2a0f24' : '#140b22';
      ctx.fillRect(fx, fy, fw, fh);
      P.trama(ctx, fx, fy, fw, fh, c.jefe ? '#3d1530' : '#1f1236', 4, (i, j) => 1 + Math.round(j / fh));
      const img = G.arte.criatura(c.id, Math.floor(this.t * 3));
      if (img) {
        const esc = Math.max(1, Math.min(Math.floor((fw - 10) / img.width), Math.floor((fh - 10) / img.height), 4));
        const iw = img.width * esc, ih = img.height * esc;
        const ix = Math.round(fx + (fw - iw) / 2), iy = Math.round(fy + (fh - ih) / 2);
        if (conocido) {
          P.brillo(ctx, fx + fw / 2, fy + fh / 2, 50, c.jefe ? '#ff2a6d' : '#3fd3a8', 0.25);
          ctx.drawImage(img, ix, iy, iw, ih);
        } else ctx.drawImage(P.silueta(img, '#05020a'), ix, iy, iw, ih);
      }
      ctx.strokeStyle = COL.borde; ctx.strokeRect(fx + 0.5, fy + 0.5, fw - 1, fh - 1);
      let ty = fy + fh + 6;
      if (!conocido) {
        G.fuente.texto(ctx, '???', x + w / 2, ty, COL.tenue, { alinear: 'centro' });
        G.fuente.texto(ctx, 'Encuentra a esta criatura para conocerla.', x + w / 2, ty + 14, COL.tenue, { alinear: 'centro' });
        return;
      }
      G.fuente.texto(ctx, c.nombre, x + 10, ty, c.jefe ? COL.oro : COL.texto, { sombra: COL.sombra });
      G.fuente.texto(ctx, c.zona, x + w - 10, ty, COL.tenue, { alinear: 'der' });
      ty += 12;
      if (!c.aliado) {
        const venc = this.visto[c.id] === 'vencido';
        const nombres = (l) => (l && l.length ? l.map((e) => G.datos.ELEMENTOS[e].nombre).join(', ') : '-');
        G.fuente.texto(ctx, venc ? `Débil a: *${nombres(c.debil)}*   Resiste: ${nombres(c.resiste)}` : 'Derrótalo para conocer sus debilidades.', x + 10, ty, COL.tenue, { resalte: '#ff8a4c' });
        ty += 12;
      }
      const lineas = G.fuente.envolver(c.bestiario || '', w - 20);
      lineas.slice(0, 9).forEach((l, i) => G.fuente.texto(ctx, l, x + 10, ty + i * 11, COL.texto));
    }
  }

  G.EscenaBestiario = EscenaBestiario;
})();
