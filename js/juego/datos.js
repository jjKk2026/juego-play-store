/* =====================================================================
   DATOS GENERALES DEL JUEGO
   Aquí están los números: héroes, técnicas, objetos y elementos.
   Si quieres que un personaje sea más fuerte o que una técnica cueste
   menos energía, este es el lugar para cambiarlo.
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

  // ------------------------------ HÉROES ------------------------------
  // base: atributos en nivel 1. crec: cuánto sube cada atributo por nivel.
  // vida, energía, fuerza, defensa, magia (poder espiritual) y velocidad.
  const HEROES = {
    hunahpu: {
      nombre: 'Hunahpú',
      titulo: 'Cazador de la cerbatana',
      color: '#ff8a4c',
      base: { vida: 64, energia: 18, fue: 12, def: 7, mag: 9, vel: 13 },
      crec: { vida: 9.5, energia: 2.6, fue: 2.4, def: 1.4, mag: 1.9, vel: 0.9 },
      tecnicas: [['cerbatana', 1], ['dardoFuego', 3], ['lluviaDardos', 6], ['rayoAlba', 10]]
    },
    ixbalanque: {
      nombre: 'Ixbalanqué',
      titulo: 'Corazón de jaguar',
      color: '#3fd3a8',
      base: { vida: 74, energia: 20, fue: 11, def: 9, mag: 11, vel: 10 },
      crec: { vida: 11, energia: 2.8, fue: 2.1, def: 1.8, mag: 2.1, vel: 0.7 },
      tecnicas: [['escudoJade', 1], ['llamadoJaguar', 2], ['aguaLuna', 4], ['olaRio', 7], ['rugidoTierra', 11]]
    }
  };

  // ------------------------------ TÉCNICAS ------------------------------
  // tipo: fisico (usa fuerza), magico (usa magia), cura, escudo.
  // objetivo: enemigo, enemigos (todos), aliado, aliados (los dos).
  const TECNICAS = {
    cerbatana: {
      nombre: 'Cerbatana', costo: 3, tipo: 'fisico', elemento: ['viento'], objetivo: 'enemigo', potencia: 1.35,
      efecto: 'dardo', desc: 'Un dardo veloz soplado con la cerbatana. Daño de viento.'
    },
    dardoFuego: {
      nombre: 'Dardo de fuego', costo: 5, tipo: 'magico', elemento: ['fuego'], objetivo: 'enemigo', potencia: 1.8,
      efecto: 'fuego', desc: 'Un dardo envuelto en llamas de ocote. Daño de fuego.'
    },
    lluviaDardos: {
      nombre: 'Lluvia de dardos', costo: 8, tipo: 'fisico', elemento: ['viento'], objetivo: 'enemigos', potencia: 1.05,
      efecto: 'lluvia', desc: 'Muchos dardos a la vez contra todos los enemigos.'
    },
    rayoAlba: {
      nombre: 'Rayo del alba', costo: 12, tipo: 'magico', elemento: ['fuego'], objetivo: 'enemigos', potencia: 1.7,
      efecto: 'alba', desc: 'La primera luz de la mañana quema a todos los enemigos.'
    },
    escudoJade: {
      nombre: 'Escudo de jade', costo: 4, tipo: 'escudo', objetivo: 'aliados', potencia: 1.6,
      efecto: 'escudo', desc: 'Un escudo de jade protege a los dos gemelos por un tiempo.'
    },
    llamadoJaguar: {
      nombre: 'Llamado del jaguar', costo: 4, tipo: 'fisico', elemento: ['tierra'], objetivo: 'enemigo', potencia: 1.6,
      efecto: 'jaguar', desc: 'Garras de jaguar que salen de la tierra. Daño de tierra.'
    },
    aguaLuna: {
      nombre: 'Agua de luna', costo: 5, tipo: 'cura', objetivo: 'aliado', potencia: 2.4,
      efecto: 'cura', desc: 'Agua fresca bendecida por la luna. Cura la vida de un gemelo.'
    },
    olaRio: {
      nombre: 'Ola del río', costo: 9, tipo: 'magico', elemento: ['agua'], objetivo: 'enemigos', potencia: 1.35,
      efecto: 'agua', desc: 'Una ola del río arrastra a todos los enemigos. Daño de agua.'
    },
    rugidoTierra: {
      nombre: 'Rugido de la tierra', costo: 12, tipo: 'fisico', elemento: ['tierra'], objetivo: 'enemigos', potencia: 1.6,
      efecto: 'terremoto', desc: 'El rugido del jaguar hace temblar el suelo bajo los enemigos.'
    }
  };

  // Técnicas dobles: necesitan las barras de los DOS gemelos llenas.
  const DOBLES = {
    juegoPelota: {
      nombre: 'Juego de pelota', requiere: ['cerbatana', 'llamadoJaguar'], costo: [4, 4],
      tipo: 'fisico', elemento: ['tierra', 'viento'], objetivo: 'enemigo', potencia: 3.2,
      efecto: 'pelota', desc: 'Los gemelos se pasan la pelota de hule y la lanzan con fuerza, como en el juego de pelota sagrado.'
    },
    eclipseGemelo: {
      nombre: 'Eclipse gemelo', requiere: ['dardoFuego', 'aguaLuna'], costo: [6, 6],
      tipo: 'magico', elemento: ['fuego', 'agua'], objetivo: 'enemigos', potencia: 2.0, curaAliados: 0.25,
      efecto: 'eclipse', desc: 'El sol y la luna se cruzan: daña a todos y cura un poco a los gemelos.'
    },
    solYLuna: {
      nombre: 'Sol y Luna', requiere: ['rayoAlba', 'rugidoTierra'], costo: [10, 10],
      tipo: 'magico', elemento: ['fuego', 'tierra'], objetivo: 'enemigos', potencia: 3.0,
      efecto: 'solLuna', desc: 'La técnica definitiva: los gemelos brillan como el sol y la luna.'
    }
  };

  // ------------------------------ OBJETOS ------------------------------
  const OBJETOS = {
    cacao: {
      nombre: 'Cacao', icono: 'cacao', uso: 'cura', valor: 60, objetivo: 'aliado',
      desc: 'Bebida espumosa de cacao. Cura 60 de vida.'
    },
    jade: {
      nombre: 'Cuenta de jade', icono: 'jade', uso: 'energia', valor: 20, objetivo: 'aliado',
      desc: 'Piedra verde llena de energía. Recupera 20 de energía.'
    },
    copal: {
      nombre: 'Copal', icono: 'copal', uso: 'huir', objetivo: 'ninguno', soloCombate: true,
      desc: 'Resina aromática. Su humo te deja huir de cualquier combate (menos de un jefe).'
    },
    pluma: {
      nombre: 'Pluma de quetzal', icono: 'pluma', uso: 'revivir', valor: 0.5, objetivo: 'caido',
      desc: 'Pluma sagrada y brillante. Revive a un gemelo caído con la mitad de su vida.'
    }
  };

  G.datos = { ELEMENTOS, HEROES, TECNICAS, DOBLES, OBJETOS, NIVEL_MAX: 30 };
})(typeof window !== 'undefined' ? window : globalThis);
