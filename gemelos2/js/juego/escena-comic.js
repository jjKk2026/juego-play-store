/* =====================================================================
   ESCENAS DE HISTORIA EN VIÑETAS (estilo cómic)
   Cada escena tiene "páginas"; cada página tiene viñetas que aparecen
   una por una, con trama de puntos, líneas de acción y globos de texto.

   Formato de una viñeta:
   { fondo: 'selva', actores: [{ id: 'hunahpu', x: 0.3, y: 0.9, esc: 3, dir: 2 }],
     textos: [{ tipo: 'caja'|'globo'|'grito', texto: '...', de: 0 }],
     efectos: ['lineas', 'rgb', 'temblor'] }
   x e y van de 0 a 1 dentro de la viñeta (y = dónde pisan los pies).
   Disposiciones de página: '1', '2h', '2v', '3' (una arriba y dos abajo), '4'.
   ===================================================================== */
'use strict';

(function () {
  const P = G.pixel;
  const U = G.util;
  const COL = G.ui.COL;

  const MARGEN = 6, ESPACIO = 5;
  function disposicion(tipo) {
    const W = G.ANCHO - MARGEN * 2, H = G.ALTO - MARGEN * 2;
    const x0 = MARGEN, y0 = MARGEN;
    const mitadW = (W - ESPACIO) / 2, mitadH = (H - ESPACIO) / 2;
    switch (tipo) {
      case '2h': return [[x0, y0, mitadW, H], [x0 + mitadW + ESPACIO, y0, mitadW, H]];
      case '2v': return [[x0, y0, W, mitadH], [x0, y0 + mitadH + ESPACIO, W, mitadH]];
      case '3': return [[x0, y0, W, mitadH], [x0, y0 + mitadH + ESPACIO, mitadW, mitadH], [x0 + mitadW + ESPACIO, y0 + mitadH + ESPACIO, mitadW, mitadH]];
      case '3b': return [[x0, y0, mitadW, mitadH], [x0 + mitadW + ESPACIO, y0, mitadW, mitadH], [x0, y0 + mitadH + ESPACIO, W, mitadH]];
      case '4': return [[x0, y0, mitadW, mitadH], [x0 + mitadW + ESPACIO, y0, mitadW, mitadH], [x0, y0 + mitadH + ESPACIO, mitadW, mitadH], [x0 + mitadW + ESPACIO, y0 + mitadH + ESPACIO, mitadW, mitadH]];
      default: return [[x0, y0, W, H]];
    }
  }

  // ------------------------- FONDOS DE VIÑETA -------------------------
  function degradado(ctx, w, h, arriba, abajo) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, arriba); g.addColorStop(1, abajo);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  function montes(ctx, w, h, y, color, semilla, alto) {
    const rnd = U.semilla(semilla);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) ctx.lineTo(x, y - rnd() * (alto || 14));
    ctx.lineTo(w, h);
    ctx.fill();
  }
  function arbolesFondo(ctx, w, h, y, color, semilla) {
    const rnd = U.semilla(semilla);
    for (let x = -10; x < w + 10; x += 14 + rnd() * 10) {
      const r = 10 + rnd() * 10;
      P.elipse(ctx, x, y - r * 0.6, r, r * 0.9, color);
      P.rect(ctx, x - 1, y - 4, 3, h - y + 4, U.tono(color, -0.3));
    }
  }
  function luciernagas(ctx, w, h, t, n, color) {
    for (let i = 0; i < n; i++) {
      const x = (i * 53 + Math.sin(t * 0.7 + i) * 8) % w;
      const y = (i * 37 % h) + Math.cos(t + i * 2) * 5;
      const a = 0.5 + Math.sin(t * 3 + i) * 0.5;
      if (a > 0.3) { P.brillo(ctx, x, y, 5, color || '#e9ff70', 0.5 * a); P.px(ctx, x, y, '#fffbd0'); }
    }
  }

  const FONDOS = {
    cielo(ctx, w, h, t) {
      degradado(ctx, w, h, '#3aa0d8', '#bfe9ff');
      P.elipse(ctx, w * 0.75, h * 0.28, 14, 14, '#fff3b0');
      P.brillo(ctx, w * 0.75, h * 0.28, 40, '#ffd166', 0.5);
      montes(ctx, w, h, h * 0.7, '#5a9a7a', 3, 18);
      arbolesFondo(ctx, w, h, h * 0.85, '#2f7a35', 5);
    },
    cieloOscuro(ctx, w, h, t) {
      degradado(ctx, w, h, '#0d0618', '#3a1f5c');
      // el lugar del sol, vacío, con grietas de neón
      P.elipse(ctx, w * 0.7, h * 0.3, 14, 14, '#120a1c');
      ctx.strokeStyle = '#ff2a6d'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(w * 0.7, h * 0.3, 15 + Math.sin(t * 3), 0, Math.PI * 2); ctx.stroke();
      P.brillo(ctx, w * 0.7, h * 0.3, 30, '#7b2cbf', 0.4);
      montes(ctx, w, h, h * 0.72, '#1d1330', 3, 18);
      arbolesFondo(ctx, w, h, h * 0.88, '#120a1c', 5);
    },
    selva(ctx, w, h, t) {
      degradado(ctx, w, h, '#7ccf8a', '#2f7a35');
      arbolesFondo(ctx, w, h, h * 0.55, '#3f9a42', 11);
      arbolesFondo(ctx, w, h, h * 0.8, '#2f6e2e', 12);
      ctx.fillStyle = '#4a9c40'; ctx.fillRect(0, h * 0.85, w, h);
      // rayos de luz
      ctx.save(); ctx.globalAlpha = 0.15; ctx.fillStyle = '#fff3b0';
      for (let i = 0; i < 3; i++) { ctx.beginPath(); const x = w * (0.2 + i * 0.3); ctx.moveTo(x, 0); ctx.lineTo(x + 12, 0); ctx.lineTo(x - 20, h); ctx.lineTo(x - 34, h); ctx.fill(); }
      ctx.restore();
      luciernagas(ctx, w, h * 0.8, t, 6);
    },
    selvaNoche(ctx, w, h, t) {
      degradado(ctx, w, h, '#0d1a2a', '#1d3a2a');
      arbolesFondo(ctx, w, h, h * 0.55, '#16302a', 11);
      arbolesFondo(ctx, w, h, h * 0.8, '#0f241f', 12);
      ctx.fillStyle = '#14281f'; ctx.fillRect(0, h * 0.85, w, h);
      luciernagas(ctx, w, h * 0.85, t, 14);
    },
    casa(ctx, w, h, t) {
      degradado(ctx, w, h, '#5c3a22', '#3a2414');
      for (let x = 0; x < w; x += 6) P.rect(ctx, x, 0, 1, h * 0.75, '#4a2e1a');
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(0, h * 0.75, w, h);
      // fogón
      P.elipse(ctx, w * 0.5, h * 0.82, 10, 3, '#2a1a10');
      P.elipse(ctx, w * 0.5, h * 0.76, 5, 6 + Math.sin(t * 9), '#ff7a3d');
      P.elipse(ctx, w * 0.5, h * 0.78, 2, 3, '#fff3b0');
      P.brillo(ctx, w * 0.5, h * 0.75, 50, '#ff9a3d', 0.35);
    },
    ceiba(ctx, w, h, t) {
      degradado(ctx, w, h, '#ffd9a0', '#7ccf8a');
      // gran ceiba: tronco con contrafuertes y copa enorme
      ctx.fillStyle = '#8c8a7a';
      ctx.beginPath(); ctx.moveTo(w * 0.42, h); ctx.lineTo(w * 0.47, h * 0.35); ctx.lineTo(w * 0.53, h * 0.35); ctx.lineTo(w * 0.58, h); ctx.fill();
      P.elipse(ctx, w * 0.5, h * 0.22, w * 0.45, h * 0.2, '#2f7a35');
      P.elipse(ctx, w * 0.45, h * 0.18, w * 0.3, h * 0.13, '#3f9a42');
      P.elipse(ctx, w * 0.4, h * 0.14, w * 0.12, h * 0.06, '#5cbf55');
      ctx.fillStyle = '#4a9c40'; ctx.fillRect(0, h * 0.9, w, h);
      luciernagas(ctx, w, h * 0.9, t, 5);
    },
    xibalba(ctx, w, h, t) {
      degradado(ctx, w, h, '#05020a', '#24123a');
      for (let i = 0; i < 6; i++) {
        const x = (i * 71) % w, c = ['#05d9e8', '#ff2a6d', '#b18cff'][i % 3];
        P.triangulo(ctx, x, h * 0.6, x - 8, h, x + 8, h, U.tono(c, -0.4));
        P.brillo(ctx, x, h * 0.75, 22, c, 0.35 + Math.sin(t * 2 + i) * 0.1);
      }
      ctx.fillStyle = '#0d3b66'; ctx.fillRect(0, h * 0.88, w, h);
      ctx.fillStyle = '#05d9e8'; for (let x = (t * 20) % 10; x < w; x += 10) ctx.fillRect(x, h * 0.88, 4, 1);
    },
    palacio(ctx, w, h, t) {
      degradado(ctx, w, h, '#110a1a', '#3a2852');
      for (let x = 10; x < w; x += 40) {
        P.rect(ctx, x, h * 0.1, 12, h * 0.8, '#2e2044');
        P.rect(ctx, x, h * 0.1, 3, h * 0.8, '#4a3a5e');
        P.rect(ctx, x - 2, h * 0.08, 16, 4, '#e8b64c');
      }
      ctx.fillStyle = '#1e1727'; ctx.fillRect(0, h * 0.85, w, h);
      ctx.fillStyle = '#e8b64c'; ctx.fillRect(0, h * 0.85, w, 1);
      P.brillo(ctx, w * 0.5, h * 0.4, 60, '#ff2a6d', 0.18 + Math.sin(t * 2) * 0.05);
    },
    amanecer(ctx, w, h, t) {
      degradado(ctx, w, h, '#ff8a4c', '#ffe9a8');
      const y = h * 0.62 - Math.min(1, t / 3) * h * 0.25;
      P.elipse(ctx, w * 0.5, y, 22, 22, '#fff3b0');
      P.brillo(ctx, w * 0.5, y, 80, '#ffd166', 0.6);
      ctx.save(); ctx.globalAlpha = 0.25; ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2 + t * 0.1;
        ctx.beginPath(); ctx.moveTo(w * 0.5, y);
        ctx.lineTo(w * 0.5 + Math.cos(a) * 300, y + Math.sin(a) * 300);
        ctx.lineTo(w * 0.5 + Math.cos(a + 0.08) * 300, y + Math.sin(a + 0.08) * 300); ctx.fill();
      }
      ctx.restore();
      montes(ctx, w, h, h * 0.75, '#3f7a4a', 9, 16);
      arbolesFondo(ctx, w, h, h * 0.9, '#2f6e2e', 4);
    },
    noche(ctx, w, h, t) {
      degradado(ctx, w, h, '#0d0618', '#1d1330');
      for (let i = 0; i < 40; i++) P.px(ctx, (i * 97) % w, (i * 53) % (h * 0.7), i % 5 ? '#9b8fb0' : '#ffffff');
      P.elipse(ctx, w * 0.25, h * 0.25, 9, 9, '#e8f4ff');
      P.brillo(ctx, w * 0.25, h * 0.25, 30, '#bfe9ff', 0.4);
      montes(ctx, w, h, h * 0.8, '#120a1c', 8, 12);
    },
    rojo(ctx, w, h) { degradado(ctx, w, h, '#ff2a6d', '#7b2cbf'); },
    oro(ctx, w, h) { degradado(ctx, w, h, '#ffd166', '#ff8a4c'); }
  };

  function dibujarActor(ctx, a, w, h, t) {
    const esc = a.esc || 3;
    let img;
    if (a.id === 'colibri') img = G.arte.colibri(Math.floor(t * 8), a.dir === 1);
    else if (a.id === 'alux') img = G.arte.alux(Math.floor(t * 2));
    else if (G.arte.PALETAS[a.id]) img = G.arte.personaje(a.id, a.dir === undefined ? 0 : a.dir, a.cuadro || 0);
    else img = G.arte.criatura(a.id, Math.floor(t * 3));
    if (!img) return null;
    const flota = (a.id === 'colibri') ? Math.sin(t * 4) * 2 * esc / 3 : 0;
    const x = Math.round(a.x * w - (img.width * esc) / 2);
    const y = Math.round(a.y * h - img.height * esc + flota);
    if (a.brillo) P.brillo(ctx, a.x * w, a.y * h - img.height * esc / 2, img.width * esc, a.brillo, 0.45);
    if (a.sombra) {
      ctx.drawImage(P.silueta(img, '#0a0612'), x + esc, y + esc, img.width * esc, img.height * esc);
    }
    ctx.drawImage(img, x, y, img.width * esc, img.height * esc);
    return { x: x + img.width * esc / 2, y, w: img.width * esc };
  }

  // Globo de diálogo con colita apuntando a quien habla.
  function globo(ctx, txt, bx, by, w, opciones) {
    const lineas = G.fuente.envolver(txt.texto, w - 10);
    const alto = lineas.length * 11 + 6;
    const ancho = Math.min(w, Math.max(...lineas.map((l) => G.fuente.ancho(l))) + 12);
    let x = U.limitar(bx - ancho / 2, 2, opciones.pw - ancho - 2);
    let y = U.limitar(by - alto - 8, opciones.minY || 2, opciones.ph - alto - 2);
    const grito = txt.tipo === 'grito';
    ctx.fillStyle = '#0a0612';
    if (grito) {
      // globo de grito con picos
      ctx.beginPath();
      const cx = x + ancho / 2, cy = y + alto / 2;
      for (let i = 0; i < 28; i++) {
        const a = i / 28 * Math.PI * 2, k = i % 2 ? 1 : 1.25;
        const px = cx + Math.cos(a) * (ancho / 2 + 4) * k, py = cy + Math.sin(a) * (alto / 2 + 4) * k;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff3b0';
      ctx.save(); ctx.translate(cx, cy); ctx.scale(0.92, 0.88); ctx.translate(-cx, -cy); ctx.fill(); ctx.restore();
    } else {
      ctx.fillRect(x - 1, y - 1, ancho + 2, alto + 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, ancho, alto);
      // colita
      if (bx !== undefined) {
        const tx = U.limitar(bx, x + 6, x + ancho - 6);
        P.triangulo(ctx, tx - 4, y + alto - 1, tx + 3, y + alto - 1, tx + (bx > x + ancho / 2 ? 4 : -4), y + alto + 6, '#0a0612');
        P.triangulo(ctx, tx - 3, y + alto - 2, tx + 2, y + alto - 2, tx + (bx > x + ancho / 2 ? 3 : -3), y + alto + 4, '#ffffff');
      }
    }
    return { x, y, ancho, alto, lineas };
  }

  // ------------------------- ESCENA -------------------------
  class EscenaComic {
    constructor(id, alTerminar) {
      const m = G.partida.hay() ? G.partida.mundo() : G.mundos.obtener('maya2');
      this.def = (m.historia && m.historia[id]) || { paginas: [] };
      this.alTerminar = alTerminar;
      this.pagina = 0;
      this.vineta = 0;
      this.t = 0;
      this.tv = 0;        // tiempo de la viñeta actual
      this.letras = 0;
      this.cache = null;
      this.saltar = 0;
      this.terminado = false;
    }
    entrar() {
      if (this.def.musica) G.audio.musica(this.def.musica);
      this.prepararPagina();
    }
    get paginaActual() { return this.def.paginas[this.pagina]; }
    prepararPagina() {
      const p = this.paginaActual;
      if (!p) return;
      this.rects = disposicion(p.disposicion || String(p.vinetas.length));
      this.vineta = 0;
      this.iniciarVineta();
      G.audio.efecto('pagina');
    }
    iniciarVineta() {
      this.tv = 0;
      this.letras = 0;
      const v = this.paginaActual.vinetas[this.vineta];
      this.totalLetras = (v.textos || []).reduce((a, t) => a + G.fuente.largo(t.texto), 0);
      (v.efectos || []).forEach((e) => {
        if (e === 'temblor') G.fx.temblor(4, 0.4);
        if (e === 'rgb') G.fx.rgb(0.4);
        if (e === 'destello') G.fx.destello('#ffffff', 0.3);
      });
      if (v.sonido) G.audio.efecto(v.sonido);
    }
    avanzar() {
      if (this.letras < this.totalLetras) { this.letras = this.totalLetras; return; }
      const p = this.paginaActual;
      if (this.vineta < p.vinetas.length - 1) {
        this.vineta++;
        this.iniciarVineta();
      } else if (this.pagina < this.def.paginas.length - 1) {
        this.pagina++;
        this.prepararPagina();
      } else this.terminar();
    }
    terminar() {
      if (this.terminado) return;
      this.terminado = true;
      G.entrada.limpiar();
      this.alTerminar && this.alTerminar();
    }
    actualizar(dt) {
      if (this.terminado || !this.paginaActual) { if (!this.terminado) this.terminar(); return; }
      this.t += dt;
      this.tv += dt;
      const vel = [0, 22, 45, 90, 9999][G.opciones.velocidadTexto] || 45;
      if (this.tv > 0.35) this.letras = Math.min(this.totalLetras, this.letras + vel * dt);
      const E = G.entrada;
      if (E.presionado('a') || E.consumirToque()) this.avanzar();
      // Mantener B (o pausa) para saltar la escena.
      if (E.mantenido('b') || E.mantenido('pausa')) {
        this.saltar += dt;
        if (this.saltar > 0.8) this.terminar();
      } else this.saltar = 0;
    }
    dibujar(ctx) {
      ctx.fillStyle = '#f4efe6';
      ctx.fillRect(0, 0, G.ANCHO, G.ALTO);
      // papel con trama suave
      P.trama(ctx, 0, 0, G.ANCHO, G.ALTO, '#e4dccd', 4, 1);
      const p = this.paginaActual;
      if (!p) return;
      let restante = this.letras;
      for (let i = 0; i <= this.vineta && i < p.vinetas.length; i++) {
        const actual = i === this.vineta;
        const entrada = actual ? U.suave(Math.min(1, this.tv / 0.3)) : 1;
        this.dibujarVineta(ctx, p.vinetas[i], this.rects[i] || this.rects[0], entrada, actual ? restante : 9999, actual);
      }
      // indicador para avanzar
      if (this.letras >= this.totalLetras && Math.floor(this.t * 3) % 2 === 0) {
        G.fuente.texto(ctx, '▶', G.ANCHO - 14, G.ALTO - 14, '#1a0f1f');
      }
      if (this.saltar > 0) {
        const w = 60 * Math.min(1, this.saltar / 0.8);
        ctx.fillStyle = '#1a0f1f'; ctx.fillRect(G.ANCHO - 70, 2, 64, 6);
        ctx.fillStyle = '#e8b64c'; ctx.fillRect(G.ANCHO - 68, 4, w, 2);
      }
    }
    dibujarVineta(ctx, v, r, entrada, letras, actual) {
      const [rx, ry, rw, rh] = r;
      const desliza = (1 - entrada) * 14;
      const x = Math.round(rx + (v.desde === 'izq' ? -desliza : desliza * 0.4));
      const y = Math.round(ry + desliza * 0.3);
      const w = Math.round(rw), h = Math.round(rh);
      ctx.save();
      ctx.globalAlpha = Math.min(1, entrada * 1.5);
      // sombra y borde grueso
      ctx.fillStyle = '#0a0612';
      ctx.fillRect(x + 3, y + 3, w, h);
      ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
      ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
      ctx.translate(x, y);
      (FONDOS[v.fondo] || FONDOS.selva)(ctx, w, h, this.t);
      // trama de puntos (sombreado de cómic)
      if (v.trama !== false) {
        P.trama(ctx, 0, 0, w, h, 'rgba(10,6,18,0.18)', 4, (i, j) => Math.round((j / h) * 2.4));
      }
      if (v.efectos && v.efectos.includes('lineas')) {
        ctx.save(); ctx.globalAlpha = 0.6; ctx.fillStyle = '#ffffff';
        const cx = w / 2, cy = h / 2, rnd = U.semilla(Math.floor(this.t * 12));
        for (let i = 0; i < 30; i++) {
          const a = rnd() * Math.PI * 2, r0 = Math.min(w, h) * 0.35;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
          ctx.lineTo(cx + Math.cos(a - 0.02) * w, cy + Math.sin(a - 0.02) * w);
          ctx.lineTo(cx + Math.cos(a + 0.02) * w, cy + Math.sin(a + 0.02) * w);
          ctx.fill();
        }
        ctx.restore();
      }
      const posiciones = (v.actores || []).map((a) => dibujarActor(ctx, a, w, h, this.t));
      // colores desfasados al entrar viñetas de impacto
      if (v.efectos && v.efectos.includes('rgb') && actual && this.tv < 0.4) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#ff2a6d'; ctx.fillRect(-2, 0, 3, h);
        ctx.fillStyle = '#05d9e8'; ctx.fillRect(w - 1, 0, 3, h);
        ctx.globalAlpha = 1;
      }
      // textos
      let yCaja = 3;
      (v.textos || []).forEach((txt) => {
        const n = G.fuente.largo(txt.texto);
        const visibles = Math.max(0, Math.min(n, Math.floor(letras)));
        letras -= n;
        if (visibles <= 0 && actual) return;
        if (txt.tipo === 'caja') {
          const lineas = G.fuente.envolver(txt.texto, w - 14);
          const ch = lineas.length * 11 + 5;
          const cw = Math.min(w - 6, Math.max(...lineas.map((l) => G.fuente.ancho(l))) + 10);
          const cx = txt.abajo ? w - cw - 3 : 3, cy = txt.abajo ? h - ch - 3 : yCaja;
          ctx.fillStyle = '#0a0612'; ctx.fillRect(cx - 1, cy - 1, cw + 2, ch + 2);
          ctx.fillStyle = '#ffd166'; ctx.fillRect(cx, cy, cw, ch);
          let resto = visibles;
          lineas.forEach((l, i) => { G.fuente.texto(ctx, l, cx + 5, cy + 3 + i * 11, '#1a0f1f', { hasta: resto, resalte: '#9b1d2b' }); resto -= G.fuente.largo(l); });
          if (!txt.abajo) yCaja += ch + 4;
        } else {
          const pos = posiciones[txt.de || 0] || { x: w / 2, y: h * 0.6 };
          const bw = Math.min(w - 8, txt.ancho || 150);
          const g = globo(ctx, txt, pos.x + (txt.dx || 0), pos.y + (txt.dy || 0), bw, { pw: w, ph: h, minY: yCaja + 1 });
          let resto = visibles;
          const color = txt.tipo === 'grito' ? '#9b1d2b' : '#1a0f1f';
          g.lineas.forEach((l, i) => { G.fuente.texto(ctx, l, g.x + 6, g.y + 4 + i * 11, color, { hasta: resto, resalte: '#2a9d8f' }); resto -= G.fuente.largo(l); });
        }
      });
      // onomatopeya dibujada dentro de la viñeta
      if (v.ono) {
        const k = Math.min(1, this.tv / 0.2);
        G.fuente.texto(ctx, v.ono, w * (v.onoX || 0.75), h * (v.onoY || 0.2), '#ffd166', { escala: k < 1 ? 2 : 3, alinear: 'centro', borde: '#0a0612' });
      }
      ctx.restore();
    }
  }

  G.EscenaComic = EscenaComic;
  G.comicFondos = FONDOS;
})();
