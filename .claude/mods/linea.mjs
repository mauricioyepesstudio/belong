#!/usr/bin/env node
// Mod «línea»: barra de estado de Claude Code con puntos de color por proyecto.
//   ● ESTADO al día (verde ≤2 días, amarillo ≤7, rojo más)  ● cambios sin commit  ● agentes
// Solo lee; no escribe nada. Generado por equipos-skills; no editar a mano.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

let entrada = {};
try { entrada = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch {}
const raiz = entrada.workspace?.project_dir || entrada.workspace?.current_dir || process.env.CLAUDE_PROJECT_DIR || process.cwd();

const C = { verde: '\x1b[32m', amarillo: '\x1b[33m', rojo: '\x1b[31m', gris: '\x1b[90m', fin: '\x1b[0m' };
const punto = (color) => `${C[color]}●${C.fin}`;
const git = (...a) => { try { return execFileSync('git', a, { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } };

let nombre = 'proyecto';
try { nombre = JSON.parse(readFileSync(join(raiz, '.claude/mods/proyecto.json'), 'utf8')).nombre ?? nombre; } catch {}

const rama = git('branch', '--show-current') || 'sin rama';
const iso = git('log', '-1', '--format=%cI', '--', 'ESTADO.md');
const dias = iso ? Math.floor((Date.now() - Date.parse(iso)) / 86400000) : null;
const colorEstado = dias === null ? 'gris' : dias <= 2 ? 'verde' : dias <= 7 ? 'amarillo' : 'rojo';
const cambios = git('status', '--porcelain').split('\n').filter(Boolean).length;
const dirAgentes = join(raiz, '.claude/agents');
const agentes = existsSync(dirAgentes) ? readdirSync(dirAgentes).filter((f) => f.endsWith('.md')).length : 0;

const partes = [
  `${punto(colorEstado)} ${nombre}`,
  `${C.gris}${rama}${C.fin}`,
  `ESTADO ${dias === null ? '—' : `${dias}d`}`,
  `${punto(cambios ? 'amarillo' : 'verde')} ${cambios} cambio${cambios === 1 ? '' : 's'}`,
  `${punto(agentes ? 'verde' : 'rojo')} ${agentes} agentes`,
];
if (entrada.model?.display_name) partes.push(`${C.gris}${entrada.model.display_name}${C.fin}`);
process.stdout.write(partes.join('  ·  '));
