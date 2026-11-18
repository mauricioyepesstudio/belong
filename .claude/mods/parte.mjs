#!/usr/bin/env node
// Mod «parte»: hook SessionStart. Al abrir el proyecto le recuerda al agente qué sigue
// y qué está bloqueado según ESTADO.md, y cuántos días lleva sin actualizarse.
// Solo lee archivos y git; no escribe nada. Generado por equipos-skills; no editar a mano.

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const raiz = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const estadoRuta = join(raiz, 'ESTADO.md');
if (!existsSync(estadoRuta)) { console.log('Parte: este proyecto no tiene ESTADO.md; créalo antes de elegir el PR del día.'); process.exit(0); }

const texto = readFileSync(estadoRuta, 'utf8');

function seccion(nombre, max) {
  const re = new RegExp(`^#{1,4}\\s*[^\\n]*${nombre}[^\\n]*$`, 'im');
  const m = re.exec(texto);
  if (!m) return [];
  const resto = texto.slice(m.index + m[0].length).split(/\n(?=#{1,4}\s)/)[0];
  return resto.split('\n').map((l) => l.trim()).filter((l) => /^([-*]|\d+[.)])\s+/.test(l)).slice(0, max);
}

let dias = null;
try {
  const iso = execFileSync('git', ['log', '-1', '--format=%cI', '--', 'ESTADO.md'], { cwd: raiz, encoding: 'utf8' }).trim();
  if (iso) dias = Math.floor((Date.now() - Date.parse(iso)) / 86400000);
} catch {}

const siguiente = seccion('Siguiente', 5);
const bloqueado = seccion('Bloquead', 4);
const lineas = [`Parte del proyecto (ESTADO.md${dias === null ? '' : `, actualizado hace ${dias} día${dias === 1 ? '' : 's'}`}):`];
if (siguiente.length) lineas.push('Siguiente:', ...siguiente);
if (bloqueado.length) lineas.push('Bloqueado (solo el dueño lo destraba):', ...bloqueado);
if (dias !== null && dias > 3) lineas.push(`Aviso: ESTADO.md lleva ${dias} días sin cambios; estado-keeper debe ponerlo al día en el PR de hoy.`);
lineas.push('Reglas: un PR pequeño por tarea, nada se integra, publica ni cobra sin el «sí» del dueño. Ver docs/cerebro/agencia.md.');
console.log(lineas.join('\n'));
