/* =====================================================================
   CONTROLES
   Junta en un solo lugar el teclado, los botones táctiles en pantalla
   y los controles de consola (gamepad). El resto del juego solo pregunta
   "¿se presionó A?" sin importar de dónde vino.
   Botones: arriba, abajo, izquierda, derecha, a, b, x, pausa.
   ===================================================================== */
'use strict';

(function () {
  const BOTONES = ['arriba', 'abajo', 'izquierda', 'derecha', 'a', 'b', 'x', 'pausa'];
  const TECLAS = {
    ArrowUp: 'arriba', KeyW: 'arriba',
    ArrowDown: 'abajo', KeyS: 'abajo',
    ArrowLeft: 'izquierda', KeyA: 'izquierda',
    ArrowRight: 'derecha', KeyD: 'derecha',
    KeyZ: 'a', Space: 'a', Enter: 'a', KeyJ: 'a',
    KeyX: 'b', Backspace: 'b', KeyK: 'b',
    KeyC: 'x', Tab: 'x', KeyL: 'x',
    Escape: 'pausa', KeyP: 'pausa'
  };

  const fuentes = { teclado: {}, tactil: {}, mando: {}, nativo: {} };
  const estado = {};
  const antes = {};
  const repeticion = {};
  let toque = null; // toque o clic sobre la pantalla del juego (coordenadas internas)
  let toquesPendientes = [];
  let modo = 'teclado';        // 'teclado', 'tactil' o 'mando' (para mostrar los botones correctos)
  let alCambiarTactil = null;
  let receptorTexto = null;    // cuando se escribe un nombre, las letras van aquí

  BOTONES.forEach((b) => { estado[b] = false; antes[b] = false; repeticion[b] = 0; });

  function cambiarModo(m) {
    if (modo === m) return;
    const antesTactil = modo === 'tactil';
    modo = m;
    if (antesTactil !== (m === 'tactil')) alCambiarTactil && alCambiarTactil(m === 'tactil');
  }

  window.addEventListener('keydown', (e) => {
    // Escribiendo un nombre: las letras se escriben en vez de mover al personaje.
    if (receptorTexto) {
      if (e.target && e.target.tagName === 'INPUT') { if (e.key === 'Enter') { e.preventDefault(); receptorTexto('listo'); } return; }
      if (e.key === 'Backspace') { e.preventDefault(); receptorTexto('borrar'); return; }
      if (e.key === 'Enter') { e.preventDefault(); receptorTexto('listo'); return; }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); receptorTexto(e.key); return; }
    }
    if (e.code === 'KeyM') { G.audio && G.audio.alternarSilencio(); return; }
    const b = TECLAS[e.code];
    if (!b) return;
    e.preventDefault();
    fuentes.teclado[b] = true;
    cambiarModo('teclado');
    G.audio && G.audio.desbloquear();
  });
  window.addEventListener('keyup', (e) => {
    const b = TECLAS[e.code];
    if (b) fuentes.teclado[b] = false;
  });
  window.addEventListener('blur', () => {
    BOTONES.forEach((b) => { fuentes.teclado[b] = false; fuentes.tactil[b] = false; fuentes.nativo[b] = false; });
  });

  function marcarTactil() { cambiarModo('tactil'); }

  // ---------- Botones táctiles (los crea index.html, aquí se conectan) ----------
  function conectarBoton(el, boton) {
    const bajar = (e) => {
      e.preventDefault();
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
      fuentes.tactil[boton] = true;
      el.classList.add('activo');
      marcarTactil();
      G.audio && G.audio.desbloquear();
    };
    const subir = (e) => {
      e.preventDefault();
      fuentes.tactil[boton] = false;
      el.classList.remove('activo');
    };
    el.addEventListener('pointerdown', bajar);
    el.addEventListener('pointerup', subir);
    el.addEventListener('pointercancel', subir);
    el.addEventListener('lostpointercapture', subir);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Cruceta: según dónde esté el dedo respecto al centro, activa 1 o 2 direcciones.
  function conectarCruceta(el) {
    const dedos = new Map();
    const recalcular = () => {
      ['arriba', 'abajo', 'izquierda', 'derecha'].forEach((d) => { fuentes.tactil[d] = false; });
      el.dataset.dir = '';
      dedos.forEach((p) => {
        const r = el.getBoundingClientRect();
        const dx = p.x - (r.left + r.width / 2), dy = p.y - (r.top + r.height / 2);
        const muerta = r.width * 0.12;
        if (Math.hypot(dx, dy) < muerta) return;
        const ang = Math.atan2(dy, dx);
        const oct = Math.round(ang / (Math.PI / 4)); // -4..4
        const dirs = {
          0: ['derecha'], 1: ['derecha', 'abajo'], 2: ['abajo'], 3: ['abajo', 'izquierda'],
          4: ['izquierda'], '-4': ['izquierda'], '-3': ['izquierda', 'arriba'], '-2': ['arriba'], '-1': ['arriba', 'derecha']
        }[oct];
        dirs.forEach((d) => { fuentes.tactil[d] = true; });
        el.dataset.dir = dirs.join(' ');
      });
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture && el.setPointerCapture(e.pointerId);
      dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
      marcarTactil();
      G.audio && G.audio.desbloquear();
      recalcular();
    });
    el.addEventListener('pointermove', (e) => {
      if (!dedos.has(e.pointerId)) return;
      e.preventDefault();
      dedos.set(e.pointerId, { x: e.clientX, y: e.clientY });
      recalcular();
    });
    const fin = (e) => { dedos.delete(e.pointerId); recalcular(); };
    el.addEventListener('pointerup', fin);
    el.addEventListener('pointercancel', fin);
    el.addEventListener('lostpointercapture', fin);
  }

  // Toques y clics directamente sobre la imagen del juego (para elegir en menús).
  function conectarLienzo(canvas) {
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      G.audio && G.audio.desbloquear();
      if (e.pointerType === 'touch') marcarTactil();
      const r = canvas.getBoundingClientRect();
      toquesPendientes.push({
        x: (e.clientX - r.left) * (G.ANCHO / r.width),
        y: (e.clientY - r.top) * (G.ALTO / r.height)
      });
    });
  }

  // ---------- Mandos de consola (Bluetooth o USB: 8BitDo, Xbox, PlayStation...) ----------
  // Distribución "estándar" de los navegadores:
  //   0 = A / Cruz (abajo)      1 = B / Círculo (derecha)
  //   2 = X / Cuadrado          3 = Y / Triángulo        4, 5 = gatillos L1 / R1
  //   8 = Select / Back         9 = Start                12-15 = cruceta
  const MAPA_MANDO = {
    a: [0],            // confirmar, hablar, abrir, golpe preciso
    b: [1],            // cancelar y habilidad del líder (cerbatana / rugido)
    x: [2, 3, 4, 5],   // cambiar de líder
    pausa: [8, 9],     // menú de pausa
    arriba: [12], abajo: [13], izquierda: [14], derecha: [15]
  };
  const ZONA_MUERTA = 0.45;
  const mandos = {};

  window.addEventListener('gamepadconnected', (e) => {
    mandos[e.gamepad.index] = true;
    G.ui && G.ui.aviso('Mando conectado', '#7ef2c8');
  });
  window.addEventListener('gamepaddisconnected', (e) => {
    delete mandos[e.gamepad.index];
    G.ui && G.ui.aviso('Mando desconectado', '#ff5d73');
  });

  function leerMando() {
    fuentes.mando = {};
    if (!navigator.getGamepads) return;
    let pads;
    try { pads = navigator.getGamepads(); } catch (e) { return; }
    for (const p of pads) {
      if (!p || !p.connected) continue;
      const boton = (i) => p.buttons[i] && (p.buttons[i].pressed || p.buttons[i].value > 0.5);
      Object.keys(MAPA_MANDO).forEach((b) => { if (MAPA_MANDO[b].some(boton)) fuentes.mando[b] = true; });
      // Palanca izquierda
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      if (ay < -ZONA_MUERTA) fuentes.mando.arriba = true;
      if (ay > ZONA_MUERTA) fuentes.mando.abajo = true;
      if (ax < -ZONA_MUERTA) fuentes.mando.izquierda = true;
      if (ax > ZONA_MUERTA) fuentes.mando.derecha = true;
      // Algunos mandos (modo D-input en Android) mandan la cruceta como un "eje sombrero" (eje 9).
      if (p.mapping !== 'standard' && p.axes.length > 9) {
        const h = p.axes[9];
        if (h > -1.1 && h < 1.1) {
          const cerca = (v) => Math.abs(h - v) < 0.1;
          if (cerca(-1) || cerca(1) || cerca(-0.714)) fuentes.mando.arriba = true;
          if (cerca(-0.714) || cerca(-0.428) || cerca(-0.142)) fuentes.mando.derecha = true;
          if (cerca(-0.142) || cerca(0.142) || cerca(0.428)) fuentes.mando.abajo = true;
          if (cerca(0.428) || cerca(0.714) || cerca(1)) fuentes.mando.izquierda = true;
        }
      }
    }
    if (Object.keys(fuentes.mando).length) { cambiarModo('mando'); G.audio && G.audio.desbloquear(); }
  }

  // Vibración del mando (si el mando y el navegador lo permiten).
  function vibrarMando(ms, fuerza) {
    if (!navigator.getGamepads) return;
    try {
      for (const p of navigator.getGamepads()) {
        const v = p && p.vibrationActuator;
        if (v && v.playEffect) v.playEffect('dual-rumble', { duration: ms, strongMagnitude: fuerza, weakMagnitude: fuerza * 0.6 }).catch(() => {});
      }
    } catch (e) { /* nada */ }
  }

  // Nombres de los botones según cómo se está jugando.
  const ETIQUETAS = {
    teclado: { a: 'Z', b: 'X', x: 'C', pausa: 'Esc' },
    tactil: { a: 'A', b: 'B', x: '⇄', pausa: 'Pausa' },
    mando: { a: 'A', b: 'B', x: 'Y', pausa: 'Start' }
  };

  // Se llama una vez por cuadro, antes de actualizar el juego.
  function leer(dt) {
    leerMando();
    BOTONES.forEach((b) => {
      antes[b] = estado[b];
      const crudo = !!(fuentes.teclado[b] || fuentes.tactil[b] || fuentes.mando[b] || fuentes.nativo[b] || simulado[b]);
      if (!crudo) bloqueo[b] = false;
      estado[b] = crudo && !bloqueo[b];
      if (estado[b]) repeticion[b] += dt; else repeticion[b] = 0;
    });
    toque = toquesPendientes.length ? toquesPendientes.shift() : null;
  }

  // Botones simulados (los usan las pruebas automáticas).
  const simulado = {};
  const bloqueo = {};

  const E = {
    BOTONES,
    leer,
    mantenido: (b) => estado[b],
    presionado: (b) => estado[b] && !antes[b],
    // Para menús: se repite si se mantiene presionado.
    repetido(b) {
      if (E.presionado(b)) return true;
      const t = repeticion[b];
      return estado[b] && t > 0.38 && Math.floor((t - 0.38) / 0.09) !== Math.floor((t - 0.38 - 1 / 60) / 0.09);
    },
    toque: () => toque,
    consumirToque() { const t = toque; toque = null; return t; },
    // Ignora lo que esté presionado ahora (para que un botón no "atraviese" dos pantallas).
    limpiar() {
      BOTONES.forEach((b) => { if (estado[b]) bloqueo[b] = true; estado[b] = false; antes[b] = false; });
      toque = null;
      toquesPendientes = [];
    },
    usaTactil: () => modo === 'tactil',
    modo: () => modo,
    etiqueta: (b) => ETIQUETAS[modo][b] || b.toUpperCase(),
    // Explicación de los controles según el dispositivo que se está usando.
    explicacion() {
      if (modo === 'tactil') return 'Muévanse con la cruceta. *A* habla, abre y confirma. *B* cancela y usa la habilidad del líder. *⇄* cambia de líder y el botón de arriba abre la pausa.';
      if (modo === 'mando') return 'Muévanse con la cruceta o la palanca. *A* habla, abre y confirma. *B* cancela y usa la habilidad del líder. *X* o *Y* cambian de líder y *Start* abre la pausa.';
      return 'Muévanse con las flechas. *Z* habla, abre y confirma. *X* cancela y usa la habilidad del líder. *C* cambia de líder y *Esc* abre la pausa. ¡También pueden usar un mando!';
    },
    vibrarMando,
    // Botones que llegan desde la app de Android (mando conectado al teléfono).
    mandoNativo(b, v) { if (BOTONES.includes(b)) { fuentes.nativo[b] = !!v; if (v) cambiarModo('mando'); } },
    // Modo texto: mientras escribes un nombre, las teclas van a esta función.
    recibirTexto(fn) { receptorTexto = fn; },
    alCambiarTactil(fn) { alCambiarTactil = fn; },
    conectarBoton, conectarCruceta, conectarLienzo,
    simular(b, valor) { simulado[b] = valor; },
    simularToque(x, y) { toquesPendientes.push({ x, y }); },
    forzarTactil(v) { cambiarModo(v ? 'tactil' : 'teclado'); }
  };
  G.entrada = E;
})();
