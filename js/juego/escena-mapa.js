/* =====================================================================
   EXPLORACIÓN DEL MAPA (vista desde arriba)
   - Un gemelo lidera y el otro lo sigue. Botón X (⇄) cambia el líder.
   - Botón A: hablar, abrir cofres y puertas, leer estelas, descansar.
   - Botón B: habilidad del líder:
       Hunahpú dispara su cerbatana (activa dianas, enciende braseros
       si el dardo pasa por el fuego, y paraliza enemigos un momento).
       Ixbalanqué ruge (asusta a los enemigos cercanos) y es el único
       con fuerza para empujar los bloques pesados con cara de jaguar.
   - Los enemigos se ven en el mapa: si te tocan, empieza un combate.
   ===================================================================== */
'use strict';

(function () {
  const P = G.pixel;
  const U = G.util;
  const L = G.losetas;
  const T = G.TILE;
  const COL = G.ui.COL;

  const VEL = 72;           // velocidad del líder (píxeles por segundo)
  const SOLIDOS = new Set(['casa', 'cofre', 'puerta', 'barrera', 'bloque', 'diana', 'brasero', 'altar', 'npc', 'estela', 'guardian', 'pilaHuesos', 'ceiba', 'jefe']);
  const VERBOS = { cofre: 'Abrir', puerta: 'Abrir', npc: 'Hablar', estela: 'Leer', altar: 'Descansar', pilaHuesos: 'Tomar', guardian: 'Dar hueso', diana: 'Mirar', brasero: 'Mirar', bloque: 'Empujar' };

  // Vencidos desde el último descanso (no se guarda: reaparecen al descansar o al recargar).
  const vencidos = new Set();

  // Gran ceiba (árbol sagrado maya) dibujada una sola vez.
  function granCeiba() {
    return P.memo('granCeiba', () => {
      const [c, ctx] = P.lienzo(80, 96);
      const tr = '#9a978a', tr2 = '#6f6c60';
      // contrafuertes (raíces tabulares)
      P.triangulo(ctx, 40, 50, 12, 95, 34, 95, tr2);
      P.triangulo(ctx, 40, 50, 68, 95, 46, 95, tr2);
      P.rect(ctx, 32, 40, 16, 56, tr);
      P.rect(ctx, 32, 40, 4, 56, U.tono(tr, 0.2));
      P.rect(ctx, 44, 40, 4, 56, tr2);
      // espinas de la ceiba joven
      for (let y = 46; y < 90; y += 7) { P.px(ctx, 31, y, tr2); P.px(ctx, 48, y + 3, tr2); }
      // ramas horizontales y copa en capas
      P.rect(ctx, 8, 30, 64, 4, tr2);
      [[40, 22, 38, 16, '#2f7a35'], [24, 26, 18, 10, '#3f9a42'], [56, 26, 18, 10, '#3f9a42'], [40, 14, 26, 11, '#3f9a42'], [34, 10, 12, 6, '#5cbf55'], [58, 20, 8, 4, '#5cbf55']].forEach(([x, y, rx, ry, col]) => P.elipse(ctx, x, y, rx, ry, col));
      for (let i = 0; i < 20; i++) P.px(ctx, 6 + (i * 37) % 68, 6 + (i * 23) % 30, i % 3 ? '#8fe07a' : '#ffd166');
      return P.contorno(c, '#10240f');
    });
  }

  // Casa maya tradicional: paredes de bajareque (palos y barro) y techo de paja.
  function casaMaya() {
    return P.memo('casaMaya', () => {
      const [c, ctx] = P.lienzo(96, 72);
      // paredes
      P.rect(ctx, 10, 40, 76, 30, '#c9a46c');
      for (let x = 12; x < 86; x += 4) P.rect(ctx, x, 42, 1, 28, '#a8824e');
      P.rect(ctx, 10, 66, 76, 4, '#8a6a42');
      // puerta
      P.rect(ctx, 40, 48, 16, 22, '#2a1a10');
      P.rect(ctx, 40, 48, 16, 2, '#5a3a20');
      // techo de paja (forma redondeada)
      for (let y = 0; y < 46; y++) {
        const k = y / 46;
        const w = Math.round(14 + Math.sqrt(k) * 82);
        const x0 = Math.round(48 - w / 2);
        P.rect(ctx, x0, y, w, 1, y % 4 === 0 ? '#c99a3a' : '#e0b84f');
      }
      for (let i = 0; i < 26; i++) {
        const x = 8 + (i * 31) % 80, y = 10 + (i * 17) % 34;
        P.linea(ctx, x, y, x + 1, y + 6, '#a8862c');
      }
      P.rect(ctx, 4, 44, 88, 3, '#a8862c');
      P.rect(ctx, 40, 0, 16, 3, '#8a6a22');
      return P.contorno(c, '#2a1a10');
    });
  }

  class EscenaMapa {
    constructor(mapaId, op) {
      op = op || {};
      this.mapaId = mapaId;
      this.mundo = G.partida.mundo();
      this.def = this.mundo.mapas[mapaId];
      if (!this.def) throw new Error('No existe el mapa ' + mapaId);
      this.zona = this.mundo.zonas[this.def.zona] || { nombre: this.def.nombre };
      this.tema = this.def.tema || 'selva';
      this.t = 0;
      this.gracia = 0.4;     // tiempo sin activar salidas al llegar
      this.guiones = 0;      // eventos en curso (bloquean el control)
      this.dialogo = null;
      this.proyectiles = [];
      this.ambiente = [];
      this.cam = { x: 0, y: 0 };
      this.banner = op.sinBanner ? null : { texto: this.def.nombre, t: 0 };
      this.invulnerable = 0;
      this.cdHabilidad = 0;
      this.empuje = 0;
      this.colibri = { x: 0, y: 0 };
      this.cargar(op);
    }

    // ------------------------------ CARGA ------------------------------
    cargar(op) {
      const filas = this.def.filas;
      this.alto = filas.length;
      this.ancho = Math.max(...filas.map((f) => f.length));
      this.tiles = [];
      this.objetos = [];
      this.enemigos = [];
      const leyenda = Object.assign({}, this.mundo.leyendaBase || {}, this.def.leyenda || {});
      for (let y = 0; y < this.alto; y++) {
        const fila = [];
        for (let x = 0; x < this.ancho; x++) {
          let c = filas[y][x] || '#';
          const d = leyenda[c];
          if (d) {
            const piso = d.piso || this.def.suelo || '.';
            fila.push(piso);
            this.crearObjeto(d, x, y, c);
          } else fila.push(c);
        }
        this.tiles.push(fila);
      }
      // posición inicial
      const e = G.partida.e;
      const tx = op.x !== undefined ? op.x : e.x, ty = op.y !== undefined ? op.y : e.y;
      const dir = op.dir !== undefined ? op.dir : e.dir;
      this.lider = { x: tx * T + 8, y: ty * T + 14, dir, cuadro: 0, paso: 0 };
      this.seguidor = { x: this.lider.x - G.DIRS[dir].dx * 12, y: this.lider.y - G.DIRS[dir].dy * 12, dir, cuadro: 0, paso: 0 };
      this.rastro = [];
      this.colibri = { x: this.lider.x + 14, y: this.lider.y - 30 };
      this.centrarCamara(true);
    }

    crearObjeto(d, x, y, marca) {
      const id = d.id || `${this.mapaId}:${x},${y}`;
      if (d.tipo === 'enemigo') {
        if (vencidos.has(id)) return;
        if (d.bandera && !G.partida.bandera(d.bandera)) return;
        const cid = d.grupo[0];
        this.enemigos.push({
          id, def: d, criatura: G.mundos.criatura(cid), x: x * T + 8, y: y * T + 14, x0: x * T + 8, y0: y * T + 14,
          estado: 'vagar', t: Math.random() * 2, vx: 0, vy: 0, aturdido: 0, asustado: 0, ruta: d.ruta ? 0 : null
        });
        return;
      }
      const o = { id, tipo: d.tipo, def: d, x, y, px: x * T, py: y * T, marca };
      if (o.tipo === 'jefe' && G.partida.bandera(d.bandera)) return;
      if (o.tipo === 'luciernaga' && G.partida.abierto(id)) return;
      if (d.solo && !G.partida.bandera(d.solo)) return;      // aparece solo si se cumple una bandera
      if (d.hasta && G.partida.bandera(d.hasta)) return;     // desaparece cuando se cumple una bandera
      if (o.tipo === 'brasero') o.encendido = !!d.encendido || G.partida.abierto(id);
      if (o.tipo === 'diana') o.activa = false;
      this.objetos.push(o);
    }

    // ------------------------------ CONSULTAS ------------------------------
    tile(tx, ty) {
      if (tx < 0 || ty < 0 || tx >= this.ancho || ty >= this.alto) return '#';
      return this.tiles[ty][tx];
    }
    objetoEn(tx, ty, filtro) {
      return this.objetos.find((o) => o.x === tx && o.y === ty && (!filtro || filtro(o)));
    }
    abierto(o) {
      if (o.tipo === 'puerta' || o.tipo === 'barrera') return G.partida.abierto(o.id);
      if (o.tipo === 'guardian') return G.partida.abierto(o.id);
      return false;
    }
    objetoSolido(o) {
      if (!SOLIDOS.has(o.tipo)) return false;
      if ((o.tipo === 'puerta' || o.tipo === 'barrera' || o.tipo === 'guardian') && this.abierto(o)) return false;
      return true;
    }
    // ¿Se puede pisar esta loseta?
    solido(tx, ty, quien) {
      const c = this.tile(tx, ty);
      const vuela = quien && quien.vuela;
      if (L.BLOQUEA.has(c)) {
        if (vuela && (c === '~' || c === 'v')) return false;
        return true;
      }
      for (const o of this.objetos) {
        if (o.tipo === 'ceiba') {
          if (tx >= o.x - 1 && tx <= o.x + 1 && ty >= o.y - 1 && ty <= o.y) return true;
          continue;
        }
        if (o.tipo === 'casa') {
          if (tx >= o.x - 3 && tx <= o.x + 2 && ty >= o.y - 2 && ty <= o.y) return true;
          continue;
        }
        if (o.tipo === 'jefe') {
          const r = o.def.tam || 1;
          if (tx >= o.x - r + 1 && tx <= o.x + r - 1 && ty >= o.y - r + 1 && ty <= o.y) return true;
          continue;
        }
        if (o.x === tx && o.y === ty && this.objetoSolido(o)) return true;
      }
      if (quien && quien.enemigo && this.objetoEn(tx, ty, (o) => o.tipo === 'salida' || o.tipo === 'evento')) return true;
      return false;
    }
    libre(x, y, quien) {
      const x0 = Math.floor((x - 5) / T), x1 = Math.floor((x + 4) / T);
      const y0 = Math.floor((y - 6) / T), y1 = Math.floor((y - 1) / T);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.solido(tx, ty, quien)) return false;
      return true;
    }
    heroeLider() { return G.partida.heroeLider(); }
    heroeSeguidor() { const e = G.partida.e; return e.heroes[(e.lider + 1) % e.heroes.length]; }
    enControl() { return !this.dialogo && this.guiones === 0 && !G.motor.enTransicion(); }
    // La loseta que está justo delante del líder (la vecina en la dirección a la que mira).
    frente() {
      const d = G.DIRS[this.lider.dir];
      return [Math.floor(this.lider.x / T) + d.dx, Math.floor((this.lider.y - 3) / T) + d.dy];
    }

    // ------------------------------ CICLO ------------------------------
    entrar() {
      G.audio.musica(this.def.musica || this.zona.musica);
      G.partida.e.mapa = this.mapaId;
      this.guardarPosicion();
      G.partida.guardar();
      if (this.def.alEntrar) this.lanzarEvento(this.def.alEntrar);
    }
    alVolver(resultado) {
      if (resultado && this.esperandoCombate) {
        const fn = this.esperandoCombate;
        this.esperandoCombate = null;
        fn(resultado);
      }
      if (!this.esperandoCombate) G.audio.musica(this.def.musica || this.zona.musica);
    }
    alOcultar() { this.guardarPosicion(); G.partida.guardar(); }

    guardarPosicion() {
      const e = G.partida.e;
      e.mapa = this.mapaId;
      e.x = Math.floor(this.lider.x / T);
      e.y = Math.floor((this.lider.y - 4) / T);
      e.dir = this.lider.dir;
    }

    actualizar(dt) {
      this.t += dt;
      G.partida.e.tiempo += dt;
      this.gracia -= dt;
      this.invulnerable = Math.max(0, this.invulnerable - dt);
      this.cdHabilidad = Math.max(0, this.cdHabilidad - dt);
      if (this.banner) { this.banner.t += dt; if (this.banner.t > 3) this.banner = null; }

      if (this.dialogo) {
        this.dialogo.actualizar(dt);
        if (this.dialogo && this.dialogo.terminado) this.dialogo = null;
      } else if (this.enControl()) {
        this.controlar(dt);
      }
      this.actualizarSeguidor();
      this.actualizarColibri(dt);
      this.actualizarEnemigos(dt);
      this.actualizarProyectiles(dt);
      this.actualizarAmbiente(dt);
      this.revisarInterruptores();
      this.centrarCamara(false);
    }

    controlar(dt) {
      const E = G.entrada;
      if (E.presionado('pausa')) { this.abrirPausa(); return; }
      if (E.presionado('x')) { this.cambiarLider(); return; }
      if (E.presionado('b')) { this.habilidad(); }
      if (E.presionado('a') || this.toqueInteractuar()) { if (this.interactuar()) return; }

      let dx = 0, dy = 0;
      if (E.mantenido('izquierda')) dx -= 1;
      if (E.mantenido('derecha')) dx += 1;
      if (E.mantenido('arriba')) dy -= 1;
      if (E.mantenido('abajo')) dy += 1;
      const L0 = this.lider;
      if (dx || dy) {
        // dirección a la que mira
        if (dx && dy) { if (!((dx < 0 && L0.dir === 1) || (dx > 0 && L0.dir === 2) || (dy < 0 && L0.dir === 3) || (dy > 0 && L0.dir === 0))) L0.dir = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 1 : 2) : (dy < 0 ? 3 : 0); }
        else L0.dir = dx < 0 ? 1 : dx > 0 ? 2 : dy < 0 ? 3 : 0;
        const k = (dx && dy) ? Math.SQRT1_2 : 1;
        const mx = dx * VEL * k * dt, my = dy * VEL * k * dt;
        const antesX = L0.x, antesY = L0.y;
        // frente a un bloque no se desliza por las esquinas (así se puede empujar)
        const [fx, fy] = this.frente();
        const hayBloque = !(dx && dy) && this.objetoEn(fx, fy, (o) => o.tipo === 'bloque');
        this.moverConColision(L0, mx, my, hayBloque);
        const movio = Math.abs(L0.x - antesX) + Math.abs(L0.y - antesY) > 0.01;
        if (movio) {
          L0.paso += dt;
          L0.cuadro = 1 + Math.floor(L0.paso * 8) % 2;
          this.rastro.push({ x: L0.x, y: L0.y, dir: L0.dir });
          if (this.rastro.length > 40) this.rastro.shift();
        } else L0.cuadro = 0;
        // empujar bloques
        this.intentarEmpujar(dt, movio, dx, dy);
      } else {
        L0.cuadro = 0;
        this.empuje = 0;
      }
      this.pisar();
    }

    moverConColision(u, mx, my, sinDeslizar) {
      const quien = u.quien;
      if (mx) {
        if (this.libre(u.x + mx, u.y, quien)) u.x += mx;
        else if (!my && !sinDeslizar) {
          // deslizar en esquinas
          for (const s of [1, -1]) {
            for (let n = 1; n <= 7; n++) {
              if (this.libre(u.x + mx, u.y + s * n, quien) && this.libre(u.x, u.y + s * Math.min(n, 1), quien)) { u.y += s * Math.min(Math.abs(mx), 1); return; }
            }
          }
        }
      }
      if (my) {
        if (this.libre(u.x, u.y + my, quien)) u.y += my;
        else if (!mx && !sinDeslizar) {
          for (const s of [1, -1]) {
            for (let n = 1; n <= 7; n++) {
              if (this.libre(u.x + s * n, u.y + my, quien) && this.libre(u.x + s * Math.min(n, 1), u.y, quien)) { u.x += s * Math.min(Math.abs(my), 1); return; }
            }
          }
        }
      }
    }

    actualizarSeguidor() {
      const S = this.seguidor;
      const atras = 9;
      if (this.rastro.length > atras) {
        const p = this.rastro[this.rastro.length - 1 - atras];
        const mov = Math.hypot(p.x - S.x, p.y - S.y);
        if (mov > 0.2) { S.paso += 1 / 60; S.cuadro = 1 + Math.floor(S.paso * 8) % 2; } else S.cuadro = 0;
        S.x = p.x; S.y = p.y; S.dir = p.dir;
      }
      if (this.lider.cuadro === 0) S.cuadro = 0;
    }

    actualizarColibri(dt) {
      if (!G.partida.bandera('colibri')) return;
      const L0 = this.lider;
      const tx = L0.x + (L0.dir === 2 ? -16 : 16), ty = L0.y - 30 + Math.sin(this.t * 3) * 4;
      this.colibri.x += (tx - this.colibri.x) * Math.min(1, dt * 3);
      this.colibri.y += (ty - this.colibri.y) * Math.min(1, dt * 3);
      if (Math.random() < dt * 6) G.fx.emitir(this.colibri.x, this.colibri.y + 2, { n: 1, color: ['#7ef2c8', '#ffd166'], vel: 8, vida: 0.6, brillo: false });
    }

    centrarCamara(inmediato) {
      const W = this.ancho * T, H = this.alto * T;
      let cx = this.lider.x - G.ANCHO / 2, cy = this.lider.y - 12 - G.ALTO / 2;
      cx = W <= G.ANCHO ? (W - G.ANCHO) / 2 : U.limitar(cx, 0, W - G.ANCHO);
      cy = H <= G.ALTO ? (H - G.ALTO) / 2 : U.limitar(cy, 0, H - G.ALTO);
      if (inmediato) { this.cam.x = cx; this.cam.y = cy; }
      else { this.cam.x += (cx - this.cam.x) * 0.2; this.cam.y += (cy - this.cam.y) * 0.2; }
    }

    // Tocar la pantalla cerca del líder también sirve para interactuar.
    toqueInteractuar() {
      const tq = G.entrada.toque();
      if (!tq) return false;
      const [fx, fy] = this.frente();
      const sx = fx * T + 8 - this.cam.x, sy = fy * T + 8 - this.cam.y;
      if (Math.abs(tq.x - sx) < 20 && Math.abs(tq.y - sy) < 20) { G.entrada.consumirToque(); return true; }
      return false;
    }

    // ------------------------------ ACCIONES ------------------------------
    cambiarLider() {
      const h = G.partida.cambiarLider();
      // El que lidera aparece donde estaba el líder; el otro pasa a seguirlo.
      const L0 = this.lider;
      this.rastro = [];
      G.audio.efecto('colibri');
      G.fx.emitir(L0.x, L0.y - 12, { n: 14, color: [G.datos.HEROES[h.id].color, '#ffffff'], vel: 40, vida: 0.5 });
      G.ui.aviso(`Ahora lidera ${G.datos.HEROES[h.id].nombre}`, G.datos.HEROES[h.id].color);
    }

    habilidad() {
      if (this.cdHabilidad > 0) return;
      const h = this.heroeLider();
      const L0 = this.lider;
      if (h.id === 'hunahpu') {
        this.cdHabilidad = 0.45;
        const d = G.DIRS[L0.dir];
        G.audio.efecto('dardo');
        this.proyectiles.push({ x: L0.x + d.dx * 6, y: L0.y - 10 + d.dy * 4, dx: d.dx, dy: d.dy, recorrido: 0, fuego: false });
      } else {
        this.cdHabilidad = 1.6;
        G.audio.efecto('rugido');
        G.fx.temblor(2, 0.3);
        this.ondas = { x: L0.x, y: L0.y - 10, t: 0 };
        this.enemigos.forEach((e) => {
          if (U.distancia(e.x, e.y, L0.x, L0.y) < 80) { e.asustado = 3; e.estado = 'asustado'; }
        });
      }
    }

    actualizarProyectiles(dt) {
      if (this.ondas) { this.ondas.t += dt; if (this.ondas.t > 0.5) this.ondas = null; }
      for (let i = this.proyectiles.length - 1; i >= 0; i--) {
        const p = this.proyectiles[i];
        const v = 220 * dt;
        p.x += p.dx * v; p.y += p.dy * v; p.recorrido += v;
        const tx = Math.floor(p.x / T), ty = Math.floor(p.y / T);
        let fin = p.recorrido > 160;
        // atravesar fuego lo convierte en dardo de fuego
        if (this.tile(tx, ty) === 'F' || this.objetoEn(tx, ty, (o) => o.tipo === 'brasero' && o.encendido) || this.objetoEn(tx, ty, (o) => o.tipo === 'altar')) {
          if (!p.fuego) { p.fuego = true; G.audio.efecto('fuego'); }
        }
        const o = this.objetoEn(tx, ty);
        if (o && o.tipo === 'diana') { this.golpearDiana(o); fin = true; }
        else if (o && o.tipo === 'brasero') {
          if (!o.encendido && p.fuego) this.encenderBrasero(o);
          if (!o.encendido) fin = true;
        } else if (o && this.objetoSolido(o)) fin = true;
        const c = this.tile(tx, ty);
        if (L.BLOQUEA.has(c) && c !== '~' && c !== 'v' && c !== 'F') fin = true;
        // enemigos
        this.enemigos.forEach((e) => {
          if (!fin && Math.abs(e.x - p.x) < 9 && Math.abs(e.y - 8 - p.y) < 10) { e.aturdido = 3; e.estado = 'aturdido'; fin = true; G.audio.efecto('golpe'); G.fx.emitir(e.x, e.y - 8, { n: 8, color: ['#ffd166', '#ffffff'], vel: 40, vida: 0.4 }); }
        });
        if (p.fuego && Math.random() < 0.6) G.fx.emitir(p.x, p.y, { n: 1, color: ['#ff7a3d', '#ffd166'], vel: 10, vida: 0.3 });
        if (fin) {
          G.fx.emitir(p.x, p.y, { n: 5, color: ['#efe6d6'], vel: 30, vida: 0.25 });
          this.proyectiles.splice(i, 1);
        }
      }
    }

    golpearDiana(o) {
      if (o.activa) return;
      const grupo = this.objetos.filter((x) => x.tipo === 'diana' && x.def.grupo === o.def.grupo);
      if (o.def.orden) {
        const esperado = grupo.filter((x) => x.activa).length + 1;
        if (o.def.orden !== esperado) {
          grupo.forEach((x) => { x.activa = false; });
          G.audio.efecto('error');
          G.ui.aviso('Los cristales se apagan... el orden no era ese.', COL.rojo);
          return;
        }
      }
      o.activa = true;
      G.audio.efecto('cristal');
      G.fx.emitir(o.x * T + 8, o.y * T + 6, { n: 12, color: ['#3fd3a8', '#a6ffe4', '#ffffff'], vel: 50, vida: 0.5, brillo: true });
    }

    encenderBrasero(o) {
      o.encendido = true;
      G.partida.abrir(o.id);
      G.audio.efecto('fuego');
      G.fx.emitir(o.x * T + 8, o.y * T + 4, { n: 16, color: ['#ff7a3d', '#ffd166', '#fff3b0'], vel: 40, angulo: -Math.PI / 2, abanico: 1.2, vida: 0.6, brillo: true });
      if (o.def.alEncender) this.lanzarEvento(o.def.alEncender);
    }

    intentarEmpujar(dt, movio, dx, dy) {
      if (movio || (dx && dy)) { this.empuje = 0; return; }
      const [fx, fy] = this.frente();
      const b = this.objetoEn(fx, fy, (o) => o.tipo === 'bloque' && !o.moviendo);
      if (!b) { this.empuje = 0; return; }
      this.empuje += dt;
      if (this.empuje < 0.25) return;
      this.empuje = 0;
      if (this.heroeLider().id !== 'ixbalanque') {
        if (!this.avisoPesado || this.t - this.avisoPesado > 3) {
          this.avisoPesado = this.t;
          G.audio.efecto('error');
          G.ui.aviso('Muy pesado. Ixbalanqué sí podría moverlo (⇄).', COL.oro);
        }
        return;
      }
      const d = G.DIRS[this.lider.dir];
      const nx = b.x + d.dx, ny = b.y + d.dy;
      const c = this.tile(nx, ny);
      if (L.BLOQUEA.has(c) || this.objetoEn(nx, ny, (o) => SOLIDOS.has(o.tipo) && this.objetoSolido(o)) || this.objetoEn(nx, ny, (o) => o.tipo === 'salida')) {
        G.audio.efecto('error');
        return;
      }
      if (this.enemigos.some((e) => Math.floor(e.x / T) === nx && Math.floor((e.y - 4) / T) === ny)) return;
      b.x = nx; b.y = ny;
      b.moviendo = 0.2;
      G.audio.efecto('empujar');
      G.fx.emitir(b.px + 8, b.py + 14, { n: 6, color: ['#a89c88', '#7a6e5e'], vel: 20, vida: 0.4 });
    }

    // Lo que pasa al pisar una loseta.
    pisar() {
      const tx = Math.floor(this.lider.x / T), ty = Math.floor((this.lider.y - 3) / T);
      if (this.gracia > 0) return;
      // acercarse a un jefe inicia su encuentro
      const jefe = this.objetos.find((o) => o.tipo === 'jefe' && U.distancia(o.x * T + 8, o.y * T + 8, this.lider.x, this.lider.y) < (o.def.radio || 44));
      if (jefe) { this.iniciarJefe(jefe); return; }
      const o = this.objetoEn(tx, ty, (x) => x.tipo === 'salida' || x.tipo === 'evento' || x.tipo === 'luciernaga');
      if (!o) return;
      if (o.tipo === 'salida') this.usarSalida(o);
      else if (o.tipo === 'luciernaga') {
        G.partida.abrir(o.id);
        G.partida.darEspecial('luciernagas');
        this.objetos.splice(this.objetos.indexOf(o), 1);
        G.audio.efecto('llave');
        G.fx.emitir(tx * T + 8, ty * T + 8, { n: 16, color: ['#e9ff70', '#ffffff'], vel: 40, vida: 0.8, brillo: true });
        G.ui.aviso(`Luciérnaga (${G.partida.especial('luciernagas')}/${this.def.luciernagas || 3}): tu luz crece`, '#e9ff70');
        if (o.def.evento) this.lanzarEvento(o.def.evento);
      } else if (o.tipo === 'evento') {
        const id = o.def.evento;
        const clave = 'ev:' + (o.def.id || id);
        if (o.def.una !== false && G.partida.bandera(clave)) return;
        if (o.def.requiere && !G.partida.bandera(o.def.requiere)) return;
        if (o.def.una !== false) G.partida.poner(clave);
        this.lanzarEvento(id);
      }
    }

    usarSalida(o) {
      const d = o.def;
      if (d.requiere && !G.partida.bandera(d.requiere)) {
        this.gracia = 1;
        this.empujarAtras();
        this.decir(d.mensaje || ['Todavía no puedes pasar por aquí.']);
        return;
      }
      this.irA(d.a, d.x, d.y, d.dir);
    }
    empujarAtras() {
      const d = G.DIRS[this.lider.dir];
      this.lider.x -= d.dx * 6; this.lider.y -= d.dy * 6;
    }

    irA(mapa, x, y, dir) {
      if (this.saliendo) return;
      this.saliendo = true;
      const e = G.partida.e;
      e.mapa = mapa; e.x = x; e.y = y; e.dir = dir === undefined ? this.lider.dir : dir;
      G.audio.efecto('puerta');
      G.motor.cambiar(new EscenaMapa(mapa), { estilo: 'rombos', color: '#0d0618', dur: 0.35 });
    }

    interactuar() {
      const [fx, fy] = this.frente();
      let o = this.objetoEn(fx, fy, (x) => x.tipo !== 'salida' && x.tipo !== 'evento' && x.tipo !== 'luciernaga' && x.tipo !== 'placa');
      if (!o) {
        // objetos grandes (ceiba, jefe)
        o = this.objetos.find((x) => (x.tipo === 'ceiba' || x.tipo === 'npc') && Math.abs(x.x - fx) <= (x.tipo === 'ceiba' ? 1 : 0) && fy >= x.y - 1 && fy <= x.y);
      }
      if (!o) return false;
      const d = o.def;
      switch (o.tipo) {
        case 'cofre': return this.abrirCofre(o);
        case 'puerta': return this.abrirPuerta(o);
        case 'npc': case 'estela': case 'ceiba':
          if (d.evento) this.lanzarEvento(d.evento);
          else this.decir(this.resolverDialogo(d.dialogo, d));
          return true;
        case 'altar': this.descansar(o); return true;
        case 'pilaHuesos':
          if (G.partida.abierto(o.id)) { this.decir(['Ya no quedan huesos aquí.']); return true; }
          G.partida.abrir(o.id);
          G.partida.darEspecial('huesos');
          G.audio.efecto('llave');
          G.ui.aviso(`Tomaste un hueso (tienes ${G.partida.especial('huesos')})`, '#efe6d6');
          G.partida.guardar();
          return true;
        case 'guardian':
          if (this.abierto(o)) return false;
          if (G.partida.especial('huesos') > 0) {
            G.partida.e.especiales.huesos--;
            G.partida.abrir(o.id);
            G.audio.efecto('rugido');
            this.decir([{ quien: 'Ixbalanqué', retrato: 'ixbalanque', texto: 'Toma, hermano jaguar. Roe este hueso y déjanos pasar.' }, 'El jaguar toma el hueso y se echa a un lado, tranquilo.']);
            G.partida.guardar();
            if (d.evento) this.lanzarEvento(d.evento);
          } else {
            G.audio.efecto('rugido');
            this.decir(d.dialogo ? this.resolverDialogo(d.dialogo, d) : ['El jaguar gruñe y no se mueve. Parece hambriento...']);
          }
          return true;
        case 'diana':
          this.decir([o.activa ? 'El cristal brilla con luz de jade.' : (d.texto || 'Un cristal apagado. Quizás un dardo de cerbatana lo despierte.')]);
          return true;
        case 'brasero':
          this.decir([o.encendido ? 'El brasero arde con fuerza.' : (d.texto || 'Un brasero apagado. Un dardo que atraviese el fuego podría encenderlo.')]);
          return true;
        case 'bloque':
          return false;
        case 'jefe':
          this.iniciarJefe(o);
          return true;
        default: return false;
      }
    }

    resolverDialogo(id, d) {
      if (Array.isArray(id)) return id;
      const fuente = this.mundo.dialogos[id];
      if (!fuente) return [d && d.texto ? d.texto : '...'];
      return typeof fuente === 'function' ? fuente(G.partida, this) : fuente;
    }

    decir(lineas) {
      return new Promise((res) => {
        this.dialogo = new G.ui.Dialogo(lineas, () => { this.dialogo = null; res(); });
      });
    }

    abrirCofre(o) {
      if (G.partida.abierto(o.id)) { this.decir(['El cofre está vacío.']); return true; }
      const c = o.def.contenido || {};
      G.partida.abrir(o.id);
      G.audio.efecto('cofre');
      G.fx.emitir(o.x * T + 8, o.y * T + 6, { n: 18, color: ['#ffd166', '#ffffff', '#7ef2c8'], vel: 50, angulo: -Math.PI / 2, abanico: 1.4, vida: 0.7, brillo: true });
      const zona = this.def.zona;
      let texto = '';
      if (c.llave) { G.partida.darLlave(zona); texto = '¡Encontraste una *llave*! Abre una puerta de esta zona.'; G.audio.efecto('llave'); }
      else if (c.llaveJefe) { G.partida.darLlaveJefe(zona); texto = '¡Encontraste la *llave del guardián*! Abre la gran puerta roja.'; }
      else if (c.mapa) { G.partida.darMapa(zona); texto = '¡Encontraste el *mapa* de esta zona! Míralo en el menú de pausa.'; }
      else if (c.especial) { G.partida.darEspecial(c.especial, c.n || 1); texto = `Obtuviste: *${c.nombre || c.especial}*.`; }
      else if (c.objeto) {
        G.partida.dar(c.objeto, c.n || 1);
        const ob = G.datos.OBJETOS[c.objeto];
        texto = `Obtuviste: *${ob.nombre}*${(c.n || 1) > 1 ? ' x' + c.n : ''}. ${ob.desc}`;
      }
      this.mostrarObjeto = { icono: c.llave ? 'llave' : c.llaveJefe ? 'llaveJefe' : c.mapa ? 'mapa' : (c.icono || c.objeto || 'cofre'), x: o.x * T + 2, y: o.y * T - 12, t: 0 };
      this.decir([texto]).then(() => {
        this.mostrarObjeto = null;
        if (o.def.evento) this.lanzarEvento(o.def.evento);
      });
      G.partida.guardar();
      return true;
    }

    abrirPuerta(o) {
      if (this.abierto(o)) return false;
      const d = o.def, zona = this.def.zona;
      if (d.clase === 'jefe') {
        if (!G.partida.tieneLlaveJefe(zona)) { G.audio.efecto('error'); this.decir(['Una gran puerta roja con el rostro de un señor de Xibalbá. Necesitas la *llave del guardián*.']); return true; }
      } else if (d.clase === 'sello') {
        const n = G.partida.especial('sellos');
        if (n < (d.requiere || 3)) { G.audio.efecto('error'); this.decir([`La puerta tiene ${d.requiere || 3} huecos con forma de sello. Tienes ${n}. Supera las pruebas de las casas.`]); return true; }
      } else if (d.clase === 'especial') {
        const n = G.partida.especial(d.especial);
        if (n < d.requiere) { G.audio.efecto('error'); this.decir([d.mensaje || `Necesitas ${d.requiere}.`]); return true; }
      } else if (!G.partida.usarLlave(zona)) {
        G.audio.efecto('error');
        this.decir(['La puerta está cerrada con llave.']);
        return true;
      }
      G.partida.abrir(o.id);
      G.audio.efecto('puerta');
      G.fx.temblor(2, 0.3);
      G.fx.emitir(o.x * T + 8, o.y * T + 8, { n: 14, color: ['#a89c88', '#ffd166'], vel: 40, vida: 0.5 });
      G.partida.guardar();
      return true;
    }

    descansar(o) {
      G.partida.curarTodo();
      vencidos.clear();
      G.partida.e.ultimoAltar = { mapa: this.mapaId, x: o.x, y: o.y + 1 };
      this.guardarPosicion();
      G.partida.guardar();
      G.audio.efecto('guardar');
      G.fx.destello('#7ef2c8', 0.4);
      G.fx.emitir(this.lider.x, this.lider.y - 12, { n: 24, color: ['#7ef2c8', '#ffffff'], vel: 30, angulo: -Math.PI / 2, abanico: 2, vida: 1, brillo: true });
      this.decir([{ texto: 'El humo del copal llena el aire. Los gemelos descansan y recuperan toda su vida y energía. *Partida guardada.*' }]);
    }

    // Interruptores: placas (con bloque o el líder encima), dianas y braseros.
    revisarInterruptores() {
      const tx = Math.floor(this.lider.x / T), ty = Math.floor((this.lider.y - 3) / T);
      this.objetos.forEach((o) => {
        if (o.tipo === 'placa') {
          const antes = o.activa;
          o.activa = !!this.objetoEn(o.x, o.y, (b) => b.tipo === 'bloque') || (o.x === tx && o.y === ty);
          if (o.activa && !antes) G.audio.efecto('interruptor');
        }
        if (o.tipo === 'bloque' && o.moviendo) {
          o.moviendo = Math.max(0, o.moviendo - 1 / 60);
        }
        if (o.tipo === 'bloque') { o.px += (o.x * T - o.px) * 0.35; o.py += (o.y * T - o.py) * 0.35; }
      });
      this.objetos.forEach((o) => {
        if (o.tipo !== 'barrera' || G.partida.abierto(o.id)) return;
        const g = o.def.grupo;
        const piezas = this.objetos.filter((x) => x !== o && x.def.grupo === g && (x.tipo === 'placa' || x.tipo === 'diana' || x.tipo === 'brasero'));
        if (!piezas.length) return;
        const ok = piezas.every((x) => (x.tipo === 'brasero' ? x.encendido : x.activa));
        if (ok) {
          this.objetos.filter((x) => x.tipo === 'barrera' && x.def.grupo === g).forEach((b) => G.partida.abrir(b.id));
          piezas.filter((x) => x.tipo === 'diana').forEach((x) => G.partida.abrir(x.id));
          G.audio.efecto('puerta');
          G.audio.efecto('cofre');
          G.fx.temblor(3, 0.4);
          G.ui.aviso(o.def.mensaje || '¡Se abrió un pasaje!', '#7ef2c8');
          G.partida.guardar();
        }
      });
      // las dianas resueltas quedan encendidas
      this.objetos.forEach((o) => { if (o.tipo === 'diana' && G.partida.abierto(o.id)) o.activa = true; });
    }

    // ------------------------------ ENEMIGOS ------------------------------
    actualizarEnemigos(dt) {
      const L0 = this.lider;
      for (const e of this.enemigos) {
        e.t += dt;
        const vuela = !!e.criatura.volador;
        const quien = { vuela, enemigo: true };
        if (e.aturdido > 0) { e.aturdido -= dt; if (e.aturdido <= 0) e.estado = 'vagar'; continue; }
        if (!this.enControl() && !this.dialogo) continue;
        if (this.dialogo) continue;
        const dist = U.distancia(e.x, e.y, L0.x, L0.y);
        const velBase = Math.min(56, 30 + e.criatura.vel * 1.2);
        let vx = 0, vy = 0;
        if (e.asustado > 0) {
          e.asustado -= dt;
          const a = Math.atan2(e.y - L0.y, e.x - L0.x);
          vx = Math.cos(a) * 50; vy = Math.sin(a) * 50;
          if (e.asustado <= 0) e.estado = 'vagar';
        } else if (e.def.ruta) {
          // patrulla fija (ruta en losetas)
          const ruta = e.def.ruta;
          const obj = ruta[e.ruta];
          const ox = obj[0] * T + 8, oy = obj[1] * T + 14;
          const d = Math.hypot(ox - e.x, oy - e.y);
          if (d < 2) e.ruta = (e.ruta + 1) % ruta.length;
          else { vx = (ox - e.x) / d * (e.def.velocidad || 50); vy = (oy - e.y) / d * (e.def.velocidad || 50); }
        } else if (dist < (e.def.vision || 76) && this.invulnerable <= 0) {
          e.estado = 'perseguir';
          vx = (L0.x - e.x) / dist * velBase; vy = (L0.y - e.y) / dist * velBase;
          if (vuela) { vx += Math.sin(e.t * 6) * 20; vy += Math.cos(e.t * 5) * 20; }
        } else {
          e.estado = 'vagar';
          if (e.t > (e.cambio || 0)) {
            e.cambio = e.t + 0.8 + Math.random() * 1.5;
            const lejos = Math.hypot(e.x - e.x0, e.y - e.y0) > 48;
            if (lejos) { const a = Math.atan2(e.y0 - e.y, e.x0 - e.x); e.vx = Math.cos(a) * 22; e.vy = Math.sin(a) * 22; }
            else if (Math.random() < 0.35) { e.vx = 0; e.vy = 0; }
            else { const a = Math.random() * Math.PI * 2; e.vx = Math.cos(a) * 22; e.vy = Math.sin(a) * 22; }
          }
          vx = e.vx; vy = e.vy;
        }
        e.u = e.u || { x: e.x, y: e.y, quien };
        e.u.x = e.x; e.u.y = e.y; e.u.quien = quien;
        if (e.def.ruta) { e.x += vx * dt; e.y += vy * dt; }
        else { this.moverConColision(e.u, vx * dt, vy * dt); e.x = e.u.x; e.y = e.u.y; }
        if (Math.abs(vx) > 1) e.mira = vx < 0 ? -1 : 1;
        // ¡contacto!
        if (this.invulnerable <= 0 && this.enControl() && Math.abs(e.x - L0.x) < 12 && Math.abs(e.y - L0.y) < 12) {
          this.iniciarCombate(e);
          return;
        }
      }
    }

    iniciarCombate(e) {
      G.audio.efecto('encuentro');
      G.fx.destello('#ffffff', 0.25);
      G.fx.temblor(3, 0.3);
      this.guiones++;
      this.guardarPosicion();
      const grupo = e.def.grupo;
      this.esperandoCombate = (res) => {
        this.guiones--;
        if (res === 'victoria') {
          vencidos.add(e.id);
          this.enemigos.splice(this.enemigos.indexOf(e), 1);
          this.invulnerable = 0.6;
          G.partida.guardar();
        } else if (res === 'huida') {
          e.aturdido = 2.5;
          e.estado = 'aturdido';
          this.invulnerable = 2;
        } else if (res === 'derrota') {
          this.gameOver();
        }
      };
      G.motor.apilar(new G.EscenaCombate({ grupo, fondo: this.def.fondoCombate || this.tema, sinHuir: e.def.sinHuir }), { fundido: true, estilo: 'rombos', color: '#ffffff', dur: 0.3 });
    }

    // Combate como parte de un evento (jefes): devuelve una promesa con el resultado.
    combate(op) {
      return new Promise((res) => {
        this.guiones++;
        this.esperandoCombate = (r) => {
          this.guiones--;
          if (r === 'derrota') { this.gameOver(); return; }
          res(r);
        };
        G.motor.apilar(new G.EscenaCombate(Object.assign({ fondo: this.def.fondoCombate || this.tema }, op)), { fundido: true, estilo: 'rombos', color: '#ff2a6d', dur: 0.4 });
      });
    }

    iniciarJefe(o) {
      if (this.jefeEnCurso) return;
      this.jefeEnCurso = true;
      this.lanzarEvento(o.def.evento).then(() => { this.jefeEnCurso = false; });
    }

    gameOver() {
      G.motor.cambiar(new G.EscenaDerrota(), { dur: 0.8 });
    }

    // ------------------------------ EVENTOS ------------------------------
    // Corre un "guion" del mundo (por ejemplo, una conversación con el jefe).
    lanzarEvento(id) {
      const fn = this.mundo.eventos && this.mundo.eventos[id];
      if (!fn) return Promise.resolve();
      this.guiones++;
      const fin = () => { this.guiones = Math.max(0, this.guiones - 1); };
      let p;
      try { p = Promise.resolve(fn(this, G.partida)); } catch (err) { fin(); G.errores.push(String(err.stack || err)); return Promise.resolve(); }
      return p.then(fin, (err) => { fin(); G.errores.push(String(err && err.stack || err)); });
    }
    // Herramientas para los guiones:
    esperar(seg) { return new Promise((res) => { this.temporizadores = this.temporizadores || []; setTimeout(res, seg * 1000 / ((G.debug && G.debug.velocidad) || 1)); }); }
    comic(id) {
      return new Promise((res) => {
        G.motor.apilar(new G.EscenaComic(id, () => { G.motor.quitar({ fundido: true }); res(); }), { fundido: true });
      });
    }
    teletransportar(x, y, dir) {
      this.lider.x = x * T + 8; this.lider.y = y * T + 14;
      if (dir !== undefined) this.lider.dir = dir;
      this.seguidor.x = this.lider.x; this.seguidor.y = this.lider.y;
      this.rastro = [];
      this.gracia = 0.5;
      this.centrarCamara(true);
    }
    // Hace aparecer los objetos de una letra del mapa (por ejemplo, un portal tras vencer a un jefe).
    aparecer(marca) {
      const ley = Object.assign({}, this.mundo.leyendaBase || {}, this.def.leyenda || {});
      this.def.filas.forEach((f, y) => {
        for (let x = 0; x < f.length; x++) {
          if (f[x] === marca && ley[marca] && !this.objetos.some((o) => o.x === x && o.y === y && o.marca === marca)) this.crearObjeto(ley[marca], x, y, marca);
        }
      });
    }
    quitarObjeto(o) { const i = this.objetos.indexOf(o); if (i >= 0) this.objetos.splice(i, 1); }
    buscar(filtro) { return this.objetos.find(filtro); }

    abrirPausa() {
      this.guardarPosicion();
      G.motor.apilar(new G.EscenaPausa(this));
    }

    // ------------------------------ AMBIENTE ------------------------------
    actualizarAmbiente(dt) {
      const tipos = [].concat(this.def.particulas || []);
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      if (tipo && this.ambiente.length < (tipo === 'luciernagas' ? 22 : 30) && Math.random() < dt * 14) {
        const x = this.cam.x + Math.random() * G.ANCHO, y = this.cam.y + Math.random() * G.ALTO;
        const a = { x, y, t: 0, vida: 4 + Math.random() * 4, tipo, fase: Math.random() * 6 };
        if (tipo === 'hojas') { a.y = this.cam.y - 4; a.vida = 8; }
        this.ambiente.push(a);
      }
      for (let i = this.ambiente.length - 1; i >= 0; i--) {
        const a = this.ambiente[i];
        a.t += dt;
        if (a.tipo === 'luciernagas') { a.x += Math.sin(a.t + a.fase) * 8 * dt; a.y += Math.cos(a.t * 0.7 + a.fase) * 6 * dt; }
        else if (a.tipo === 'hojas') { a.x += (14 + Math.sin(a.t * 2 + a.fase) * 16) * dt; a.y += 16 * dt; }
        else { a.y -= 10 * dt; a.x += Math.sin(a.t * 2 + a.fase) * 6 * dt; }
        if (a.t > a.vida) this.ambiente.splice(i, 1);
      }
    }

    // ------------------------------ DIBUJO ------------------------------
    dibujar(ctx) {
      const cx = Math.round(this.cam.x), cy = Math.round(this.cam.y);
      ctx.fillStyle = this.tema === 'selva' ? '#1d3a1f' : '#05020a';
      ctx.fillRect(0, 0, G.ANCHO, G.ALTO);
      const x0 = Math.max(0, Math.floor(cx / T) - 1), x1 = Math.min(this.ancho - 1, Math.floor((cx + G.ANCHO) / T) + 1);
      const y0 = Math.max(0, Math.floor(cy / T) - 1), y1 = Math.min(this.alto - 1, Math.floor((cy + G.ALTO) / T) + 2);
      const fAgua = Math.floor(this.t * 4) % 4;
      const fViento = Math.floor(this.t * 2.5);
      const altas = [];
      // 1) suelo
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const c = this.tiles[y][x];
          const v = Math.floor(U.ruido(x, y, 3) * 8);
          const sx = x * T - cx, sy = y * T - cy;
          let img;
          switch (c) {
            case ',': img = L.pastoAlto(this.tema, v, (fViento + x) % 4); break;
            case '"': img = L.flores(this.tema, v, Math.floor(this.t * 2) + x); break;
            case ':': img = L.camino(this.tema, v % 4); break;
            case '~': case 'w': {
              let b = 0;
              const esAgua = (tx, ty) => { const k = this.tile(tx, ty); return k === '~' || k === 'w' || k === '='; };
              if (!esAgua(x, y - 1)) b |= 1; if (!esAgua(x, y + 1)) b |= 2; if (!esAgua(x - 1, y)) b |= 4; if (!esAgua(x + 1, y)) b |= 8;
              img = L.agua(this.tema, (fAgua + x) % 4, b, c === 'w');
              break;
            }
            case '=': img = L.puente(this.tema, this.tile(x, y - 1) === '=' || this.tile(x, y + 1) === '=' || (this.tile(x - 1, y) === '~' && this.tile(x + 1, y) === '~')); break;
            case '#': {
              const abajo = this.tile(x, y + 1);
              img = L.muro(this.tema, abajo !== '#', v);
              break;
            }
            case 'v': img = L.abismo(this.tema, this.tile(x, y - 1) !== 'v'); break;
            case 'h': img = L.huesos(this.tema, v); break;
            default: img = L.suelo(this.tema, v % 6);
          }
          ctx.drawImage(img, sx, sy);
          if (L.ALTAS.has(c)) altas.push({ y: y * T + 15, tipo: 'tile', c, x, ty: y, v });
        }
      }
      // 2) objetos planos
      this.objetos.forEach((o) => {
        const sx = o.x * T - cx, sy = o.y * T - cy;
        if (sx < -32 || sy < -32 || sx > G.ANCHO + 32 || sy > G.ALTO + 32) return;
        if (o.tipo === 'placa') ctx.drawImage(L.placa(o.activa), sx, sy);
        else if (o.tipo === 'camino') { ctx.globalAlpha = 0.55; ctx.fillStyle = o.def.color; ctx.fillRect(sx + 1, sy + 1, 14, 14); ctx.globalAlpha = 1; }
        else if (o.tipo === 'salida') this.dibujarSalida(ctx, o, sx, sy);
        else if (o.tipo === 'evento') { /* invisible */ }
        else if ((o.tipo === 'puerta' || o.tipo === 'barrera') && this.abierto(o)) ctx.drawImage(L.suelo(this.tema, 0), sx, sy);
        else if (o.tipo === 'puerta') ctx.drawImage(L.puerta(this.tema, o.def.clase || 'llave'), sx, sy);
        else if (o.tipo === 'barrera') ctx.drawImage(L.puerta(this.tema, 'barrera'), sx, sy);
        else altas.push({ y: o.y * T + 15, tipo: 'obj', o });
      });
      // 3) personajes y cosas altas ordenadas por profundidad
      this.enemigos.forEach((e) => altas.push({ y: e.y, tipo: 'enemigo', e }));
      const ids = [this.heroeLider().id, this.heroeSeguidor().id];
      altas.push({ y: this.seguidor.y - 0.5, tipo: 'heroe', u: this.seguidor, id: ids[1] });
      altas.push({ y: this.lider.y, tipo: 'heroe', u: this.lider, id: ids[0], lider: true });
      altas.sort((a, b) => a.y - b.y);
      altas.forEach((a) => this.dibujarAlta(ctx, a, cx, cy));
      // 4) dardos, ondas, partículas
      this.proyectiles.forEach((p) => {
        const x = p.x - cx, y = p.y - cy;
        P.linea(ctx, x, y, x - p.dx * 6, y - p.dy * 6, p.fuego ? '#ff7a3d' : '#efe6d6', 1);
        if (p.fuego) P.brillo(ctx, x, y, 8, '#ff7a3d', 0.6);
      });
      if (this.ondas) {
        ctx.save(); ctx.strokeStyle = '#e0a43a'; ctx.globalAlpha = 1 - this.ondas.t / 0.5;
        ctx.beginPath(); ctx.arc(this.ondas.x - cx, this.ondas.y - cy, 10 + this.ondas.t * 140, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      G.fx.dibujarParticulas(ctx, cx, cy);
      this.dibujarAmbiente(ctx, cx, cy);
      // 5) oscuridad y luces
      this.dibujarOscuridad(ctx, cx, cy);
      // colibrí guía (brilla incluso en la oscuridad)
      if (G.partida.bandera('colibri')) {
        const img = G.arte.colibri(Math.floor(this.t * 12), this.lider.dir !== 2);
        P.brillo(ctx, this.colibri.x - cx, this.colibri.y - cy, 14, '#3fd3a8', 0.45);
        ctx.drawImage(img, Math.round(this.colibri.x - cx - 6), Math.round(this.colibri.y - cy - 4));
      }
      if (this.mostrarObjeto) {
        const m = this.mostrarObjeto;
        m.t += 1 / 60;
        P.brillo(ctx, m.x - cx + 6, m.y - cy + 6, 16, '#ffd166', 0.5);
        ctx.drawImage(G.arte.icono(m.icono), Math.round(m.x - cx), Math.round(m.y - cy - Math.min(8, m.t * 30)));
      }
      G.fx.dibujarFlotantes(ctx, cx, cy);
      this.dibujarHUD(ctx);
      if (this.dialogo) this.dialogo.dibujar(ctx);
    }

    dibujarSalida(ctx, o, sx, sy) {
      const a = o.def.aspecto || 'escalera';
      if (a === 'escalera') ctx.drawImage(L.escalera(this.tema, o.def.baja !== false), sx, sy);
      else if (a === 'cueva') {
        ctx.fillStyle = '#05020a';
        P.elipse(ctx, sx + 8, sy + 10, 8, 7, '#05020a');
        ctx.fillRect(sx, sy + 10, 16, 6);
        P.brillo(ctx, sx + 8, sy + 10, 12, '#7b2cbf', 0.3);
      } else if (a === 'portal') {
        ctx.fillStyle = '#05020a'; ctx.fillRect(sx + 2, sy, 12, 16);
        P.brillo(ctx, sx + 8, sy + 8, 14, this.tema === 'selva' ? '#ffd166' : '#ff2a6d', 0.35 + Math.sin(this.t * 3) * 0.1);
      } else if (a === 'camino') {
        // salida por el borde del mapa: flechitas en el suelo
        const k = Math.floor(this.t * 2) % 2;
        ctx.globalAlpha = 0.5;
        G.fuente.texto(ctx, '·', sx + 7, sy + 5 + k, '#fff3b0');
        ctx.globalAlpha = 1;
      }
    }

    dibujarAlta(ctx, a, cx, cy) {
      if (a.tipo === 'tile') {
        const sx = a.x * T - cx, sy = a.ty * T - cy;
        const c = a.c;
        if (c === 'T') ctx.drawImage(L.arbol(this.tema, a.v, Math.floor(this.t * 1.5 + a.x * 0.3)), sx - 4, sy - 16);
        else if (c === 'r') ctx.drawImage(L.roca(this.tema, a.v), sx, sy);
        else if (c === 'b') ctx.drawImage(L.arbusto(this.tema, a.v, Math.floor(this.t * 2 + a.x)), sx, sy);
        else if (c === 'n') ctx.drawImage(L.cristal(this.tema, a.v, Math.floor(this.t * 3)), sx, sy - 8);
        else if (c === 'F') ctx.drawImage(L.fuego(Math.floor(this.t * 8), true), sx, sy - 8);
        return;
      }
      if (a.tipo === 'heroe') {
        const u = a.u;
        const parpadeo = this.invulnerable > 0 && a.lider && Math.floor(this.t * 20) % 2 === 0;
        if (parpadeo) return;
        P.elipse(ctx, Math.round(u.x - cx), Math.round(u.y - cy), 5, 2, 'rgba(0,0,0,0.25)');
        ctx.drawImage(G.arte.personaje(a.id, u.dir, u.cuadro), Math.round(u.x - cx - 8), Math.round(u.y - cy - 24));
        return;
      }
      if (a.tipo === 'enemigo') {
        const e = a.e;
        const img = G.arte.criatura(e.criatura.id, Math.floor(this.t * (e.criatura.volador ? 8 : 4)));
        if (!img) return;
        let dib = img;
        if (e.mira === 1) dib = P.memo('esp:' + e.criatura.id + ':' + Math.floor(this.t * (e.criatura.volador ? 8 : 4)) % 2, () => P.espejo(img));
        const esc = img.width > 30 ? 0.75 : 1;
        const w = Math.round(img.width * esc), h = Math.round(img.height * esc);
        const flota = e.criatura.volador ? Math.round(Math.sin(this.t * 4 + e.x0) * 2) - 6 : 0;
        P.elipse(ctx, Math.round(e.x - cx), Math.round(e.y - cy), 5, 2, 'rgba(0,0,0,0.3)');
        if (this.def.oscuridad > 0.3) P.brillo(ctx, e.x - cx, e.y - cy - 8, 14, '#ff2a6d', 0.25);
        ctx.drawImage(dib, Math.round(e.x - cx - w / 2), Math.round(e.y - cy - h + flota), w, h);
        if (e.estado === 'aturdido') G.fuente.texto(ctx, '★', e.x - cx + Math.sin(this.t * 8) * 5, e.y - cy - h - 6 + flota, '#ffd166', { alinear: 'centro' });
        else if (e.estado === 'perseguir') G.fuente.texto(ctx, '!', e.x - cx, e.y - cy - h - 8 + flota, '#ff5d73', { alinear: 'centro', borde: '#1a0f1f' });
        return;
      }
      const o = a.o;
      const sx = o.x * T - cx, sy = o.y * T - cy;
      switch (o.tipo) {
        case 'cofre': ctx.drawImage(L.cofre(G.partida.abierto(o.id), o.def.contenido && o.def.contenido.llaveJefe), sx, sy); break;
        case 'bloque': ctx.drawImage(L.bloque(this.tema), Math.round(o.px - cx), Math.round(o.py - cy)); break;
        case 'diana': ctx.drawImage(L.diana(o.activa, Math.floor(this.t * 4)), sx, sy - 4); break;
        case 'brasero': ctx.drawImage(L.fuego(Math.floor(this.t * 8), o.encendido, o.def.color), sx, sy - 8); break;
        case 'altar': ctx.drawImage(L.altar(Math.floor(this.t * 6)), sx, sy - 8); break;
        case 'estela': ctx.drawImage(L.estela(this.tema), sx, sy - 8); break;
        case 'pilaHuesos': ctx.drawImage(L.pilaHuesos(G.partida.abierto(o.id)), sx, sy); break;
        case 'ceiba': ctx.drawImage(granCeiba(), sx - 32, sy - 80); break;
        case 'casa': ctx.drawImage(casaMaya(), sx - 40, sy - 56); break;
        case 'luciernaga': {
          const yy = sy + 6 + Math.sin(this.t * 3 + o.x) * 2;
          P.brillo(ctx, sx + 8, yy, 10, '#e9ff70', 0.6);
          ctx.drawImage(G.arte.icono('luciernaga'), sx + 2, yy - 3);
          break;
        }
        case 'guardian': {
          if (this.abierto(o)) {
            // el jaguar se echa a un lado, tranquilo
            const img = G.arte.criatura(o.def.criatura || 'jaguarObsidiana', 0);
            ctx.globalAlpha = 0.9;
            ctx.drawImage(img, sx + 12, sy - 4, img.width * 0.7, img.height * 0.7);
            ctx.globalAlpha = 1;
          } else {
            const img = G.arte.criatura(o.def.criatura || 'jaguarObsidiana', Math.floor(this.t * 2));
            ctx.drawImage(img, sx - 7, sy - 6);
          }
          break;
        }
        case 'npc': {
          const p = o.def.personaje;
          if (p === 'alux') {
            const img = G.arte.alux(Math.floor(this.t * 2));
            P.brillo(ctx, sx + 8, sy + 8, 14, '#8fe07a', 0.3);
            ctx.drawImage(img, sx + 2, sy + 2 + Math.round(Math.sin(this.t * 2) * 1));
          } else {
            const dirNpc = this.dialogo && U.distancia(this.lider.x, this.lider.y, sx + cx + 8, sy + cy + 14) < 30 ? this.dirHacia(o) : 0;
            ctx.drawImage(G.arte.personaje(p, dirNpc, 0), sx, sy - 9);
          }
          break;
        }
        case 'jefe': {
          const img = G.arte.criatura(o.def.criatura, Math.floor(this.t * 3));
          if (!img) break;
          const esc = o.def.escalaMapa || 1;
          const w = img.width * esc, h = img.height * esc;
          P.brillo(ctx, sx + 8, sy - h / 2 + 12, w * 0.6, o.def.aura || '#ff2a6d', 0.25 + Math.sin(this.t * 2) * 0.08);
          ctx.drawImage(img, Math.round(sx + 8 - w / 2), Math.round(sy + 16 - h), w, h);
          if (o.def.compania) {
            const img2 = G.arte.criatura(o.def.compania, Math.floor(this.t * 3) + 1);
            ctx.drawImage(img2, Math.round(sx + 8 - w / 2 - img2.width - 4), Math.round(sy + 16 - img2.height * esc), img2.width * esc, img2.height * esc);
          }
          break;
        }
        default: break;
      }
      // indicador "A" sobre lo que puedes usar
      if (this.enControl() && VERBOS[o.tipo]) {
        const [fx, fy] = this.frente();
        if (fx === o.x && fy === o.y && !(o.tipo === 'cofre' && G.partida.abierto(o.id)) && !(o.tipo === 'guardian' && this.abierto(o)) && o.tipo !== 'bloque') {
          G.fuente.texto(ctx, 'A', sx + 8, sy - 18 + Math.sin(this.t * 6) * 2, '#ffd166', { alinear: 'centro', borde: '#1a0f1f' });
          this.verbo = VERBOS[o.tipo];
        }
      }
    }

    dirHacia(o) {
      const dx = this.lider.x - (o.x * T + 8), dy = this.lider.y - (o.y * T + 14);
      if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? 1 : 2;
      return dy < 0 ? 3 : 0;
    }

    dibujarAmbiente(ctx, cx, cy) {
      this.ambiente.forEach((a) => {
        const x = a.x - cx, y = a.y - cy;
        const vida = Math.min(1, a.t / 0.5, (a.vida - a.t) / 0.8);
        if (a.tipo === 'luciernagas') {
          const brillo = (0.5 + Math.sin(this.t * 3 + a.fase) * 0.5) * vida;
          if (brillo > 0.25) { P.brillo(ctx, x, y, 6, '#e9ff70', 0.6 * brillo); P.px(ctx, x, y, '#fffbd0'); }
        } else if (a.tipo === 'hojas') {
          ctx.globalAlpha = vida;
          P.rect(ctx, x, y, 2, 1, Math.floor(a.fase * 10) % 2 ? '#8fe07a' : '#d9b44a');
          P.px(ctx, x + (Math.floor(a.t * 4) % 2), y + 1, '#5cbf55');
          ctx.globalAlpha = 1;
        } else {
          const col = a.tipo === 'brasas' ? '#ff8a4c' : (Math.floor(a.fase) % 2 ? '#05d9e8' : '#ff2a6d');
          P.brillo(ctx, x, y, 5, col, 0.5 * vida);
          P.px(ctx, x, y, col);
        }
      });
      // rayos de luz entre las hojas (selva de día)
      if (this.def.rayos) {
        ctx.save();
        ctx.globalAlpha = 0.07 + Math.sin(this.t * 0.5) * 0.02;
        ctx.fillStyle = '#fff3b0';
        for (let i = 0; i < 4; i++) {
          const x = ((i * 130 - cx * 0.3) % (G.ANCHO + 200)) - 60;
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x - 50, G.ALTO); ctx.lineTo(x - 80, G.ALTO); ctx.fill();
        }
        ctx.restore();
      }
    }

    luces(cx, cy) {
      const l = [];
      const radioBase = (this.def.luz || 64) + G.partida.especial('luciernagas') * (this.def.luzPorLuciernaga || 0);
      l.push([this.lider.x - cx, this.lider.y - 12 - cy, radioBase]);
      if (G.partida.bandera('colibri')) l.push([this.colibri.x - cx, this.colibri.y - cy, 26]);
      const enVista = (x, y) => x > -60 && y > -60 && x < G.ANCHO + 60 && y < G.ALTO + 60;
      for (let y = Math.max(0, Math.floor(cy / T) - 3); y < Math.min(this.alto, Math.floor((cy + G.ALTO) / T) + 3); y++) {
        for (let x = Math.max(0, Math.floor(cx / T) - 3); x < Math.min(this.ancho, Math.floor((cx + G.ANCHO) / T) + 3); x++) {
          const c = this.tiles[y][x];
          if (c === 'F') l.push([x * T + 8 - cx, y * T - cy, 54 + Math.sin(this.t * 9 + x) * 3, '#ff8a4c']);
          else if (c === 'n') l.push([x * T + 8 - cx, y * T - cy, 40, '#05d9e8']);
          else if (c === '"' && this.tema !== 'selva') l.push([x * T + 8 - cx, y * T + 8 - cy, 18]);
        }
      }
      this.objetos.forEach((o) => {
        const x = o.x * T + 8 - cx, y = o.y * T - cy;
        if (!enVista(x, y)) return;
        if (o.tipo === 'brasero' && o.encendido) l.push([x, y, (o.def.radio || 64) + Math.sin(this.t * 9 + o.x) * 3, '#ff8a4c']);
        if (o.tipo === 'altar') l.push([x, y, 46, '#3fd3a8']);
        if (o.tipo === 'luciernaga') l.push([x, y + 6, 24, '#e9ff70']);
        if (o.tipo === 'diana') l.push([x, y + 4, o.activa ? 34 : 20, o.activa ? '#3fd3a8' : '#ff2a6d']);
        if (o.tipo === 'salida' && (o.def.aspecto === 'portal')) l.push([x, y + 8, 30]);
      });
      this.proyectiles.forEach((p) => { if (p.fuego) l.push([p.x - cx, p.y - cy, 30, '#ff8a4c']); });
      return l;
    }

    dibujarOscuridad(ctx, cx, cy) {
      const osc = this.def.oscuridad || 0;
      if (osc <= 0) return;
      if (!this.capaOscura) this.capaOscura = G.util.crearLienzo(G.ANCHO, G.ALTO);
      const [c, x] = this.capaOscura;
      x.globalCompositeOperation = 'source-over';
      x.clearRect(0, 0, G.ANCHO, G.ALTO);
      x.fillStyle = `rgba(5,2,12,${osc})`;
      x.fillRect(0, 0, G.ANCHO, G.ALTO);
      x.globalCompositeOperation = 'destination-out';
      const luces = this.luces(cx, cy);
      luces.forEach(([lx, ly, r]) => {
        const g = x.createRadialGradient(lx, ly, r * 0.15, lx, ly, r);
        g.addColorStop(0, 'rgba(0,0,0,1)');
        g.addColorStop(0.6, 'rgba(0,0,0,0.7)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g;
        x.fillRect(lx - r, ly - r, r * 2, r * 2);
      });
      ctx.drawImage(c, 0, 0);
      // brillos de colores (neón y fuego) encima de la oscuridad
      luces.forEach(([lx, ly, r, col]) => { if (col) P.brillo(ctx, lx, ly, r * 0.5, col, 0.18); });
    }

    dibujarHUD(ctx) {
      // vida de los gemelos
      const hs = [this.heroeLider(), this.heroeSeguidor()];
      G.ui.ventana(ctx, 4, 4, 108, 32, { alfa: 0.8 });
      hs.forEach((h, i) => {
        const s = G.reglas.stats(h);
        const y = 8 + i * 13;
        ctx.drawImage(G.arte.retrato(h.id), 0, 0, 22, 22, 8, y - 1, 11, 11);
        G.fuente.texto(ctx, String(h.vida), 22, y, h.vida < s.vida * 0.3 ? COL.rojo : COL.texto, { sombra: COL.sombra });
        G.ui.barra(ctx, 46, y + 3, 50, 3, h.vida, s.vida, h.vida < s.vida * 0.3 ? '#ff5d73' : '#7ef2c8');
        if (i === 0) G.fuente.texto(ctx, '★', 99, y, COL.oro);
      });
      // llaves de la zona
      const llaves = G.partida.llaves(this.def.zona);
      let yy = 40;
      if (llaves > 0 || G.partida.tieneLlaveJefe(this.def.zona)) {
        G.ui.ventana(ctx, 4, yy, 52, 15, { alfa: 0.8 });
        ctx.drawImage(G.arte.icono('llave'), 8, yy + 2);
        G.fuente.texto(ctx, 'x' + llaves, 20, yy + 3, COL.texto);
        if (G.partida.tieneLlaveJefe(this.def.zona)) ctx.drawImage(G.arte.icono('llaveJefe'), 38, yy + 2);
        yy += 18;
      }
      if (this.def.luciernagas) {
        G.ui.ventana(ctx, 4, yy, 52, 15, { alfa: 0.8 });
        ctx.drawImage(G.arte.icono('luciernaga'), 8, yy + 4);
        G.fuente.texto(ctx, `${G.partida.especial('luciernagas')}/${this.def.luciernagas}`, 22, yy + 3, '#e9ff70');
        yy += 18;
      }
      if (G.partida.especial('huesos') > 0 && this.def.zona === 'casa') {
        G.ui.ventana(ctx, 4, yy, 52, 15, { alfa: 0.8 });
        ctx.drawImage(G.arte.icono('hueso'), 8, yy + 4);
        G.fuente.texto(ctx, 'x' + G.partida.especial('huesos'), 24, yy + 3, COL.texto);
      }
      // ayuda de botones
      if (this.enControl()) {
        const h = this.heroeLider();
        const tactil = G.entrada.usaTactil();
        const hab = h.id === 'hunahpu' ? 'Cerbatana' : 'Rugido';
        const txt = (tactil ? 'B ' : 'X ') + hab + ' · ' + (tactil ? '⇄' : 'C') + ' Cambiar';
        ctx.globalAlpha = 0.75;
        G.fuente.texto(ctx, txt, G.ANCHO / 2, G.ALTO - 12, COL.texto, { alinear: 'centro', sombra: COL.sombra });
        ctx.globalAlpha = 1;
        if (this.verbo) {
          G.fuente.texto(ctx, (tactil ? 'A ' : 'Z ') + this.verbo, G.ANCHO / 2, G.ALTO - 24, COL.oro, { alinear: 'centro', borde: COL.sombra });
        }
      }
      this.verbo = null;
      // nombre del lugar al entrar
      if (this.banner) {
        const b = this.banner;
        const a = Math.min(1, b.t / 0.3) * Math.min(1, (3 - b.t) / 0.5);
        ctx.globalAlpha = Math.max(0, a);
        const w = G.fuente.ancho(b.texto, 2) + 40;
        G.ui.ventana(ctx, (G.ANCHO - w) / 2, 40, w, 30, { borde: COL.oro });
        G.fuente.texto(ctx, b.texto, G.ANCHO / 2, 46, COL.oro, { alinear: 'centro', escala: 2, sombra: COL.sombra });
        ctx.globalAlpha = 1;
      }
    }
  }

  EscenaMapa.vencidos = vencidos;
  G.EscenaMapa = EscenaMapa;
})();
