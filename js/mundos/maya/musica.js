/* =====================================================================
   MÚSICA DEL MUNDO MAYA
   selva (tranquila), templo, cuevas (misteriosa), cañón, palacio,
   casa oscura y el combate final contra los Señores de Xibalbá.
   ===================================================================== */
'use strict';

(function () {
  const sil = G.musica.sil;
  Object.assign(G.musica, {
    selva: {
      bpm: 92, sub: 2, eco: 0.3, volumen: 0.75, ambiente: 'selva',
      voces: [
        {
          inst: 'flauta', vol: 0.45, notas: [
            'D5 - B4 - D5 E5 G5 - E5 - D5 - B4 - A4 - G4 - A4 B4 D5 - - - E5 - D5 B4 A4 - - -',
            'G5 - E5 D5 E5 - G5 A5 G5 - E5 - D5 - - - B4 - D5 - E5 - D5 B4 A4 - G4 - - - . .',
            sil(32)
          ]
        },
        { inst: 'ocarina', vol: 0.3, notas: [sil(32), sil(32), 'B4 - - - D5 - - - E5 - - - D5 - B4 - A4 - - - G4 - - - A4 - - - - - . .'] },
        { inst: 'percusion', vol: 0.45, notas: 'x . s . o . s s x . s . o s . s' },
        { inst: 'percusion', vol: 0.4, notas: 'b . . . . . . . b . . b . . . .' },
        { inst: 'zumbido', vol: 0.25, notas: 'G2 - - - - - - - - - - - - - - - D3 - - - - - - - - - - - - - - -' }
      ]
    },
    templo: {
      bpm: 80, sub: 2, eco: 0.55, volumen: 0.75,
      voces: [
        { inst: 'ocarina', vol: 0.45, notas: ['E5 - - - G5 - A5 - B5 - - - A5 - G5 - E5 - - - D5 - E5 - - - - - . . . .', 'G5 - - - A5 - B5 - D6 - - - B5 - A5 - G5 - - - A5 - G5 - E5 - - - . . . .'] },
        { inst: 'zumbido', vol: 0.4, notas: 'E3 - - - - - - - - - - - - - - - D3 - - - - - - - - - - - - - - -' },
        { inst: 'percusion', vol: 0.45, notas: 'o . . . . . x . o . . . . . . .' }
      ]
    },
    cuevas: {
      bpm: 70, sub: 2, eco: 0.75, volumen: 0.8, ambiente: 'cueva',
      voces: [
        { inst: 'zumbido', vol: 0.55, notas: 'D2 - - - - - - - - - - - - - - - Eb2 - - - - - - - - - - - - - - -' },
        { inst: 'ocarina', vol: 0.4, notas: ['A4 - - Bb4 A4 - - - F4 - - - D4 - - - ' + sil(16), sil(8) + 'A4 - Bb4 - D5 - C5 Bb4 A4 - - - ' + sil(12)] },
        { inst: 'silbato', vol: 0.35, prob: 0.4, notas: 'E6 - - - ' + sil(60) },
        { inst: 'percusion', vol: 0.4, notas: 'o . . . . . . . . . . . x . . .' }
      ]
    },
    canon: {
      bpm: 86, sub: 2, eco: 0.6, volumen: 0.8, ambiente: 'cueva',
      voces: [
        { inst: 'percusion', vol: 0.6, notas: 'B . . o . . x . B . o . x . . .' },
        { inst: 'caracola', vol: 0.4, prob: 0.7, notas: 'D3 - - - - - - - ' + sil(24) },
        { inst: 'flauta', vol: 0.4, notas: 'D5 - F5 - G5 - A5 - G5 F5 D5 - . . . . C5 - D5 - F5 - E5 - D5 - - - . . . .' },
        { inst: 'zumbido', vol: 0.35, notas: 'D2 - - - - - - - - - - - - - - - C2 - - - - - - - - - - - - - - -' }
      ]
    },
    palacio: {
      bpm: 76, sub: 2, eco: 0.7, volumen: 0.8,
      voces: [
        { inst: 'zumbido', vol: 0.55, notas: 'C2 - - - - - - - - - - - - - - - Db2 - - - - - - - - - - - - - - -' },
        { inst: 'percusion', vol: 0.55, notas: 'B . . . . . . . b . . . . . . .' },
        { inst: 'flauta', vol: 0.35, notas: ['C5 - - Db5 C5 - G4 - - - . . Ab4 - G4 - F4 - - - G4 - - - - - . . . . . .', sil(32)] },
        { inst: 'silbato', vol: 0.35, prob: 0.4, notas: sil(40) + 'C7 - - - ' + sil(20) }
      ]
    },
    oscura: {
      bpm: 60, sub: 2, eco: 0.8, volumen: 0.8,
      voces: [
        { inst: 'zumbido', vol: 0.6, notas: 'A1 - - - - - - - - - - - - - - - Bb1 - - - - - - - - - - - - - - -' },
        { inst: 'percusion', vol: 0.5, notas: 'b . b . . . . . . . . . . . . .' },
        { inst: 'ocarina', vol: 0.3, prob: 0.6, notas: sil(16) + 'E5 - - - F5 - - - E5 - - - . . . .' }
      ]
    },
    jefeFinal: {
      bpm: 158, sub: 2, eco: 0.3, volumen: 0.85,
      voces: [
        { inst: 'percusion', vol: 0.85, notas: 'B . B x B . x x B . B x o x B B' },
        { inst: 'percusion', vol: 0.4, notas: 'S s s S s s S s' },
        { inst: 'caracola', vol: 0.5, notas: 'C3 - - - C3 - - - Db3 - - - C3 - Bb2 -' },
        {
          inst: 'flauta', vol: 0.5, notas: [
            'C5 Db5 C5 . G4 . C5 . Eb5 Db5 C5 . Bb4 . G4 . Ab4 - G4 - F4 - G4 - C5 - - - . . . .',
            'G5 - F5 Eb5 Db5 - C5 . Eb5 - Db5 C5 Bb4 - G4 . Ab4 - Bb4 - C5 - Db5 - C5 - - - - - . .'
          ]
        },
        { inst: 'zumbido', vol: 0.35, notas: 'C2 - - - - - - - - - - - - - - - Db2 - - - - - - - - - - - - - - -' },
        { inst: 'silbato', vol: 0.4, prob: 0.6, notas: sil(28) + 'E7 - - -' }
      ]
    }
  });
})();
