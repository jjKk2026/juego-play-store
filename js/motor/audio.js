/* =====================================================================
   SONIDO Y MÚSICA (todo generado con código, sin archivos de audio)
   Instrumentos inspirados en América precolombina:
   - flauta y ocarina (barro), caracola (trompeta de concha),
   - teponaztli (tambor de tronco de dos tonos), huehuetl (tambor grande),
   - sonaja (maraca de semillas) y silbato (sonido de viento misterioso).
   Las canciones se escriben como texto: "D5 - F5 ." = nota, sostener, nota, silencio.
   ===================================================================== */
'use strict';

(function () {
  let ac = null;            // el "estudio de sonido" del navegador
  let maestro, compresor, busMusica, busEfectos, reverb, reverbEnvio;
  let ruidoBuf = null;
  let silenciado = false;
  let volMusica = 0.7, volEfectos = 0.8;
  let pistaActual = null;   // { nombre, def, salida, voces }
  let nombrePista = null;
  let ambienteProx = 0;

  const NOTAS = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  function frecuencia(nota) {
    const m = /^([A-G][#b]?)(-?\d)$/.exec(nota);
    if (!m) return 0;
    const n = NOTAS[m[1]] + (parseInt(m[2], 10) + 1) * 12;
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  function crear() {
    if (ac) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ac = new AC();
    compresor = ac.createDynamicsCompressor();
    compresor.threshold.value = -14;
    compresor.ratio.value = 4;
    maestro = ac.createGain();
    maestro.gain.value = silenciado ? 0 : 1;
    compresor.connect(maestro);
    maestro.connect(ac.destination);
    busMusica = ac.createGain();
    busMusica.gain.value = volMusica;
    busEfectos = ac.createGain();
    busEfectos.gain.value = volEfectos;
    busMusica.connect(compresor);
    busEfectos.connect(compresor);
    // Eco de cueva (reverberación) hecho con ruido que se apaga lentamente.
    reverb = ac.createConvolver();
    const largo = ac.sampleRate * 2.8;
    const imp = ac.createBuffer(2, largo, ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = imp.getChannelData(c);
      for (let i = 0; i < largo; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 3.2);
    }
    reverb.buffer = imp;
    reverbEnvio = ac.createGain();
    reverbEnvio.gain.value = 0.25;
    reverbEnvio.connect(reverb);
    reverb.connect(compresor);
    ruidoBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const r = ruidoBuf.getChannelData(0);
    for (let i = 0; i < r.length; i++) r[i] = Math.random() * 2 - 1;
    return true;
  }

  // ---------------- Piezas básicas ----------------
  function env(g, t, a, sostener, liberar, pico) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(pico, t + a);
    g.gain.setValueAtTime(pico, t + a + Math.max(0, sostener));
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + Math.max(0, sostener) + liberar);
  }
  function osc(tipo, f, t, fin) {
    const o = ac.createOscillator();
    o.type = tipo;
    o.frequency.setValueAtTime(f, t);
    o.start(t);
    o.stop(fin + 0.05);
    return o;
  }
  function ruido(t, fin) {
    const s = ac.createBufferSource();
    s.buffer = ruidoBuf;
    s.loop = true;
    s.start(t, Math.random() * 1.5);
    s.stop(fin + 0.05);
    return s;
  }
  function filtro(tipo, f, q) {
    const b = ac.createBiquadFilter();
    b.type = tipo;
    b.frequency.value = f;
    if (q !== undefined) b.Q.value = q;
    return b;
  }
  function vibrato(t, nodoFrec, f, prof, vel, retraso, fin) {
    const l = osc('sine', vel, t, fin);
    const g = ac.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(f * prof, t + retraso);
    l.connect(g); g.connect(nodoFrec);
    return l;
  }

  // ---------------- Instrumentos ----------------
  const INST = {
    flauta(dest, t, f, dur, v) {
      const fin = t + dur + 0.1;
      const g = ac.createGain();
      env(g, t, 0.04, dur - 0.08, 0.1, v * 0.32);
      const o = osc('triangle', f, t, fin);
      const o2 = osc('sine', f * 2, t, fin);
      const g2 = ac.createGain(); g2.gain.value = 0.12;
      vibrato(t, o.frequency, f, 0.012, 5.4, Math.min(0.25, dur * 0.6), fin);
      const lp = filtro('lowpass', 2600);
      o.connect(lp); o2.connect(g2); g2.connect(lp);
      // soplido
      const n = ruido(t, fin);
      const bp = filtro('bandpass', f * 2, 1.2);
      const gn = ac.createGain();
      env(gn, t, 0.02, dur * 0.2, 0.1, v * 0.05);
      n.connect(bp); bp.connect(gn); gn.connect(dest);
      lp.connect(g); g.connect(dest);
    },
    ocarina(dest, t, f, dur, v) {
      const fin = t + dur + 0.2;
      const g = ac.createGain();
      env(g, t, 0.07, dur - 0.1, 0.18, v * 0.36);
      const o = osc('sine', f, t, fin);
      const o2 = osc('sine', f * 3, t, fin);
      const g2 = ac.createGain(); g2.gain.value = 0.05;
      vibrato(t, o.frequency, f, 0.008, 4.6, Math.min(0.3, dur * 0.7), fin);
      o.connect(g); o2.connect(g2); g2.connect(g); g.connect(dest);
    },
    caracola(dest, t, f, dur, v) {
      const fin = t + dur + 0.3;
      const g = ac.createGain();
      env(g, t, 0.22, dur - 0.25, 0.3, v * 0.26);
      const o = osc('sawtooth', f, t, fin);
      const o2 = osc('square', f * 1.006, t, fin);
      const lp = filtro('lowpass', 250, 3);
      lp.frequency.setValueAtTime(250, t);
      lp.frequency.linearRampToValueAtTime(f * 7, t + 0.25);
      lp.frequency.linearRampToValueAtTime(f * 4, t + dur);
      o.frequency.setValueAtTime(f * 0.94, t);
      o.frequency.linearRampToValueAtTime(f, t + 0.2);
      vibrato(t, o.frequency, f, 0.01, 4, 0.4, fin);
      const g2 = ac.createGain(); g2.gain.value = 0.5;
      o.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(dest);
    },
    zumbido(dest, t, f, dur, v) {
      const fin = t + dur + 0.8;
      const g = ac.createGain();
      env(g, t, Math.min(1.2, dur * 0.4), dur * 0.5, 0.8, v * 0.13);
      const lp = filtro('lowpass', 700, 1);
      [0.997, 1.003, 0.5].forEach((d) => { const o = osc('sawtooth', f * d, t, fin); o.connect(lp); });
      lp.connect(g); g.connect(dest);
    },
    silbato(dest, t, f, dur, v) {
      const fin = t + dur + 0.3;
      const g = ac.createGain();
      env(g, t, 0.15, dur * 0.5, dur * 0.5, v * 0.14);
      const n = ruido(t, fin);
      const bp = filtro('bandpass', f, 18);
      bp.frequency.setValueAtTime(f * 1.15, t);
      bp.frequency.exponentialRampToValueAtTime(f * 0.7, t + dur + 0.2);
      n.connect(bp); bp.connect(g); g.connect(dest);
    },
    // Percusión: cada letra es un golpe distinto.
    percusion(dest, t, letra, dur, v) {
      const golpes = {
        x: () => tronco(dest, t, 392, v),
        o: () => tronco(dest, t, 262, v),
        B: () => huehuetl(dest, t, v),
        b: () => huehuetl(dest, t, v * 0.55),
        s: () => sonaja(dest, t, v * 0.6, 0.05),
        S: () => sonaja(dest, t, v, 0.14),
        k: () => clic(dest, t, v)
      };
      golpes[letra] && golpes[letra]();
    }
  };
  function tronco(dest, t, f, v) {
    const g = ac.createGain();
    env(g, t, 0.003, 0.0, 0.18, v * 0.45);
    const o = osc('sine', f, t, t + 0.3);
    o.frequency.exponentialRampToValueAtTime(f * 0.92, t + 0.15);
    const o2 = osc('triangle', f * 2.7, t, t + 0.06);
    const g2 = ac.createGain(); env(g2, t, 0.001, 0, 0.04, v * 0.12);
    o.connect(g); o2.connect(g2); g2.connect(dest); g.connect(dest);
  }
  function huehuetl(dest, t, v) {
    const g = ac.createGain();
    env(g, t, 0.004, 0.02, 0.35, v * 0.8);
    const o = osc('sine', 110, t, t + 0.5);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.18);
    o.connect(g); g.connect(dest);
    const n = ruido(t, t + 0.1);
    const lp = filtro('lowpass', 500);
    const gn = ac.createGain(); env(gn, t, 0.001, 0, 0.07, v * 0.3);
    n.connect(lp); lp.connect(gn); gn.connect(dest);
  }
  function sonaja(dest, t, v, largo) {
    const n = ruido(t, t + largo + 0.05);
    const hp = filtro('highpass', 5200);
    const g = ac.createGain(); env(g, t, 0.005, largo * 0.3, largo, v * 0.22);
    n.connect(hp); hp.connect(g); g.connect(dest);
  }
  function clic(dest, t, v) {
    const o = osc('square', 1400, t, t + 0.03);
    const g = ac.createGain(); env(g, t, 0.001, 0, 0.025, v * 0.12);
    o.connect(g); g.connect(dest);
  }

  // ---------------- Secuenciador de canciones ----------------
  function prepararVoz(v) {
    const patrones = (Array.isArray(v.notas) ? v.notas : [v.notas]).map((p) =>
      p.split(/\s+/).filter((x) => x && x !== '|'));
    return { def: v, patrones, vuelta: 0, paso: 0, proximo: 0 };
  }

  function reproducirPista(nombre) {
    if (nombrePista === nombre) return;
    nombrePista = nombre;
    if (!ac) return; // empezará al desbloquear
    detenerPista(0.6);
    const def = G.musica && G.musica[nombre];
    if (!def) return;
    const salida = ac.createGain();
    salida.gain.setValueAtTime(0.0001, ac.currentTime);
    salida.gain.linearRampToValueAtTime(def.volumen || 0.8, ac.currentTime + 0.8);
    salida.connect(busMusica);
    const envio = ac.createGain();
    envio.gain.value = def.eco !== undefined ? def.eco : 0.3;
    salida.connect(envio);
    envio.connect(reverbEnvio);
    const inicio = ac.currentTime + 0.1;
    const voces = def.voces.map(prepararVoz);
    voces.forEach((v) => { v.proximo = inicio; });
    pistaActual = { nombre, def, salida, voces, paso: 60 / def.bpm / (def.sub || 2) };
  }

  function detenerPista(fade) {
    if (!pistaActual || !ac) { pistaActual = null; return; }
    const s = pistaActual.salida;
    const t = ac.currentTime;
    s.gain.cancelScheduledValues(t);
    s.gain.setValueAtTime(s.gain.value, t);
    s.gain.linearRampToValueAtTime(0.0001, t + (fade || 0.3));
    setTimeout(() => s.disconnect(), ((fade || 0.3) + 0.2) * 1000);
    pistaActual = null;
  }

  function programar() {
    if (!ac || !pistaActual) return;
    const limite = ac.currentTime + 0.25;
    const p = pistaActual;
    p.voces.forEach((v) => {
      let guard = 0;
      while (v.proximo < limite && guard++ < 64) {
        const pat = v.patrones[v.vuelta % v.patrones.length];
        const tok = pat[v.paso];
        if (tok && tok !== '.' && tok !== '-') {
          // duración: cuántos "-" siguen
          let n = 1;
          while (pat[v.paso + n] === '-') n++;
          const dur = n * p.paso * (v.def.legato || 0.95);
          const vel = (v.def.vol || 0.6) * (0.85 + Math.random() * 0.15);
          if (!(v.def.prob && Math.random() > v.def.prob)) {
            if (v.def.inst === 'percusion') INST.percusion(p.salida, v.proximo, tok, dur, vel);
            else {
              const f = frecuencia(tok) * Math.pow(2, v.def.octava || 0);
              if (f) INST[v.def.inst](p.salida, v.proximo, f, dur, vel);
            }
          }
        }
        v.proximo += p.paso;
        v.paso++;
        if (v.paso >= pat.length) { v.paso = 0; v.vuelta++; }
      }
    });
    // Sonidos de ambiente (pájaros en la selva, gotas en la cueva).
    if (p.def.ambiente && ac.currentTime > ambienteProx) {
      ambienteProx = ac.currentTime + 1.5 + Math.random() * 4;
      efecto(p.def.ambiente === 'selva' ? 'pajaro' : 'gota', { musica: true });
    }
  }

  // ---------------- Efectos de sonido ----------------
  const FX = {
    cursor(d, t) { tronco(d, t, 880, 0.35); },
    aceptar(d, t) { tronco(d, t, 660, 0.5); tronco(d, t + 0.06, 990, 0.5); },
    cancelar(d, t) { tronco(d, t, 440, 0.45); tronco(d, t + 0.06, 330, 0.45); },
    error(d, t) { clic(d, t, 1); clic(d, t + 0.08, 1); },
    texto(d, t) { clic(d, t, 0.25); },
    golpe(d, t) { huehuetl(d, t, 0.9); sonaja(d, t, 1, 0.08); },
    golpeFuerte(d, t) { huehuetl(d, t, 1.3); huehuetl(d, t + 0.04, 1); sonaja(d, t, 1.4, 0.2); },
    preciso(d, t) { INST.ocarina(d, t, 1568, 0.12, 0.9); INST.ocarina(d, t + 0.07, 2093, 0.2, 0.9); },
    critico(d, t) { FX.golpeFuerte(d, t); INST.flauta(d, t, 1760, 0.15, 0.7); },
    fallo(d, t) { const o = osc('sine', 500, t, t + 0.2); o.frequency.exponentialRampToValueAtTime(200, t + 0.18); const g = ac.createGain(); env(g, t, 0.01, 0.05, 0.12, 0.2); o.connect(g); g.connect(d); },
    dardo(d, t) { const n = ruido(t, t + 0.2); const bp = filtro('bandpass', 2400, 3); bp.frequency.exponentialRampToValueAtTime(5000, t + 0.15); const g = ac.createGain(); env(g, t, 0.005, 0.03, 0.12, 0.5); n.connect(bp); bp.connect(g); g.connect(d); },
    fuego(d, t) { const n = ruido(t, t + 0.6); const bp = filtro('lowpass', 900, 2); bp.frequency.linearRampToValueAtTime(3000, t + 0.3); const g = ac.createGain(); env(g, t, 0.02, 0.2, 0.35, 0.6); n.connect(bp); bp.connect(g); g.connect(d); for (let i = 0; i < 6; i++) clic(d, t + Math.random() * 0.5, 0.5); },
    agua(d, t) { for (let i = 0; i < 6; i++) { const tt = t + i * 0.05; const f = 400 + Math.random() * 600; const o = osc('sine', f, tt, tt + 0.1); o.frequency.exponentialRampToValueAtTime(f * 2, tt + 0.08); const g = ac.createGain(); env(g, tt, 0.005, 0.02, 0.06, 0.25); o.connect(g); g.connect(d); } },
    tierra(d, t) { huehuetl(d, t, 1.2); huehuetl(d, t + 0.12, 1); const n = ruido(t, t + 0.7); const lp = filtro('lowpass', 220); const g = ac.createGain(); env(g, t, 0.05, 0.3, 0.3, 0.9); n.connect(lp); lp.connect(g); g.connect(d); },
    viento(d, t) { const n = ruido(t, t + 0.7); const bp = filtro('bandpass', 600, 4); bp.frequency.exponentialRampToValueAtTime(2800, t + 0.35); bp.frequency.exponentialRampToValueAtTime(900, t + 0.65); const g = ac.createGain(); env(g, t, 0.1, 0.25, 0.3, 0.6); n.connect(bp); bp.connect(g); g.connect(d); },
    curar(d, t) { [784, 988, 1175, 1568].forEach((f, i) => INST.ocarina(d, t + i * 0.08, f, 0.2, 0.6)); },
    escudo(d, t) { [523, 659, 784].forEach((f) => INST.ocarina(d, t, f, 0.5, 0.4)); },
    nivel(d, t) { [587, 740, 880, 1175].forEach((f, i) => INST.flauta(d, t + i * 0.1, f, 0.18, 0.7)); INST.flauta(d, t + 0.45, 1175, 0.5, 0.7); },
    cofre(d, t) { tronco(d, t, 523, 0.6); [659, 784, 1047, 1319].forEach((f, i) => INST.ocarina(d, t + 0.15 + i * 0.07, f, 0.25, 0.6)); },
    llave(d, t) { [1319, 1568, 2093].forEach((f, i) => INST.ocarina(d, t + i * 0.09, f, 0.15, 0.7)); },
    puerta(d, t) { huehuetl(d, t, 0.8); const n = ruido(t, t + 0.5); const lp = filtro('lowpass', 400); const g = ac.createGain(); env(g, t, 0.05, 0.2, 0.2, 0.5); n.connect(lp); lp.connect(g); g.connect(d); },
    empujar(d, t) { const n = ruido(t, t + 0.3); const lp = filtro('lowpass', 300); const g = ac.createGain(); env(g, t, 0.02, 0.15, 0.1, 0.5); n.connect(lp); lp.connect(g); g.connect(d); },
    interruptor(d, t) { tronco(d, t, 523, 0.6); tronco(d, t + 0.1, 784, 0.6); },
    cristal(d, t) { [1760, 2349, 2637].forEach((f, i) => INST.ocarina(d, t + i * 0.05, f, 0.3, 0.45)); },
    rugido(d, t) { const o = osc('sawtooth', 90, t, t + 0.7); o.frequency.linearRampToValueAtTime(140, t + 0.15); o.frequency.linearRampToValueAtTime(70, t + 0.6); const lp = filtro('lowpass', 600, 4); const g = ac.createGain(); env(g, t, 0.05, 0.3, 0.3, 0.6); o.connect(lp); lp.connect(g); g.connect(d); const n = ruido(t, t + 0.6); const g2 = ac.createGain(); env(g2, t, 0.05, 0.3, 0.2, 0.25); const bp = filtro('bandpass', 800, 1); n.connect(bp); bp.connect(g2); g2.connect(d); },
    huir(d, t) { [880, 660, 440].forEach((f, i) => tronco(d, t + i * 0.07, f, 0.5)); },
    encuentro(d, t) { INST.caracola(d, t, 147, 0.5, 0.9); huehuetl(d, t, 1); huehuetl(d, t + 0.15, 0.8); },
    jefe(d, t) { INST.caracola(d, t, 110, 1.2, 1); INST.caracola(d, t, 165, 1.2, 0.6); huehuetl(d, t, 1.2); },
    guardar(d, t) { [659, 880, 1319].forEach((f, i) => INST.ocarina(d, t + i * 0.1, f, 0.3, 0.6)); },
    paso(d, t) { clic(d, t, 0.15); },
    revivir(d, t) { [523, 659, 784, 1047, 1319].forEach((f, i) => INST.flauta(d, t + i * 0.07, f, 0.2, 0.6)); },
    muerte(d, t) { const o = osc('triangle', 300, t, t + 0.6); o.frequency.exponentialRampToValueAtTime(80, t + 0.5); const g = ac.createGain(); env(g, t, 0.01, 0.2, 0.3, 0.4); o.connect(g); g.connect(d); },
    colibri(d, t) { [2093, 2637, 3136].forEach((f, i) => INST.ocarina(d, t + i * 0.04, f, 0.08, 0.35)); },
    pajaro(d, t) { const f = 2200 + Math.random() * 1500; const n = 2 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) { const tt = t + i * 0.12; const o = osc('sine', f, tt, tt + 0.1); o.frequency.exponentialRampToValueAtTime(f * 1.4, tt + 0.05); o.frequency.exponentialRampToValueAtTime(f * 0.9, tt + 0.09); const g = ac.createGain(); env(g, tt, 0.005, 0.04, 0.04, 0.08); o.connect(g); g.connect(d); } },
    gota(d, t) { const f = 900 + Math.random() * 700; const o = osc('sine', f, t, t + 0.2); o.frequency.exponentialRampToValueAtTime(f * 2.2, t + 0.08); const g = ac.createGain(); env(g, t, 0.003, 0.02, 0.15, 0.15); o.connect(g); g.connect(d); },
    camara(d, t) { const o = osc('sine', 60, t, t + 1.2); const g = ac.createGain(); env(g, t, 0.05, 0.6, 0.5, 0.7); o.connect(g); g.connect(d); FX.silbatoCorto(d, t); },
    silbatoCorto(d, t) { INST.silbato(d, t, 2200, 0.6, 1); },
    pagina(d, t) { const n = ruido(t, t + 0.25); const bp = filtro('bandpass', 3000, 0.8); bp.frequency.exponentialRampToValueAtTime(1200, t + 0.2); const g = ac.createGain(); env(g, t, 0.02, 0.05, 0.15, 0.35); n.connect(bp); bp.connect(g); g.connect(d); },
    victoria(d, t) { [587, 740, 880].forEach((f, i) => INST.flauta(d, t + i * 0.12, f, 0.2, 0.7)); INST.flauta(d, t + 0.4, 1175, 0.6, 0.7); huehuetl(d, t, 1); huehuetl(d, t + 0.4, 1); }
  };

  function efecto(nombre, op) {
    if (!ac || silenciado) return;
    const fn = FX[nombre];
    if (!fn) return;
    try { fn(op && op.musica ? (pistaActual ? pistaActual.salida : busMusica) : busEfectos, ac.currentTime + 0.005); } catch (e) { /* nada */ }
  }

  const A = {
    frecuencia,
    desbloquear() {
      if (!crear()) return;
      if (ac.state === 'suspended') ac.resume();
      if (nombrePista && !pistaActual) { const n = nombrePista; nombrePista = null; reproducirPista(n); }
    },
    musica(nombre) {
      if (!nombre) { nombrePista = null; detenerPista(0.6); return; }
      reproducirPista(nombre);
    },
    pistaActual: () => nombrePista,
    efecto,
    actualizar() { programar(); },
    configurar(op) {
      if (op.volMusica !== undefined) volMusica = op.volMusica;
      if (op.volEfectos !== undefined) volEfectos = op.volEfectos;
      if (op.silencio !== undefined) silenciado = op.silencio;
      if (ac) {
        busMusica.gain.value = volMusica;
        busEfectos.gain.value = volEfectos;
        maestro.gain.value = silenciado ? 0 : 1;
      }
    },
    alternarSilencio() {
      silenciado = !silenciado;
      A.configurar({});
      if (G.opciones) { G.opciones.silencio = silenciado; G.guardado && G.guardado.guardarOpciones(); }
      document.dispatchEvent(new CustomEvent('silencio', { detail: silenciado }));
      return silenciado;
    },
    silenciado: () => silenciado,
    // Al minimizar la app se pausa el sonido.
    pausar(v) { if (!ac) return; if (v) ac.suspend(); else ac.resume(); }
  };
  G.audio = A;
})();
