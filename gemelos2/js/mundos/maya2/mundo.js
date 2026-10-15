/* =====================================================================
   MUNDO MAYA: XIBALBÁ (Gemelos del Sol 2: El Sello de Camazotz)
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
  const { TZ, AB, HU, IX, IXP, di } = W;

  // Para no repetir: un evento que solo pasa la primera vez.
  const unaVez = (bandera, fn) => async (esc, p) => {
    if (p.bandera(bandera)) return;
    p.poner(bandera);
    await fn(esc, p);
  };

  // Combate contra un jefe que se purifica: devuelve true si quedó purificado.
  async function jefePurificable(esc, p, criatura) {
    const r = await esc.combate({ grupo: [criatura], modo: 'jefe', musica: 'jefe' });
    return r === 'victoria';
  }
  function darReliquia(p, id) {
    p.darEspecial(id);
    G.audio.efecto('cofre');
    G.ui.aviso(`Reliquia sagrada: ${G.datos.RELIQUIAS[id].nombre} (${p.reliquias()}/3)`, '#e9ff70');
  }

  const eventos = {
    // ------------------------------ SELVA ------------------------------
    entrarSelva: async (esc, p) => {
      if (!p.bandera('bienvenida')) return eventos.bienvenida(esc, p);
      if (p.bandera('vucubVencido') && !p.bandera('duelo')) return eventos.duelo(esc, p);
    },
    bienvenida: unaVez('bienvenida', async (esc, p) => {
      p.poner('colibri');
      G.audio.efecto('colibri');
      await esc.decir([
        di(TZ, '{H}, no estás solo. Yo, Tz\'unun, volaré contigo. Si necesitas una pista, búscame en el menú de pausa.'),
        di(TZ, G.entrada.explicacion()),
        di(TZ, 'Primero habla con la abuela Ixmucané. Está junto a su casa, aquí a la izquierda.')
      ]);
      p.objetivo('abuela');
    }),

    abuela: async (esc, p) => {
      if (!p.bandera('abuela')) {
        await esc.decir([
          di(AB, 'Ay, mi niño... el Sello de Camazotz le borró los recuerdos a tu hermano. Pero su corazón sigue ahí dentro.'),
          di(AB, 'Escucha bien: si le haces daño, le haces daño a él. El sello solo se rompe con *luz pura*: purificándolo con tu espíritu o con reliquias sagradas.'),
          di(AB, 'Los enemigos grandes de Xibalbá también tienen luz atrapada. Véncelos y *purifícalos*: te ayudarán como espíritus.'),
          di(AB, 'Toma: *cacao* para la vida, *cuentas de jade* para los PE, *copal* para escapar y una *pluma de quetzal*: si caes, te levantará sola.')
        ]);
        p.dar('cacao', 3); p.dar('jade', 2); p.dar('copal', 1); p.dar('pluma', 1);
        G.audio.efecto('cofre');
        G.ui.aviso('Recibiste cacao, jade, copal y una pluma', '#ffd166');
        await esc.decir([
          di(AB, 'Vucub Caquix se metió otra vez en las raíces de la gran *ceiba*, al norte. Dicen que guarda una chispa del sol.'),
          di(AB, 'Si te cansas, descansa en los *altares de copal*. ¡Ve con cuidado!')
        ]);
        p.poner('abuela');
        p.objetivo('templo');
        p.guardar();
        return;
      }
      p.curarTodo();
      G.audio.efecto('curar');
      const frase = p.bandera('fin') ? '¡Mis dos niños juntos otra vez! No hay nada más bonito.'
        : p.bandera('duelo') ? 'Tu hermano bajó a Xibalbá. Busca las tres reliquias, mi niño.'
          : 'Vucub Caquix te espera en las raíces de la ceiba.';
      await esc.decir([di(AB, frase), 'La abuela te sirve atole calientito. Recuperas toda la vida y los PE.']);
    },

    llegadaTemplo: unaVez('llegadaTemplo', async (esc) => {
      await esc.decir([di(TZ, 'Las raíces de la ceiba... Hay puertas, rejas y cristales. Lee las estelas: siempre dan pistas.')]);
    }),

    jefeVucub: async (esc, p) => {
      await esc.decir([
        { quien: 'Vucub Caquix', texto: '¿Tú otra vez? ¿Y solito? ¡Ja! Sin tu hermano no eres nada.' },
        { quien: 'Vucub Caquix', texto: 'Los Señores me dieron una chispa del sol. ¡Ahora sí soy el sol de verdad!' },
        di(HU, 'Esa luz no es tuya. Y voy a necesitarla para salvar a mi hermano.'),
        di(TZ, 'Es débil al *viento*: usa el *Viento cortante*. Si recibes golpes, tu barra de *Límite* se llena. Cuando caiga, ¡*purifícalo*!')
      ]);
      if (!(await jefePurificable(esc, p, 'vucubCaquix'))) return;
      p.poner('vucubVencido');
      p.darEspecial('chispa');
      p.objetivo('duelo');
      esc.quitarObjeto(esc.buscar((o) => o.tipo === 'jefe'));
      esc.aparecer('Y');
      await esc.comic('vucubDespues');
      await esc.decir([di(TZ, 'En combate, el espíritu se invoca con *Espíritu* cuando el Límite está lleno. Y ese portal nos devuelve a la selva... siento algo raro allá.')]);
      p.guardar();
    },

    // Capítulo 1, final: duelo contra el hermano poseído
    duelo: unaVez('duelo', async (esc, p) => {
      G.audio.efecto('camara');
      G.fx.temblor(3, 0.5);
      await esc.decir([
        di(IXP, '...{H}. Ese nombre... me duele la cabeza cuando lo oigo.'),
        di(HU, '¡Hermano! ¡Soy yo! ¡Vuelve a casa!'),
        di(IXP, 'Camazotz dice que tú eres mi enemigo. ¡Aléjate!'),
        di(TZ, '¡No puedes vencerlo sin herirlo! *Resiste 5 turnos* o usa la *Chispa de luz* desde Objeto.')
      ]);
      const r = await esc.combate({ grupo: ['ixbalanqueDuelo'], modo: 'duelo', musica: 'jefeFinal', turnosDuelo: 5 });
      if (r === 'derrota') return;
      p.poner('duelo');
      p.objetivo('cuevas');
      await esc.comic('duelo');
      await esc.decir([di(TZ, 'El camino a Xibalbá está al *noreste* de la selva, junto a las rocas. ¡Vamos por las reliquias!')]);
      p.guardar();
    }),

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
        { quien: 'Camino negro', texto: '"Yo soy el camino de Xibalbá. Sígueme."' },
        di(TZ, '¡El camino negro habló! Crucemos el río hacia el este. Huelo cacao en la sala del norte...')
      ]);
      p.objetivo('camazotz');
    }),
    reliquiaObtenida: async (esc, p) => {
      const n = p.reliquias();
      await esc.decir([di(TZ, n >= 3 ? '¡Las *tres reliquias*! Ya podemos abrir la puerta del trono.' : `¡Una reliquia sagrada! Llevamos ${n} de 3.`)]);
      p.guardar();
    },
    jefeCamazotz: async (esc, p) => {
      await esc.decir([
        { quien: 'Camazotz', texto: 'Skreee... El hermanito valiente. Tu gemelo ahora sirve a Xibalbá. ¡Y tú serás mi cena!' },
        di(HU, '¡Quítale el sello a mi hermano!'),
        { quien: 'Camazotz', texto: 'Solo la luz lo rompe... ¡y aquí abajo no hay luz!' },
        di(TZ, '¡Es débil al *fuego*! Usa el *Dardo de fuego*. Y si tienes el Límite lleno, invoca a la Guacamaya para curarte.')
      ]);
      if (!(await jefePurificable(esc, p, 'camazotz'))) return;
      p.poner('camazotzVencido');
      p.objetivo(p.tieneReliquia('cacaoAncestral') ? 'canon' : 'cruce');
      esc.quitarObjeto(esc.buscar((o) => o.tipo === 'jefe'));
      await esc.comic('camazotzDespues');
      darReliquia(p, 'copalPuro');
      if (!p.tieneReliquia('cacaoAncestral')) await esc.decir([di(TZ, 'Nos falta el *Cacao Ancestral*. Está en un cofre de la sala del noreste de estas cuevas.')]);
      p.guardar();
    },

    // ------------------------------ CAÑÓN ------------------------------
    llegadaCanon: unaVez('llegadaCanon', async (esc, p) => {
      await esc.decir([
        di(TZ, 'El cañón de Meauán. Aquí vive *Zipacná*, hijo de Vucub Caquix. Guarda el *Jade Sagrado*.'),
        di(TZ, 'Este lugar está lleno de fuego y cristales. Lee las estelas.')
      ]);
      p.objetivo('canonPistas');
    }),
    jefeZipacna: async (esc, p) => {
      await esc.decir([
        { quien: 'Zipacná', texto: '¿Tú purificaste a mi padre? ¡Ahora anda contento, cantando como pajarito! ¡Qué vergüenza!' },
        di(HU, 'Ahora es libre. Tú también puedes serlo.'),
        { quien: 'Zipacná', texto: '¡Ja! ¡Te voy a aplastar con una montaña!' },
        di(TZ, '¡Es débil al *agua*! Cuidado con su pisotón. Y recuerda *Defender* cuando estés débil: el daño se reduce a la mitad.')
      ]);
      if (!(await jefePurificable(esc, p, 'zipacna'))) return;
      p.poner('zipacnaVencido');
      p.objetivo(p.reliquias() + 1 >= 3 ? 'trono' : 'cruce');
      esc.quitarObjeto(esc.buscar((o) => o.tipo === 'jefe'));
      esc.aparecer('Y');
      await esc.comic('zipacnaDespues');
      darReliquia(p, 'jadeSagrado');
      p.guardar();
    },

    // ------------------------------ PALACIO ------------------------------
    llegadaPalacio: unaVez('llegadaPalacio', async (esc, p) => {
      await esc.comic('palacio');
      await esc.decir([di(TZ, 'La puerta del norte lleva al trono. Necesita las *tres reliquias*. Hay un altar para descansar.')]);
      p.objetivo(p.reliquias() >= 3 ? 'trono' : 'cruce');
    }),
    antesTrono: unaVez('antesTrono', async (esc) => {
      await esc.decir([di(TZ, 'Ahí está tu hermano... Si lo necesitas, descansa en el altar. Recuerda: *no lo hieras*.')]);
    }),

    // FINAL: fase 1 (romper el sello) y fase 2 (Avatar de la Noche Eterna)
    jefeFinal: async (esc, p) => {
      if (!p.bandera('selloRoto')) {
        await esc.decir([
          di(IXP, '{H}... vete. Los Señores me ordenan pelear contigo.'),
          di(HU, 'No voy a pelear contra ti. Voy a pelear *por* ti.'),
          di(TZ, '¡Mira las dos barras! Si su *Vida* llega a 0, lo pierdes. Baja su *Sello* a 0 con *Espíritu → Purificar* (media barra de Límite) o con la *Reliquia de Luz* (Objeto).'),
          di(TZ, 'Para llenar el Límite tienes que recibir golpes... *Defiende* para aguantar.')
        ]);
        const r = await esc.combate({ grupo: ['ixbalanquePoseido'], modo: 'sello', musica: 'jefeFinal' });
        if (r !== 'selloRoto') return;
        p.poner('selloRoto');
        p.unirAlEquipo('ixbalanque');
        p.curarTodo();
        p.guardar();
        await esc.comic('liberado');
      }
      await esc.comic('avatar');
      await esc.decir([
        di(IX, '¡Ahora somos dos! Cuando los dos tengamos el Límite lleno, podemos usar la *Técnica Gemela*.'),
        di(TZ, '¡Es débil al *fuego* y al *agua*! ¡Por la luz!')
      ]);
      const r2 = await esc.combate({ grupo: ['avatar'], modo: 'final', heroes: ['hunahpu', 'ixbalanque'], musica: 'jefeFinal' });
      if (r2 !== 'victoria') return;
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
    id: 'maya2',
    nombre: 'Xibalbá',
    cultura: 'Maya (k\'iche\')',
    heroes: ['hunahpu', 'ixbalanque'],
    equipoInicial: ['hunahpu'],
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
