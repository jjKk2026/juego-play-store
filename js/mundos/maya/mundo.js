/* =====================================================================
   MUNDO MAYA: XIBALBÁ (Popol Vuh)
   Aquí se juntan todas las piezas del mundo (mapas, criaturas, historia)
   y se escriben los "eventos": pequeñas escenas que pasan al hablar con
   alguien, al pisar un lugar o al encontrar a un jefe.

   Para crear un mundo nuevo (por ejemplo el Mictlán), copia esta carpeta,
   cambia los mapas, criaturas, historia y música, y agrega sus archivos
   en index.html, sw.js y la prueba. Mira el README.
   ===================================================================== */
'use strict';

(function () {
  const W = G.mundoMaya;
  const { TZ, AB, HU, IX, di } = W;

  // Para no repetir: un evento que solo pasa la primera vez.
  const unaVez = (bandera, fn) => async (esc, p) => {
    if (p.bandera(bandera)) return;
    p.poner(bandera);
    await fn(esc, p);
  };

  const eventos = {
    // ------------------------------ SELVA ------------------------------
    bienvenida: unaVez('bienvenida', async (esc, p) => {
      p.poner('colibri');
      G.audio.efecto('colibri');
      await esc.decir([
        di(TZ, '¡Aquí estoy! Volaré siempre cerca de ustedes. Si necesitan una pista, búsquenme en el menú de pausa.'),
        di(TZ, G.entrada.explicacion()),
        di(TZ, 'Primero hablen con su abuela Ixmucané. Está junto a su casa, aquí a la izquierda.')
      ]);
      p.objetivo('abuela');
    }),

    abuela: async (esc, p) => {
      if (!p.bandera('abuela')) {
        await esc.decir([
          di(AB, 'Ay, mis niños... desde que el cielo se quebró, el sol ya no sale. La milpa tiene frío y los pájaros casi no cantan.'),
          di(AB, 'Los Señores de Xibalbá se llevaron la luz a su casa, allá abajo, en el inframundo. Ustedes son valientes, como su padre.'),
          di(AB, 'El camino empieza en la gran *ceiba*, al norte. Pero en sus raíces se metió *Vucub Caquix*, el ave presumida que dice ser el sol.'),
          di(AB, 'Tomen: *cacao* para la vida, *cuentas de jade* para la energía, *copal* para escapar y una *pluma de quetzal* por si uno de ustedes cae.')
        ]);
        p.dar('cacao', 3); p.dar('jade', 2); p.dar('copal', 1); p.dar('pluma', 1);
        G.audio.efecto('cofre');
        G.ui.aviso('Recibiste cacao, jade, copal y una pluma', '#ffd166');
        await esc.decir([di(AB, 'Si se cansan, descansen en los *altares de copal*. El humo sagrado los cuida y guarda su camino. ¡Vayan con cuidado!')]);
        p.poner('abuela');
        p.objetivo('templo');
        p.guardar();
        return;
      }
      p.curarTodo();
      G.audio.efecto('curar');
      const frase = p.bandera('fin') ? '¡Mis niños! El sol volvió a calentar la milpa. Estoy tan orgullosa...'
        : p.bandera('vucubVencido') ? 'Dicen que vencieron a Vucub Caquix. Bajen con cuidado a Xibalbá; allá todo es engaño.'
          : 'Cuídense mucho. Vucub Caquix los espera en las raíces de la ceiba.';
      await esc.decir([di(AB, frase), 'La abuela les sirve atole calientito. Recuperan toda su vida y energía.']);
    },

    llegadaTemplo: unaVez('llegadaTemplo', async (esc) => {
      await esc.decir([di(TZ, 'Las raíces de la ceiba... Aquí abajo hay puertas, rejas y cristales. Lean las estelas: siempre dan pistas.')]);
    }),

    jefeVucub: async (esc, p) => {
      await esc.decir([
        { quien: 'Vucub Caquix', texto: '¿Quién se atreve a entrar en mi árbol? ¡Mírenme bien! Mis ojos son de plata y mis dientes, de piedras preciosas.' },
        { quien: 'Vucub Caquix', texto: '¡Yo soy el sol! ¡Yo soy la luz! ¿Para qué quieren otro sol, si me tienen a mí?' },
        di(HU, 'Tu brillo no calienta la milpa ni alumbra el camino. Tú no eres el sol.'),
        di(IX, 'Y entre tus plumas brilla algo que no es tuyo: ¡una chispa de la luz robada!'),
        di(TZ, '¡Cuidado! Su punto débil es el *viento*: la *cerbatana* de {H} le hará mucho daño. ¡Y no olviden el golpe preciso!')
      ]);
      const r = await esc.combate({ grupo: ['vucubCaquix'], jefe: true, musica: 'jefe' });
      if (r !== 'victoria') return;
      p.poner('vucubVencido');
      p.objetivo('cuevas');
      esc.quitarObjeto(esc.buscar((o) => o.tipo === 'jefe'));
      esc.aparecer('Y');
      await esc.comic('vucubDespues');
      await esc.decir([di(TZ, 'Ese portal nos devuelve a la selva. El camino a Xibalbá baja por el *noreste*, junto a las rocas.')]);
      p.guardar();
    },

    // ------------------------------ CUEVAS ------------------------------
    llegadaCuevas: unaVez('llegadaCuevas', async (esc, p) => {
      await esc.comic('xibalba');
      await esc.decir([di(TZ, 'Busquemos el *cruce de los cuatro caminos*. Está al sur de aquí.')]);
      p.objetivo('cruce');
    }),
    caminoRojo: async (esc) => volverAlCruce(esc, 'rojo'),
    caminoBlanco: async (esc) => volverAlCruce(esc, 'blanco'),
    caminoAmarillo: async (esc) => volverAlCruce(esc, 'amarillo'),
    caminoNegro: unaVez('caminoNegro', async (esc, p) => {
      G.audio.efecto('camara');
      await esc.decir([
        { quien: 'Camino negro', texto: '"Yo soy el camino de Xibalbá. Síganme."' },
        di(TZ, '¿Lo oyeron? ¡El camino negro habló, igual que en el Popol Vuh! Crucemos el río hacia el este.')
      ]);
      p.objetivo('canon');
    }),
    llegadaCanon: unaVez('llegadaCanon', async (esc, p) => {
      await esc.decir([
        di(TZ, 'El cañón de Meauán. Aquí se esconde *Zipacná*, hijo de Vucub Caquix. Dicen que él hace las montañas.'),
        di(TZ, 'Este lugar está lleno de fuego y cristales. Lean las estelas.')
      ]);
      p.objetivo('canonPistas');
    }),
    jefeZipacna: async (esc, p) => {
      await esc.decir([
        { quien: 'Zipacná', texto: '¿Ustedes vencieron a mi padre? ¡Yo soy Zipacná! Yo levanto las montañas y las cargo sobre mis hombros.' },
        di(IX, 'Conocemos tu historia. Una montaña terminó cayendo sobre ti.'),
        { quien: 'Zipacná', texto: '¡Ja! ¡Esta vez seré yo quien les lance la montaña!' },
        di(TZ, '¡Es débil al *agua*! La *Ola del río* de {I} y el *Eclipse gemelo* son buenas ideas. Cuidado con su pisotón.')
      ]);
      const r = await esc.combate({ grupo: ['zipacna'], jefe: true, musica: 'jefe' });
      if (r !== 'victoria') return;
      p.poner('zipacnaVencido');
      p.objetivo('pruebas');
      esc.quitarObjeto(esc.buscar((o) => o.tipo === 'jefe'));
      esc.aparecer('Y');
      await esc.comic('zipacnaDespues');
      p.guardar();
    },

    // ------------------------------ PALACIO ------------------------------
    llegadaPalacio: unaVez('llegadaPalacio', async (esc, p) => {
      await esc.comic('palacio');
      await esc.decir([di(TZ, 'Tres casas, tres sellos: la *Oscura* al oeste, la de los *Murciélagos* al norte y la de los *Jaguares* al este. Hay un altar para descansar.')]);
      p.objetivo('pruebas');
    }),
    entradaOscura: unaVez('entradaOscura', async (esc) => {
      await esc.decir([
        di(HU, 'No veo nada...'),
        di(TZ, 'La Casa Oscura. ¿Recuerdan el relato? Los gemelos usaron *luciérnagas* para engañar a los Señores.'),
        di(TZ, 'Encontremos tres luciérnagas: cada una hará crecer nuestra luz. La puerta del sello está al noreste.')
      ]);
    }),
    avisoOscura: async () => {},
    entradaMurcielagos: unaVez('entradaMurcielagos', async (esc) => {
      await esc.decir([
        di(IX, 'Escucha esos chillidos...'),
        di(TZ, 'Los murciélagos vuelan de arriba abajo sin parar. Pasen cuando estén lejos... o prepárense para luchar.'),
        di(TZ, 'Para abrir la última sala hay que despertar *dos cristales* con la cerbatana.')
      ]);
    }),
    avisoMurcielagos: async () => {},
    entradaJaguares: unaVez('entradaJaguares', async (esc) => {
      await esc.decir([
        di(TZ, 'Jaguares hambrientos cuidan los pasos. En el relato, los gemelos les lanzaron *huesos*.'),
        di(TZ, 'Tomen huesos de las pilas y dénselos a los jaguares (botón A frente a ellos).')
      ]);
    }),
    avisoJaguares: async () => {},
    selloObtenido: async (esc, p) => {
      const n = p.especial('sellos');
      if (n >= 3) {
        p.objetivo('trono');
        await esc.decir([di(TZ, '¡Los *tres sellos*! La gran puerta del norte del palacio ya puede abrirse. Los Señores nos esperan.')]);
      } else {
        await esc.decir([di(TZ, `¡Un sello! Llevamos ${n} de 3. Volvamos al palacio por la siguiente casa.`)]);
      }
      p.guardar();
    },
    antesTrono: unaVez('antesTrono', async (esc) => {
      await esc.decir([di(TZ, 'Ahí están... *Hun Camé* y *Vucub Camé*, los señores más poderosos de Xibalbá. Si lo necesitan, descansen en el altar.')]);
    }),
    jefeFinal: async (esc, p) => {
      await esc.decir([
        { quien: 'Hun Camé', texto: 'Así que los hijos de Hun Hunahpú llegaron hasta aquí. Pasaron nuestras casas... con trucos.' },
        { quien: 'Vucub Camé', texto: 'Pero la luz del sol se queda en Xibalbá. Aquí abajo, nosotros decidimos.' },
        di(HU, 'La luz es de todos: de la milpa, de los ríos, de la gente de maíz.'),
        di(IX, '¡Venimos a llevarla de vuelta!'),
        di(TZ, 'Hun Camé es débil al *fuego* y Vucub Camé al *agua*. ¡Usen las técnicas dobles!')
      ]);
      const r = await esc.combate({ grupo: ['hunCame', 'vucubCame'], jefe: true, musica: 'jefeFinal' });
      if (r !== 'victoria') return;
      p.poner('fin');
      p.objetivo('fin');
      p.curarTodo();
      p.guardar();
      await esc.comic('final');
      G.motor.cambiar(new G.EscenaCreditos(), { dur: 1 });
    }
  };

  async function volverAlCruce(esc, color) {
    await esc.decir([`El camino ${color} da vueltas y vueltas entre la niebla... y te devuelve al cruce.`]);
    esc.teletransportar(10, 17, 2);
  }

  G.mundos.registrar({
    id: 'maya',
    nombre: 'Xibalbá',
    cultura: 'Maya (k\'iche\')',
    heroes: ['hunahpu', 'ixbalanque'],
    inicio: { mapa: 'selva', x: 15, y: 24, dir: 1, escena: 'intro', objetivo: 'abuela', objetos: {} },
    zonas: {
      selva: { nombre: 'Selva de Ceiba', musica: 'selva' },
      cuevas: { nombre: 'Cuevas de Xibalbá', musica: 'cuevas' },
      casa: { nombre: 'Casa de los Señores', musica: 'palacio' }
    },
    mapas: W.mapas,
    criaturas: W.criaturas,
    historia: W.historia,
    dialogos: W.dialogos,
    pistas: W.pistas,
    fragmentos: W.fragmentos,
    eventos
  });
})();
