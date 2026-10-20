# Perfiles demo diarios

Generador de perfiles de prueba para poblar BELONG mientras hay poco tráfico real.
**Apagado por defecto.**

## Cómo se distinguen de usuarios reales

Cada perfil demo lleva tres marcas:

1. `app_metadata.is_demo = true` en Supabase Auth (solo la service role puede ponerla).
2. Email en el dominio reservado `@demo.belong.app` (no es un buzón real; nadie recibe correos).
3. La bio empieza con `🧪 Perfil de prueba.` para que quien navegue lo vea.

Además: contraseña aleatoria que no se guarda (nadie puede iniciar sesión con ellos),
avatares ilustrados (no fotos de personas reales) y un tope total (por defecto 60).

Cada perfil recibe: nombre, ubicación, rol, bio, objetivo, fortalezas/intereses/valores,
2 habilidades, racha y una publicación de presentación en el feed social.

## Activarlo (lo hace el dueño)

1. GitHub → repo → Settings → Secrets and variables → Actions → **Secrets**:
   `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`.
2. Misma pantalla → **Variables**: `DEMO_PROFILES_ENABLED = true`.
   Opcionales: `DEMO_PROFILES_PER_DAY` (por defecto 3), `DEMO_PROFILES_MAX` (por defecto 60).
3. Corre todos los días a las 09:00 hora Colombia.

Prueba manual: Actions → **Demo profiles** → Run workflow → `generate` / `count`.

## Apagar y borrar

- Apagar: borrar la variable `DEMO_PROFILES_ENABLED` o ponerla en `false`.
- Borrar todos: Actions → Demo profiles → Run workflow → `delete-all`.
  Solo borra cuentas con las marcas 1 y 2 a la vez; sus publicaciones y datos se borran en cascada.

## Local

```
npx --yes tsx@4 scripts/demo-profiles.ts generate --count 3 --dry-run
```

## Pendiente

- Excluir perfiles demo de métricas de impacto/analítica (principio de métricas honestas).
