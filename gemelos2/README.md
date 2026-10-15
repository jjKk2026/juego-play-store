# Gemelos del Sol 2 · El Sello de Camazotz

Segunda parte de *Gemelos del Sol*, hecha sobre el mismo motor. Es un RPG en pixel art inspirado en el **Popol Vuh**, en español, que funciona **sin internet**, guarda la partida solo y se juega en el navegador o como **APK de Android** (app separada del primer juego: se pueden tener las dos).

## La historia

- **Prólogo.** Camazotz, el murciélago de la muerte, le pone a **Ixbalanqué** el *Sello de Camazotz*: pierde la memoria y se va a Xibalbá. **Hunahpú** sale a buscarlo solo, con el colibrí Tz'unun.
- **Capítulo 1 · Selva de Ceiba.** En las raíces de la ceiba vence a **Vucub Caquix** y lo *purifica*: se vuelve el Espíritu de la Guacamaya y le da la **chispa de luz**. De vuelta en la selva aparece su hermano poseído: un **duelo** en el que hay que resistir 5 turnos (o usar la chispa).
- **Capítulo 2 · Cuevas de Xibalbá.** Hay que reunir las tres **reliquias sagradas**: el **Cacao Ancestral** (en un cofre de las cuevas), el **Copal Puro** (lo da **Camazotz** al purificarlo) y el **Jade Sagrado** (lo cuida **Zipacná** en el cañón de Meauán).
- **Final · Casa de los Señores.** *Fase 1:* Ixbalanqué poseído tiene dos barras, **Vida** y **Sello Oscuro**. Si su vida llega a 0 se pierde (¡es tu hermano!); se gana bajando el sello a 0 con **Espíritu → Purificar** o con la **Reliquia de Luz**. *Fase 2:* los gemelos juntos contra el **Avatar de la Noche Eterna** (Hun Camé y Vucub Camé unidos), con la **Técnica Gemela** *Sol y Luna*.

## El combate (ATB, estilo Final Fantasy)

Cada personaje tiene una barra de **Tiempo**; cuando se llena, elige entre 5 comandos:

| Comando | Qué hace |
|---|---|
| **Atacar** | Golpe físico. Presiona A cuando el anillo se junte para un *golpe preciso*. |
| **Magia** | Gasta **PE** (Puntos de Espíritu): fuego, agua, viento, tierra, curar, escudo. |
| **Espíritu** | Usa la barra de **Límite**: técnica especial, **Purificar**, invocar a un **espíritu aliado** o la **Técnica Gemela**. |
| **Objeto** | Cacao, jade, copal, pluma de quetzal, chispa de luz, reliquias. |
| **Defender** | Recibes la mitad del daño hasta tu siguiente turno. |

- El **Límite** sube **15%** cada vez que te golpean y **5%** cada vez que atacas.
- Solo los **jefes** (no los enemigos comunes) se purifican: al vencerlos quedan *debilitados* y con **corrupción**; dos purificaciones (gratis) los liberan y se vuelven **espíritus aliados** que puedes invocar.

## Cómo está organizado el código

```
gemelos2/
  js/motor/        motor (igual que el juego 1: pantalla, entrada, audio, guardado, interfaz)
  js/combate/      LÓGICA del combate, sin dibujar nada:
    personaje.js     class Personaje       (héroe o criatura: vida, PE, ATB, límite, sello…)
    sistema.js       class SistemaCombate  (turnos ATB, daño, límite, purificar, sello, resultados)
    menu-acciones.js class MenuAcciones    (los 5 comandos y la elección de objetivo)
  js/juego/        escenas (título, mapa, combate, pausa…), datos.js, reglas.js, volumen.js (sombreado)
  js/mundos/maya2/ criaturas, su arte (arte-criaturas.js), mapas, historia, música y eventos
  tests/           pruebas en Node y el robot que juega la partida completa
  android/         proyecto Android (WebView) — applicationId co.gemelosdelsol.juego2
```

La escena de combate (`js/juego/escena-combate.js`) solo **dibuja y anima**: le pide al `SistemaCombate` que avance y anima los "eventos" que éste devuelve (`danio`, `cura`, `purifica`, `selloRoto`, `invoca`…).

### Cómo crear una batalla de prueba

**En el navegador** (abre `gemelos2/index.html`, luego la consola del navegador con F12):

```js
G.partida.nueva();                 // partida nueva
G.debug.subirNivel(5);             // sube a los héroes 5 niveles
G.partida.dar('cacao', 3);         // algunos objetos
// combate de jefe con purificación:
G.motor.apilar(new G.EscenaCombate({ grupo: ['vucubCaquix'], modo: 'jefe', fondo: 'templo' }));
// otros modos: 'normal', 'duelo' (resistir turnos), 'sello' (Ixbalanqué poseído),
// 'final' (dos héroes): { grupo: ['avatar'], modo: 'final', heroes: ['hunahpu', 'ixbalanque'] }
```

**Sin pantalla (solo la lógica, en Node)**, como hacen las pruebas:

```js
const { cargar } = require('./tests/cargar-juego.js');
const G = cargar();
const heroe = G.Personaje.deHeroe(G.reglas.crearHeroe('hunahpu', 5));
const jefe = G.Personaje.deCriatura('vucubCaquix');
const combate = new G.SistemaCombate({ heroes: [heroe], enemigos: [jefe], modo: 'jefe', inventario: { cacao: 3 } });

combate.actualizar(2);                                   // avanza 2 segundos las barras de tiempo
const eventos = combate.ejecutar(heroe, { tipo: 'atacar', objetivo: jefe });
console.log(eventos, jefe.vida, heroe.limite);           // el límite subió 5%
```

## Pruebas

- `node --test gemelos2/tests/*.test.js` — mapas, historia, reglas del combate (límite, defender, purificar, Sello Oscuro, duelo, técnica gemela) y dificultad (simula cientos de combates contra cada jefe).
- `node gemelos2/tests/partida-completa.mjs` (necesita Playwright) — un robot juega la aventura completa, de la pantalla de título a los créditos.

## Publicar

- **Web:** con GitHub Pages activado en `main` (carpeta raíz), el juego 2 queda en `https://<tu-usuario>.github.io/juego-play-store/gemelos2/`. Si lo cambias, sube el número de `VERSION` en `gemelos2/sw.js`.
- **Android:** el mismo workflow compila `GemelosDelSol2-1.0.N.apk` y lo publica en **Releases** junto al del juego 1.

La partida, las opciones y el bestiario se guardan aparte de los del primer juego.
