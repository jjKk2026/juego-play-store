/* =====================================================================
   ROBOT DE PRUEBA (Gemelos del Sol 2): juega la aventura completa.
   Camina por los mapas (buscando el camino), habla, abre cofres, empuja
   bloques, dispara la cerbatana y pelea con los 5 comandos: purifica a
   los jefes, resiste el duelo, rompe el Sello Oscuro sin herir a su
   hermano y usa la Técnica Gemela contra el Avatar.
   Lo usa tests/partida-completa.mjs. No es parte del juego.
   ===================================================================== */
'use strict';

(function () {
  const T = 16;
  const DIR = { abajo: 0, izquierda: 1, derecha: 2, arriba: 3 };
  const NOMBRE_DIR = ['abajo', 'izquierda', 'derecha', 'arriba'];

  // ------------------------------ GUION ------------------------------
  // ir: caminar a una loseta · usar: mirar hacia un lado y presionar A
  // disparar: mirar y presionar B · lider: cambiar de líder · empujar: empujar un bloque
  const G_ = (x, y) => ({ ir: [x, y] });
  const usar = (x, y, dir) => [{ ir: [x, y] }, { mirar: dir }, { a: true }];
  const disparar = (x, y, dir) => [{ ir: [x, y] }, { mirar: dir }, { b: true }, { esperar: 1 }];
  const PLAN = [
    { mapa: 'selva', log: 'Selva: hablar con la abuela' },
    ...usar(13, 24, 'izquierda'),
    { cond: () => G.partida.bandera('abuela'), log: 'La abuela dio los objetos' },
    G_(21, 9), G_(21, 7),
    { mapa: 'templo', log: 'Capítulo 1: raíces de la ceiba' },
    ...usar(14, 28, 'arriba'),
    ...usar(34, 30, 'arriba'),
    { cond: () => G.partida.llaves('selva') >= 1, log: 'Llave pequeña' },
    ...usar(19, 26, 'arriba'),
    G_(13, 21),
    { empujar: 'derecha', hasta: [23, 21], log: 'Hunahpú empuja el bloque sobre la placa' },
    { cond: () => G.partida.abierto('templo:19,16'), log: 'Reja abierta' },
    ...disparar(6, 20, 'izquierda'),
    { cond: () => G.partida.abierto('templo:5,16'), log: 'Cristal despierto' },
    ...usar(5, 12, 'arriba'),
    { cond: () => G.partida.tieneLlaveJefe('selva'), log: 'Llave del guardián' },
    ...usar(15, 13, 'arriba'),
    ...usar(23, 13, 'arriba'),
    ...usar(19, 10, 'arriba'),
    { minNivel: 4 },
    G_(19, 7),
    { cond: () => G.partida.bandera('vucubVencido') && G.partida.espiritus().includes('guacamaya'), log: '¡Vucub Caquix purificado: Espíritu de la Guacamaya!', foto: 'jefe1' },
    { cond: () => G.partida.especial('chispa') > 0, log: 'Chispa de luz' },
    G_(19, 8),
    { mapa: 'selva' },
    { cond: () => G.partida.bandera('duelo'), espera: 60, log: 'Duelo contra el hermano poseído superado', foto: 'duelo' },
    G_(42, 8), G_(43, 8),
    { mapa: 'cuevas', log: 'Capítulo 2: Cuevas de Xibalbá' },
    G_(6, 14), G_(18, 17),
    { cond: () => G.partida.bandera('caminoNegro'), log: 'El camino negro habló' },
    G_(30, 17),
    ...usar(33, 4, 'arriba'),
    { cond: () => G.partida.tieneReliquia('cacaoAncestral'), log: 'Reliquia 1: Cacao Ancestral' },
    ...usar(37, 27, 'arriba'),
    { minNivel: 7 },
    G_(38, 28),
    { cond: () => G.partida.espiritus().includes('murcielago') && G.partida.tieneReliquia('copalPuro'), log: '¡Camazotz purificado! Reliquia 2: Copal Puro', foto: 'jefe2' },
    G_(40, 28), G_(40, 29),
    { mapa: 'canon', log: 'Cañón de Meauán' },
    ...disparar(18, 36, 'arriba'),
    ...disparar(16, 34, 'derecha'),
    ...disparar(20, 34, 'izquierda'),
    { cond: () => G.partida.abierto('canon:18,30'), log: 'Braseros encendidos' },
    ...usar(35, 21, 'arriba'),
    ...disparar(22, 24, 'derecha'),
    ...disparar(14, 21, 'arriba'),
    ...disparar(13, 24, 'izquierda'),
    { cond: () => G.partida.abierto('canon:10,24'), log: 'Cristales en orden del sol' },
    G_(5, 26),
    { empujar: 'arriba', hasta: [5, 21] },
    G_(6, 21),
    { empujar: 'izquierda', hasta: [3, 21] },
    G_(7, 21),
    { cond: () => G.partida.abierto('canon:5,18'), log: 'Placas presionadas' },
    ...usar(3, 13, 'arriba'),
    ...usar(7, 13, 'arriba'),
    { cond: () => G.partida.tieneLlaveJefe('cuevas'), log: 'Llave del guardián del cañón' },
    ...usar(18, 19, 'arriba'),
    ...usar(13, 12, 'arriba'),
    ...usar(23, 12, 'arriba'),
    ...usar(18, 10, 'arriba'),
    { minNivel: 9 },
    G_(18, 7),
    { cond: () => G.partida.espiritus().includes('montana') && G.partida.reliquias() === 3, log: '¡Zipacná purificado! Reliquia 3: Jade Sagrado', foto: 'jefe3' },
    G_(18, 8),
    { mapa: 'palacio', log: 'Casa de los Señores' },
    ...usar(19, 18, 'arriba'),
    ...usar(16, 3, 'arriba'),
    G_(16, 1), G_(16, 0),
    { mapa: 'trono', log: 'Sala del trono' },
    ...usar(4, 15, 'izquierda'),
    { minNivel: 12 },
    G_(12, 7),
    { creditos: true, log: '¡Sello roto, Avatar vencido! Créditos', foto: 'final' }
  ];

  const R = {
    i: 0, t: 0, tPaso: 0, soltar: [], log: [], fotos: [], terminado: false, error: null,
    derrotas: 0, combates: 0, precisos: 0, ruta: null, atascado: 0, ultimaPos: null, subidas: 0,
    nivelesJefes: [],

    registrar(m) { this.log.push(`[${Math.round(G.partida.e ? G.partida.e.tiempo : 0)}s] ${m}`); },
    pulsar(b) { G.entrada.simular(b, true); this.soltar.push(b); },
    soltarTodo() { G.entrada.BOTONES.forEach((b) => G.entrada.simular(b, false)); },
    mantener(b) { ['arriba', 'abajo', 'izquierda', 'derecha'].forEach((d) => G.entrada.simular(d, d === b)); },

    tick(dt) {
      if (this.terminado) return;
      this.t += dt;
      // soltar lo que se presionó el paso anterior (para que cuente como "presionado")
      if (this.soltar.length) { this.soltar.forEach((b) => G.entrada.simular(b, false)); this.soltar = []; return; }
      const esc = G.motor.escena();
      if (!esc || G.motor.enTransicion()) return;
      try {
        if (esc instanceof G.EscenaTitulo) return this.titulo(esc);
        if (esc instanceof G.EscenaNombre) return this.nombres(esc);
        if (esc instanceof G.EscenaComic) { this.soltarTodo(); return this.pulsar('a'); }
        if (esc instanceof G.EscenaCombate) return this.combate(esc);
        if (esc instanceof G.EscenaDerrota) return this.derrota(esc);
        if (esc instanceof G.EscenaCreditos) {
          // al llegar a los créditos, el plan termina (el jefe final se activa al acercarse)
          this.i = PLAN.findIndex((x) => x.creditos);
          this.avanzar();
          return;
        }
        if (esc instanceof G.EscenaMapa) return this.mapa(esc, dt);
        // cualquier otra escena (pausa, opciones): salir
        this.pulsar('b');
      } catch (e) { this.error = String(e.stack || e); this.terminado = true; }
    },

    titulo(esc) {
      if (this.empezo) { this.error = 'Volvió a la pantalla de título sin querer'; this.terminado = true; return; }
      if (esc.fase === 'inicio') return this.pulsar('a');
      if (esc.confirmar) { esc.confirmar.sel = 1; return this.pulsar('a'); }
      esc.menu.sel = 1; // Nueva partida
      this.pulsar('a');
      if (!esc.confirmar && esc.fase === 'menu') this.empezo = true;
    },

    // Pantalla de nombres: el primer gemelo se llama "Kin" (escrito con el teclado
    // de letras de la pantalla) y el segundo se deja con "Omitir" (nombre por defecto).
    nombres(esc) {
      if (esc.terminado) return;
      if (esc.paso === 0) {
        const objetivo = 'Kin';
        if (esc.texto === objetivo) { esc.fila = 3; esc.col = 5; return this.pulsar('a'); }
        const c = objetivo[esc.texto.length];
        const filas = esc.filas();
        const j = filas.findIndex((f) => f.includes(c));
        if (j < 0) { esc.mayus = !esc.mayus; return; }
        esc.fila = j; esc.col = filas[j].indexOf(c);
        return this.pulsar('a');
      }
      esc.fila = 3; esc.col = 4; // Omitir
      this.pulsar('a');
    },

    derrota(esc) {
      if (esc.t < 1.6) return;
      this.derrotas++;
      this.registrar('Derrota #' + this.derrotas + ' — se reintenta');
      esc.menu.sel = 0;
      this.pulsar('a');
      // cada dos derrotas, la prueba sube un nivel (se aplica al volver al mapa)
      if (this.derrotas % 2 === 0) this.nivelMinimo = (this.nivelMinimo || 1) + 1;
    },

    avanzar() {
      const p = PLAN[this.i];
      if (p && p.log) this.registrar('✔ ' + p.log);
      if (p && p.foto) this.fotos.push(p.foto);
      this.i++;
      this.tPaso = 0;
      this.ruta = null;
      this.mapaDelPaso = undefined;
      this.mantener(null); // suelta las flechas (A/B/X se sueltan solos en el siguiente paso)
      if (this.i >= PLAN.length) { this.terminado = true; this.registrar('PLAN COMPLETO'); }
    },

    // ------------------------------ MAPA ------------------------------
    mapa(esc, dt) {
      if (esc.dialogo) { this.soltarTodo(); return this.pulsar('a'); }
      if (!esc.enControl()) { this.soltarTodo(); return; }
      const p = PLAN[this.i];
      if (!p) return;
      // mantener el nivel mínimo de la prueba (también después de recargar la partida)
      const nMin = Math.min(...G.partida.equipo().map((h) => h.nivel));
      if (this.nivelMinimo && nMin < this.nivelMinimo) { G.debug.subirNivel(this.nivelMinimo - nMin); this.subidas += this.nivelMinimo - nMin; }
      // si un paso de caminar nos llevó a otro mapa (por una salida), ya se cumplió
      if (this.mapaDelPaso === undefined) this.mapaDelPaso = esc.mapaId;
      if (p.ir && esc.mapaId !== this.mapaDelPaso) return this.avanzar();
      this.tPaso += dt;
      if (this.tPaso > 90) throw new Error(`Atascado en el paso ${this.i}: ${JSON.stringify(p)} en ${esc.mapaId} (${this.pos(esc)})`);
      if (p.mapa) { if (esc.mapaId === p.mapa) this.avanzar(); return; }
      if (p.cond) { if (p.cond()) this.avanzar(); else if (this.tPaso > (p.espera || 6)) throw new Error('No se cumplió: ' + (p.log || p.cond)); return; }
      if (p.esperar) { if (this.tPaso >= p.esperar) this.avanzar(); return; }
      if (p.minNivel) {
        const n = Math.min(...G.partida.equipo().map((h) => h.nivel));
        this.nivelesJefes.push(n);
        this.registrar(`Nivel antes del jefe: ${G.partida.equipo().map((h) => h.nivel).join('/')}`);
        if (n < p.minNivel) this.registrar(`(se sube a ${p.minNivel} para la prueba)`);
        this.nivelMinimo = Math.max(this.nivelMinimo || 1, p.minNivel);
        return this.avanzar();
      }
      if (p.mirar !== undefined) {
        const d = DIR[p.mirar];
        if (esc.lider.dir === d) { this.soltarTodo(); return this.avanzar(); }
        this.pulsar(p.mirar);
        return;
      }
      if (p.a) { if (window.ROBOT_DEBUG) this.registrar('A en ' + this.pos(esc) + ' frente ' + esc.frente() + ' dir ' + esc.lider.dir + ' xy ' + Math.round(esc.lider.x) + ',' + Math.round(esc.lider.y)); this.pulsar('a'); return this.avanzar(); }
      if (p.b) { this.pulsar('b'); return this.avanzar(); }
      if (p.ir) return this.caminar(esc, p.ir[0], p.ir[1], dt);
      if (p.empujar) {
        const [hx, hy] = p.hasta;
        if (esc.objetoEn(hx, hy, (o) => o.tipo === 'bloque')) { this.soltarTodo(); return this.avanzar(); }
        // si un enemigo se para delante del bloque, se pelea con él (como haría un jugador)
        if (this.tPaso > 4 && Math.floor(this.tPaso) !== Math.floor(this.tPaso - dt)) {
          const b = esc.objetos.filter((o) => o.tipo === 'bloque').sort((x, y) => Math.hypot(x.x - hx, x.y - hy) - Math.hypot(y.x - hx, y.y - hy))[0];
          const e = b && esc.enemigos.find((en) => Math.hypot(en.x - (b.x * T + 8), en.y - (b.y * T + 8)) < 48);
          if (window.ROBOT_DEBUG || this.tPaso > 20) this.registrar(`empujando: bloque en ${b && [b.x, b.y]}, yo en ${this.pos(esc)}, enemigo cerca: ${!!e}`);
          if (e) { this.registrar('Un enemigo estorba el bloque: ¡a pelear!'); esc.iniciarCombate(e); return; }
        }
        this.mantener(p.empujar);
        return;
      }
      if (p.creditos) { this.soltarTodo(); return; }
    },

    pos(esc) { return [Math.floor(esc.lider.x / T), Math.floor((esc.lider.y - 3) / T)]; },

    // Busca el camino más corto (sin atravesar paredes ni objetos).
    buscarRuta(esc, ox, oy, tx, ty) {
      const clave = (x, y) => y * 1000 + x;
      const previo = new Map([[clave(ox, oy), null]]);
      const cola = [[ox, oy]];
      while (cola.length) {
        const [x, y] = cola.shift();
        if (x === tx && y === ty) break;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (previo.has(clave(nx, ny))) continue;
          if (!(nx === tx && ny === ty) && esc.solido(nx, ny)) continue;
          if (nx === tx && ny === ty && esc.solido(nx, ny)) continue;
          // no pisar salidas ni eventos que no sean el destino
          if (!(nx === tx && ny === ty) && esc.objetoEn(nx, ny, (o) => o.tipo === 'salida')) continue;
          previo.set(clave(nx, ny), [x, y]);
          cola.push([nx, ny]);
        }
      }
      if (!previo.has(clave(tx, ty))) return null;
      const ruta = [];
      let c = [tx, ty];
      while (c) { ruta.unshift(c); c = previo.get(clave(c[0], c[1])); }
      return ruta;
    },

    caminar(esc, tx, ty, dt) {
      const [px, py] = this.pos(esc);
      if (px === tx && py === ty) {
        // centrarse un poco en la loseta antes de seguir
        const cx = tx * T + 8, cy = ty * T + 13;
        const ex = cx - esc.lider.x, ey = cy - esc.lider.y;
        if (Math.abs(ex) <= 3 && Math.abs(ey) <= 3) { this.soltarTodo(); return this.avanzar(); }
        this.mantener(Math.abs(ex) > Math.abs(ey) ? (ex > 0 ? 'derecha' : 'izquierda') : (ey > 0 ? 'abajo' : 'arriba'));
        return;
      }
      if (!this.ruta || this.tRuta > 1.2) {
        this.ruta = this.buscarRuta(esc, px, py, tx, ty);
        this.tRuta = 0;
        if (!this.ruta) { this.soltarTodo(); if (this.tPaso > 8) throw new Error(`Sin camino de (${px},${py}) a (${tx},${ty}) en ${esc.mapaId}`); return; }
      }
      this.tRuta += dt;
      // siguiente loseta del camino
      let k = this.ruta.findIndex(([x, y]) => x === px && y === py);
      const sig = this.ruta[Math.min(this.ruta.length - 1, k + 1)] || this.ruta[this.ruta.length - 1];
      const cx = sig[0] * T + 8, cy = sig[1] * T + 13;
      const ex = cx - esc.lider.x, ey = cy - esc.lider.y;
      // moverse por un eje a la vez, alineándose primero
      let dir;
      if (sig[0] !== px) dir = Math.abs(ey) > 3 ? (ey > 0 ? 'abajo' : 'arriba') : (ex > 0 ? 'derecha' : 'izquierda');
      else dir = Math.abs(ex) > 3 ? (ex > 0 ? 'derecha' : 'izquierda') : (ey > 0 ? 'abajo' : 'arriba');
      this.mantener(dir);
      // detectar atascos (por ejemplo, un enemigo que estorba)
      const ahora = esc.lider.x * 1000 + esc.lider.y;
      if (ahora === this.ultimaPos) this.atascado += dt; else this.atascado = 0;
      this.ultimaPos = ahora;
      if (this.atascado > 0.6) { this.ruta = null; this.atascado = 0; this.mantener(NOMBRE_DIR[Math.floor(Math.random() * 4)]); }
    },

    // ------------------------------ COMBATE ------------------------------
    combate(esc) {
      this.soltarTodo();
      if (esc.mensajes) return this.pulsar('a');
      // golpe preciso: presionar A cuando el anillo coincide
      if (esc.anillo && !esc.anillo.presionado) {
        const r = esc.radioAnillo();
        if (r >= 9 && r <= 14) { this.precisos++; this.pulsar('a'); }
        return;
      }
      const m = esc.menu;
      if (!m || m.respuesta) return;
      if (!esc._contado) { esc._contado = true; this.combates++; }
      const accion = elegir(esc.s, m.heroe);
      if (accion.tipo === 'espiritu' && accion.modo === 'purificar') this.purificaciones = (this.purificaciones || 0) + 1;
      m.respuesta = accion;
      m.actualizar = () => accion;   // el menú "elige" esta acción
    }
  };

  // Jugador automático (igual al del simulador de balance).
  function elegir(s, h) {
    const o = s.opciones(h);
    const vivosE = s.enemigos.filter((e) => e.vivo);
    const sello = vivosE.find((e) => e.sello !== null);
    const debil = vivosE.find((e) => e.estado === 'debilitado');
    const pur = o.espiritu.find((x) => x.modo === 'purificar' && x.puede);
    if (debil && pur) return { tipo: 'espiritu', modo: 'purificar', objetivo: debil };
    const herido = s.heroes.filter((x) => x.vivo).find((x) => x.vida < x.vidaMax * 0.4);
    const caido = s.heroes.find((x) => !x.vivo);
    if (caido && (s.inventario.pluma || 0) > 0) return { tipo: 'objeto', id: 'pluma', objetivo: caido };
    const cura = o.magia.find((m) => m.id === 'aguaLuna' && m.puede);
    if (herido && cura) return { tipo: 'magia', id: 'aguaLuna', objetivo: herido };
    if (herido && (s.inventario.cacao || 0) > 0) return { tipo: 'objeto', id: 'cacao', objetivo: herido };
    if (sello) {
      if (pur) return { tipo: 'espiritu', modo: 'purificar', objetivo: sello };
      if ((s.inventario.reliquiaLuz || 0) > 0) return { tipo: 'objeto', id: 'reliquiaLuz', objetivo: sello };
      const inv = o.espiritu.find((x) => x.modo === 'invocar' && x.puede && x.id === 'guacamaya');
      if (inv && h.vida < h.vidaMax * 0.7) return { tipo: 'espiritu', modo: 'invocar', id: inv.id };
      return { tipo: 'defender' };
    }
    if (s.modo === 'duelo') {
      if ((s.inventario.chispa || 0) > 0 && s.turnosHeroe >= 2) return { tipo: 'objeto', id: 'chispa' };
      return { tipo: 'defender' };
    }
    const gem = o.espiritu.find((x) => x.modo === 'gemela' && x.puede);
    if (gem) return { tipo: 'espiritu', modo: 'gemela', id: 'tecnicaGemela', objetivo: vivosE };
    const lim = o.espiritu.find((x) => x.modo === 'limite' && x.puede);
    const objetivo = vivosE.filter((e) => e.estado === 'normal').sort((a, b) => a.vida - b.vida)[0] || vivosE[0];
    if (!objetivo) return { tipo: 'defender' };
    // con dos héroes, guarda el límite para la técnica gemela
    const otro = s.heroes.find((x) => x !== h && x.vivo);
    const inv = o.espiritu.find((x) => x.modo === 'invocar' && x.puede);
    if (inv && !otro) return { tipo: 'espiritu', modo: 'invocar', id: inv.id };
    if (lim && !otro) return { tipo: 'espiritu', modo: 'limite', objetivo: lim.objetivo === 'enemigos' ? vivosE : objetivo };
    if (h.pe < 5 && (s.inventario.jade || 0) > 0 && s.enemigos.some((e) => e.jefe)) return { tipo: 'objeto', id: 'jade', objetivo: h };
    const magia = o.magia.filter((m) => m.puede && m.objetivo !== 'aliado' && m.objetivo !== 'aliados').map((m) => [m, G.datos.MAGIAS[m.id]])
      .filter(([, d]) => (d.objetivo === 'enemigos' && vivosE.length > 1) || (d.elemento || []).some((x) => (objetivo.debil || []).includes(x)))
      .sort((a, b) => b[1].potencia - a[1].potencia)[0];
    if (magia) return { tipo: 'magia', id: magia[0].id, objetivo: magia[1].objetivo === 'enemigos' ? vivosE : objetivo };
    return { tipo: 'atacar', objetivo: objetivo };
  }

  window.ROBOT = R;
  G.debug.antesDePaso = (dt) => R.tick(dt);
})();
