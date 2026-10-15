/* =====================================================================
   PANTALLA DE NOMBRES (estilo Pokémon)
   Antes de empezar, el jugador escribe el nombre de cada gemelo.
   Se puede escribir de tres maneras:
   - con el teclado de letras de la pantalla (cruceta o mando + A),
   - tocando el recuadro del nombre (abre el teclado del celular o iPad),
   - escribiendo directamente con el teclado del computador.
   Si el nombre queda vacío o se elige "Omitir", se usa el nombre por
   defecto (Ren y Alex). Los nombres se guardan en la partida
   (G.partida.nombre) y los diálogos los usan con {H} y {I}.
   ===================================================================== */
'use strict';

(function () {
  const P = G.pixel;
  const COL = G.ui.COL;

  const LETRAS = {
    mayus: ['ABCDEFGHIJKLMN', 'ÑOPQRSTUVWXYZÁ', "ÉÍÓÚÜ'-.0123456"],
    minus: ['abcdefghijklmn', 'ñopqrstuvwxyzá', "éíóúü'-.789!?,"]
  };
  const BOTONES = [
    { id: 'espacio', texto: 'Espacio' }, { id: 'mayus', texto: 'Aa' }, { id: 'borrar', texto: 'Borrar' },
    { id: 'maya', texto: 'Maya' }, { id: 'omitir', texto: 'Omitir' }, { id: 'listo', texto: 'Listo' }
  ];
  const GEMELOS = [
    { id: 'hunahpu', pregunta: '¿Cómo se llama el primer gemelo?', titulo: 'El cazador de la cerbatana' },
    { id: 'ixbalanque', pregunta: '¿Y cómo se llama su hermano?', titulo: 'Corazón de jaguar' }
  ];
  // Posición del teclado de letras dentro de la pantalla.
  const GX = 124, GY = 86, CW = 18, CH = 15;
  const CAJA = { x: 124, y: 52, w: 238, h: 20 };

  class EscenaNombre {
    constructor(alTerminar) {
      this.alTerminar = alTerminar;
      this.paso = 0;
      this.texto = '';
      this.mayus = true;
      this.fila = 0; this.col = 0;   // posición del cursor (fila 3 = botones)
      this.t = 0;
      this.terminado = false;
    }

    get gemelo() { return GEMELOS[this.paso]; }
    get porDefecto() { return G.datos.NOMBRES_POR_DEFECTO[this.gemelo.id]; }
    filas() { return LETRAS[this.mayus ? 'mayus' : 'minus']; }

    entrar() {
      G.audio.musica('titulo');
      G.entrada.recibirTexto((c) => this.tecla(c));
      this.crearCampo();
    }
    salir() {
      G.entrada.recibirTexto(null);
      if (this.campo) { this.campo.remove(); this.campo = null; }
      const lienzo = G.motor.lienzo();
      if (this.alTocar) lienzo.removeEventListener('pointerdown', this.alTocar);
    }

    // Campo de texto real (invisible) para que aparezca el teclado del celular o iPad.
    crearCampo() {
      const c = document.createElement('input');
      c.type = 'text';
      c.id = 'campo-nombre';
      c.maxLength = G.datos.LARGO_NOMBRE;
      c.autocomplete = 'off';
      c.setAttribute('autocapitalize', 'words');
      c.setAttribute('autocorrect', 'off');
      c.setAttribute('spellcheck', 'false');
      c.setAttribute('enterkeyhint', 'done');
      c.setAttribute('aria-label', 'Nombre del gemelo');
      c.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.01;font-size:16px;border:0;padding:0;';
      document.body.appendChild(c);
      c.addEventListener('input', () => {
        const limpio = G.partida.limpiarNombre(c.value);
        if (limpio !== c.value.trim()) c.value = limpio;
        this.texto = limpio;
        this.mayus = !limpio.length;
      });
      c.addEventListener('blur', () => { this.escribiendoNativo = false; });
      this.campo = c;
      // El foco debe darse dentro del mismo toque (si no, iOS no muestra el teclado).
      const lienzo = G.motor.lienzo();
      this.alTocar = (e) => {
        const r = lienzo.getBoundingClientRect();
        const x = (e.clientX - r.left) * (G.ANCHO / r.width), y = (e.clientY - r.top) * (G.ALTO / r.height);
        if (x >= CAJA.x && x <= CAJA.x + CAJA.w && y >= CAJA.y && y <= CAJA.y + CAJA.h) {
          c.value = this.texto;
          c.focus();
          this.escribiendoNativo = true;
        } else if (this.escribiendoNativo) {
          c.blur();
        }
      };
      lienzo.addEventListener('pointerdown', this.alTocar);
    }

    // Una letra o una orden que llega del teclado del computador.
    tecla(c) {
      if (this.terminado) return;
      if (c === 'borrar') return this.borrar();
      if (c === 'listo') return this.listo();
      this.escribir(c);
    }

    escribir(c) {
      const nuevo = G.partida.limpiarNombre(this.texto + c);
      if (nuevo.length > this.texto.length || (c === ' ' && this.texto.length < G.datos.LARGO_NOMBRE)) {
        this.texto = c === ' ' ? this.texto + ' ' : nuevo;
        G.audio.efecto('cursor');
        // Como en los teclados de los teléfonos: después de la primera letra, minúsculas.
        if (this.texto.length === 1 && this.mayus) this.mayus = false;
      } else G.audio.efecto('error');
    }
    borrar() {
      if (!this.texto.length) {
        // con el nombre vacío, B vuelve al gemelo anterior
        if (this.paso > 0) { this.paso--; this.texto = G.partida.nombre(this.gemelo.id); G.audio.efecto('cancelar'); }
        return;
      }
      this.texto = this.texto.slice(0, -1);
      if (!this.texto.length) this.mayus = true;
      G.audio.efecto('cancelar');
    }
    omitir() { this.texto = ''; this.listo(); }
    listo() {
      const nombre = G.partida.ponerNombre(this.gemelo.id, this.texto);
      G.audio.efecto('aceptar');
      G.ui.aviso(`¡${nombre}!`, G.datos.HEROES[this.gemelo.id].color);
      if (this.campo) { this.campo.value = ''; this.campo.blur(); }
      if (this.paso < GEMELOS.length - 1) {
        this.paso++;
        this.texto = '';
        this.mayus = true;
        this.fila = 0; this.col = 0;
        return;
      }
      this.terminado = true;
      G.entrada.limpiar();
      this.alTerminar && this.alTerminar();
    }

    pulsarBoton(id) {
      if (id === 'espacio') this.escribir(' ');
      else if (id === 'mayus') { this.mayus = !this.mayus; G.audio.efecto('cursor'); }
      else if (id === 'borrar') this.borrar();
      else if (id === 'maya') { this.texto = G.datos.HEROES[this.gemelo.id].nombre; G.audio.efecto('colibri'); }
      else if (id === 'omitir') this.omitir();
      else if (id === 'listo') this.listo();
    }

    elegir() {
      if (this.fila === 3) return this.pulsarBoton(BOTONES[this.col].id);
      const c = this.filas()[this.fila][this.col];
      if (c) this.escribir(c);
    }

    actualizar(dt) {
      this.t += dt;
      if (this.terminado) return;
      const E = G.entrada;
      const columnas = () => (this.fila === 3 ? BOTONES.length : this.filas()[this.fila].length);
      if (E.repetido('derecha')) { this.col = (this.col + 1) % columnas(); G.audio.efecto('cursor'); }
      if (E.repetido('izquierda')) { this.col = (this.col + columnas() - 1) % columnas(); G.audio.efecto('cursor'); }
      if (E.repetido('abajo') || E.repetido('arriba')) {
        const antes = this.fila;
        this.fila = (this.fila + (E.repetido('abajo') ? 1 : 3)) % 4;
        // pasar entre letras (14 columnas) y botones (6) conservando la posición aproximada
        if (this.fila === 3 && antes !== 3) this.col = Math.min(BOTONES.length - 1, Math.floor(this.col * BOTONES.length / 14));
        else if (antes === 3 && this.fila !== 3) this.col = Math.min(13, Math.floor((this.col + 0.5) * 14 / BOTONES.length));
        G.audio.efecto('cursor');
      }
      if (E.presionado('a')) this.elegir();
      if (E.presionado('b')) this.borrar();
      if (E.presionado('x')) { this.mayus = !this.mayus; G.audio.efecto('cursor'); }
      if (E.presionado('pausa')) { this.fila = 3; this.col = BOTONES.length - 1; this.listo(); }
      // tocar o hacer clic en una letra o un botón
      const tq = E.consumirToque();
      if (tq) {
        const fila = Math.floor((tq.y - GY) / CH), col = Math.floor((tq.x - GX) / CW);
        if (fila >= 0 && fila < 3 && col >= 0 && col < 14) { this.fila = fila; this.col = col; this.elegir(); }
        else {
          BOTONES.forEach((b, i) => {
            const r = this.rectBoton(i);
            if (tq.x >= r.x && tq.x <= r.x + r.w && tq.y >= r.y && tq.y <= r.y + r.h) { this.fila = 3; this.col = i; this.pulsarBoton(b.id); }
          });
        }
      }
    }

    rectBoton(i) { const w = 38; return { x: GX + i * (w + 2), y: GY + 3 * CH + 6, w, h: 15 }; }

    dibujar(ctx) {
      const W = G.ANCHO, H = G.ALTO;
      // fondo con trama de cómic
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#120a1c'); g.addColorStop(1, '#3a1f5c');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      P.trama(ctx, 0, 0, W, H, 'rgba(0,0,0,0.25)', 4, (i, j) => 1 + Math.round(j / H * 2));
      const color = G.datos.HEROES[this.gemelo.id].color;
      // retrato grande del gemelo
      P.brillo(ctx, 60, 110, 70, color, 0.35);
      const sprite = G.arte.personaje(this.gemelo.id, 0, Math.floor(this.t * 2) % 2 ? 0 : 0);
      ctx.drawImage(sprite, 20, 46, 80, 125);
      G.fuente.texto(ctx, this.gemelo.titulo, 60, 178, color, { alinear: 'centro', sombra: COL.sombra });
      G.fuente.texto(ctx, `Gemelo ${this.paso + 1} de 2`, 60, 192, COL.tenue, { alinear: 'centro' });
      // pregunta
      G.fuente.texto(ctx, this.gemelo.pregunta, W / 2 + 50, 18, COL.oro, { alinear: 'centro', borde: '#1a0f1f' });
      G.fuente.texto(ctx, 'Si lo dejas vacío se llamará ' + this.porDefecto + '.', W / 2 + 50, 34, COL.tenue, { alinear: 'centro' });
      // recuadro del nombre (como un campo de texto)
      G.ui.ventana(ctx, CAJA.x, CAJA.y, CAJA.w, CAJA.h, { borde: this.escribiendoNativo ? COL.borde2 : COL.borde });
      if (this.texto) G.fuente.texto(ctx, this.texto, CAJA.x + 8, CAJA.y + 5, COL.texto, { sombra: COL.sombra });
      else G.fuente.texto(ctx, this.porDefecto, CAJA.x + 8, CAJA.y + 5, '#5c4f7a');
      const xc = CAJA.x + 8 + (this.texto ? G.fuente.ancho(this.texto) + 2 : 0);
      if (Math.floor(this.t * 2.5) % 2 === 0) { ctx.fillStyle = COL.oro; ctx.fillRect(xc, CAJA.y + 4, 1, 11); }
      G.fuente.texto(ctx, `${this.texto.length}/${G.datos.LARGO_NOMBRE}`, CAJA.x + CAJA.w - 6, CAJA.y + 5, COL.tenue, { alinear: 'der' });
      if (G.entrada.usaTactil()) G.fuente.texto(ctx, 'Toca el recuadro para usar el teclado del dispositivo', CAJA.x + CAJA.w / 2, CAJA.y + CAJA.h + 3, '#7e6fa0', { alinear: 'centro' });
      // teclado de letras
      this.filas().forEach((fila, j) => {
        [...fila].forEach((c, i) => {
          const x = GX + i * CW, y = GY + j * CH;
          const sel = this.fila === j && this.col === i;
          ctx.fillStyle = sel ? COL.seleccion : 'rgba(23,11,38,0.75)';
          ctx.fillRect(x, y, CW - 1, CH - 1);
          if (sel) { ctx.strokeStyle = COL.oro; ctx.strokeRect(x + 0.5, y + 0.5, CW - 2, CH - 2); }
          G.fuente.texto(ctx, c, x + CW / 2, y + 2, sel ? COL.oro : COL.texto, { alinear: 'centro' });
        });
      });
      BOTONES.forEach((b, i) => {
        const r = this.rectBoton(i);
        const sel = this.fila === 3 && this.col === i;
        const destacado = b.id === 'listo';
        ctx.fillStyle = sel ? COL.seleccion : (destacado ? '#1d4a3d' : 'rgba(23,11,38,0.85)');
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = sel ? COL.oro : (destacado ? COL.borde2 : '#5c4f7a');
        ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        const txt = b.id === 'mayus' ? (this.mayus ? 'ABC' : 'abc') : b.texto;
        G.fuente.texto(ctx, txt, r.x + r.w / 2, r.y + 3, sel ? COL.oro : COL.texto, { alinear: 'centro' });
      });
      // ayuda de botones
      const et = G.entrada.etiqueta;
      G.fuente.texto(ctx, `${et('a')} escribir · ${et('b')} borrar · ${et('x')} mayúsculas · ${et('pausa')} listo`, W / 2 + 50, H - 14, COL.tenue, { alinear: 'centro' });
    }
  }

  G.EscenaNombre = EscenaNombre;
})();
