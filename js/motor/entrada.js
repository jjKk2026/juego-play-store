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

  const fuentes = { teclado: {}, tactil: {}, mando: {} };
  const estado = {};
  const antes = {};
  const repeticion = {};
  let toque = null; // toque o clic sobre la pantalla del juego (coordenadas internas)
  let toquesPendientes = [];
  let usoTactil = false;
  let alCambiarTactil = null;

  BOTONES.forEach((b) => { estado[b] = false; antes[b] = false; repeticion[b] = 0; });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM') { G.audio && G.audio.alternarSilencio(); return; }
    const b = TECLAS[e.code];
    if (!b) return;
    e.preventDefault();
    fuentes.teclado[b] = true;
    if (usoTactil) { usoTactil = false; alCambiarTactil && alCambiarTactil(false); }
    G.audio && G.audio.desbloquear();
  });
  window.addEventListener('keyup', (e) => {
    const b = TECLAS[e.code];
    if (b) fuentes.teclado[b] = false;
  });
  window.addEventListener('blur', () => {
    BOTONES.forEach((b) => { fuentes.teclado[b] = false; fuentes.tactil[b] = false; });
  });

  function marcarTactil() {
    if (!usoTactil) { usoTactil = true; alCambiarTactil && alCambiarTactil(true); }
  }

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

  // ---------- Mandos de consola ----------
  function leerMando() {
    fuentes.mando = {};
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    for (const p of pads) {
      if (!p) continue;
      const b = (i) => p.buttons[i] && p.buttons[i].pressed;
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      if (b(12) || ay < -0.5) fuentes.mando.arriba = true;
      if (b(13) || ay > 0.5) fuentes.mando.abajo = true;
      if (b(14) || ax < -0.5) fuentes.mando.izquierda = true;
      if (b(15) || ax > 0.5) fuentes.mando.derecha = true;
      if (b(0)) fuentes.mando.a = true;
      if (b(1)) fuentes.mando.b = true;
      if (b(2) || b(3)) fuentes.mando.x = true;
      if (b(9) || b(8)) fuentes.mando.pausa = true;
    }
  }

  // Se llama una vez por cuadro, antes de actualizar el juego.
  function leer(dt) {
    leerMando();
    BOTONES.forEach((b) => {
      antes[b] = estado[b];
      const crudo = !!(fuentes.teclado[b] || fuentes.tactil[b] || fuentes.mando[b] || simulado[b]);
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
    usaTactil: () => usoTactil,
    alCambiarTactil(fn) { alCambiarTactil = fn; },
    conectarBoton, conectarCruceta, conectarLienzo,
    simular(b, valor) { simulado[b] = valor; },
    simularToque(x, y) { toquesPendientes.push({ x, y }); },
    forzarTactil(v) { usoTactil = v; alCambiarTactil && alCambiarTactil(v); }
  };
  G.entrada = E;
})();
