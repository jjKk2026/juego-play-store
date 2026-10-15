/* =====================================================================
   REGISTRO DE MUNDOS
   Cada cultura (maya, mexica, inca, muisca, mapuche...) es un "mundo"
   que vive en su propia carpeta dentro de js/mundos/ y se registra aquí.
   Un mundo trae: sus mapas, criaturas, jefes, historia, música y pistas.
   El motor y las escenas no cambian: solo se agrega una carpeta nueva.
   (Mira el README para ver la plantilla paso a paso.)
   ===================================================================== */
'use strict';

(function (raiz) {
  const G = raiz.G = raiz.G || {};
  const mundos = {};

  // Partes que cada mundo puede (o debe) traer.
  const OBLIGATORIO = ['id', 'nombre', 'cultura', 'inicio', 'mapas', 'criaturas'];

  G.mundos = {
    registrar(def) {
      OBLIGATORIO.forEach((k) => {
        if (!def[k]) throw new Error(`El mundo "${def.id || '?'}" no tiene "${k}"`);
      });
      def.historia = def.historia || {};
      def.dialogos = def.dialogos || {};
      def.pistas = def.pistas || {};
      def.zonas = def.zonas || {};
      def.fragmentos = def.fragmentos || [];
      mundos[def.id] = def;
      // Las criaturas de todos los mundos se juntan en un solo bestiario.
      Object.keys(def.criaturas).forEach((id) => { def.criaturas[id].id = id; def.criaturas[id].mundo = def.id; });
      return def;
    },
    obtener(id) { return mundos[id]; },
    lista() { return Object.values(mundos); },
    // Busca una criatura en cualquier mundo.
    criatura(id) {
      for (const m of Object.values(mundos)) if (m.criaturas[id]) return m.criaturas[id];
      return null;
    },
    todasLasCriaturas() {
      const r = [];
      Object.values(mundos).forEach((m) => Object.values(m.criaturas).forEach((c) => { if (!c.ocultaBestiario) r.push(c); }));
      return r;
    },
    // Mundos planeados para el futuro (se muestran como "próximamente").
    PROXIMOS: [
      { id: 'mictlan', nombre: 'Mictlán', cultura: 'Mexica', criaturas: ['Mictlantecuhtli', 'Tzitzimime', 'Ahuízotl'] },
      { id: 'ukupacha', nombre: 'Uku Pacha', cultura: 'Inca', criaturas: ['Supay', 'Amaru'] },
      { id: 'muisca', nombre: 'Laguna de Guatavita', cultura: 'Muisca', criaturas: ['Chibchacum', 'Huitaca', 'Bochica (aliado)'] },
      { id: 'mapuche', nombre: 'Tierras del Sur', cultura: 'Mapuche', criaturas: ['Caicai Vilu', 'Cherufe', 'Chonchón'] }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
