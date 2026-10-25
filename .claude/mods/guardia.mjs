#!/usr/bin/env node
// Mod «guardia»: hook PreToolUse que frena, antes de ejecutarse, las acciones que en
// este portafolio solo decide el dueño. Sale con 2 (bloquea) y explica el motivo.
// Generado por AI-Projects-Control-Plane/equipos-skills; no editar a mano.

import { readFileSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

let entrada = {};
try { entrada = JSON.parse(readFileSync(0, 'utf8') || '{}'); } catch { process.exit(0); }
const herramienta = entrada.tool_name ?? '';
const datos = entrada.tool_input ?? {};

const raiz = process.env.CLAUDE_PROJECT_DIR || entrada.cwd || process.cwd();
const cfgRuta = join(raiz, '.claude/mods/guardia.json');
const extra = existsSync(cfgRuta) ? JSON.parse(readFileSync(cfgRuta, 'utf8')) : { comandos: [] };

const COMANDOS = [
  [/git\s+push\b[^\n]*(\s--force\b|\s-f\b|\s--force-with-lease\b)[^\n]*\b(main|master)\b/i, 'Forzar push a la rama principal.'],
  [/git\s+push\b[^\n]*\borigin\s+(main|master)\b/i, 'Subir directo a la rama principal: el cambio va por PR y lo integra el dueño.'],
  [/\bgh\s+pr\s+merge\b/i, 'Integrar un PR: eso lo hace el dueño.'],
  [/\bsupabase\s+(db\s+push|db\s+reset|migration\s+up)\b/i, 'Aplicar migraciones al Supabase vivo: necesita el OK del dueño.'],
  [/\bvercel\b[^\n]*(--prod\b|\bpromote\b)/i, 'Publicar en producción de Vercel: necesita el OK del dueño.'],
  [/\bstripe\b[^\n]*--live\b/i, 'Operar Stripe en modo Live.'],
  [/\brm\s+-rf?\s+(\/|~|\.)(\s|$)/i, 'Borrado masivo.'],
  ...extra.comandos.map(([re, motivo]) => [new RegExp(re, 'i'), motivo]),
];

function bloquear(motivo) {
  process.stderr.write(`guardia: bloqueado. ${motivo} Pídeselo al dueño en el chat; no busques otra vía.\n`);
  process.exit(2);
}

if (/^(Bash|PowerShell)$/.test(herramienta)) {
  const cmd = String(datos.command ?? '');
  for (const [re, motivo] of COMANDOS) if (re.test(cmd)) bloquear(motivo);
}

if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(herramienta)) {
  const archivo = basename(String(datos.file_path ?? datos.notebook_path ?? ''));
  if (/^\.env(\..+)?$/i.test(archivo) && !/\.example$/i.test(archivo)) bloquear(`Editar ${archivo}: las llaves las guarda el dueño, nunca un agente.`);
}

process.exit(0);
