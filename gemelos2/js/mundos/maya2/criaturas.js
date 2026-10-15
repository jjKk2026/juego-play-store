/* =====================================================================
   CRIATURAS — Gemelos del Sol 2: El Sello de Camazotz
   Los dibujos están en arte-criaturas.js. Aquí van los números,
   los ataques y los textos del bestiario.
   purificable: true → es un jefe que, al vencerlo, se purifica y se
   vuelve un espíritu aliado (espiritu: id en G.datos.ESPIRITUS).
   ===================================================================== */
'use strict';

(function () {
  const MORDIDA = { nombre: 'Mordida', tipo: 'fisico', objetivo: 'uno', potencia: 1, prob: 1, efecto: 'garra' };

  const CRIATURAS = {
    // ======== Selva de Ceiba ========
    murcielago: {
      nombre: 'Murciélago de Xibalbá', corto: 'Murciélago', arte: 'murcielago', zona: 'Selva de Ceiba', volador: true,
      vida: 30, fue: 10, def: 4, mag: 6, vel: 14, xp: 14,
      debil: ['fuego'], resiste: ['viento'],
      ataques: [MORDIDA, { nombre: 'Chillido', tipo: 'magico', objetivo: 'uno', potencia: 0.9, prob: 0.4, efecto: 'onda', elemento: 'viento' }],
      suelta: [{ objeto: 'cacao', prob: 0.25 }],
      bestiario: 'En el Popol Vuh, la Casa de los Murciélagos (Zotzi Ha) era una de las pruebas de Xibalbá. "Zotz" significa murciélago en varias lenguas mayas, y un linaje kaqchikel se llamaba Zotz\'il: "gente murciélago".'
    },
    buho: {
      nombre: 'Búho mensajero', corto: 'Búho', arte: 'buho', zona: 'Selva de Ceiba', volador: true,
      vida: 34, fue: 9, def: 5, mag: 11, vel: 11, xp: 16,
      debil: ['agua'], resiste: ['viento'],
      ataques: [{ nombre: 'Picotazo', tipo: 'fisico', objetivo: 'uno', potencia: 1, prob: 1, efecto: 'garra' },
        { nombre: 'Graznido', tipo: 'magico', objetivo: 'todos', potencia: 0.8, prob: 0.35, efecto: 'onda', elemento: 'viento' }],
      suelta: [{ objeto: 'jade', prob: 0.25 }],
      bestiario: 'Los Señores de Xibalbá tenían cuatro búhos mensajeros, los Tucur. Con ellos llamaron al juego de pelota al padre y al tío de los gemelos. Muchos pueblos mayas veían al búho como mensajero de la muerte.'
    },
    jaguarSombra: {
      nombre: 'Jaguar sombra', arte: 'jaguar', zona: 'Selva de Ceiba',
      vida: 52, fue: 13, def: 6, mag: 4, vel: 12, xp: 22,
      debil: ['fuego'], resiste: ['tierra'],
      ataques: [{ nombre: 'Zarpazo', tipo: 'fisico', objetivo: 'uno', potencia: 1.05, prob: 1, efecto: 'garra' },
        { nombre: 'Salto nocturno', tipo: 'fisico', objetivo: 'uno', potencia: 1.35, prob: 0.25, efecto: 'garra' }],
      suelta: [{ objeto: 'cacao', prob: 0.35 }],
      bestiario: 'El jaguar ("balam") era para los mayas el señor de la noche y del inframundo. Se decía que el sol se volvía jaguar al cruzar Xibalbá por la noche. Los gobernantes usaban su piel como símbolo de poder.'
    },
    // ======== Cuevas de Xibalbá ========
    murcielagoNeon: {
      nombre: 'Murciélago de las cuevas', corto: 'Murciélago azul', arte: 'murcielago', zona: 'Cuevas de Xibalbá', volador: true,
      paleta: { cuerpo: '#1d4a6e', ala: '#16385a', hueso: '#05d9e8', ojo: '#ffd166', borde: '#05d9e8' },
      vida: 66, fue: 19, def: 9, mag: 14, vel: 17, xp: 46,
      debil: ['fuego'], resiste: ['viento'],
      ataques: [MORDIDA, { nombre: 'Eco de la cueva', tipo: 'magico', objetivo: 'todos', potencia: 0.75, prob: 0.35, efecto: 'onda', elemento: 'viento' }],
      suelta: [{ objeto: 'cacao', prob: 0.3 }, { objeto: 'jade', prob: 0.15 }],
      bestiario: 'Para los mayas, las cuevas eran puertas al inframundo y lugares sagrados donde se hacían ceremonias. En las cuevas de Guatemala y del sur de México viven grandes colonias de murciélagos.'
    },
    esqueleto: {
      nombre: 'Guerrero esqueleto', corto: 'Esqueleto', arte: 'esqueleto', zona: 'Cuevas de Xibalbá',
      vida: 92, fue: 21, def: 14, mag: 6, vel: 11, xp: 60,
      debil: ['tierra'], resiste: ['viento'],
      ataques: [{ nombre: 'Macuahuitl', tipo: 'fisico', objetivo: 'uno', potencia: 1.1, prob: 1, efecto: 'corte' },
        { nombre: 'Golpe de escudo', tipo: 'fisico', objetivo: 'uno', potencia: 0.8, prob: 0.3, aturdir: 0.4, efecto: 'golpe' }],
      suelta: [{ objeto: 'cacao', prob: 0.35 }, { objeto: 'pluma', prob: 0.06 }],
      bestiario: 'Entre los Señores de Xibalbá, Chamiabac y Chamiaholom ("Bastón de hueso" y "Bastón de calavera") tenían el oficio de enflaquecer a la gente hasta dejarla en los huesos. Estos guerreros llevan el macuahuitl, un garrote de madera con filos de obsidiana.'
    },
    buhoObsidiana: {
      nombre: 'Búho de obsidiana', corto: 'Búho negro', arte: 'buho', zona: 'Cuevas de Xibalbá', volador: true,
      paleta: { pluma: '#3a3052', pecho: '#6b5a8a', disco: '#5c4f7a', ojo: '#ff2a6d', pico: '#b18cff' },
      vida: 72, fue: 15, def: 10, mag: 22, vel: 13, xp: 52,
      debil: ['agua'], resiste: ['viento'],
      ataques: [{ nombre: 'Picotazo', tipo: 'fisico', objetivo: 'uno', potencia: 1, prob: 1, efecto: 'garra' },
        { nombre: 'Espejo de obsidiana', tipo: 'magico', objetivo: 'uno', potencia: 1.25, prob: 0.4, efecto: 'onda' }],
      suelta: [{ objeto: 'jade', prob: 0.35 }],
      bestiario: 'La obsidiana es un vidrio volcánico negro. Los mayas la usaban para navajas, puntas de lanza y espejos, y la comerciaban desde los volcanes de las tierras altas de Guatemala.'
    },
    // ======== Casa de los Señores ========
    esqueletoNoble: {
      nombre: 'Guerrero de Xibalbá', corto: 'Guerrero', arte: 'esqueleto', zona: 'Casa de los Señores',
      paleta: { hueso: '#d8cfe0', ojo: '#ff2a6d', escudo: '#3a1f5c', pluma: '#e8b64c', madera: '#3d2a10', tela: '#2a1846' },
      vida: 170, fue: 33, def: 21, mag: 12, vel: 13, xp: 125,
      debil: ['tierra'], resiste: ['viento', 'agua'],
      ataques: [{ nombre: 'Macuahuitl', tipo: 'fisico', objetivo: 'uno', potencia: 1.15, prob: 1, efecto: 'corte' },
        { nombre: 'Golpe de escudo', tipo: 'fisico', objetivo: 'uno', potencia: 0.8, prob: 0.3, aturdir: 0.4, efecto: 'golpe' }],
      suelta: [{ objeto: 'jade', prob: 0.3 }, { objeto: 'pluma', prob: 0.1 }],
      bestiario: 'Xibalbá significa "lugar del miedo". Sus doce señores tenían cada uno un oficio: causar heridas, enfermedad, hambre o miedo. Se llegaba bajando escalones muy empinados y cruzando ríos.'
    },
    jaguarObsidiana: {
      nombre: 'Jaguar de la Casa', arte: 'jaguar', zona: 'Casa de los Señores',
      paleta: { cuerpo: '#1a1426', vientre: '#2e2440', mancha: '#ffd166', ojo: '#ff2a6d', borde: '#ffd166' },
      vida: 160, fue: 36, def: 18, mag: 10, vel: 16, xp: 120,
      debil: ['agua'], resiste: ['fuego'],
      ataques: [{ nombre: 'Zarpazo', tipo: 'fisico', objetivo: 'uno', potencia: 1.1, prob: 1, efecto: 'garra' },
        { nombre: 'Rugido', tipo: 'magico', objetivo: 'todos', potencia: 0.7, prob: 0.3, aturdir: 0.3, efecto: 'onda' }],
      suelta: [{ objeto: 'cacao', prob: 0.4 }],
      bestiario: 'En la Casa de los Jaguares, las fieras querían devorar a los gemelos. Ellos les lanzaron huesos para que se entretuvieran royéndolos, y así pasaron la noche sanos y salvos.'
    },
    // ======== JEFES PURIFICABLES (se vuelven espíritus) ========
    vucubCaquix: {
      nombre: 'Vucub Caquix', arte: 'guacamaya', zona: 'Selva de Ceiba', jefe: true, purificable: true, espiritu: 'guacamaya', colorEspiritu: '#ffd166',
      titulo: 'El ave que se creía el sol',
      vida: 580, fue: 22, def: 10, mag: 20, vel: 12, xp: 220,
      debil: ['viento'], resiste: ['fuego'],
      ataques: [
        { nombre: 'Picotazo de plata', tipo: 'fisico', objetivo: 'uno', potencia: 1.1, prob: 1, efecto: 'garra' },
        { nombre: 'Aleteo', tipo: 'magico', objetivo: 'todos', potencia: 0.85, prob: 0.4, efecto: 'onda', elemento: 'viento' },
        { nombre: 'Brillo falso', tipo: 'magico', objetivo: 'todos', potencia: 0.95, prob: 0.3, aturdir: 0.3, efecto: 'destello', elemento: 'fuego', frase: '¡Mírame! ¡Yo soy el sol!' }
      ],
      suelta: [{ objeto: 'pluma', prob: 1 }],
      bestiario: 'Siete Guacamaya. Antes de que existiera el sol verdadero, presumía ser el sol y la luna porque sus ojos eran de plata y sus dientes de piedras preciosas. Los gemelos le dispararon con la cerbatana mientras comía de su árbol de nance. Algunos estudiosos lo relacionan con la Osa Mayor.'
    },
    camazotz: {
      nombre: 'Camazotz', arte: 'camazotz', zona: 'Cuevas de Xibalbá', jefe: true, purificable: true, espiritu: 'murcielago', colorEspiritu: '#b18cff',
      titulo: 'El murciélago de la muerte',
      vida: 850, fue: 31, def: 13, mag: 29, vel: 16, xp: 420,
      debil: ['fuego'], resiste: ['viento'],
      ataques: [
        { nombre: 'Cuchillo de pedernal', tipo: 'fisico', objetivo: 'uno', potencia: 1.15, prob: 1, efecto: 'corte' },
        { nombre: 'Eco de la noche', tipo: 'magico', objetivo: 'todos', potencia: 0.85, prob: 0.4, efecto: 'onda', aturdir: 0.25, frase: 'Mi sello vive en la mente de tu hermano.' },
        { nombre: 'Mordida vampira', tipo: 'fisico', objetivo: 'uno', potencia: 1.3, prob: 0.25, efecto: 'garra' }
      ],
      suelta: [{ objeto: 'pluma', prob: 1 }],
      bestiario: 'Camazotz ("murciélago de la muerte") aparece en el Popol Vuh en la Casa de los Murciélagos: cuando Hunahpú se asomó de su cerbatana, le cortó la cabeza. Para muchos pueblos mayas el murciélago se unía a la noche, la muerte y el inframundo; el glifo de la ciudad de Copán es un murciélago.'
    },
    zipacna: {
      nombre: 'Zipacná', arte: 'gigante', zona: 'Cuevas de Xibalbá', jefe: true, purificable: true, espiritu: 'montana', colorEspiritu: '#c49a6c',
      titulo: 'El que hace las montañas',
      vida: 1150, fue: 35, def: 17, mag: 26, vel: 11, xp: 700,
      debil: ['agua'], resiste: ['tierra'],
      ataques: [
        { nombre: 'Puño de montaña', tipo: 'fisico', objetivo: 'uno', potencia: 1.25, prob: 1, efecto: 'golpe' },
        { nombre: 'Lanzar el cerro', tipo: 'fisico', objetivo: 'todos', potencia: 0.85, prob: 0.4, efecto: 'roca', elemento: 'tierra', frase: '¡Yo hago las montañas!' },
        { nombre: 'Pisotón', tipo: 'fisico', objetivo: 'todos', potencia: 0.65, prob: 0.3, aturdir: 0.35, efecto: 'temblor' }
      ],
      suelta: [{ objeto: 'pluma', prob: 1 }],
      bestiario: 'Hijo de Vucub Caquix. Decía que él hacía las montañas. Venció a los Cuatrocientos Muchachos, que subieron al cielo como las estrellas de las Pléyades. Los gemelos lo engañaron con un cangrejo hecho de flores y hojas, y una montaña le cayó encima.'
    },
    // ======== IXBALANQUÉ BAJO EL SELLO ========
    ixbalanqueDuelo: {
      nombre: '{I} (poseído)', arte: 'poseido', zona: 'Selva de Ceiba', jefe: true, ocultaBestiario: true,
      vida: 420, fue: 15, def: 10, mag: 14, vel: 13, xp: 120,
      debil: [], resiste: [],
      ataques: [
        { nombre: 'Garra de sombra', tipo: 'fisico', objetivo: 'uno', potencia: 1.05, prob: 1, efecto: 'garra' },
        { nombre: 'Rugido del sello', tipo: 'magico', objetivo: 'todos', potencia: 0.85, prob: 0.35, efecto: 'onda', frase: 'Vete, hermano. Ya no soy el de antes.' }
      ],
      suelta: []
    },
    ixbalanquePoseido: {
      nombre: '{I} (poseído)', arte: 'poseido', zona: 'Casa de los Señores', jefe: true, sello: true,
      titulo: 'Bajo el Sello de Camazotz',
      vida: 900, fue: 52, def: 18, mag: 52, vel: 15, xp: 0,
      debil: [], resiste: [],
      ataques: [
        { nombre: 'Garra de sombra', tipo: 'fisico', objetivo: 'uno', potencia: 1.1, prob: 1, efecto: 'garra' },
        { nombre: 'Llamado oscuro', tipo: 'magico', objetivo: 'uno', potencia: 1.2, prob: 0.4, efecto: 'onda', frase: 'No... recuerdo... tu nombre...' },
        { nombre: 'Rugido del sello', tipo: 'magico', objetivo: 'todos', potencia: 0.9, prob: 0.3, aturdir: 0.25, efecto: 'onda' }
      ],
      suelta: [],
      bestiario: 'El Sello de Camazotz es una invención de este juego: una magia de los Señores de Xibalbá que apaga los recuerdos. En el Popol Vuh, Ixbalanqué nunca deja de ser compañero fiel de su hermano: incluso le devolvió la cabeza en la Casa de los Murciélagos.'
    },
    // ======== JEFE FINAL ========
    avatar: {
      nombre: 'Avatar de la Noche Eterna', corto: 'Avatar', arte: 'avatar', zona: 'Casa de los Señores', jefe: true,
      titulo: 'Hun Camé y Vucub Camé unidos',
      vida: 2700, fue: 42, def: 22, mag: 42, vel: 15, xp: 0,
      debil: ['fuego', 'agua'], resiste: ['viento'],
      ataques: [
        { nombre: 'Juicio de Xibalbá', tipo: 'magico', objetivo: 'todos', potencia: 0.9, prob: 0.4, efecto: 'destello', frase: 'Aquí abajo, nosotros juzgamos.' },
        { nombre: 'Bastón de los muertos', tipo: 'fisico', objetivo: 'uno', potencia: 1.25, prob: 1, efecto: 'golpe' },
        { nombre: 'Noche sin estrellas', tipo: 'magico', objetivo: 'uno', potencia: 1.4, prob: 0.3, aturdir: 0.3, efecto: 'onda', frase: 'La noche será eterna.' }
      ],
      suelta: [],
      bestiario: 'Forma que imagina este juego: Hun Camé ("Uno Muerte") y Vucub Camé ("Siete Muerte") unidos en un solo cuerpo. En el Popol Vuh no se fusionan; los gemelos los vencieron con astucia, disfrazados de magos danzantes.'
    },
    hunCame: { nombre: 'Hun Camé', arte: 'senor', zona: 'Casa de los Señores', ocultaBestiario: true, vida: 1, fue: 1, def: 1, mag: 1, vel: 1, ataques: [MORDIDA], bestiario: '' },
    vucubCame: {
      nombre: 'Vucub Camé', arte: 'senor', zona: 'Casa de los Señores', ocultaBestiario: true,
      paleta: { manto: '#5c1439', pluma: '#d62839', pluma2: '#e8b64c', ojo: '#05d9e8', borde: '#e8b64c' },
      vida: 1, fue: 1, def: 1, mag: 1, vel: 1, ataques: [MORDIDA], bestiario: ''
    },
    // ======== Aliados ========
    tzunun: {
      nombre: "Tz'unun, colibrí de luz", arte: 'colibriGrande', zona: 'Aliado', aliado: true,
      bestiario: "Tz'unun significa colibrí en k'iche'. En un relato maya q'eqchi', el Sol se transformó en colibrí para acercarse a la Luna. Los mayas admiraban al colibrí por su valentía y por el brillo de sus plumas."
    },
    alux: {
      nombre: 'Alux', arte: 'aluxGrande', zona: 'Aliado', aliado: true,
      bestiario: 'En la tradición maya de la península de Yucatán, los aluxes son espíritus pequeños que cuidan la milpa y el monte. La gente les deja ofrendas para que protejan los cultivos; si se les ofende, hacen travesuras.'
    },
    ixmucane: {
      nombre: 'Abuela Ixmucané', arte: 'abuelaGrande', zona: 'Aliada', aliado: true,
      bestiario: 'Ixmucané es la abuela de los gemelos. En el Popol Vuh también es una de las abuelas creadoras: molió el maíz amarillo y blanco con el que se formó a las primeras personas.'
    }
  };

  G.mundoMaya = G.mundoMaya || {};
  G.mundoMaya.criaturas = CRIATURAS;
})();
