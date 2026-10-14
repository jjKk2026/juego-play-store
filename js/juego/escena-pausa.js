/* =====================================================================
   MENÚ DE PAUSA, OPCIONES Y PANTALLA DE DERROTA
   ===================================================================== */
'use strict';

(function () {
  const P = G.pixel;
  const U = G.util;
  const COL = G.ui.COL;
  const T = G.TILE;

  function fondoOscuro(ctx, a) {
    ctx.fillStyle = `rgba(8,4,16,${a === undefined ? 0.7 : a})`;
    ctx.fillRect(0, 0, G.ANCHO, G.ALTO);
  }

  // ------------------------------ OPCIONES ------------------------------
  class EscenaOpciones {
    constructor() { this.transparente = true; this.t = 0; this.sel = 0; }
    items() {
      const o = G.opciones;
      const barra = (v) => Math.round(v * 10) + '/10';
      return [
        { id: 'volMusica', texto: 'Volumen de la música', valor: barra(o.volMusica) },
        { id: 'volEfectos', texto: 'Volumen de los efectos', valor: barra(o.volEfectos) },
        { id: 'silencio', texto: 'Silenciar todo', valor: o.silencio ? 'Sí' : 'No' },
        { id: 'velocidadTexto', texto: 'Velocidad del texto', valor: ['', 'Lenta', 'Normal', 'Rápida', 'Instantánea'][o.velocidadTexto] },
        { id: 'modoBatalla', texto: 'Modo de batalla', valor: o.modoBatalla === 'espera' ? 'Espera' : 'Activo' },
        { id: 'vibracion', texto: 'Vibración de pantalla', valor: o.vibracion ? 'Sí' : 'No' },
        { id: 'tactil', texto: 'Controles táctiles', valor: { auto: 'Automático', si: 'Siempre', no: 'Nunca' }[o.tactil] },
        { id: 'volver', texto: 'Volver', valor: '' }
      ];
    }
    cambiar(id, d) {
      const o = G.opciones;
      const ciclo = (lista, v) => lista[(lista.indexOf(v) + d + lista.length) % lista.length];
      if (id === 'volMusica' || id === 'volEfectos') o[id] = U.limitar(Math.round((o[id] + d * 0.1) * 10) / 10, 0, 1);
      else if (id === 'silencio') o.silencio = !o.silencio;
      else if (id === 'velocidadTexto') o.velocidadTexto = ((o.velocidadTexto - 1 + d + 4) % 4) + 1;
      else if (id === 'modoBatalla') o.modoBatalla = o.modoBatalla === 'espera' ? 'activo' : 'espera';
      else if (id === 'vibracion') o.vibracion = !o.vibracion;
      else if (id === 'tactil') { o.tactil = ciclo(['auto', 'si', 'no'], o.tactil); G.aplicarTactil && G.aplicarTactil(); }
      G.audio.configurar(o);
      document.dispatchEvent(new CustomEvent('silencio', { detail: o.silencio }));
      G.guardado.guardarOpciones();
      G.audio.efecto('cursor');
    }
    actualizar(dt) {
      this.t += dt;
      const E = G.entrada;
      const items = this.items();
      if (E.repetido('abajo')) { this.sel = (this.sel + 1) % items.length; G.audio.efecto('cursor'); }
      if (E.repetido('arriba')) { this.sel = (this.sel + items.length - 1) % items.length; G.audio.efecto('cursor'); }
      const id = items[this.sel].id;
      if (E.repetido('derecha') && id !== 'volver') this.cambiar(id, 1);
      if (E.repetido('izquierda') && id !== 'volver') this.cambiar(id, -1);
      const tq = E.consumirToque();
      if (tq) {
        const fila = Math.floor((tq.y - 40) / 16);
        if (fila >= 0 && fila < items.length) {
          this.sel = fila;
          if (items[fila].id === 'volver') return this.salir();
          this.cambiar(items[fila].id, tq.x < G.ANCHO / 2 + 40 && (items[fila].id === 'volMusica' || items[fila].id === 'volEfectos') ? -1 : 1);
        }
      }
      if (E.presionado('a')) { if (id === 'volver') return this.salir(); this.cambiar(id, 1); }
      if (E.presionado('b') || E.presionado('pausa')) this.salir();
    }
    salir() { G.audio.efecto('cancelar'); G.motor.quitar(); }
    dibujar(ctx) {
      fondoOscuro(ctx, 0.85);
      G.ui.ventana(ctx, 40, 20, G.ANCHO - 80, G.ALTO - 36, { titulo: 'Opciones' });
      this.items().forEach((it, i) => {
        const y = 40 + i * 16;
        if (i === this.sel) { ctx.fillStyle = COL.seleccion; ctx.fillRect(44, y - 2, G.ANCHO - 88, 14); G.ui.cursor(ctx, 46, y, this.t); }
        G.fuente.texto(ctx, it.texto, 58, y, COL.texto, { sombra: COL.sombra });
        if (it.valor) G.fuente.texto(ctx, '< ' + it.valor + ' >', G.ANCHO - 52, y, COL.resalte, { alinear: 'der', sombra: COL.sombra });
      });
      G.fuente.texto(ctx, 'Izquierda/derecha para cambiar. M silencia en cualquier momento.', G.ANCHO / 2, G.ALTO - 26, COL.tenue, { alinear: 'centro' });
    }
  }

  // ------------------------------ PAUSA ------------------------------
  class EscenaPausa {
    constructor(mapa) {
      this.mapa = mapa;
      this.transparente = true;
      this.t = 0;
      this.vista = 'menu';
      const ops = [
        { texto: 'Continuar', valor: 'continuar' },
        { texto: 'Estado', valor: 'estado' },
        { texto: 'Objetos', valor: 'objetos' },
        { texto: 'Mapa', valor: 'mapa' },
        { texto: "Hablar con Tz'unun", valor: 'colibri', deshabilitado: !G.partida.bandera('colibri') },
        { texto: 'Bestiario', valor: 'bestiario' },
        { texto: 'Opciones', valor: 'opciones' },
        { texto: 'Guardar', valor: 'guardar' },
        { texto: 'Salir al título', valor: 'titulo' }
      ];
      this.menu = new G.ui.Menu(ops, { x: 8, y: 22, ancho: 126, altoFila: 13, titulo: 'Pausa' });
      this.heroeSel = 0;
    }
    entrar() { G.audio.efecto('aceptar'); }
    alVolver() { G.entrada.limpiar(); }
    actualizar(dt) {
      this.t += dt;
      const E = G.entrada;
      if (this.dialogo) { this.dialogo.actualizar(dt); if (this.dialogo.terminado) this.dialogo = null; return; }
      if (this.vista === 'menu') {
        if (E.presionado('pausa')) { G.motor.quitar(); return; }
        const r = this.menu.actualizar(dt);
        if (!r) return;
        if (r.tipo === 'cancelar') { G.motor.quitar(); return; }
        this.elegir(r.opcion.valor);
      } else if (this.vista === 'objetos') {
        this.actualizarObjetos(dt);
      } else if (this.vista === 'colibri') {
        const r = this.menuColibri.actualizar(dt);
        if (r && r.tipo === 'cancelar') this.vista = 'menu';
        else if (r) this.hablarColibri(r.opcion.valor);
      } else {
        if (this.vista === 'estado' && (E.presionado('izquierda') || E.presionado('derecha'))) { this.heroeSel = 1 - this.heroeSel; G.audio.efecto('cursor'); }
        if (E.presionado('b') || E.presionado('a') || E.presionado('pausa') || E.consumirToque()) { G.audio.efecto('cancelar'); this.vista = 'menu'; }
      }
    }
    elegir(v) {
      switch (v) {
        case 'continuar': G.motor.quitar(); break;
        case 'estado': this.vista = 'estado'; break;
        case 'objetos': this.abrirObjetos(); break;
        case 'mapa': this.vista = 'mapa'; break;
        case 'colibri':
          this.menuColibri = new G.ui.Menu([
            { texto: '¿Qué debo hacer ahora?', valor: 'pista' },
            { texto: 'Cuéntame del Popol Vuh', valor: 'relato' },
            { texto: '¿Cómo se juega?', valor: 'ayuda' }
          ], { x: 140, y: 40, ancho: 170, titulo: "Tz'unun" });
          this.vista = 'colibri';
          break;
        case 'bestiario': G.motor.apilar(new G.EscenaBestiario()); break;
        case 'opciones': G.motor.apilar(new EscenaOpciones()); break;
        case 'guardar':
          this.mapa.guardarPosicion();
          {
            const ok = G.partida.guardar();
            G.ui.aviso(ok ? 'Partida guardada' : 'No se pudo guardar', ok ? '#7ef2c8' : COL.rojo);
          }
          G.audio.efecto('guardar');
          break;
        case 'titulo':
          this.mapa.guardarPosicion();
          G.partida.guardar();
          G.motor.cambiar(new G.EscenaTitulo());
          break;
        default: break;
      }
    }
    hablarColibri(v) {
      const m = G.partida.mundo();
      const yo = { quien: "Tz'unun", retrato: 'colibri' };
      let lineas;
      if (v === 'pista') {
        const p = m.pistas[G.partida.objetivo()] || 'Sigue explorando. Escucha a los aluxes y lee las estelas: guardan secretos.';
        lineas = [Object.assign({ texto: p }, yo)];
      } else if (v === 'relato') {
        const frags = m.fragmentos;
        this.iFrag = ((this.iFrag === undefined ? Math.floor(Math.random() * frags.length) : this.iFrag) + 1) % frags.length;
        lineas = frags[this.iFrag].map((t) => Object.assign({ texto: t }, yo));
      } else {
        const tactil = G.entrada.usaTactil();
        lineas = [
          Object.assign({ texto: tactil ? 'Muévete con la cruceta. *A* sirve para hablar, abrir y confirmar. *B* para cancelar y usar la habilidad del líder.' : 'Muévete con las flechas. *Z* (o Enter) para hablar, abrir y confirmar. *X* para cancelar y usar la habilidad del líder. *C* cambia de líder.' }, yo),
          Object.assign({ texto: 'Hunahpú dispara su *cerbatana*: activa cristales y, si el dardo cruza un fuego, enciende braseros. Ixbalanqué *ruge* para asustar enemigos y es el único que empuja bloques con cara de jaguar.' }, yo),
          Object.assign({ texto: 'En combate, cuando ataques aparecerá un anillo: toca *A* justo cuando se junte con el círculo dorado para un *golpe preciso*.' }, yo),
          Object.assign({ texto: 'Si las barras de tiempo de los dos están llenas, en Técnicas aparecen las *técnicas dobles* (con estrella). Los altares de copal curan y guardan la partida.' }, yo)
        ];
      }
      this.dialogo = new G.ui.Dialogo(lineas, () => {});
    }

    abrirObjetos() {
      const ids = Object.keys(G.datos.OBJETOS);
      this.menuObj = new G.ui.Menu(ids.map((id) => {
        const o = G.datos.OBJETOS[id];
        return { texto: o.nombre, valor: id, detalle: 'x' + G.partida.cuantos(id), deshabilitado: !G.partida.cuantos(id) || o.soloCombate, desc: o.desc };
      }), { x: 140, y: 22, ancho: 150, titulo: 'Objetos' });
      this.vista = 'objetos';
      this.eligeHeroe = null;
    }
    actualizarObjetos(dt) {
      const E = G.entrada;
      if (this.eligeHeroe) {
        const r = this.menuHeroe.actualizar(dt);
        if (!r) return;
        if (r.tipo === 'cancelar') { this.eligeHeroe = null; return; }
        this.usarObjeto(this.eligeHeroe, G.partida.heroes()[r.indice]);
        this.eligeHeroe = null;
        this.abrirObjetos();
        return;
      }
      const r = this.menuObj.actualizar(dt);
      if (!r) return;
      if (r.tipo === 'cancelar') { this.vista = 'menu'; return; }
      this.eligeHeroe = r.opcion.valor;
      this.menuHeroe = new G.ui.Menu(G.partida.heroes().map((h) => {
        const s = G.reglas.stats(h);
        return { texto: G.datos.HEROES[h.id].nombre, detalle: `${h.vida}/${s.vida}  E ${h.energia}/${s.energia}` };
      }), { x: 140, y: 120, ancho: 200, titulo: '¿A quién?' });
      void E;
    }
    usarObjeto(id, h) {
      const o = G.datos.OBJETOS[id];
      const s = G.reglas.stats(h);
      if (o.uso === 'cura') {
        if (h.vida <= 0 || h.vida >= s.vida) { G.audio.efecto('error'); return; }
        h.vida = Math.min(s.vida, h.vida + o.valor);
      } else if (o.uso === 'energia') {
        if (h.energia >= s.energia) { G.audio.efecto('error'); return; }
        h.energia = Math.min(s.energia, h.energia + o.valor);
      } else if (o.uso === 'revivir') {
        if (h.vida > 0) { G.audio.efecto('error'); return; }
        h.vida = Math.round(s.vida * o.valor);
      } else return;
      G.partida.quitar(id);
      G.audio.efecto('curar');
      G.ui.aviso(`${G.datos.HEROES[h.id].nombre} usó ${o.nombre}`, '#7ef2c8');
    }

    dibujar(ctx) {
      fondoOscuro(ctx, 0.62);
      // tiempo y lugar
      const e = G.partida.e;
      const min = Math.floor(e.tiempo / 60), hrs = Math.floor(min / 60);
      G.ui.ventana(ctx, 8, 150, 126, 44);
      G.fuente.texto(ctx, this.mapa.def.nombre, 14, 156, COL.oro);
      G.fuente.texto(ctx, `Tiempo: ${hrs}:${String(min % 60).padStart(2, '0')}`, 14, 168, COL.texto);
      G.fuente.texto(ctx, `Sellos: ${G.partida.especial('sellos')}/3`, 14, 180, COL.tenue);
      this.menu.dibujar(ctx);
      if (this.vista === 'menu') this.dibujarResumen(ctx);
      else if (this.vista === 'estado') this.dibujarEstado(ctx);
      else if (this.vista === 'objetos') {
        this.menuObj.dibujar(ctx);
        const sel = this.menuObj.opciones[this.menuObj.sel];
        if (sel && !this.eligeHeroe) {
          const lineas = G.fuente.envolver(sel.desc, 220);
          G.ui.ventana(ctx, 140, 160, 236, lineas.length * 11 + 10, { borde: COL.borde2 });
          lineas.forEach((l, i) => G.fuente.texto(ctx, l, 146, 165 + i * 11, COL.texto));
        }
        if (this.eligeHeroe) this.menuHeroe.dibujar(ctx);
      } else if (this.vista === 'mapa') this.dibujarMapa(ctx);
      else if (this.vista === 'colibri') this.menuColibri.dibujar(ctx);
      if (this.dialogo) this.dialogo.dibujar(ctx);
    }

    dibujarResumen(ctx) {
      G.partida.heroes().forEach((h, i) => {
        const s = G.reglas.stats(h);
        const x = 142, y = 22 + i * 58, w = G.ANCHO - x - 8;
        G.ui.ventana(ctx, x, y, w, 52);
        ctx.drawImage(G.arte.retrato(h.id), x + 6, y + 6, 40, 40);
        const def = G.datos.HEROES[h.id];
        G.fuente.texto(ctx, def.nombre, x + 52, y + 6, def.color, { sombra: COL.sombra });
        G.fuente.texto(ctx, 'Nivel ' + h.nivel, x + w - 8, y + 6, COL.oro, { alinear: 'der' });
        G.fuente.texto(ctx, `Vida ${h.vida}/${s.vida}`, x + 52, y + 19, COL.texto);
        G.ui.barra(ctx, x + 52, y + 31, 90, 3, h.vida, s.vida, '#7ef2c8');
        G.fuente.texto(ctx, `Energía ${h.energia}/${s.energia}`, x + 150, y + 19, '#4cc9f0');
        G.ui.barra(ctx, x + 150, y + 31, 70, 3, h.energia, s.energia, '#4cc9f0');
        G.fuente.texto(ctx, `Exp. para subir: ${G.reglas.xpSiguiente(h.nivel) - h.xp}`, x + 52, y + 38, COL.tenue);
      });
      // objetos especiales
      const x = 142, y = 140, w = G.ANCHO - x - 8;
      G.ui.ventana(ctx, x, y, w, 54, { titulo: 'Bolsa' });
      let i = 0;
      Object.keys(G.datos.OBJETOS).forEach((id) => {
        const xx = x + 8 + (i % 4) * 56, yy = y + 10 + Math.floor(i / 4) * 16;
        ctx.drawImage(G.arte.icono(G.datos.OBJETOS[id].icono), xx, yy);
        G.fuente.texto(ctx, 'x' + G.partida.cuantos(id), xx + 14, yy + 2, COL.texto);
        i++;
      });
      const zona = this.mapa.def.zona;
      const extras = [['llave', G.partida.llaves(zona)], ['hueso', G.partida.especial('huesos')], ['luciernaga', G.partida.especial('luciernagas')], ['sello', G.partida.especial('sellos')]];
      extras.forEach(([ic, n], j) => {
        const xx = x + 8 + j * 56, yy = y + 30;
        ctx.globalAlpha = n ? 1 : 0.35;
        ctx.drawImage(G.arte.icono(ic), xx, yy);
        G.fuente.texto(ctx, 'x' + n, xx + 14, yy + 2, COL.texto);
        ctx.globalAlpha = 1;
      });
    }

    dibujarEstado(ctx) {
      const h = G.partida.heroes()[this.heroeSel];
      const def = G.datos.HEROES[h.id];
      const s = G.reglas.stats(h);
      const x = 142, y = 22, w = G.ANCHO - x - 8, alto = 172;
      G.ui.ventana(ctx, x, y, w, alto, { titulo: def.nombre });
      ctx.drawImage(G.arte.personaje(h.id, 0, 0), x + 10, y + 12, 32, 50);
      G.fuente.texto(ctx, def.titulo, x + 50, y + 10, def.color);
      G.fuente.texto(ctx, `Nivel ${h.nivel}   Exp. ${h.xp}/${G.reglas.xpSiguiente(h.nivel)}`, x + 50, y + 22, COL.texto);
      const filas = [['Vida', `${h.vida}/${s.vida}`], ['Energía', `${h.energia}/${s.energia}`], ['Fuerza', s.fue], ['Defensa', s.def], ['Magia', s.mag], ['Velocidad', s.vel]];
      filas.forEach(([k, v], i) => {
        G.fuente.texto(ctx, k, x + 50 + (i % 2) * 90, y + 36 + Math.floor(i / 2) * 11, COL.tenue);
        G.fuente.texto(ctx, String(v), x + 130 + (i % 2) * 90, y + 36 + Math.floor(i / 2) * 11, COL.texto, { alinear: 'der' });
      });
      G.fuente.texto(ctx, 'Técnicas:', x + 10, y + 74, COL.oro);
      def.tecnicas.forEach(([id, n], i) => {
        const t = G.datos.TECNICAS[id];
        const sabe = h.nivel >= n;
        G.fuente.texto(ctx, sabe ? `${t.nombre} (${t.costo} E)` : `??? (nivel ${n})`, x + 14 + (i % 2) * 110, y + 86 + Math.floor(i / 2) * 11, sabe ? COL.texto : COL.tenue);
      });
      G.fuente.texto(ctx, 'Técnicas dobles:', x + 10, y + 122, COL.oro);
      const disp = G.reglas.doblesDisponibles(G.partida.heroes());
      Object.keys(G.datos.DOBLES).forEach((id, i) => {
        const t = G.datos.DOBLES[id];
        G.fuente.texto(ctx, disp.includes(id) ? '★ ' + t.nombre : '★ ???', x + 14 + (i % 2) * 110, y + 134 + Math.floor(i / 2) * 11, disp.includes(id) ? '#ffd166' : COL.tenue);
      });
      G.fuente.texto(ctx, '< > cambiar de gemelo', x + w - 8, y + alto - 12, COL.tenue, { alinear: 'der' });
    }

    dibujarMapa(ctx) {
      const m = this.mapa;
      const x = 142, y = 22, w = G.ANCHO - x - 8, h = 172;
      G.ui.ventana(ctx, x, y, w, h, { titulo: 'Mapa: ' + m.zona.nombre });
      if (!G.partida.tieneMapa(m.def.zona)) {
        const lineas = G.fuente.envolver('Todavía no tienes el mapa de esta zona. Búscalo en algún cofre escondido.', w - 20);
        lineas.forEach((l, i) => G.fuente.texto(ctx, l, x + 10, y + 20 + i * 12, COL.texto));
        ctx.drawImage(G.arte.icono('mapa'), x + w / 2 - 6, y + 80);
        return;
      }
      const esc = Math.max(1, Math.min(Math.floor((w - 12) / m.ancho), Math.floor((h - 30) / m.alto), 4));
      const ox = Math.round(x + (w - m.ancho * esc) / 2), oy = y + 12;
      const colores = { '#': '#3a2852', '~': '#2a7fb8', 'w': '#4a8fc8', '=': '#9c6b3d', 'T': '#2f6e35', 'v': '#05020a', 'r': '#6b6070', 'b': '#2f6e35', 'n': '#05d9e8', 'F': '#ff7a3d', ':': '#8a6a4a' };
      for (let ty = 0; ty < m.alto; ty++) {
        for (let tx = 0; tx < m.ancho; tx++) {
          const c = m.tiles[ty][tx];
          ctx.fillStyle = colores[c] || '#5a4a6e';
          ctx.fillRect(ox + tx * esc, oy + ty * esc, esc, esc);
        }
      }
      m.objetos.forEach((o) => {
        let c = null;
        if (o.tipo === 'cofre' && !G.partida.abierto(o.id)) c = '#ffd166';
        else if (o.tipo === 'puerta' && !m.abierto(o)) c = o.def.clase === 'jefe' ? '#ff2a6d' : '#c4302b';
        else if (o.tipo === 'salida') c = '#ffffff';
        else if (o.tipo === 'altar') c = '#7ef2c8';
        else if (o.tipo === 'jefe') c = '#ff2a6d';
        if (c) { ctx.fillStyle = c; ctx.fillRect(ox + o.x * esc, oy + o.y * esc, esc, esc); }
      });
      if (Math.floor(this.t * 4) % 2 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ox + Math.floor(m.lider.x / T) * esc - 1, oy + Math.floor((m.lider.y - 4) / T) * esc - 1, esc + 2, esc + 2);
      }
      const ley = [['#ffd166', 'Cofre'], ['#c4302b', 'Puerta'], ['#7ef2c8', 'Altar'], ['#ffffff', 'Tú / salida']];
      ley.forEach(([c, t], i) => {
        ctx.fillStyle = c; ctx.fillRect(x + 10 + i * 58, y + h - 12, 5, 5);
        G.fuente.texto(ctx, t, x + 18 + i * 58, y + h - 15, COL.tenue);
      });
    }
  }

  // ------------------------------ DERROTA ------------------------------
  class EscenaDerrota {
    constructor() {
      this.t = 0;
      this.menu = new G.ui.Menu([
        { texto: 'Intentarlo de nuevo', valor: 'otra' },
        { texto: 'Volver al título', valor: 'titulo' }
      ], { x: G.ANCHO / 2 - 70, y: 150, ancho: 140, cancelable: false });
    }
    entrar() { G.audio.musica('derrota'); }
    actualizar(dt) {
      this.t += dt;
      if (this.t < 1.5) return;
      const r = this.menu.actualizar(dt);
      if (!r || r.tipo !== 'elegir') return;
      if (r.opcion.valor === 'titulo') { G.motor.cambiar(new G.EscenaTitulo()); return; }
      if (!G.partida.cargar()) { G.motor.cambiar(new G.EscenaTitulo()); return; }
      G.partida.curarTodo();
      G.EscenaMapa.vencidos.clear();
      G.motor.cambiar(new G.EscenaMapa(G.partida.e.mapa));
    }
    dibujar(ctx) {
      ctx.fillStyle = '#0a0612';
      ctx.fillRect(0, 0, G.ANCHO, G.ALTO);
      P.trama(ctx, 0, 0, G.ANCHO, G.ALTO, '#1d1330', 4, (i, j) => Math.round(2 * j / G.ALTO));
      const a = Math.min(1, this.t / 1.2);
      ctx.globalAlpha = a;
      G.fuente.texto(ctx, 'Los gemelos han caído', G.ANCHO / 2, 40, '#ff5d73', { alinear: 'centro', escala: 2, borde: '#1a0f1f' });
      const lineas = G.fuente.envolver('"No se rindan. En el Popol Vuh, los gemelos también murieron en Xibalbá... y volvieron a nacer en el río, más fuertes que antes." —Tz\'unun', 300);
      lineas.forEach((l, i) => G.fuente.texto(ctx, l, G.ANCHO / 2, 80 + i * 12, COL.texto, { alinear: 'centro' }));
      const c = G.arte.colibri(Math.floor(this.t * 10));
      P.brillo(ctx, G.ANCHO / 2, 128, 20, '#3fd3a8', 0.4);
      ctx.drawImage(c, G.ANCHO / 2 - 12, 120 + Math.sin(this.t * 3) * 3, 24, 16);
      ctx.globalAlpha = 1;
      if (this.t >= 1.5) this.menu.dibujar(ctx);
    }
  }

  G.EscenaPausa = EscenaPausa;
  G.EscenaOpciones = EscenaOpciones;
  G.EscenaDerrota = EscenaDerrota;
})();
