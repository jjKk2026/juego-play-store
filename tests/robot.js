/* =====================================================================
   ROBOT DE PRUEBA: juega la aventura completa de principio a fin.
   Camina por los mapas (buscando el camino), habla, abre cofres, empuja
   bloques, dispara la cerbatana, entrega huesos, pelea en los combates
   (incluido el golpe preciso) y ve todas las escenas.
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
  const disparar = (x, y, dir) => [{ lider: 'hunahpu' }, { ir: [x, y] }, { mirar: dir }, { b: true }, { esperar: 1 }];
  const PLAN = [
    { mapa: 'selva', log: 'Selva: hablar con la abuela' },
    ...usar(13, 24, 'izquierda'),
    { cond: () => G.partida.bandera('abuela'), log: 'La abuela dio los objetos' },
    G_(21, 9), G_(21, 7),
    { mapa: 'templo', log: 'Templo de la ceiba' },
    ...usar(14, 28, 'arriba'),
    ...usar(34, 30, 'arriba'),
    { cond: () => G.partida.llaves('selva') >= 1, log: 'Llave pequeña' },
    ...usar(19, 26, 'arriba'),
    { lider: 'ixbalanque' },
    G_(13, 21),
    { empujar: 'derecha', hasta: [23, 21], log: 'Bloque sobre la placa' },
    { cond: () => G.partida.abierto('templo:19,16'), log: 'Reja abierta' },
    ...disparar(6, 20, 'izquierda'),
    { cond: () => G.partida.abierto('templo:5,16'), log: 'Cristal despierto' },
    ...usar(5, 12, 'arriba'),
    { cond: () => G.partida.tieneLlaveJefe('selva'), log: 'Llave del guardián' },
    ...usar(15, 13, 'arriba'),
    ...usar(23, 13, 'arriba'),
    ...usar(19, 10, 'arriba'),
    { minNivel: 3 },
    G_(19, 7),
    { cond: () => G.partida.bandera('vucubVencido'), log: '¡Vucub Caquix vencido!', foto: 'jefe1' },
    G_(19, 8),
    { mapa: 'selva' },
    G_(42, 8), G_(43, 8),
    { mapa: 'cuevas', log: 'Cuevas de Xibalbá' },
    G_(6, 14), G_(18, 17),
    { cond: () => G.partida.bandera('caminoNegro'), log: 'El camino negro habló' },
    G_(30, 17),
    ...usar(37, 27, 'arriba'),
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
    { lider: 'ixbalanque' },
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
    { minNivel: 8 },
    G_(18, 7),
    { cond: () => G.partida.bandera('zipacnaVencido'), log: '¡Zipacná vencido!', foto: 'jefe2' },
    G_(18, 8),
    { mapa: 'palacio', log: 'Casa de los Señores' },
    ...usar(19, 18, 'arriba'),
    G_(3, 11), G_(2, 11),
    { mapa: 'casaOscura', log: 'Casa Oscura' },
    G_(4, 3), G_(13, 9), G_(26, 15),
    { cond: () => G.partida.especial('luciernagas') >= 3, log: 'Tres luciérnagas' },
    ...usar(27, 4, 'arriba'),
    ...usar(28, 3, 'arriba'),
    { cond: () => G.partida.especial('sellos') >= 1, log: 'Sello 1' },
    G_(3, 18), G_(2, 18),
    { mapa: 'palacio' },
    G_(9, 3), G_(9, 2),
    { mapa: 'casaMurcielagos', log: 'Casa de los Murciélagos' },
    ...disparar(12, 7, 'arriba'),
    ...disparar(24, 8, 'abajo'),
    { cond: () => G.partida.abierto('casaMurcielagos:31,8'), log: 'Cristales de los murciélagos' },
    ...usar(32, 8, 'derecha'),
    { cond: () => G.partida.especial('sellos') >= 2, log: 'Sello 2' },
    G_(3, 8), G_(2, 8),
    { mapa: 'palacio' },
    ...usar(19, 18, 'arriba'),
    G_(28, 11), G_(29, 11),
    { mapa: 'casaJaguares', log: 'Casa de los Jaguares' },
    ...usar(13, 13, 'arriba'),
    ...usar(11, 15, 'izquierda'),
    ...usar(4, 14, 'arriba'),
    ...usar(15, 11, 'arriba'),
    ...usar(14, 6, 'arriba'),
    { lider: 'ixbalanque' },
    G_(3, 8),
    { empujar: 'arriba', hasta: [3, 4] },
    G_(2, 4),
    { empujar: 'derecha', hasta: [5, 4] },
    { cond: () => G.partida.abierto('casaJaguares:21,5'), log: 'Reja de los jaguares' },
    ...usar(26, 5, 'arriba'),
    { cond: () => G.partida.especial('sellos') >= 3, log: 'Sello 3' },
    G_(15, 19), G_(15, 20),
    { mapa: 'palacio' },
    ...usar(19, 18, 'arriba'),
    ...usar(16, 3, 'arriba'),
    G_(16, 1), G_(16, 0),
    { mapa: 'trono', log: 'Sala del trono' },
    ...usar(4, 15, 'izquierda'),
    { minNivel: 12 },
    G_(12, 7),
    { creditos: true, log: '¡Fin! Créditos', foto: 'final' }
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
      const nMin = Math.min(...G.partida.heroes().map((h) => h.nivel));
      if (this.nivelMinimo && nMin < this.nivelMinimo) { G.debug.subirNivel(this.nivelMinimo - nMin); this.subidas += this.nivelMinimo - nMin; }
      // si un paso de caminar nos llevó a otro mapa (por una salida), ya se cumplió
      if (this.mapaDelPaso === undefined) this.mapaDelPaso = esc.mapaId;
      if (p.ir && esc.mapaId !== this.mapaDelPaso) return this.avanzar();
      this.tPaso += dt;
      if (this.tPaso > 90) throw new Error(`Atascado en el paso ${this.i}: ${JSON.stringify(p)} en ${esc.mapaId} (${this.pos(esc)})`);
      if (p.mapa) { if (esc.mapaId === p.mapa) this.avanzar(); return; }
      if (p.cond) { if (p.cond()) this.avanzar(); else if (this.tPaso > 6) throw new Error('No se cumplió: ' + (p.log || p.cond)); return; }
      if (p.esperar) { if (this.tPaso >= p.esperar) this.avanzar(); return; }
      if (p.minNivel) {
        const n = Math.min(...G.partida.heroes().map((h) => h.nivel));
        this.nivelesJefes.push(n);
        this.registrar(`Nivel antes del jefe: ${G.partida.heroes().map((h) => h.nivel).join('/')}`);
        if (n < p.minNivel) this.registrar(`(se sube a ${p.minNivel} para la prueba)`);
        this.nivelMinimo = Math.max(this.nivelMinimo || 1, p.minNivel);
        return this.avanzar();
      }
      if (p.lider) {
        if (G.partida.heroeLider().id === p.lider) return this.avanzar();
        if (this.tPaso > 0.1) { this.tPaso = 0; this.pulsar('x'); }
        return;
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
      if (esc.estado === 'victoria') return this.pulsar('a');
      // golpe preciso: presionar A cuando el anillo coincide
      if (esc.anillo && !esc.anillo.presionado) {
        const r = esc.radioAnillo();
        if (r >= 9 && r <= 14) { this.precisos++; this.pulsar('a'); }
        return;
      }
      const m = esc.menu;
      if (!m || m.tipo !== 'comando') return;
      if (!esc._contado) { esc._contado = true; this.combates++; }
      const h = m.heroe;
      const vivos = esc.vivosE();
      if (!vivos.length) return;
      const accion = this.elegirAccion(esc, h, vivos);
      esc.cerrarMenu(h, accion);
    },

    elegirAccion(esc, h, vivos) {
      const D = G.datos, P = G.partida;
      const otro = esc.heroes.find((x) => x !== h);
      // revivir al hermano caído
      if (otro.ref.vida <= 0 && P.cuantos('pluma') > 0) return () => esc.accionObjeto(h, 'pluma', otro);
      // curar si alguien está muy herido
      const herido = esc.vivosH().find((x) => x.ref.vida < x.s.vida * 0.4);
      if (herido) {
        if (h.id === 'ixbalanque' && G.reglas.tecnicasDe(h.ref).includes('aguaLuna') && h.ref.energia >= 5) return () => esc.accionTecnica(h, 'aguaLuna', herido);
        if (P.cuantos('cacao') > 0) return () => esc.accionObjeto(h, 'cacao', herido);
      }
      if (h.ref.energia < 4 && P.cuantos('jade') > 0 && esc.esJefe) return () => esc.accionObjeto(h, 'jade', h);
      const objetivo = vivos.reduce((a, b) => (a.vida < b.vida ? a : b));
      const debil = (els, e) => (els || []).some((x) => (e.debil || []).includes(x));
      // técnica doble si se puede
      const otroListo = otro.ref.vida > 0 && otro.atb >= 100 && !otro.enCola;
      if (otroListo) {
        const iH = esc.heroes.indexOf(h);
        const dobles = G.reglas.doblesDisponibles(P.heroes()).filter((id) => {
          const t = D.DOBLES[id];
          return h.ref.energia >= t.costo[iH] && otro.ref.energia >= t.costo[1 - iH];
        }).sort((a, b) => D.DOBLES[b].potencia - D.DOBLES[a].potencia);
        if (dobles.length && (esc.esJefe || vivos.length > 1)) {
          const t = D.DOBLES[dobles[0]];
          esc.listos = esc.listos.filter((x) => x !== otro);
          otro.enCola = true;
          const obj = t.objetivo === 'enemigos' ? vivos.slice() : objetivo;
          return () => esc.accionDoble(h, otro, dobles[0], obj);
        }
      }
      // técnica que aproveche la debilidad
      const tecs = G.reglas.tecnicasDe(h.ref).map((id) => [id, D.TECNICAS[id]])
        .filter(([, t]) => (t.objetivo === 'enemigo' || t.objetivo === 'enemigos') && h.ref.energia >= t.costo);
      const buena = tecs.filter(([, t]) => (t.objetivo === 'enemigos' && vivos.length > 1) || debil(t.elemento, objetivo))
        .sort((a, b) => b[1].potencia - a[1].potencia)[0];
      if (buena && (esc.esJefe || vivos.length > 1 || Math.random() < 0.5)) {
        const [id, t] = buena;
        return () => esc.accionTecnica(h, id, t.objetivo === 'enemigos' ? vivos.slice() : objetivo);
      }
      if (esc.esJefe && !esc.vivosH().every((x) => x.escudoT > 0) && h.id === 'ixbalanque' && h.ref.energia >= 4 && Math.random() < 0.25) {
        return () => esc.accionTecnica(h, 'escudoJade', esc.vivosH());
      }
      return () => esc.accionAtacar(h, objetivo);
    }
  };

  window.ROBOT = R;
  G.debug.antesDePaso = (dt) => R.tick(dt);
})();
