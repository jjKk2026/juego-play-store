/* =====================================================================
   MÚSICA GENERAL (sirve para todos los mundos)
   Cómo leer una pista:
   - bpm: velocidad.  sub: cuántos pasos por pulso (2 = corcheas).
   - Cada voz tiene un instrumento y sus "notas":
       "D5" toca la nota Re de la octava 5, "-" la sostiene, "." es silencio.
   - En la percusión: x/o tambor de tronco agudo/grave, B/b tambor grande,
     s/S sonaja corta/larga, k golpecito de madera.
   - Si "notas" es una lista, se alternan en cada vuelta.
   ===================================================================== */
'use strict';

(function () {
  const sil = (n) => Array(n).fill('.').join(' ');
  G.musica = G.musica || {};
  G.musica.sil = sil;

  Object.assign(G.musica, {
    titulo: {
      bpm: 72, sub: 2, eco: 0.55, volumen: 0.8,
      voces: [
        { inst: 'zumbido', vol: 0.6, notas: 'D3 - - - - - - - - - - - - - - - A2 - - - - - - - - - - - - - - -' },
        {
          inst: 'ocarina', vol: 0.55, notas: [
            'A4 - - C5 D5 - - - F5 - E5 D5 C5 - A4 - G4 - - A4 C5 - - - D5 - - - - - . .',
            'F5 - - E5 D5 - C5 - D5 - A4 - - - . . C5 - D5 - F5 - G5 - A5 - - - - - . .'
          ]
        },
        { inst: 'percusion', vol: 0.5, notas: 'x . . . o . . . x . . . o . . s' },
        { inst: 'caracola', vol: 0.35, notas: 'D3 - - - - - - - ' + sil(56) }
      ]
    },
    batalla: {
      bpm: 138, sub: 2, eco: 0.2, volumen: 0.75,
      voces: [
        { inst: 'percusion', vol: 0.75, notas: 'B . x x o . x . B B x . o . x s' },
        { inst: 'percusion', vol: 0.4, notas: 's s S s s s S s' },
        {
          inst: 'flauta', vol: 0.5, notas: [
            'D5 . D5 F5 G5 . F5 D5 C5 . A4 C5 D5 - - . D5 . D5 F5 A5 . G5 F5 G5 . F5 D5 C5 - - .',
            'F5 . F5 G5 A5 . G5 F5 D5 . C5 D5 F5 - - . G5 . F5 D5 C5 . A4 C5 D5 - - - - - . .'
          ]
        },
        { inst: 'caracola', vol: 0.4, notas: 'D3 - - - . . . . F3 - - - . . . . G3 - - - . . . . A3 - - - C4 - A3 -' }
      ]
    },
    jefe: {
      bpm: 150, sub: 2, eco: 0.25, volumen: 0.8,
      voces: [
        { inst: 'percusion', vol: 0.8, notas: 'B . B x o B x x B . B x o x B x' },
        { inst: 'percusion', vol: 0.35, notas: 'S s s s S s s s' },
        { inst: 'caracola', vol: 0.5, notas: 'D3 - - - D3 - - - Eb3 - - - D3 - C3 -' },
        {
          inst: 'flauta', vol: 0.5, notas: [
            'D5 Eb5 D5 . A4 . D5 . F5 Eb5 D5 . C5 . A4 . Bb4 - A4 - G4 - A4 - D5 - - - . . . .',
            'A5 - G5 F5 Eb5 - D5 . F5 - Eb5 D5 C5 - A4 . Bb4 - C5 - D5 - Eb5 - D5 - - - - - . .'
          ]
        },
        { inst: 'silbato', vol: 0.4, prob: 0.5, notas: '. . . . . . . . . . . . . . . . . . . . . . . . . . . . E7 - - -' }
      ]
    },
    victoria: {
      bpm: 120, sub: 2, eco: 0.3, volumen: 0.8,
      voces: [
        { inst: 'flauta', vol: 0.6, notas: 'D5 . F#5 . A5 - - . A5 . B5 A5 F#5 - D5 - E5 - - - F#5 - - - D5 - - - - - . .' },
        { inst: 'ocarina', vol: 0.35, notas: 'A4 - - - D5 - - - F#5 - - - D5 - - - C#5 - - - A4 - - - F#4 - - - - - . .' },
        { inst: 'percusion', vol: 0.6, notas: 'B . x . B . x . B . x x B x B .' }
      ]
    },
    derrota: {
      bpm: 60, sub: 2, eco: 0.6, volumen: 0.7,
      voces: [
        { inst: 'ocarina', vol: 0.55, notas: 'A4 - - - G4 - F4 - E4 - - - - - - - D4 - - - - - - - . . . . . . . .' },
        { inst: 'zumbido', vol: 0.5, notas: 'D3 - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -' }
      ]
    },
    final: {
      bpm: 84, sub: 2, eco: 0.5, volumen: 0.85,
      voces: [
        {
          inst: 'flauta', vol: 0.55, notas: [
            'G5 - - E5 D5 - B4 - D5 - E5 - G5 - - - A5 - G5 E5 D5 - E5 - G5 - - - - - . .',
            'B5 - - A5 G5 - E5 - G5 - A5 - B5 - D6 - B5 - - A5 G5 - E5 - D5 - - - - - . .'
          ]
        },
        { inst: 'ocarina', vol: 0.3, notas: 'D5 - - - - - - - B4 - - - - - - - C5 - - - - - - - D5 - - - - - - -' },
        { inst: 'zumbido', vol: 0.4, notas: 'G2 - - - - - - - - - - - - - - - C3 - - - - - - - D3 - - - - - - -' },
        { inst: 'percusion', vol: 0.45, notas: 'x . s . o . s . x . s s o . s .' }
      ]
    }
  });
})();
