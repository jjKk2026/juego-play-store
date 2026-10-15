/* =====================================================================
   HISTORIA DEL MUNDO MAYA — Gemelos del Sol 2: El Sello de Camazotz
   - Escenas en viñetas (cómic).
   - Diálogos de personajes, aluxes y estelas.
   - Pistas del colibrí Tz'unun según lo que toca hacer.
   - Fragmentos breves del Popol Vuh (contados con palabras sencillas).
   La historia del juego es nueva, pero se inspira en el Popol Vuh.
   ===================================================================== */
'use strict';

(function () {
  const TZ = { quien: "Tz'unun", retrato: 'colibri' };
  const AB = { quien: 'Abuela Ixmucané', retrato: 'abuela' };
  const HU = { quien: '{H}', retrato: 'hunahpu' };
  const IX = { quien: '{I}', retrato: 'ixbalanque' };
  const ALUX = { quien: 'Alux', retrato: 'alux' };
  const di = (q, texto) => Object.assign({ texto }, q);

  const IXP = { quien: '{I} (poseído)', retrato: 'ixbalanque' };
  const ESP = (nombre) => ({ quien: nombre, retrato: 'colibri' });

  // ------------------------------ VIÑETAS ------------------------------
  const historia = {
    // PRÓLOGO: el Sello de Camazotz
    intro: {
      musica: 'titulo',
      paginas: [
        {
          disposicion: '1',
          vinetas: [{
            fondo: 'cielo',
            actores: [{ id: 'hunahpu', x: 0.38, y: 0.95, esc: 4, dir: 2 }, { id: 'ixbalanque', x: 0.62, y: 0.95, esc: 4, dir: 1 }],
            textos: [
              { tipo: 'caja', texto: 'Después de devolver el sol al cielo, los gemelos *{GEMELOS}* vivían en paz con su abuela.' },
              { tipo: 'caja', texto: 'Pero en Xibalbá, alguien no había olvidado su derrota...' }
            ]
          }]
        },
        {
          disposicion: '2h',
          vinetas: [
            {
              fondo: 'selva',
              actores: [{ id: 'hunahpu', x: 0.3, y: 0.92, esc: 3, dir: 2, cuadro: 1 }, { id: 'ixbalanque', x: 0.72, y: 0.92, esc: 3, dir: 1 }],
              textos: [{ tipo: 'globo', texto: '¡Hoy te gano a la pelota, hermano!', de: 0 }, { tipo: 'globo', texto: '¡Eso dijiste ayer!', de: 1, dy: 40 }]
            },
            {
              fondo: 'cieloOscuro', efectos: ['temblor', 'rgb', 'lineas'], sonido: 'golpeFuerte', ono: '¡SKREEE!', onoX: 0.5, onoY: 0.3,
              actores: [{ id: 'camazotz', x: 0.5, y: 0.95, esc: 1.5, brillo: '#7b2cbf' }],
              textos: [{ tipo: 'caja', texto: 'Del cielo bajó *Camazotz*, el murciélago de la muerte.', abajo: true }]
            }
          ]
        },
        {
          disposicion: '3',
          vinetas: [
            {
              fondo: 'rojo', efectos: ['rgb'], sonido: 'camara',
              actores: [{ id: 'camazotz', x: 0.3, y: 1.0, esc: 1.2 }, { id: 'ixbalanque', x: 0.75, y: 0.98, esc: 3, dir: 1 }],
              textos: [
                { tipo: 'globo', texto: 'Los Señores de Xibalbá te mandan un regalo: ¡el *Sello Oscuro*!', de: 0, ancho: 180, dx: 60, dy: 20 }
              ]
            },
            {
              fondo: 'cieloOscuro', efectos: ['temblor'],
              actores: [{ id: 'ixbalanquePoseido', x: 0.5, y: 0.98, esc: 3, brillo: '#e040ff' }],
              textos: [{ tipo: 'globo', texto: '¿Quién... eres tú?', de: 0 }]
            },
            {
              fondo: 'selvaNoche', efectos: ['lineas'],
              actores: [{ id: 'hunahpu', x: 0.5, y: 0.98, esc: 3, dir: 0 }],
              textos: [{ tipo: 'grito', texto: '¡HERMANO!', de: 0 }]
            }
          ]
        },
        {
          disposicion: '2v',
          vinetas: [
            {
              fondo: 'cieloOscuro',
              actores: [{ id: 'camazotz', x: 0.35, y: 0.95, esc: 1 }, { id: 'ixbalanquePoseido', x: 0.7, y: 0.95, esc: 2 }],
              textos: [{ tipo: 'caja', texto: 'Con los ojos morados y sin recuerdos, {I} se fue volando con Camazotz hacia el inframundo.' }]
            },
            {
              fondo: 'casa',
              actores: [{ id: 'abuela', x: 0.22, y: 0.98, esc: 2, dir: 2 }, { id: 'hunahpu', x: 0.62, y: 0.98, esc: 2, dir: 1 }, { id: 'colibri', x: 0.85, y: 0.55, esc: 3, dir: 1, brillo: '#3fd3a8' }],
              textos: [
                { tipo: 'globo', texto: 'Un sello así solo se rompe con *luz pura*, mi niño. No le hagas daño a tu hermano...', de: 0, ancho: 180, dx: 60 },
                { tipo: 'caja', texto: 'Así comenzó el viaje de {H}, solo... pero no por mucho tiempo.', abajo: true }
              ]
            }
          ]
        }
      ]
    },

    vucubDespues: {
      musica: 'final',
      paginas: [{
        disposicion: '2h',
        vinetas: [
          {
            fondo: 'ceiba', efectos: ['lineas'], ono: '¡LUZ!', onoX: 0.5, onoY: 0.2,
            actores: [{ id: 'vucubCaquix', x: 0.5, y: 0.95, esc: 1.6, brillo: '#ffd166' }],
            textos: [{ tipo: 'caja', texto: 'La oscuridad salió de Vucub Caquix. Su orgullo se volvió un brillo tibio y amable.' }]
          },
          {
            fondo: 'oro',
            actores: [{ id: 'hunahpu', x: 0.3, y: 0.95, esc: 3, dir: 2 }, { id: 'colibri', x: 0.72, y: 0.55, esc: 3, dir: 1, brillo: '#ffd166' }],
            textos: [
              { tipo: 'globo', texto: 'Ahora es tu espíritu aliado. ¡Y te dejó una *chispa de luz*!', de: 1, ancho: 150 },
              { tipo: 'caja', texto: 'La chispa sirve para hacer retroceder a la sombra.', abajo: true }
            ]
          }
        ]
      }]
    },

    duelo: {
      musica: 'oscura',
      paginas: [{
        disposicion: '2h',
        vinetas: [
          {
            fondo: 'selvaNoche', efectos: ['rgb'],
            actores: [{ id: 'ixbalanquePoseido', x: 0.5, y: 0.98, esc: 3, brillo: '#e040ff' }],
            textos: [{ tipo: 'globo', texto: 'Mis... recuerdos... duelen. ¡Me voy a Xibalbá!', de: 0, ancho: 150 }]
          },
          {
            fondo: 'selvaNoche',
            actores: [{ id: 'hunahpu', x: 0.3, y: 0.98, esc: 3, dir: 2 }, { id: 'colibri', x: 0.72, y: 0.55, esc: 3, dir: 1, brillo: '#3fd3a8' }],
            textos: [
              { tipo: 'globo', texto: 'La chispa no basta. Necesitamos las *tres reliquias sagradas*: Cacao Ancestral, Copal Puro y Jade Sagrado.', de: 1, ancho: 170 },
              { tipo: 'caja', texto: 'Están escondidas en las cuevas de Xibalbá.', abajo: true }
            ]
          }
        ]
      }]
    },

    xibalba: {
      musica: 'cuevas',
      paginas: [{
        disposicion: '1',
        vinetas: [{
          fondo: 'xibalba', efectos: ['rgb'],
          actores: [{ id: 'hunahpu', x: 0.42, y: 0.95, esc: 3, dir: 3 }, { id: 'colibri', x: 0.68, y: 0.5, esc: 3, brillo: '#05d9e8' }],
          textos: [
            { tipo: 'caja', texto: 'Capítulo 2: *las Cuevas de Xibalbá*. Escalones empinados, ríos oscuros y cristales que brillan.' },
            { tipo: 'globo', texto: 'Camazotz vive aquí abajo. Fue él quien puso el sello. ¡Ten cuidado!', de: 1, ancho: 140 }
          ]
        }]
      }]
    },

    camazotzDespues: {
      musica: 'final',
      paginas: [{
        disposicion: '2h',
        vinetas: [
          {
            fondo: 'xibalba', efectos: ['lineas'], ono: '¡FSSSH!', onoX: 0.5, onoY: 0.2,
            actores: [{ id: 'camazotz', x: 0.5, y: 1.0, esc: 1.2, brillo: '#b18cff' }],
            textos: [{ tipo: 'caja', texto: 'Purificado, Camazotz ya no es el murciélago de la muerte, sino el guardián de la noche tranquila.' }]
          },
          {
            fondo: 'xibalba',
            actores: [{ id: 'hunahpu', x: 0.3, y: 0.95, esc: 3, dir: 2 }, { id: 'colibri', x: 0.72, y: 0.55, esc: 3, dir: 1, brillo: '#b18cff' }],
            textos: [{ tipo: 'globo', texto: 'Te regaló el *Copal Puro*. Dice que el camino sigue por el cañón de Zipacná.', de: 1, ancho: 150 }]
          }
        ]
      }]
    },

    zipacnaDespues: {
      musica: 'final',
      paginas: [{
        disposicion: '2h',
        vinetas: [
          {
            fondo: 'xibalba', efectos: ['temblor', 'lineas'], sonido: 'tierra', ono: '¡BRUUUM!', onoX: 0.5, onoY: 0.25,
            actores: [{ id: 'zipacna', x: 0.5, y: 1.05, esc: 1.4, brillo: '#c49a6c' }],
            textos: [{ tipo: 'caja', texto: 'Zipacná dejó de cargar montañas por orgullo. Ahora las levanta para proteger a sus amigos.' }]
          },
          {
            fondo: 'palacio',
            actores: [{ id: 'hunahpu', x: 0.32, y: 0.95, esc: 3, dir: 2 }, { id: 'colibri', x: 0.7, y: 0.5, esc: 3, dir: 1, brillo: '#3fd3a8' }],
            textos: [{ tipo: 'globo', texto: '¡El *Jade Sagrado*! Ese portal lleva a la *Casa de los Señores*. Allí tienen a tu hermano.', de: 1, ancho: 150 }]
          }
        ]
      }]
    },

    palacio: {
      musica: 'palacio',
      paginas: [{
        disposicion: '2h',
        vinetas: [
          {
            fondo: 'palacio', efectos: ['rgb'],
            actores: [{ id: 'hunCame', x: 0.3, y: 0.98, esc: 1.2 }, { id: 'vucubCame', x: 0.72, y: 0.98, esc: 1.2 }],
            textos: [{ tipo: 'globo', texto: 'Que venga, que venga. Su hermano ya es nuestro guardián.', de: 0, ancho: 150, dx: 40 }]
          },
          {
            fondo: 'palacio',
            actores: [{ id: 'hunahpu', x: 0.5, y: 0.98, esc: 3, dir: 0 }],
            textos: [{ tipo: 'globo', texto: 'Aguanta, hermano. Ya casi llego.', de: 0 }]
          }
        ]
      }]
    },

    liberado: {
      musica: 'final',
      paginas: [{
        disposicion: '3',
        vinetas: [
          {
            fondo: 'oro', efectos: ['destello', 'lineas'], sonido: 'golpeFuerte', ono: '¡CRASH!', onoX: 0.5, onoY: 0.3,
            actores: [{ id: 'ixbalanque', x: 0.5, y: 0.98, esc: 3, dir: 0 }],
            textos: [{ tipo: 'caja', texto: 'El Sello Oscuro se rompió en mil pedazos de luz.' }]
          },
          {
            fondo: 'palacio',
            actores: [{ id: 'ixbalanque', x: 0.5, y: 0.98, esc: 2, dir: 1 }],
            textos: [{ tipo: 'globo', texto: '¿{H}? Te... ¡te recuerdo! Escuché tu voz todo el tiempo.', de: 0, ancho: 140 }]
          },
          {
            fondo: 'palacio',
            actores: [{ id: 'hunahpu', x: 0.5, y: 0.98, esc: 2, dir: 2 }],
            textos: [{ tipo: 'globo', texto: 'Nunca te iba a dejar. ¡Juntos otra vez!', de: 0, ancho: 140 }]
          }
        ]
      }]
    },

    avatar: {
      musica: 'jefeFinal',
      paginas: [{
        disposicion: '2h',
        vinetas: [
          {
            fondo: 'rojo', efectos: ['temblor', 'rgb'], sonido: 'camara',
            actores: [{ id: 'hunCame', x: 0.3, y: 0.98, esc: 1.2 }, { id: 'vucubCame', x: 0.72, y: 0.98, esc: 1.2 }],
            textos: [{ tipo: 'globo', texto: '¿Rompieron el sello? ¡Entonces seremos UNO!', de: 0, ancho: 150, dx: 40 }]
          },
          {
            fondo: 'cieloOscuro', efectos: ['temblor', 'lineas'], ono: '¡GROOOM!', onoX: 0.5, onoY: 0.2,
            actores: [{ id: 'avatar', x: 0.5, y: 1.0, esc: 1.2, brillo: '#ff2a6d' }],
            textos: [{ tipo: 'caja', texto: 'Hun Camé y Vucub Camé se unieron: el *Avatar de la Noche Eterna*.', abajo: true }]
          }
        ]
      }]
    },

    final: {
      musica: 'final',
      paginas: [
        {
          disposicion: '2h',
          vinetas: [
            {
              fondo: 'palacio', efectos: ['destello', 'lineas'], sonido: 'golpeFuerte',
              actores: [{ id: 'hunCame', x: 0.3, y: 0.98, esc: 1.2 }, { id: 'vucubCame', x: 0.72, y: 0.98, esc: 1.2 }],
              textos: [{ tipo: 'caja', texto: 'La técnica *Sol y Luna* separó al Avatar. Los Señores huyeron a lo más hondo de Xibalbá.' }]
            },
            {
              fondo: 'oro', efectos: ['rgb'],
              actores: [{ id: 'hunahpu', x: 0.35, y: 0.98, esc: 3, dir: 3 }, { id: 'ixbalanque', x: 0.65, y: 0.98, esc: 3, dir: 3 }],
              textos: [{ tipo: 'caja', texto: 'Los espíritus de la guacamaya, el murciélago y la montaña los llevaron de vuelta a casa.', abajo: true }]
            }
          ]
        },
        {
          disposicion: '3b',
          vinetas: [
            {
              fondo: 'amanecer',
              actores: [{ id: 'abuela', x: 0.5, y: 0.98, esc: 2, dir: 0 }],
              textos: [{ tipo: 'globo', texto: '¡Mis dos niños! ¡Volvieron juntos!', de: 0 }]
            },
            {
              fondo: 'amanecer',
              actores: [{ id: 'alux', x: 0.3, y: 0.9, esc: 3 }, { id: 'alux', x: 0.7, y: 0.85, esc: 2 }],
              textos: [{ tipo: 'globo', texto: '¡Ji ji! ¡Hay que hacer fiesta!', de: 0 }]
            },
            {
              fondo: 'noche',
              actores: [{ id: 'colibri', x: 0.5, y: 0.6, esc: 3, brillo: '#ffd166' }],
              textos: [
                { tipo: 'caja', texto: 'Ningún sello puede borrar lo que dos hermanos se quieren.' },
                { tipo: 'globo', texto: 'El sol y la luna brillan otra vez, uno junto al otro.', de: 0, ancho: 200, dy: 20 }
              ]
            }
          ]
        }
      ]
    }
  };

  // ------------------------------ DIÁLOGOS ------------------------------
  const dialogos = {
    ceiba: [di(TZ, 'La gran *ceiba*, el árbol sagrado. Sus raíces llegan a Xibalbá. Vucub Caquix se esconde allí abajo otra vez.')],
    alux1: [di(ALUX, '¡Ji ji! Soy un alux. Vi a tu hermano volar con un murciélago enorme... ¡Tenía los ojos morados!')],
    alux2: [di(ALUX, 'Psst... tu cerbatana despierta los cristales dormidos, aunque estén al otro lado del agua.')],
    alux3: [di(ALUX, 'Si empujas fuerte los bloques de piedra, se mueven. ¡Hasta yo puedo! Bueno... casi.')],
    estelaSelva: [di({ quien: 'Estela tallada' }, '"Los jefes vencidos no se destruyen: se purifican. Su luz atrapada vuelve a ser buena."'), di(TZ, 'Cuando venzas a un jefe, usa *Espíritu → Purificar*. ¡Se volverá tu aliado!')],
    estelaTemplo: [di({ quien: 'Glifos en la piedra' }, '"El cazador despertó el cristal con su soplo y movió la piedra pesada con paciencia."')],
    estelaCruce: [di({ quien: 'Estela del cruce' }, '"Cuatro caminos: rojo, negro, blanco y amarillo. El camino negro habló: yo soy el camino del Señor."')],
    estelaFuego: [di({ quien: 'Glifos de fuego' }, '"El dardo que cruza el fuego se enciende." Alinea la cerbatana, el fuego del centro y cada brasero.')],
    estelaSol: [di({ quien: 'Estela del sol' }, '"El sol nace por el *este*, sube a lo más *alto* y se oculta por el *oeste*." Despierta los cristales en ese orden.')],
    estelaPalacio: [di({ quien: 'Estela de los Señores' }, '"Solo quien traiga Cacao, Copal y Jade podrá abrir la puerta del trono."')],
    estelaCacao: [di({ quien: 'Estela' }, '"El *cacao* es la bebida de los dioses. Da fuerza al corazón."')],
    estelaCopal: [di({ quien: 'Estela' }, '"El humo del *copal* sube al cielo y limpia lo que está sucio."')],
    estelaJade: [di({ quien: 'Estela' }, '"El *jade* verde es la vida que nunca se acaba."')]
  };

  // ------------------------------ PISTAS ------------------------------
  const pistas = {
    abuela: 'Habla con la abuela Ixmucané. Está junto a su casa, a la izquierda del camino.',
    templo: 'Vucub Caquix está en las raíces de la gran ceiba, al norte, cruzando el puente. Cuando lo venzas, ¡purifícalo con Espíritu!',
    duelo: 'Vuelve a la selva por el portal. Siento la presencia de tu hermano...',
    cuevas: 'El camino a Xibalbá está al noreste de la selva, junto a unas rocas.',
    cruce: 'Busca el cruce de los cuatro caminos, al sur. El camino negro es el que lleva a Xibalbá. Hay una reliquia en la sala del noreste.',
    camazotz: 'Camazotz vigila la escalera del sureste de las cuevas. Es débil al fuego: ¡usa el Dardo de fuego!',
    canon: 'El cañón de Meauán está bajando la escalera del sureste. Zipacná guarda el Jade Sagrado.',
    canonPistas: 'En el cañón: un dardo que atraviesa el fuego se enciende. Los cristales siguen el camino del sol: este, arriba, oeste. Las placas se presionan con un bloque y contigo.',
    trono: '¡Tienes las tres reliquias! Abre la puerta del norte del palacio. No hieras a tu hermano: purifica su sello o usa las reliquias.',
    fin: '¡Lo lograron! Ahora pueden explorar juntos y completar el bestiario.'
  };

  // ------------------------------ POPOL VUH ------------------------------
  const fragmentos = [
    ['Al principio todo estaba en calma y en silencio. Solo existían el cielo vacío y el mar en reposo.', 'Los creadores hablaron, y con su palabra surgieron la tierra, las montañas y los árboles.'],
    ['Los creadores intentaron hacer personas de barro, pero se deshacían. Luego las hicieron de madera, pero no tenían corazón.', 'Al final las formaron con masa de maíz amarillo y blanco. Así nació la gente de maíz.'],
    ['Vucub Caquix decía: "Yo soy el sol, yo soy la luz, yo soy la luna". Pero su brillo no llegaba lejos.', 'Los gemelos le dispararon con la cerbatana mientras comía en su árbol de nance.'],
    ['Hun Hunahpú, el padre de los gemelos, jugaba a la pelota con su hermano. El ruido molestó a los Señores de Xibalbá.', 'Los llamaron al inframundo y no regresaron. Años después, sus hijos bajaron a enfrentar a los mismos señores.'],
    ['Ixquic, la madre de los gemelos, era hija de un señor de Xibalbá.', 'Escapó al mundo de arriba gracias a los búhos mensajeros, y allí nacieron Hunahpú e Ixbalanqué.'],
    ['En Xibalbá había casas de prueba: la Casa Oscura, la del Frío, la de los Jaguares, la del Fuego, la de los Murciélagos y la de las Navajas.', 'Los gemelos superaron cada una con ingenio y valor.'],
    ['En la Casa Oscura debían devolver al amanecer una antorcha y dos cigarros sin gastarlos.', 'Los gemelos pusieron plumas rojas de guacamaya en la antorcha y luciérnagas en las puntas de los cigarros. ¡Parecían encendidos!'],
    ['Para descubrir los nombres de los Señores, los gemelos mandaron a un mosquito a picarlos uno por uno.', 'Al quejarse, los señores se llamaban entre sí por su nombre. Así los gemelos supieron quién era quién.'],
    ['Después de vencer a los Señores de Xibalbá, los gemelos subieron al cielo.', 'Uno se convirtió en el sol y el otro en la luna. Así hubo luz en el cielo y sobre la tierra.']
  ];

  G.mundoMaya = G.mundoMaya || {};
  Object.assign(G.mundoMaya, { historia, dialogos, pistas, fragmentos, TZ, AB, HU, IX, IXP, ESP, di });
})();
