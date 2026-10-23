# BELONG: la idea, lo construido y las necesidades humanas

_23-oct-2026. Lo pidió Mauricio: "identificar la idea con lo que llevamos de desarrollo, ver necesidades de la humanidad para que esto sea una red con propósito universal de crecimiento social". Este documento es la brújula de producto para todos los agentes del repo. Cifras: solo las publicadas, con fuente; nada de métricas propias inventadas._

## 1. La idea en una frase

**BELONG es la red donde las personas encuentran a su gente, crecen con propósito y convierten ese propósito en proyectos con impacto medible.**

Lema vigente: _Build a life that matters._ La visión larga, en `BELONG_ROADMAP.md`, es "el sistema operativo del potencial humano". Este documento la aterriza en tres pilares que ya existen en el código.

## 2. Tres necesidades humanas universales (con fuente)

| Pilar | Necesidad | Dato público | Fuente |
|---|---|---|---|
| **Conexión** | No crecer solo | 1 de cada 6 personas en el mundo sufre soledad. En adolescentes y jóvenes, cerca de 1 de cada 5. Se asocia a unas 871.000 muertes al año | [OMS, Comisión de Conexión Social, 30-jun-2025](https://www.who.int/news/item/30-06-2025-social-connection-linked-to-improved-heath-and-reduced-risk-of-early-death) |
| **Crecimiento** | Sentido, metas y avance | En EE. UU., los adultos de 18 a 29 años que "prosperan" bajaron del 64 % (2010) al 44 %: hoy son el grupo más bajo | [Gallup, 2026](https://news.gallup.com/poll/715010/life-ratings-young-adults-down-points-2010.aspx) |
| **Contribución** | Aportar a algo mayor | Solo el 35 % de las metas de los ODS de la ONU van en camino o con avance moderado, y el 18 % retrocedió | [ONU, Informe ODS 2025](https://unstats.un.org/sdgs/report/2025/The-Sustainable-Development-Goals-Report-2025.pdf) |
| (señal a favor) | La gente quiere ayudar | 28,3 % de los estadounidenses (75,7 millones) hizo voluntariado formal en 2023, el mayor salto registrado | [AmeriCorps, 2024](https://americorps.gov/newsroom/press-release/more-757-million-people-volunteered-america-americorps-reports) |

**Lectura [juicio]:** la necesidad no es "otra red social". Hace falta un lugar donde la conexión produzca avance y el avance produzca aporte. Las redes de atención optimizan el tiempo en pantalla, y BELONG optimiza el progreso compartido.

## 3. Lo que ya está construido, pilar por pilar

| Pilar | Motores y rutas que ya existen | Qué falta (brecha) |
|---|---|---|
| Conexión | `engines/circles` (círculos de rendición de cuentas con check-ins), `community`, `social`, `messages`, `events`, `/people` y `/feed` | Medir si los círculos se sostienen semana a semana; invitar a un grupo entero (organización) de una vez |
| Crecimiento | `identity`, `onboarding` (propósito), `mission`, metas y tareas en `project`, `ai` (coach) | Un recorrido claro de "propósito → meta → misión semanal" en la primera semana |
| Contribución | `project` (dueños, tareas, metas), `impact` (Belong Score, Impact Passport, rachas), `collaboration`, `opportunity`, `marketplace`, `organization` | Ligar cada proyecto a una causa universal (por ejemplo, los ODS) para que el impacto se pueda sumar |

Conclusión: **el producto ya cubre los tres pilares.** El trabajo de los próximos meses es conectar las piezas y medir el avance con honestidad, sin abrir motores nuevos del roadmap largo.

## 4. Métrica norte propuesta

**Círculos vivos:** círculos con al menos 3 miembros que hicieron check-in 4 semanas seguidas. Junta conexión y crecimiento, se puede medir con `engines/circles` y no premia la adicción. Hoy vale null (sin medir).

## 5. Plan de desarrollo continuo (una tarea = un PR en borrador)

1. **Hecho en este PR:** sección "Why BELONG exists" en la portada, con las 3 necesidades y sus fuentes (`engines/belong/purpose.ts` y su prueba).
2. **Círculos vivos medibles:** cálculo puro, con pruebas, de semanas seguidas de check-in por círculo, y lectura en el dashboard.
3. **Causa del proyecto:** etiqueta opcional de ODS en cada proyecto. Requiere migración, así que va con revisión de `migration-reviewer` y la decisión de Mauricio.
4. **Círculo para organizaciones:** una organización crea un círculo piloto e invita a su grupo con un enlace. Es lo que pide la validación del consejo.
5. **Primera semana guiada:** de propósito a meta y de meta a misión semanal, usando el onboarding actual.

Lo que solo puede hacer Mauricio: fusionar el PR #8 (Fase 2), aplicar la migración `circle_invite_notifications` y verificar OAuth en producción.

## 6. Relación con el consejo del 20-oct

El 20-oct el consejo congeló BELONG. El 23-oct Mauricio pidió el desarrollo continuo de la website y su crecimiento, y eso reactiva Desarrollo. Se mantiene la meta de validación: 1 organización interesada por escrito al 19-nov (embudo en `/mnt/project-files/belong/equipo-autonomo/`). Las dos cosas se refuerzan, porque el punto 4 del plan sirve directamente al piloto con organizaciones.
