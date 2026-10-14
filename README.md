# Gemelos del Sol · La luz de Xibalbá

RPG de aventura en pixel art inspirado en el **Popol Vuh**. Los Gemelos Héroes, **Hunahpú** e **Ixbalanqué**, bajan a Xibalbá (el inframundo maya) para recuperar la luz del sol que robaron los Señores Hun Camé y Vucub Camé. Los acompaña **Tz'unun**, un colibrí de luz que da pistas y cuenta fragmentos del Popol Vuh.

- Juego completamente en español.
- Funciona **sin internet** y **guarda la partida solo** en el dispositivo.
- Se juega en el navegador (computador, iPad, celular) y como **APK de Android**.
- Todo el arte, la música y los sonidos están hechos con código: no hay imágenes ni audios copiados.

## Qué tiene

| Parte | Detalle |
|---|---|
| **Mundo** | 3 zonas: Selva de Ceiba, Cuevas de Xibalbá y Casa de los Señores, con 9 mapas, mazmorras, acertijos y jefes. |
| **Jefes** | Vucub Caquix, Zipacná, y Hun Camé y Vucub Camé juntos. |
| **Combate** | Por turnos con barra de tiempo (estilo Chrono Trigger): Atacar, Técnicas, Objetos y Huir. Técnicas dobles, golpe preciso, debilidades por elemento (fuego, agua, tierra, viento) y golpe final en cámara lenta con onomatopeyas de cómic. |
| **Acertijos** | Llaves, puertas, cofres, bloques que solo mueve Ixbalanqué, cristales que activa la cerbatana de Hunahpú, braseros que se encienden con dardos de fuego, placas, la Casa Oscura con luciérnagas y los jaguares que piden huesos. |
| **Historia** | Escenas en viñetas de cómic (trama de puntos, líneas de acción, colores desfasados). |
| **Progreso** | Vida, energía, niveles, técnicas nuevas, objetos (cacao, jade, copal, pluma de quetzal) y altares de copal que curan y guardan. |
| **Bestiario** | Dibujo de cada criatura con datos reales y breves sobre ella y la cultura maya. |
| **Menús** | Título animado, Nueva partida, Continuar, Opciones (volumen, velocidad del texto, modo de batalla…), Bestiario, pausa con guardado y botón de silencio. |

## Controles

| Acción | Teclado | Pantalla táctil |
|---|---|---|
| Moverse | Flechas o WASD | Cruceta |
| Hablar, abrir, confirmar, golpe preciso | Z, Espacio o Enter | A |
| Cancelar / habilidad del líder (cerbatana o rugido) | X | B |
| Cambiar de líder | C o Tab | ⇄ |
| Pausa | Esc o P | ❚❚ |
| Silenciar | M | 🔊 |

También funciona con control de consola (gamepad). En los menús se puede tocar directamente la opción.

## Cómo está organizado el código

```
index.html            la página del juego
css/juego.css         estilos y botones táctiles
js/motor/             piezas generales (pantalla, letras, controles, sonido, guardado, efectos, menús)
js/juego/             reglas, arte de los héroes, losetas y escenas (título, mapa, combate, cómic, pausa, bestiario)
js/mundos/maya/       todo lo del mundo maya: criaturas, mapas, historia, música y eventos
js/principal.js       arranque
tests/                pruebas automáticas
android/              envoltura de Android que mete el juego dentro del APK
.github/workflows/    compila el APK y lo publica en Releases
sw.js, manifest.json  para que funcione sin internet e instalable
```

### Agregar un mundo nuevo (Mictlán, Uku Pacha, Muisca, Mapuche…)

Cada cultura vive en su propia carpeta. El motor y las escenas no cambian.

1. Copia la carpeta `js/mundos/maya/` a, por ejemplo, `js/mundos/mictlan/`.
2. En `criaturas.js` cambia las criaturas y jefes (por ejemplo Mictlantecuhtli, Tzitzimime, Ahuízotl), con sus números, debilidades, texto del bestiario y dibujo.
3. En `mapas.js` dibuja los mapas con letras (la lista de letras está al inicio de `js/juego/losetas.js`).
4. En `historia.js` escribe las viñetas, diálogos, pistas y relatos.
5. En `musica.js` compón las canciones de las zonas.
6. En `mundo.js` cambia `id`, `nombre`, `cultura`, el punto de inicio y los eventos.
7. Agrega los archivos nuevos en `index.html` y en la lista de `sw.js`.
8. Corre las pruebas (abajo). Ellas avisan si falta algo.

En `js/juego/mundos.js` ya están anotados los próximos mundos; aparecen como "Próximamente" en el bestiario.

## Pruebas

- `node --test tests/*.test.js` revisa los mapas (salidas, llaves, puertas, rejas), los textos (que todas las letras existan en la fuente) y la dificultad (simula cientos de combates contra cada jefe). GitHub Actions las corre antes de compilar el APK.
- `node tests/partida-completa.mjs` (necesita Playwright) abre el juego en un navegador y un robot lo juega completo, de la pantalla de título a los créditos.

## Publicar

- **Web (GitHub Pages):** Settings → Pages → Branch `main` / carpeta `/ (root)`. El juego queda en `https://<tu-usuario>.github.io/juego-play-store/`. Si cambias el juego, sube el número de `VERSION` en `sw.js` para que los dispositivos reciban la versión nueva.
- **Android:** cada cambio en `main` compila un APK y lo publica en **Releases** (`GemelosDelSol-1.0.N.apk`). Si instalas una versión nueva encima de la anterior, la partida se conserva. No desinstales el juego para actualizarlo, porque desinstalar borra la partida.

La llave de firma del APK (`android/app/gemelos-release.keystore`) está en el repositorio para que todas las versiones se firmen igual. Si el repositorio es público y quieres una llave privada, guárdala en Settings → Secrets como `GEMELOS_KEYSTORE` (en base64) y `GEMELOS_KEYSTORE_PASSWORD`, y el workflow usará esa.

## Créditos y respeto cultural

La historia del juego es nueva, pero se inspira en el Popol Vuh, libro sagrado del pueblo maya k'iche'. Los seres del inframundo aparecen como señores y espíritus poderosos, no como caricaturas. Los datos del bestiario son reales y breves. Estilo inspirado (sin copiar nada) en Chrono Trigger, Zelda, Katana Zero, Estudio Ghibli y Spider-Verse.
