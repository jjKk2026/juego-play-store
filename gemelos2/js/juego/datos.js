/* =====================================================================
   DATOS GENERALES — Gemelos del Sol 2: El Sello de Camazotz
   Héroes, magias (gastan PE: Puntos de Espíritu), técnicas límite,
   espíritus aliados, objetos y reliquias.
   ===================================================================== */
'use strict';

(function (raiz) {
  const G = raiz.G = raiz.G || {};

  const ELEMENTOS = {
    fuego: { nombre: 'Fuego', color: '#ff7a3d' },
    agua: { nombre: 'Agua', color: '#4cc9f0' },
    tierra: { nombre: 'Tierra', color: '#c49a6c' },
    viento: { nombre: 'Viento', color: '#b8f2a1' }
  };

  // vida, energía (PE), fuerza, defensa, magia, velocidad
  const HEROES = {
    hunahpu: {
      nombre: 'Hunahpú', titulo: 'Cazador de la cerbatana', color: '#ff8a4c',
      base: { vida: 92, energia: 22, fue: 13, def: 9, mag: 11, vel: 13 },
      crec: { vida: 12, energia: 2.8, fue: 2.5, def: 1.7, mag: 2.1, vel: 0.9 },
      magias: [['dardoFuego', 1], ['aguaLuna', 2], ['vientoCortante', 4], ['escudoJade', 6], ['rayoAlba', 9]],
      limite: 'furiaSol'
    },
    ixbalanque: {
      nombre: 'Ixbalanqué', titulo: 'Corazón de jaguar', color: '#3fd3a8',
      base: { vida: 100, energia: 22, fue: 12, def: 10, mag: 12, vel: 11 },
      crec: { vida: 12.5, energia: 2.8, fue: 2.3, def: 1.8, mag: 2.2, vel: 0.8 },
      magias: [['llamadoJaguar', 1], ['aguaLuna', 1], ['olaRio', 1], ['rugidoTierra', 1]],
      limite: 'garraEclipse'
    }
  };

  // MAGIA: gasta PE. tipo: magico (daño), fisico (daño con fuerza), cura, escudo.
  const MAGIAS = {
    dardoFuego: { nombre: 'Dardo de fuego', costo: 4, tipo: 'magico', elemento: ['fuego'], objetivo: 'enemigo', potencia: 1.7, efecto: 'fuego', desc: 'Un dardo envuelto en llamas. Daño de fuego.' },
    aguaLuna: { nombre: 'Agua de luna', costo: 5, tipo: 'cura', objetivo: 'aliado', potencia: 2.6, efecto: 'cura', desc: 'Agua fresca bendecida por la luna. Cura la vida.' },
    vientoCortante: { nombre: 'Viento cortante', costo: 6, tipo: 'magico', elemento: ['viento'], objetivo: 'enemigos', potencia: 1.15, efecto: 'viento', desc: 'Una ráfaga de dardos que alcanza a todos. Daño de viento.' },
    escudoJade: { nombre: 'Escudo de jade', costo: 5, tipo: 'escudo', objetivo: 'aliados', potencia: 1.6, efecto: 'escudo', desc: 'Sube mucho la defensa por un tiempo.' },
    rayoAlba: { nombre: 'Rayo del alba', costo: 12, tipo: 'magico', elemento: ['fuego'], objetivo: 'enemigos', potencia: 1.75, efecto: 'alba', desc: 'La primera luz de la mañana quema a todos.' },
    llamadoJaguar: { nombre: 'Llamado del jaguar', costo: 4, tipo: 'fisico', elemento: ['tierra'], objetivo: 'enemigo', potencia: 1.7, efecto: 'jaguar', desc: 'Garras de jaguar que salen del suelo. Daño de tierra.' },
    olaRio: { nombre: 'Ola del río', costo: 8, tipo: 'magico', elemento: ['agua'], objetivo: 'enemigos', potencia: 1.4, efecto: 'agua', desc: 'Una ola arrastra a todos. Daño de agua.' },
    rugidoTierra: { nombre: 'Rugido de la tierra', costo: 12, tipo: 'fisico', elemento: ['tierra'], objetivo: 'enemigos', potencia: 1.8, efecto: 'terremoto', desc: 'El suelo tiembla bajo los enemigos.' }
  };

  // ESPÍRITU: técnicas que usan la barra de límite (0 a 100).
  const LIMITES = {
    furiaSol: { nombre: 'Furia del Sol', tipo: 'fisico', elemento: ['fuego'], objetivo: 'enemigo', potencia: 3.4, efecto: 'alba', desc: 'Hunahpú concentra toda la luz en un solo golpe.' },
    garraEclipse: { nombre: 'Garra del eclipse', tipo: 'fisico', elemento: ['tierra'], objetivo: 'enemigos', potencia: 2.4, efecto: 'terremoto', desc: 'Ixbalanqué desata la fuerza del jaguar sobre todos.' },
    tecnicaGemela: { nombre: 'Sol y Luna', tipo: 'magico', elemento: ['fuego', 'tierra', 'agua'], objetivo: 'enemigos', potencia: 4.6, efecto: 'solLuna', desc: 'TÉCNICA GEMELA: los dos límites juntos. El sol y la luna brillan a la vez.' }
  };
  const COSTO = { limite: 100, purificar: 50, invocar: 100, gemela: 100 };
  const LIMITE_AL_RECIBIR = 15;  // % que sube al recibir daño
  const LIMITE_AL_ATACAR = 5;    // % que sube al atacar
  const PURIFICAR_SELLO = 34;    // cuánto baja el Sello Oscuro una purificación
  const RELIQUIA_SELLO = 25;     // cuánto lo baja la Reliquia de Luz

  // Espíritus aliados: jefes purificados que ahora ayudan.
  const ESPIRITUS = {
    guacamaya: { nombre: 'Espíritu de la Guacamaya', de: 'vucubCaquix', invocacion: 'Plumaje del alba', tipo: 'curaTodo', potencia: 0.55, color: '#ffd166', desc: 'Cura a todo el equipo y lo protege con plumas de luz.' },
    murcielago: { nombre: 'Espíritu de Camazotz', de: 'camazotz', invocacion: 'Vuelo de Camazotz', tipo: 'drena', potencia: 2.1, elemento: ['viento'], color: '#b18cff', desc: 'Daña a todos los enemigos y devuelve vida al equipo.' },
    montana: { nombre: 'Espíritu de la Montaña', de: 'zipacna', invocacion: 'Muralla de Meauán', tipo: 'muralla', potencia: 2.4, elemento: ['tierra'], color: '#c49a6c', desc: 'Una montaña cae sobre los enemigos y protege al equipo.' }
  };

  const OBJETOS = {
    cacao: { nombre: 'Cacao', icono: 'cacao', uso: 'cura', valor: 70, objetivo: 'aliado', desc: 'Bebida espumosa de cacao. Cura 70 de vida.' },
    jade: { nombre: 'Cuenta de jade', icono: 'jade', uso: 'energia', valor: 20, objetivo: 'aliado', desc: 'Recupera 20 PE (Puntos de Espíritu).' },
    copal: { nombre: 'Copal', icono: 'copal', uso: 'huir', objetivo: 'ninguno', soloCombate: true, desc: 'Su humo te deja huir de cualquier combate (menos de un jefe).' },
    pluma: { nombre: 'Pluma de quetzal', icono: 'pluma', uso: 'revivir', valor: 0.5, objetivo: 'caido', desc: 'Revive a un aliado caído. Si caes, una pluma te levanta sola (una vez por combate).' },
    chispa: { nombre: 'Chispa de luz', icono: 'luciernaga', uso: 'chispa', objetivo: 'ninguno', soloCombate: true, clave: true, desc: 'Luz pura del sol. Hace retroceder a la sombra que posee a tu hermano.' },
    reliquiaLuz: { nombre: 'Reliquia de Luz', icono: 'sello', uso: 'sello', objetivo: 'enemigo', soloCombate: true, clave: true, desc: 'Una de las tres reliquias sagradas. Debilita mucho el Sello Oscuro.' }
  };

  // Las tres reliquias sagradas (se guardan como objetos especiales).
  const RELIQUIAS = {
    cacaoAncestral: { nombre: 'Cacao Ancestral', icono: 'cacao' },
    copalPuro: { nombre: 'Copal Puro', icono: 'copal' },
    jadeSagrado: { nombre: 'Jade Sagrado', icono: 'jade' }
  };

  const NOMBRES_POR_DEFECTO = { hunahpu: 'Ren', ixbalanque: 'Alex' };

  G.datos = {
    ELEMENTOS, HEROES, MAGIAS, LIMITES, COSTO, ESPIRITUS, OBJETOS, RELIQUIAS,
    LIMITE_AL_RECIBIR, LIMITE_AL_ATACAR, PURIFICAR_SELLO, RELIQUIA_SELLO,
    NIVEL_MAX: 30, NOMBRES_POR_DEFECTO, LARGO_NOMBRE: 10,
    // compatibilidad con piezas del primer juego
    TECNICAS: MAGIAS, DOBLES: {}
  };
})(typeof window !== 'undefined' ? window : globalThis);
