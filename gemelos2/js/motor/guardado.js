/* =====================================================================
   GUARDADO
   La partida se guarda en el propio dispositivo (localStorage), sin
   internet. Hay tres "cajones":
   - la partida (dónde estás, nivel, objetos...),
   - las opciones (volumen, velocidad del texto...),
   - el bestiario (las criaturas vistas, se conservan entre partidas).
   ===================================================================== */
'use strict';

(function () {
  const CLAVE_PARTIDA = 'gemelos-del-sol-2.partida';
  const CLAVE_OPCIONES = 'gemelos-del-sol-2.opciones';
  const CLAVE_BESTIARIO = 'gemelos-del-sol-2.bestiario';

  const OPCIONES_BASE = {
    volMusica: 0.7,
    volEfectos: 0.8,
    silencio: false,
    velocidadTexto: 2,      // 1 lenta, 2 normal, 3 rápida, 4 instantánea
    modoBatalla: 'espera',  // 'espera' (el tiempo se detiene al elegir) o 'activo'
    vibracion: true,        // pantalla que tiembla en los golpes
    tactil: 'auto'          // 'auto', 'si', 'no'
  };

  function leer(clave) {
    try {
      const t = localStorage.getItem(clave);
      return t ? JSON.parse(t) : null;
    } catch (e) { return null; }
  }
  function escribir(clave, valor) {
    try {
      localStorage.setItem(clave, JSON.stringify(valor));
      return true;
    } catch (e) { return false; }
  }

  G.opciones = Object.assign({}, OPCIONES_BASE, leer(CLAVE_OPCIONES) || {});

  G.guardado = {
    hayPartida() { return !!leer(CLAVE_PARTIDA); },
    cargarPartida() { return leer(CLAVE_PARTIDA); },
    guardarPartida(estado) {
      estado.guardadoEn = Date.now();
      return escribir(CLAVE_PARTIDA, estado);
    },
    borrarPartida() { try { localStorage.removeItem(CLAVE_PARTIDA); } catch (e) { /* nada */ } },
    guardarOpciones() { escribir(CLAVE_OPCIONES, G.opciones); },
    bestiario() { return leer(CLAVE_BESTIARIO) || {}; },
    // estado: 'visto' (lo viste) o 'vencido' (lo derrotaste)
    marcarBestiario(id, estado) {
      const b = G.guardado.bestiario();
      if (b[id] === 'vencido') return;
      if (b[id] === estado) return;
      b[id] = estado;
      escribir(CLAVE_BESTIARIO, b);
    }
  };
})();
