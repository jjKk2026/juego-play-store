/* =====================================================================
   ESTADO DE LA PARTIDA
   Todo lo que hay que recordar de tu aventura: dónde estás, el nivel de
   los gemelos, los objetos, las llaves, los cofres abiertos, etc.
   Se guarda solo (automáticamente) al cambiar de mapa, después de cada
   combate, al abrir cofres y en los altares.
   ===================================================================== */
'use strict';

(function () {
  const R = () => G.reglas;
  let e = null; // el estado actual

  const Partida = {
    get e() { return e; },
    hay: () => !!e,

    nueva(mundoId) {
      const m = G.mundos.obtener(mundoId || 'maya');
      e = {
        version: 1,
        mundo: m.id,
        mapa: m.inicio.mapa, x: m.inicio.x, y: m.inicio.y, dir: m.inicio.dir || 0,
        lider: 0,
        heroes: m.heroes.map((id) => R().crearHeroe(id, 1)),
        objetos: Object.assign({ cacao: 0, jade: 0, copal: 0, pluma: 0 }, m.inicio.objetos || {}),
        especiales: {},
        llaves: {}, llaveJefe: {}, mapasZona: {},
        banderas: {}, abiertos: {}, tiempo: 0,
        objetivo: m.inicio.objetivo || '',
        ultimoAltar: { mapa: m.inicio.mapa, x: m.inicio.x, y: m.inicio.y }
      };
      return e;
    },
    cargar() {
      const d = G.guardado.cargarPartida();
      if (!d || !G.mundos.obtener(d.mundo)) return false;
      e = d;
      // Por si una versión vieja no tenía algún campo.
      e.especiales = e.especiales || {};
      e.ultimoAltar = e.ultimoAltar || { mapa: e.mapa, x: e.x, y: e.y };
      return true;
    },
    guardar() {
      if (!e) return false;
      const ok = G.guardado.guardarPartida(e);
      return ok;
    },
    mundo() { return G.mundos.obtener(e.mundo); },

    // ---------------- Héroes ----------------
    heroes() { return e.heroes; },
    heroeLider() { return e.heroes[e.lider]; },
    cambiarLider() { e.lider = (e.lider + 1) % e.heroes.length; return e.heroes[e.lider]; },
    curarTodo() {
      e.heroes.forEach((h) => { const s = R().stats(h); h.vida = s.vida; h.energia = s.energia; });
    },
    nivelPromedio() { return e.heroes.reduce((a, h) => a + h.nivel, 0) / e.heroes.length; },

    // ---------------- Objetos ----------------
    cuantos(id) { return e.objetos[id] || 0; },
    dar(id, n) { e.objetos[id] = (e.objetos[id] || 0) + (n === undefined ? 1 : n); if (e.objetos[id] > 99) e.objetos[id] = 99; },
    quitar(id, n) { e.objetos[id] = Math.max(0, (e.objetos[id] || 0) - (n === undefined ? 1 : n)); },
    especial(id) { return e.especiales[id] || 0; },
    darEspecial(id, n) { e.especiales[id] = (e.especiales[id] || 0) + (n === undefined ? 1 : n); },

    // ---------------- Llaves y mapas (por zona) ----------------
    llaves(zona) { return e.llaves[zona] || 0; },
    darLlave(zona) { e.llaves[zona] = (e.llaves[zona] || 0) + 1; },
    usarLlave(zona) { if (!e.llaves[zona]) return false; e.llaves[zona]--; return true; },
    tieneLlaveJefe(zona) { return !!e.llaveJefe[zona]; },
    darLlaveJefe(zona) { e.llaveJefe[zona] = true; },
    tieneMapa(zona) { return !!e.mapasZona[zona]; },
    darMapa(zona) { e.mapasZona[zona] = true; },

    // ---------------- Banderas (cosas que ya pasaron) ----------------
    bandera(k) { return e && e.banderas[k]; },
    poner(k, v) { e.banderas[k] = v === undefined ? true : v; },
    abierto(id) { return !!e.abiertos[id]; },
    abrir(id) { e.abiertos[id] = true; },
    objetivo(id) { if (id !== undefined) e.objetivo = id; return e.objetivo; },

    // ---------------- Nombres (datos globales para los diálogos) ----------------
    // Partidas guardadas antes de existir esta opción conservan los nombres del Popol Vuh.
    nombre(id) {
      const n = e && e.nombres && e.nombres[id];
      if (n) return n;
      return (e && e.nombres ? G.datos.NOMBRES_POR_DEFECTO[id] : null) || G.datos.HEROES[id].nombre;
    },
    ponerNombre(id, texto) {
      const limpio = Partida.limpiarNombre(texto);
      e.nombres = e.nombres || {};
      e.nombres[id] = limpio || G.datos.NOMBRES_POR_DEFECTO[id];
      return e.nombres[id];
    },
    // Quita espacios de más y letras que el juego no sabe dibujar.
    limpiarNombre(texto) {
      const t = [...String(texto || '')].filter((c) => G.fuente.soporta(c) && c !== '*' && c !== '{' && c !== '}').join('');
      return t.replace(/\s+/g, ' ').trim().slice(0, G.datos.LARGO_NOMBRE);
    },
    // "Ren y Alex", "Hunahpú e Ixbalanqué" (se usa "e" antes de i- / hi-).
    gemelos() {
      const a = Partida.nombre('hunahpu'), b = Partida.nombre('ixbalanque');
      const conE = /^(h?[iíIÍ])(?![aeouáéóú])/.test(b.toLowerCase());
      return a + (conE ? ' e ' : ' y ') + b;
    }
  };

  G.partida = Partida;
})();
