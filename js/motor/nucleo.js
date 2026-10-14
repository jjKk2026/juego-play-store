/* =====================================================================
   NÚCLEO DEL MOTOR
   - Prepara la pantalla (un lienzo pequeño de 384x216 que se agranda).
   - Corre el "bucle" del juego: 60 veces por segundo actualiza y dibuja.
   - Maneja las "escenas" (título, mapa, combate, menú...) y los fundidos.
   ===================================================================== */
'use strict';

(function () {
  const PASO = 1 / 60;
  let lienzo, ctx;
  let pila = [];            // escenas activas (la de arriba es la que juega)
  let transicion = null;    // { fase: 'sale'|'entra', t, dur, fn, color }
  let acumulado = 0, ultimo = 0;
  let corriendo = false;
  let tiempoTotal = 0;

  const M = {
    lienzo: () => lienzo,
    ctx: () => ctx,
    tiempo: () => tiempoTotal,
    escena: () => pila[pila.length - 1],
    pila: () => pila,

    iniciar(canvas) {
      lienzo = canvas;
      lienzo.width = G.ANCHO;
      lienzo.height = G.ALTO;
      ctx = lienzo.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      G.entrada.conectarLienzo(lienzo);
      window.addEventListener('resize', M.ajustarTamano);
      window.addEventListener('orientationchange', () => setTimeout(M.ajustarTamano, 200));
      document.addEventListener('visibilitychange', () => {
        const oculto = document.hidden;
        G.audio.pausar(oculto);
        if (oculto) {
          const e = M.escena();
          e && e.alOcultar && e.alOcultar();
        }
      });
      M.ajustarTamano();
      corriendo = true;
      ultimo = performance.now();
      requestAnimationFrame(bucle);
    },

    // Agranda la imagen para llenar la pantalla sin deformarla.
    ajustarTamano() {
      const cont = lienzo.parentElement;
      const aw = cont.clientWidth, ah = cont.clientHeight;
      let esc = Math.min(aw / G.ANCHO, ah / G.ALTO);
      if (esc >= 2) {
        const entero = Math.floor(esc);
        if (esc - entero < 0.35) esc = entero; // nitidez perfecta si casi cabe
      }
      lienzo.style.width = Math.floor(G.ANCHO * esc) + 'px';
      lienzo.style.height = Math.floor(G.ALTO * esc) + 'px';
    },

    // Cambia de escena con un fundido a negro.
    cambiar(escena, op) {
      op = op || {};
      const hacer = () => {
        while (pila.length) { const e = pila.pop(); e.salir && e.salir(); }
        pila.push(escena);
        escena.entrar && escena.entrar();
        G.entrada.limpiar();
      };
      if (op.sinFundido) hacer();
      else M.fundido(hacer, op);
    },
    // Pone una escena encima de la actual (por ejemplo, el menú de pausa o un combate).
    apilar(escena, op) {
      op = op || {};
      const hacer = () => {
        pila.push(escena);
        escena.entrar && escena.entrar();
        G.entrada.limpiar();
      };
      if (op.fundido) M.fundido(hacer, op); else hacer();
    },
    quitar(op) {
      op = op || {};
      const hacer = () => {
        const e = pila.pop();
        e && e.salir && e.salir();
        const de = M.escena();
        de && de.alVolver && de.alVolver(op.resultado);
        G.entrada.limpiar();
      };
      if (op.fundido) M.fundido(hacer, op); else hacer();
    },
    fundido(fn, op) {
      op = op || {};
      const dur = op.dur || 0.3;
      // Si la pantalla ya está oscura (otro fundido terminando), se empieza "ya oscuro".
      const yaOscuro = transicion && transicion.ejecutando;
      transicion = { fase: 'sale', t: yaOscuro ? dur : 0, dur, fn, color: op.color || '#000', estilo: op.estilo || 'negro' };
    },
    enTransicion: () => !!transicion,

    // Para pruebas: avanza el juego "segundos" de golpe (sin esperar).
    avanzar(segundos) {
      const n = Math.round(segundos / PASO);
      for (let i = 0; i < n; i++) paso(PASO);
      dibujar();
    }
  };

  function paso(dtReal) {
    tiempoTotal += dtReal;
    // Gancho para las pruebas automáticas (un "robot" que juega solo).
    if (G.debug && G.debug.antesDePaso) G.debug.antesDePaso(dtReal);
    G.entrada.leer(dtReal);
    const dt = dtReal * G.tiempo.escala;
    G.fx.actualizar(dt, dtReal);
    G.audio.actualizar();
    if (transicion) {
      transicion.t += dtReal;
      if (transicion.t >= transicion.dur) {
        if (transicion.fase === 'sale') {
          const tr = transicion;
          tr.ejecutando = true;
          tr.fn && tr.fn();
          tr.ejecutando = false;
          // Si durante fn se pidió otro fundido, ese sigue (la pantalla ya está negra).
          if (transicion === tr) { tr.fase = 'entra'; tr.t = 0; }
        } else transicion = null;
      }
      // Durante el fundido de entrada la escena ya se mueve.
      if (transicion && transicion.fase === 'sale') return;
    }
    const e = M.escena();
    if (e && e.actualizar) e.actualizar(dt, dtReal);
  }

  function dibujar() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, G.ANCHO, G.ALTO);
    const [sx, sy] = G.fx.desplazamiento();
    ctx.save();
    ctx.translate(sx, sy);
    // Se dibujan todas las escenas que dejan ver la de abajo (por ejemplo, el menú de pausa).
    let desde = pila.length - 1;
    while (desde > 0 && pila[desde].transparente) desde--;
    for (let i = desde; i < pila.length; i++) pila[i].dibujar && pila[i].dibujar(ctx);
    ctx.restore();
    G.fx.dibujarEncima(ctx, lienzo);
    G.ui.dibujarAvisos(ctx, 1 / 60);
    if (transicion) {
      const k = transicion.fase === 'sale' ? transicion.t / transicion.dur : 1 - transicion.t / transicion.dur;
      dibujarFundido(G.util.limitar(k, 0, 1), transicion);
    }
  }

  // Fundido en forma de rombos que crecen (como un tejido).
  function dibujarFundido(k, tr) {
    ctx.fillStyle = tr.color;
    if (tr.estilo === 'negro') {
      ctx.globalAlpha = k;
      ctx.fillRect(0, 0, G.ANCHO, G.ALTO);
      ctx.globalAlpha = 1;
      return;
    }
    const tam = 24;
    for (let y = 0; y < G.ALTO + tam; y += tam) {
      for (let x = 0; x < G.ANCHO + tam; x += tam) {
        const r = Math.max(0, k * 1.6 - (x / G.ANCHO) * 0.6) * tam * 0.75;
        if (r <= 0) continue;
        ctx.beginPath();
        ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y);
        ctx.fill();
      }
    }
  }

  function bucle(ahora) {
    if (!corriendo) return;
    let dt = (ahora - ultimo) / 1000;
    ultimo = ahora;
    if (dt > 0.25) dt = 0.25;
    const vel = (G.debug && G.debug.velocidad) || 1;
    acumulado += dt * vel;
    let n = 0;
    while (acumulado >= PASO && n < 10 * vel) {
      try { paso(PASO); } catch (e) { reportar(e); }
      acumulado -= PASO;
      n++;
    }
    if (n >= 10 * vel) acumulado = 0;
    try { dibujar(); } catch (e) { reportar(e); }
    requestAnimationFrame(bucle);
  }

  // Guarda los errores para que las pruebas automáticas los vean.
  G.errores = [];
  function reportar(e) {
    if (G.errores.length < 20) G.errores.push(String(e && e.stack || e));
    console.error(e);
  }
  window.addEventListener('error', (e) => reportar(e.error || e.message));

  M.PASO = PASO;
  G.motor = M;
})();
