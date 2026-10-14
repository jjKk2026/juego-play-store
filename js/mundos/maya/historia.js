/* =====================================================================
   HISTORIA DEL MUNDO MAYA
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
  const HU = { quien: 'Hunahpú', retrato: 'hunahpu' };
  const IX = { quien: 'Ixbalanqué', retrato: 'ixbalanque' };
  const ALUX = { quien: 'Alux', retrato: 'alux' };
  const di = (q, texto) => Object.assign({ texto }, q);

  // ------------------------------ VIÑETAS ------------------------------
  const historia = {
    intro: {
      musica: 'titulo',
      paginas: [
        {
          disposicion: '1',
          vinetas: [{
            fondo: 'cielo',
            actores: [{ id: 'hunahpu', x: 0.38, y: 0.95, esc: 4, dir: 2 }, { id: 'ixbalanque', x: 0.62, y: 0.95, esc: 4, dir: 1 }],
            textos: [
              { tipo: 'caja', texto: 'Hace mucho tiempo, cuando el mundo aún era joven...' },
              { tipo: 'caja', texto: 'Los gemelos *Hunahpú* e *Ixbalanqué* vivían con su abuela, al borde de la selva.' }
            ]
          }]
        },
        {
          disposicion: '2h',
          vinetas: [
            {
              fondo: 'cielo',
              actores: [{ id: 'hunahpu', x: 0.3, y: 0.92, esc: 3, dir: 2, cuadro: 1 }, { id: 'ixbalanque', x: 0.72, y: 0.92, esc: 3, dir: 1 }],
              textos: [{ tipo: 'globo', texto: '¡Atrapa la pelota, hermano!', de: 0 }, { tipo: 'globo', texto: '¡Esta vez no se me escapa!', de: 1, dy: 40 }]
            },
            {
              fondo: 'cieloOscuro', efectos: ['temblor', 'rgb', 'lineas'], sonido: 'golpeFuerte', ono: '¡KRAK!', onoX: 0.5, onoY: 0.35,
              actores: [{ id: 'ixbalanque', x: 0.5, y: 0.98, esc: 3, dir: 3 }],
              textos: [{ tipo: 'caja', texto: 'De pronto, el cielo se quebró.', abajo: false }]
            }
          ]
        },
        {
          disposicion: '3',
          vinetas: [
            {
              fondo: 'cieloOscuro', efectos: ['rgb'], sonido: 'camara',
              actores: [{ id: 'hunCame', x: 0.3, y: 1.0, esc: 1.25, brillo: '#7b2cbf' }, { id: 'vucubCame', x: 0.7, y: 1.0, esc: 1.25, brillo: '#ff2a6d' }],
              textos: [
                { tipo: 'caja', texto: 'Desde *Xibalbá*, el inframundo, subieron los Señores Hun Camé y Vucub Camé.' },
                { tipo: 'globo', texto: 'La luz del sol ahora es nuestra. Que el mundo de arriba duerma en la sombra.', de: 0, ancho: 190, dx: 70, dy: 30 }
              ]
            },
            {
              fondo: 'selvaNoche',
              actores: [{ id: 'ixbalanque', x: 0.5, y: 0.98, esc: 3, dir: 0 }],
              textos: [{ tipo: 'globo', texto: '¡Se están llevando la luz!', de: 0 }]
            },
            {
              fondo: 'selvaNoche', efectos: ['lineas'],
              actores: [{ id: 'hunahpu', x: 0.5, y: 0.98, esc: 3, dir: 0 }],
              textos: [{ tipo: 'grito', texto: '¡Devuélvanla!', de: 0 }]
            }
          ]
        },
        {
          disposicion: '2v',
          vinetas: [
            {
              fondo: 'casa',
              actores: [{ id: 'abuela', x: 0.22, y: 0.98, esc: 2, dir: 2 }, { id: 'hunahpu', x: 0.62, y: 0.98, esc: 2, dir: 1 }, { id: 'ixbalanque', x: 0.78, y: 0.98, esc: 2, dir: 1 }],
              textos: [{ tipo: 'globo', texto: 'Sin sol, la milpa no crecerá y la selva se apagará, hijos míos...', de: 0, ancho: 170, dx: 60 }]
            },
            {
              fondo: 'selvaNoche',
              actores: [{ id: 'colibri', x: 0.5, y: 0.62, esc: 4, dir: 2, brillo: '#3fd3a8' }, { id: 'hunahpu', x: 0.18, y: 0.98, esc: 2, dir: 2 }, { id: 'ixbalanque', x: 0.84, y: 0.98, esc: 2, dir: 1 }],
              textos: [
                { tipo: 'globo', texto: "Yo soy Tz'unun, colibrí de luz. Los guiaré hasta Xibalbá.", de: 0, ancho: 170 },
                { tipo: 'caja', texto: 'Así comenzó el viaje de los Gemelos del Sol.', abajo: true }
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
            fondo: 'ceiba', efectos: ['lineas', 'rgb'], ono: '¡FIUU!', onoX: 0.5, onoY: 0.2,
            actores: [{ id: 'vucubCaquix', x: 0.5, y: 0.95, esc: 2 }],
            textos: [{ tipo: 'caja', texto: 'Igual que en el Popol Vuh, la cerbatana venció a Vucub Caquix. Su falso brillo se apagó.' }]
          },
          {
            fondo: 'selva',
            actores: [{ id: 'hunahpu', x: 0.3, y: 0.95, esc: 3, dir: 2 }, { id: 'colibri', x: 0.7, y: 0.55, esc: 3, dir: 1, brillo: '#ffd166' }],
            textos: [
              { tipo: 'globo', texto: 'Entre sus plumas había una chispa del sol robado. ¡La primera!', de: 1, ancho: 150 },
              { tipo: 'caja', texto: 'El camino a Xibalbá está abierto, al noreste de la selva.', abajo: true }
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
          actores: [{ id: 'hunahpu', x: 0.4, y: 0.95, esc: 3, dir: 3 }, { id: 'ixbalanque', x: 0.58, y: 0.95, esc: 3, dir: 3 }, { id: 'colibri', x: 0.75, y: 0.5, esc: 3, brillo: '#05d9e8' }],
          textos: [
            { tipo: 'caja', texto: 'Bajaron por escalones muy empinados, como cuenta el Popol Vuh, hasta las *Cuevas de Xibalbá*.' },
            { tipo: 'globo', texto: 'Aquí la luz viene de los cristales... y de mí. ¡No se separen!', de: 2, ancho: 140 }
          ]
        }]
      }]
    },

    zipacnaDespues: {
      musica: 'final',
      paginas: [{
        disposicion: '2h',
        vinetas: [
          {
            fondo: 'xibalba', efectos: ['temblor', 'lineas'], sonido: 'tierra', ono: '¡BRUUUM!', onoX: 0.5, onoY: 0.25,
            actores: [{ id: 'zipacna', x: 0.5, y: 1.05, esc: 2 }],
            textos: [{ tipo: 'caja', texto: 'La montaña que Zipacná quería lanzar cayó sobre él, como en el antiguo relato.' }]
          },
          {
            fondo: 'palacio',
            actores: [{ id: 'ixbalanque', x: 0.32, y: 0.95, esc: 3, dir: 2 }, { id: 'colibri', x: 0.7, y: 0.5, esc: 3, dir: 1, brillo: '#ffd166' }],
            textos: [
              { tipo: 'globo', texto: '¡Otra chispa de sol! Y detrás de la montaña... un portal a la *Casa de los Señores*.', de: 1, ancho: 150 }
            ]
          }
        ]
      }]
    },

    palacio: {
      musica: 'palacio',
      paginas: [{
        disposicion: '3',
        vinetas: [
          {
            fondo: 'palacio', efectos: ['rgb'],
            actores: [{ id: 'buhoTucur', x: 0.5, y: 0.95, esc: 2 }],
            textos: [
              { tipo: 'caja', texto: 'Un búho mensajero los esperaba en la entrada.' },
              { tipo: 'globo', texto: 'Los Señores los invitan a pasar la noche en sus casas. Si salen con vida... los recibirán.', de: 0, ancho: 200, dx: 60 }
            ]
          },
          {
            fondo: 'palacio',
            actores: [{ id: 'hunahpu', x: 0.5, y: 0.98, esc: 2, dir: 0 }],
            textos: [{ tipo: 'globo', texto: 'Las casas de prueba... nuestro padre no pudo con ellas.', de: 0, ancho: 140 }]
          },
          {
            fondo: 'palacio',
            actores: [{ id: 'ixbalanque', x: 0.5, y: 0.98, esc: 2, dir: 0 }],
            textos: [{ tipo: 'globo', texto: 'Nosotros sí podremos. ¡Juntos!', de: 0 }]
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
              actores: [{ id: 'hunCame', x: 0.3, y: 0.98, esc: 2 }, { id: 'vucubCame', x: 0.72, y: 0.98, esc: 2 }],
              textos: [{ tipo: 'caja', texto: 'Los Señores de Xibalbá cayeron de rodillas. La luz robada escapó de sus mantos.' }]
            },
            {
              fondo: 'oro', efectos: ['rgb'], ono: '¡LUZ!', onoX: 0.5, onoY: 0.3,
              actores: [{ id: 'hunahpu', x: 0.35, y: 0.98, esc: 3, dir: 3 }, { id: 'ixbalanque', x: 0.65, y: 0.98, esc: 3, dir: 3 }],
              textos: [{ tipo: 'caja', texto: 'Las chispas del sol se juntaron en una sola llama, brillante y cálida.', abajo: true }]
            }
          ]
        },
        {
          disposicion: '3b',
          vinetas: [
            {
              fondo: 'amanecer',
              actores: [{ id: 'abuela', x: 0.5, y: 0.98, esc: 2, dir: 0 }],
              textos: [{ tipo: 'globo', texto: '¡El sol! ¡Mis niños lo lograron!', de: 0 }]
            },
            {
              fondo: 'amanecer',
              actores: [{ id: 'alux', x: 0.3, y: 0.9, esc: 3 }, { id: 'alux', x: 0.7, y: 0.85, esc: 2 }],
              textos: [{ tipo: 'globo', texto: '¡Ji ji! ¡La milpa ya tiene calor!', de: 0 }]
            },
            {
              fondo: 'noche',
              actores: [{ id: 'colibri', x: 0.5, y: 0.6, esc: 3, brillo: '#ffd166' }],
              textos: [
                { tipo: 'caja', texto: 'Y como cuenta el Popol Vuh, los gemelos subieron al cielo: uno se volvió el *sol* y el otro la *luna*.' },
                { tipo: 'globo', texto: 'Desde entonces cuidan juntos el día y la noche.', de: 0, ancho: 200, dy: 20 }
              ]
            }
          ]
        }
      ]
    }
  };

  // ------------------------------ DIÁLOGOS ------------------------------
  const dialogos = {
    ceiba: [di(TZ, 'La gran *ceiba*, el árbol sagrado. Para los mayas, sus raíces llegan a Xibalbá, su tronco vive en la tierra y sus ramas sostienen el cielo.')],
    alux1: [di(ALUX, '¡Ji ji! Soy un alux. Cuido esta milpa y este monte.'), di(ALUX, 'Los bloques con cara de jaguar solo se mueven con fuerza de jaguar. ¡Ixbalanqué tiene esa fuerza!')],
    alux2: [di(ALUX, 'Psst... la cerbatana de Hunahpú despierta los cristales dormidos, aunque estén al otro lado del agua.')],
    alux3: [di(ALUX, 'Dicen que detrás de los arbustos de esta esquina hay un tesoro... ¡Pero yo no dije nada! ¡Ji ji!')],
    estelaSelva: [di({ quien: 'Estela tallada' }, '"Antes de que hubiera sol, Vucub Caquix se alzaba orgulloso y decía: yo soy el sol, yo soy la luz, yo soy la luna."')],
    estelaTemplo: [di({ quien: 'Glifos en la piedra' }, '"El jaguar movió la piedra pesada. El cazador despertó el cristal con su soplo."'), di(TZ, '¡Una pista! Bloques para Ixbalanqué, cristales para la cerbatana de Hunahpú.')],
    estelaCruce: [di({ quien: 'Estela del cruce' }, '"Llegaron a un cruce de cuatro caminos: rojo, negro, blanco y amarillo. El camino negro les habló: yo soy el camino del Señor."'), di(TZ, 'En el relato, los otros caminos solo daban vueltas...')],
    estelaFuego: [di({ quien: 'Glifos de fuego' }, '"El dardo que cruza el fuego se enciende." Alinea la cerbatana, el fuego del centro y cada brasero.')],
    estelaSol: [di({ quien: 'Estela del sol' }, '"El sol nace por el *este*, sube a lo más *alto* y se oculta por el *oeste*." Despierta los cristales en ese orden.')],
    estelaPalacio: [di({ quien: 'Estela de los Señores' }, '"Casa de los Señores de Xibalbá. Tres casas de prueba guardan tres sellos. Solo quien los reúna verá a Hun Camé y Vucub Camé."')],
    estelaOscura: [di({ quien: 'Estela' }, 'Al oeste: *Casa Oscura*. "No había luz en su interior, solo tinieblas."')],
    estelaMurcielagos: [di({ quien: 'Estela' }, 'Al norte: *Casa de los Murciélagos*. "Adentro solo había murciélagos que chillaban y volaban."')],
    estelaJaguares: [di({ quien: 'Estela' }, 'Al este: *Casa de los Jaguares*. "Llena de jaguares que se empujaban y se mordían."')]
  };

  // ------------------------------ PISTAS ------------------------------
  const pistas = {
    abuela: 'Hablen con su abuela Ixmucané. Está junto a su casa, a la izquierda del camino.',
    templo: 'El templo está bajo las raíces de la gran ceiba, al norte, cruzando el puente del río. En el templo: la llave pequeña está en la sala del este; los bloques con cara de jaguar los mueve Ixbalanqué y los cristales despiertan con la cerbatana.',
    cuevas: 'El camino a Xibalbá está al noreste de la selva, junto a unas rocas. ¡Ya pueden bajar!',
    cruce: 'Busquen el cruce de los cuatro caminos, al sur de donde llegamos. Recuerden el relato: el camino negro es el que lleva a Xibalbá.',
    canon: 'El cañón de Meauán está al sureste de las cuevas, pasando el puente del río. Allí se esconde Zipacná.',
    canonPistas: 'En el cañón: un dardo que atraviesa el fuego se enciende; alineen fuego y brasero. Los cristales se despiertan siguiendo el camino del sol: este, arriba, oeste. Las dos placas del oeste se presionan con un bloque... y con uno de ustedes.',
    pruebas: 'Superen las tres casas del palacio: la Oscura (oeste), la de los Murciélagos (norte) y la de los Jaguares (este). Cada una guarda un sello.',
    trono: '¡Tienen los tres sellos! Abran la gran puerta del norte del palacio. Los Señores los esperan. Descansen antes en el altar.',
    fin: '¡Lo lograron! La luz volvió al mundo. Pueden seguir explorando y completar el bestiario.'
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
  Object.assign(G.mundoMaya, { historia, dialogos, pistas, fragmentos, TZ, AB, HU, IX, di });
})();
