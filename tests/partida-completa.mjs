// Prueba de la partida completa: un robot juega desde la pantalla de título
// hasta los créditos finales, en un navegador real (Chromium con Playwright).
// Uso:  node tests/partida-completa.mjs   (necesita Playwright instalado)
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) {
  ({ chromium } = await import('/opt/node22/lib/node_modules/playwright/index.mjs'));
}

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const carpetaFotos = process.env.FOTOS || null;
const VELOCIDAD = Number(process.env.VELOCIDAD || 10);
const LIMITE_MIN = Number(process.env.LIMITE_MIN || 25);

const navegador = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const pagina = await navegador.newPage({ viewport: { width: 960, height: 540 } });
const errores = [];
pagina.on('pageerror', (e) => errores.push('Error de página: ' + e.message));
pagina.on('console', (m) => { if (m.type() === 'error') errores.push('Consola: ' + m.text()); });

await pagina.goto('file://' + path.join(raiz, 'index.html'));
await pagina.waitForFunction(() => window.G && G.motor && G.motor.escena());
await pagina.evaluate(() => localStorage.clear());
await pagina.addScriptTag({ path: path.join(raiz, 'tests/robot.js') });
await pagina.evaluate(([v, dbg]) => { G.debug.velocidad = v; window.ROBOT_DEBUG = dbg; }, [VELOCIDAD, !!process.env.ROBOT_DEBUG]);

const inicio = Date.now();
let fotosTomadas = new Set();
let ultimoLog = 0;
while (true) {
  await pagina.waitForTimeout(1000);
  const r = await pagina.evaluate(() => ({
    terminado: ROBOT.terminado, error: ROBOT.error, log: ROBOT.log, fotos: ROBOT.fotos,
    errores: G.errores.slice(), paso: ROBOT.i
  }));
  r.log.slice(ultimoLog).forEach((l) => console.log('  ' + l));
  ultimoLog = r.log.length;
  if (carpetaFotos) {
    for (const f of r.fotos) {
      if (!fotosTomadas.has(f)) { fotosTomadas.add(f); await pagina.screenshot({ path: path.join(carpetaFotos, f + '.png') }); }
    }
  }
  if (r.errores.length) { errores.push(...r.errores); break; }
  if (r.error) { errores.push('Robot: ' + r.error); break; }
  if (r.terminado) break;
  if ((Date.now() - inicio) / 60000 > LIMITE_MIN) { errores.push('Tiempo agotado en el paso ' + r.paso); break; }
}

const resumen = await pagina.evaluate(() => ({
  combates: ROBOT.combates, precisos: ROBOT.precisos, derrotas: ROBOT.derrotas, subidas: ROBOT.subidas,
  niveles: G.partida.heroes().map((h) => h.id + ' nv ' + h.nivel), fin: G.partida.bandera('fin'),
  guardado: !!localStorage.getItem('gemelos-del-sol.partida'),
  bestiario: Object.keys(JSON.parse(localStorage.getItem('gemelos-del-sol.bestiario') || '{}')).length
}));
if (carpetaFotos) await pagina.screenshot({ path: path.join(carpetaFotos, 'ultimo.png') });
await navegador.close();

console.log('\nResumen:', JSON.stringify(resumen));
if (errores.length || !resumen.fin) {
  console.error('\n✘ La partida NO se completó:\n' + errores.join('\n'));
  process.exit(1);
}
console.log('\n✔ Partida completa de principio a fin, sin errores.');
