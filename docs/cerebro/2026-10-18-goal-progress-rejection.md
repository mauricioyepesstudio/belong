# Goal progress confirmation — 2026-10-18

Base: acdb7830199d03529d977da83fb6672e16c26ba4. Existing persistence PR10 and optimistic progress PR13 preserved. Scope is client behavior only; no visual redesign, server, schema, RLS, permissions, credentials or budget changes.

## Reproduction and behavior

In a project Goals tab, reject the progress action promise. Previously the rejection escaped; now it reports `Goal progress could not be confirmed. Refresh before trying again.` and preserves current goals. A ref-held per-ID lock acquired before transition suppresses duplicate pending requests for that goal, allows independent goals and releases in finally. Confirmed success retains the functional single-goal update. This is not cross-session concurrency protection or evidence that an uncertain write did not happen.

Ten focused handler regression cases pass, including seven new rejection/concurrency/retry cases. Full suite: 201 passed, 8 credential-dependent integration tests skipped. Focused ESLint and TypeScript pass. Build/review/CI and actual deployed SHA are recorded at final handoff in central task `belong-goal-progress-rejection-20261018`.

Authenticated acceptance requires an authorized BELONG test account and project. No real Supabase mutation, RLS acceptance or authenticated browser journey is claimed by mocked handler tests. Next: test confirmed update, rejected update and refresh against that project; goal creation error handling is a separate future slice.

## Produced creative

- Date: 2026-10-18.
- Objective: make projects, goals and community tangible through a clear next step, without fabricated impact claims.
- File: `exec-22619d8a-fd46-4f30-ae64-3468f78a19f7.png` (generated image delivered here, not an application asset).
- Real palette: #030014, #8b5cf6, #a78bfa and #6366f1. Conceptual architectural illustration, not a product screenshot.
- Text: BELONG / Lo que quieres construir, empieza con un paso. / Proyectos, metas y comunidad. / Construye con propósito / belong-ruddy.vercel.app.
- Caption/CTA: Un proyecto empieza con una idea y un siguiente paso claro. En BELONG, organiza tus proyectos y metas junto a tu comunidad. Empieza aquí: https://belong-ruddy.vercel.app
- Status: produced, ready to share here; not scheduled or externally published. Channel/account/OAuth access has not been verified in this delivery; no provider receipt or public post permalink exists for this piece. No client logos, private data, metrics or testimonials.
