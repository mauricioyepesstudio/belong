# Equipos de skills — BELONG

> Generado por `AI-Projects-Control-Plane/equipos-skills` (versión 2026-10-15). No editar a mano: el cambio se hace en el cerebro central y se regenera.

**Para qué sirve este proyecto:** Plataforma social con propósito; contenido externo en inglés.

## Cómo se activan

- **Claude Code en el computador:** al abrir esta carpeta y aceptar la confianza del proyecto, Claude Code ofrece instalar el marketplace `equipos-rge` y los plugins de abajo (están en `.claude/settings.json`). Si no lo ofrece: `claude plugin marketplace add ./.claude/equipos` y luego `claude plugin install <plugin>@equipos-rge` por cada uno.
- **Ver qué quedó activo:** `/plugin` dentro de Claude Code.
- Cada plugin está fijado a un commit revisado: no cambia solo cuando su autor publica algo nuevo.

## Equipos

| Equipo | Plugin | Qué hace | Fuente · licencia |
|---|---|---|---|
| Marketing (anuncios, copy, SEO, analítica, estrategia) | `marketing-skills` | Equipo de marketing: anuncios (ads, ad-creative), copywriting y copy-editing, SEO (seo-audit, ai-seo, programmatic-seo, schema, site-architecture), analítica y atribución, estrategia (marketing-plan, launch, pricing, offers, cro) y email. | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills/tree/55ff469422c3592dac45bcad08dfb40221981c02) @ `55ff469` · MIT |
| Redes sociales (LinkedIn, reels, YouTube, analítica, newsletter) | `social-media-skills` | Equipo de redes: LinkedIn (post-writer, hook-generator, post-formatter, post-scorer, profile-optimizer), reels (reels-scripting), YouTube (youtube-thumbnail), analítica (analytics-dashboard), newsletter (newsletter-voice), voz de marca y carruseles. *Requiere:* reels-scripting usa APIFY_API_TOKEN y GOOGLE_AI_API_KEY; las imágenes usan Gemini. Sin esas llaves esos skills no corren; el resto sí. | [charlie947/social-media-skills](https://github.com/charlie947/social-media-skills/tree/8cefb5b6d03757885faa6918bd8bfaef202a83db) @ `8cefb5b` · MIT |
| Diseño | `taste-skill` | Equipo de diseño: dirección de arte anti-plantilla para landings y sitios (taste-skill v2, redesign, minimalist, soft, brutalist, brandkit, image-to-code). *Requiere:* Su script de imágenes consulta APIs públicas (Openverse, Wikimedia, Met, Art Institute, Internet Archive) y solo trae imágenes CC0/CC-BY con su licencia. | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill/tree/f624f37a8c650b9cc550253104925efe4c8de246) @ `f624f37` · MIT |
| Diseño | `diseno-frontend` | frontend-design de Anthropic: interfaces con criterio visual, complemento de taste-skill. | [anthropics/skills](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44) @ `dbd4588` · Apache-2.0 |
| Documentos | `documentos` | Equipo de documentos: Word, PDF, PowerPoint, Excel, coautoría de documentos y comunicaciones internas. Se instala desde la fuente oficial; no se copia a los repos. | [anthropics/skills](https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44) @ `dbd4588` · Anthropic (docx/pdf/pptx/xlsx: uso según los términos de Anthropic, no redistribuir) · Apache-2.0 (doc-coauthoring, internal-comms) |
| Finanzas (apoyo, con revisión humana) | `financial-analysis` | Equipo financiero: modelo de 3 estados, DCF, comparables, análisis competitivo, auditoría y limpieza de Excel, decks financieros. *Requiere:* Trae conectores de datos de mercado (FactSet, S&P, Morningstar, Daloopa, Moody's) que piden cuenta propia; sin ellos trabaja con los números que le des. | [anthropics/financial-services-plugins](https://github.com/anthropics/financial-services-plugins/tree/574ed3624aebd0418c7e96cd101262f30210ab26/plugins/vertical-plugins/financial-analysis) @ `574ed36` · Apache-2.0 |
| Legal (apoyo, con revisión de abogado) | `commercial-legal` | Contratos: NDAs (verde/amarillo/rojo), contratos de proveedor y SaaS, renovaciones, enmiendas, escalamiento. | [anthropics/claude-for-legal](https://github.com/anthropics/claude-for-legal/tree/4a6c651889c97cc9140580363c73e0eb17379c2b/commercial-legal) @ `4a6c651` · Apache-2.0 |
| Legal (apoyo, con revisión de abogado) | `privacy-legal` | Privacidad: evaluaciones de impacto (PIA), DPAs, solicitudes de datos (DSAR), brechas regulatorias. | [anthropics/claude-for-legal](https://github.com/anthropics/claude-for-legal/tree/4a6c651889c97cc9140580363c73e0eb17379c2b/privacy-legal) @ `4a6c651` · Apache-2.0 |
| Legal (apoyo, con revisión de abogado) | `ai-governance-legal` | Gobernanza de IA: inventario de usos de IA, evaluaciones de impacto, revisión de proveedores de IA, política inicial. | [anthropics/claude-for-legal](https://github.com/anthropics/claude-for-legal/tree/4a6c651889c97cc9140580363c73e0eb17379c2b/ai-governance-legal) @ `4a6c651` · Apache-2.0 |
| Legal (apoyo, con revisión de abogado) | `ip-legal` | Propiedad intelectual: búsqueda de marca (clearance), cláusulas de PI, licencias open source, takedowns y cartas de cese. | [anthropics/claude-for-legal](https://github.com/anthropics/claude-for-legal/tree/4a6c651889c97cc9140580363c73e0eb17379c2b/ip-legal) @ `4a6c651` · Apache-2.0 |
| Legal (apoyo, con revisión de abogado) | `product-legal` | Legal de producto: revisión de claims de marketing, revisión de lanzamientos y riesgo de funciones nuevas. | [anthropics/claude-for-legal](https://github.com/anthropics/claude-for-legal/tree/4a6c651889c97cc9140580363c73e0eb17379c2b/product-legal) @ `4a6c651` · Apache-2.0 |

## Reglas de este proyecto (mandan sobre cualquier skill)

- BELONG publica en inglés.
- Sin métricas inventadas: los posts y reportes usan solo datos reales.
- El trabajo visual sigue necesitando aprobación visual antes del commit (belong-visual / visual-qa).
- Los equipos legal y finanzas son de apoyo: todo lo que producen es un borrador para revisión humana (abogado o profesional titulado), no asesoría.
- Ningún skill publica, envía, paga ni cambia campañas por sí solo: publicar sigue necesitando el «sí» explícito del dueño.
- Las reglas del CLAUDE.md del proyecto mandan sobre cualquier skill.
- Los conectores que traen los plugins (Ironclad, DocuSign, FactSet, etc.) quedan sin conectar; no se crean cuentas ni se pegan llaves en el chat.
