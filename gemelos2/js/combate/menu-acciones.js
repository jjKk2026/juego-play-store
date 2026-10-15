/* =====================================================================
   MENÚ DE ACCIONES (los 5 comandos del combate)
   🗡 Atacar · 🔮 Magia · 👻 Espíritu · 🎒 Objeto · 🛡 Defender
   Se maneja con cruceta/teclas/mando o tocando las opciones.
   Cuando el jugador termina de elegir, entrega una "acción", por ejemplo:
     { tipo: 'magia', id: 'dardoFuego', objetivo: <Personaje> }
   y el SistemaCombate la ejecuta.
   ===================================================================== */
'use strict';

(function () {
  const COL = G.ui.COL;

  class MenuAcciones {
    constructor(sistema, heroe, op) {
      this.sistema = sistema;
      this.heroe = heroe;
      this.op = op || {};
      this.pila = [];          // menús abiertos (para volver con B)
      this.objetivo = null;    // selección de objetivo en curso
      this.t = 0;
      this.abrirPrincipal();
    }

    abrirPrincipal() {
      const o = this.sistema.opciones(this.heroe);
      this.opciones = o;
      const algunEspiritu = o.espiritu.some((x) => x.puede);
      const ops = [
        { texto: 'Atacar', valor: 'atacar' },
        { texto: 'Magia', valor: 'magia', deshabilitado: !o.magia.length },
        { texto: 'Espíritu', valor: 'espiritu', color: algunEspiritu ? '#7ef2c8' : undefined },
        { texto: 'Objeto', valor: 'objeto', deshabilitado: !o.objetos.length },
        { texto: 'Defender', valor: 'defender' }
      ];
      this.pila = [{ tipo: 'principal', menu: new G.ui.Menu(ops, { x: 4, y: 150, ancho: 92, altoFila: 12, titulo: this.heroe.nombre, cancelable: false }) }];
    }

    get actual() { return this.pila[this.pila.length - 1]; }

    submenu(tipo, items, titulo) {
      const ops = items.map((i) => ({
        texto: i.nombre + (i.cantidad ? '' : ''),
        detalle: i.cantidad !== undefined ? 'x' + i.cantidad : (i.costo ? (tipo === 'magia' ? i.costo + ' PE' : i.costo + '%') : (tipo === 'espiritu' ? 'libre' : '')),
        deshabilitado: !i.puede, desc: i.desc, dato: i
      }));
      const alto = Math.min(6, ops.length);
      this.pila.push({ tipo, menu: new G.ui.Menu(ops, { x: 4, y: 150 - alto * 12 - 16, ancho: 172, altoFila: 12, visibles: 6, titulo }) });
    }

    // Selección de objetivo: enemigo(s), aliado(s) o caído.
    elegirObjetivo(tipoObj, crearAccion) {
      const s = this.sistema;
      let lista;
      if (tipoObj === 'enemigo' || tipoObj === 'enemigos') {
        lista = s.enemigos.filter((e) => e.vivo);
        // para purificar solo sirven el jefe vencido o el que tiene sello
        if (this.purificando) lista = lista.filter((e) => e.estado === 'debilitado' || e.sello !== null);
        else lista = lista.filter((e) => e.estado !== 'debilitado');
      } else if (tipoObj === 'caido') lista = s.heroes.filter((h) => !h.vivo);
      else if (tipoObj === 'aliado' || tipoObj === 'aliados') lista = s.heroes.filter((h) => h.vivo);
      else return crearAccion(null);
      if (!lista.length) {
        G.audio.efecto('error');
        if (s.enemigos.some((e) => e.estado === 'debilitado')) G.ui.aviso('¡Ya está vencido! Usa Espíritu → Purificar', '#b18cff');
        return null;
      }
      const todos = tipoObj === 'enemigos' || tipoObj === 'aliados';
      if (todos) return crearAccion(lista);
      if (lista.length === 1 && this.op.autoUnico) return crearAccion(lista[0]);
      this.objetivo = { lista, sel: 0, crear: crearAccion };
      return null;
    }

    /**
     * Se llama cada cuadro. Devuelve la acción elegida o null.
     * escena.centro(personaje) se usa para tocar objetivos con el dedo.
     */
    actualizar(dt, escena) {
      this.t += dt;
      const E = G.entrada;
      if (this.objetivo) return this.actualizarObjetivo(escena);
      const r = this.actual.menu.actualizar(dt);
      if (!r) return null;
      if (r.tipo === 'cancelar') {
        if (this.pila.length > 1) { this.pila.pop(); this.purificando = false; }
        return null;
      }
      const tipo = this.actual.tipo;
      if (tipo === 'principal') {
        const v = r.opcion.valor;
        this.opciones = this.sistema.opciones(this.heroe);   // el límite o los PE pudieron cambiar
        if (v === 'atacar') return this.elegirObjetivo('enemigo', (t) => ({ tipo: 'atacar', objetivo: t }));
        if (v === 'defender') return { tipo: 'defender' };
        if (v === 'magia') return this.submenu('magia', this.opciones.magia, 'Magia (PE)'), null;
        if (v === 'espiritu') {
          if (!this.opciones.espiritu.length) { G.audio.efecto('error'); return null; }
          return this.submenu('espiritu', this.opciones.espiritu, `Espíritu (límite ${Math.floor(this.heroe.limite)}%)`), null;
        }
        if (v === 'objeto') return this.submenu('objeto', this.opciones.objetos, 'Objeto'), null;
        return null;
      }
      const d = r.opcion.dato;
      if (tipo === 'magia') return this.elegirObjetivo(d.objetivo, (t) => ({ tipo: 'magia', id: d.id, objetivo: t }));
      if (tipo === 'espiritu') {
        this.purificando = d.modo === 'purificar';
        return this.elegirObjetivo(d.objetivo, (t) => ({ tipo: 'espiritu', modo: d.modo, id: d.id, objetivo: t }));
      }
      if (tipo === 'objeto') {
        const o = G.datos.OBJETOS[d.id];
        return this.elegirObjetivo(o.objetivo, (t) => ({ tipo: 'objeto', id: d.id, objetivo: t }));
      }
      void E;
      return null;
    }

    actualizarObjetivo(escena) {
      const E = G.entrada;
      const m = this.objetivo;
      if (E.repetido('abajo') || E.repetido('derecha')) { m.sel = (m.sel + 1) % m.lista.length; G.audio.efecto('cursor'); }
      if (E.repetido('arriba') || E.repetido('izquierda')) { m.sel = (m.sel + m.lista.length - 1) % m.lista.length; G.audio.efecto('cursor'); }
      const tq = E.toque();
      if (tq && escena) {
        const i = m.lista.findIndex((u) => { const [cx, cy] = escena.centro(u); return Math.abs(tq.x - cx) < 30 && Math.abs(tq.y - cy) < 34; });
        if (i >= 0) { E.consumirToque(); m.sel = i; return this.confirmar(); }
      }
      if (E.presionado('a')) return this.confirmar();
      if (E.presionado('b')) { G.audio.efecto('cancelar'); this.objetivo = null; this.purificando = false; }
      return null;
    }
    confirmar() {
      const m = this.objetivo;
      this.objetivo = null;
      G.audio.efecto('aceptar');
      return m.crear(m.lista[m.sel]);
    }

    objetivoSeleccionado() { return this.objetivo ? this.objetivo.lista[this.objetivo.sel] : null; }
    descripcion() {
      const m = this.actual.menu;
      const o = m.opciones[m.sel];
      return o && o.desc;
    }

    dibujar(ctx) {
      if (this.objetivo) {
        const u = this.objetivoSeleccionado();
        const txt = u ? u.nombre : '';
        const w = G.fuente.ancho(txt) + 16;
        G.ui.ventana(ctx, (G.ANCHO - w) / 2, 132, w, 15, { borde: COL.borde2 });
        G.fuente.texto(ctx, txt, G.ANCHO / 2, 135, COL.texto, { alinear: 'centro' });
        return;
      }
      this.pila.forEach((p) => p.menu.dibujar(ctx));
      const d = this.descripcion();
      if (d) {
        const lineas = G.fuente.envolver(d, 184);
        G.ui.ventana(ctx, 158, 4, 196, lineas.length * 11 + 8, { borde: COL.borde2 });
        lineas.forEach((l, i) => G.fuente.texto(ctx, l, 164, 8 + i * 11, COL.texto, { sombra: COL.sombra }));
      }
    }
  }

  G.MenuAcciones = MenuAcciones;
})();
