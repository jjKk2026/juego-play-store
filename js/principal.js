/* =====================================================================
   ARRANQUE DEL JUEGO
   Conecta la pantalla, los botones táctiles y el botón de silencio,
   y muestra la pantalla de título.
   ===================================================================== */
'use strict';

(function () {
  const lienzo = document.getElementById('lienzo');
  const cargando = document.getElementById('cargando');

  // Botones táctiles
  document.querySelectorAll('[data-boton]').forEach((el) => G.entrada.conectarBoton(el, el.dataset.boton));
  G.entrada.conectarCruceta(document.getElementById('cruceta'));

  // Mostrar u ocultar los controles táctiles según el dispositivo y las opciones.
  const esTactil = () => ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
  G.aplicarTactil = function () {
    const o = G.opciones.tactil;
    const mostrar = o === 'si' || (o === 'auto' && (G.entrada.usaTactil() || esTactil()));
    document.body.classList.toggle('tactil', mostrar);
    setTimeout(() => G.motor.ajustarTamano(), 50);
  };
  G.entrada.alCambiarTactil(() => G.aplicarTactil());

  // Botón de silencio (siempre visible)
  const btnSilencio = document.getElementById('btn-silencio');
  const pintarSilencio = () => { btnSilencio.textContent = G.audio.silenciado() ? '🔇' : '🔊'; };
  btnSilencio.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    G.audio.desbloquear();
    G.audio.alternarSilencio();
    pintarSilencio();
  });
  document.addEventListener('silencio', pintarSilencio);

  G.audio.configurar(G.opciones);
  pintarSilencio();

  // Herramientas para pruebas automáticas (no afectan al jugador).
  G.debug = {
    velocidad: 1,
    antesDePaso: null,
    escena: () => G.motor.escena(),
    subirNivel(n) {
      G.partida.heroes().forEach((h) => {
        for (let i = 0; i < n; i++) G.reglas.ganarXP(h, G.reglas.xpSiguiente(h.nivel) - h.xp);
      });
      G.partida.curarTodo();
    }
  };

  // Mundos registrados: si falta alguno, se avisa en pantalla.
  if (!G.mundos.lista().length) {
    cargando.textContent = 'No se encontró ningún mundo.';
    return;
  }

  G.motor.iniciar(lienzo);
  G.aplicarTactil();
  cargando.style.display = 'none';
  G.motor.cambiar(new G.EscenaTitulo(), { sinFundido: true });

  // Conexión con la app de Android: botón "atrás" y pausa al minimizar.
  window.botonAtras = function () {
    const e = G.motor.escena();
    if (e instanceof G.EscenaTitulo) return 'salir';
    G.entrada.simular(e instanceof G.EscenaMapa ? 'pausa' : 'b', true);
    setTimeout(() => G.entrada.simular('pausa', false), 120);
    setTimeout(() => G.entrada.simular('b', false), 120);
    return 'ok';
  };
  window.alPausarApp = function () {
    const e = G.motor.escena();
    if (e && e.alOcultar) e.alOcultar();
    G.audio.pausar(true);
  };
  window.alVolverApp = function () { G.audio.pausar(false); };

  // Funciona sin internet: el "service worker" guarda una copia del juego (solo en la versión web).
  if ('serviceWorker' in navigator && location.protocol === 'https:' && location.hostname !== 'appassets.androidplatform.net') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
