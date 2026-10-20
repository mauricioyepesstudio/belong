// BELONG demo profiles — pure generation logic (no I/O).
//
// Demo profiles are fake accounts used to populate the platform while it has
// little real traffic. Every one of them is marked in three independent ways so
// they can never be confused with a real person and can be deleted in bulk:
//   1. auth app_metadata.is_demo = true   (only the service role can set this;
//      it is the authoritative flag used by the cleanup command)
//   2. email on the reserved domain @demo.belong.app (never a real inbox)
//   3. bio starts with DEMO_BIO_PREFIX, so people browsing see it is a test
//
// The runner lives in scripts/demo-profiles.ts.

export const DEMO_EMAIL_DOMAIN = "demo.belong.app";
export const DEMO_BIO_PREFIX = "🧪 Perfil de prueba.";

export type BuildGoal =
  | "startup"
  | "career"
  | "learn"
  | "health"
  | "relationships"
  | "community"
  | "travel"
  | "creator";

export interface DemoProfile {
  email: string;
  fullName: string;
  avatarUrl: string;
  location: string;
  role: string;
  bio: string;
  buildGoal: BuildGoal;
  buildVision: string;
  strengths: string[];
  interests: string[];
  values: string[];
  skills: string[];
  streak: number;
  introPost: string;
}

const FIRST_NAMES = [
  "Valentina", "Santiago", "Camila", "Mateo", "Isabella", "Sebastián", "Lucía",
  "Nicolás", "Mariana", "Samuel", "Daniela", "Andrés", "Gabriela", "Tomás",
  "Sofía", "Emiliano", "Juliana", "Diego", "Paula", "Martín", "Renata", "Felipe",
  "Laura", "Joaquín", "Antonella", "Alejandro", "Manuela", "Julián",
];

const LAST_NAMES = [
  "Restrepo", "García", "Martínez", "Gómez", "Rodríguez", "Herrera", "Castillo",
  "Morales", "Vargas", "Rojas", "Ospina", "Jiménez", "Salazar", "Mendoza",
  "Cárdenas", "Ríos", "Navarro", "Fuentes", "Aguilar", "Torres", "Peña", "Silva",
];

const LOCATIONS = [
  "Medellín, CO", "Bogotá, CO", "Cali, CO", "Barranquilla, CO", "Ciudad de México, MX",
  "Guadalajara, MX", "Buenos Aires, AR", "Santiago, CL", "Lima, PE", "Quito, EC",
  "Madrid, ES", "Barcelona, ES", "Miami, US", "San José, CR", "Montevideo, UY",
];

interface Archetype {
  role: string;
  buildGoal: BuildGoal;
  bio: string;
  vision: string;
  strengths: string[];
  interests: string[];
  values: string[];
  skills: string[];
  intro: string;
}

const ARCHETYPES: Archetype[] = [
  {
    role: "Fundador/a",
    buildGoal: "startup",
    bio: "Construyendo una startup para que los pequeños negocios vendan en línea sin complicaciones.",
    vision: "Ayudar a 1.000 emprendedores a digitalizar su negocio este año.",
    strengths: ["Estrategia de producto", "Ventas", "Liderazgo"],
    interests: ["Startups", "E-commerce", "Finanzas"],
    values: ["Impacto", "Constancia", "Honestidad"],
    skills: ["Product Management", "Go-to-market", "Pitch"],
    intro: "Hola BELONG 👋 Estoy validando una idea para pequeños negocios. ¿Alguien que haya vendido a tiendas de barrio y quiera conversar?",
  },
  {
    role: "Diseñador/a UX",
    buildGoal: "creator",
    bio: "Diseño experiencias simples para productos con propósito.",
    vision: "Crear un portafolio de proyectos sociales que cambien vidas.",
    strengths: ["Diseño UI", "Investigación de usuarios", "Prototipado"],
    interests: ["Figma", "Accesibilidad", "Ilustración"],
    values: ["Empatía", "Claridad", "Oficio"],
    skills: ["Figma", "Design Systems", "UX Research"],
    intro: "Busco un proyecto con impacto social donde aportar diseño. ¡Escríbanme si necesitan manos en UX!",
  },
  {
    role: "Desarrollador/a",
    buildGoal: "career",
    bio: "Full-stack aprendiendo en público. Me encanta colaborar en proyectos open source.",
    vision: "Conseguir mi primer trabajo remoto como desarrollador/a senior.",
    strengths: ["Backend", "Resolución de problemas", "Aprendizaje rápido"],
    interests: ["TypeScript", "Open source", "IA"],
    values: ["Curiosidad", "Excelencia", "Autonomía"],
    skills: ["TypeScript", "React", "PostgreSQL"],
    intro: "Esta semana terminé mi primer proyecto con Next.js. ¿Alguien quiere hacer code review juntos?",
  },
  {
    role: "Líder comunitario/a",
    buildGoal: "community",
    bio: "Conecto personas de mi barrio con oportunidades de formación y empleo.",
    vision: "Abrir un espacio comunitario de aprendizaje en mi ciudad.",
    strengths: ["Facilitación", "Alianzas", "Comunicación"],
    interests: ["Voluntariado", "Educación", "Eventos"],
    values: ["Pertenencia", "Generosidad", "Colaboración"],
    skills: ["Organización de eventos", "Alianzas", "Comunicación"],
    intro: "Estamos organizando un taller gratuito de habilidades digitales. ¿Quién se suma como mentor/a?",
  },
  {
    role: "Creador/a de contenido",
    buildGoal: "creator",
    bio: "Cuento historias de emprendedores latinos en video corto.",
    vision: "Vivir de mi contenido sin perder mi esencia.",
    strengths: ["Storytelling", "Edición de video", "Marketing"],
    interests: ["Redes sociales", "Música", "Cultura latina"],
    values: ["Autenticidad", "Creatividad", "Constancia"],
    skills: ["Edición de video", "Copywriting", "Instagram"],
    intro: "Quiero entrevistar a 5 personas de BELONG que estén construyendo algo con propósito. ¿Quién se anima?",
  },
  {
    role: "Mentor/a",
    buildGoal: "learn",
    bio: "15 años en tecnología. Ahora acompaño a quienes están empezando.",
    vision: "Mentorear a 50 personas en su primer proyecto.",
    strengths: ["Coaching", "Estrategia", "Escucha"],
    interests: ["Mentoría", "Liderazgo", "Educación"],
    values: ["Servicio", "Paciencia", "Crecimiento"],
    skills: ["Mentoría", "Gestión de equipos", "Estrategia"],
    intro: "Abro 3 espacios de mentoría gratuitos este mes para quienes estén lanzando su primer proyecto.",
  },
  {
    role: "Emprendedor/a social",
    buildGoal: "community",
    bio: "Trabajo en soluciones de reciclaje con cooperativas locales.",
    vision: "Reducir a la mitad los residuos de mi comunidad en dos años.",
    strengths: ["Gestión de proyectos", "Sostenibilidad", "Negociación"],
    interests: ["Clima", "Economía circular", "Cooperativas"],
    values: ["Justicia", "Persistencia", "Impacto"],
    skills: ["Gestión de proyectos", "Sostenibilidad", "Fundraising"],
    intro: "¿Alguien ha trabajado con cooperativas de reciclaje? Busco aprender de su experiencia.",
  },
  {
    role: "Coach de bienestar",
    buildGoal: "health",
    bio: "Acompaño a profesionales a crear hábitos sostenibles de bienestar.",
    vision: "Lanzar un programa de bienestar accesible para equipos remotos.",
    strengths: ["Coaching", "Hábitos", "Comunicación"],
    interests: ["Salud mental", "Deporte", "Meditación"],
    values: ["Equilibrio", "Cuidado", "Disciplina"],
    skills: ["Coaching", "Talleres", "Contenido de bienestar"],
    intro: "Reto de 7 días: una caminata de 20 minutos al día. ¿Quién se apunta y hacemos check-in aquí?",
  },
];

/** Deterministic PRNG (mulberry32) so tests and dry runs are reproducible. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)];
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isDemoEmail(email: string | null | undefined): boolean {
  return Boolean(email && email.toLowerCase().endsWith(`@${DEMO_EMAIL_DOMAIN}`));
}

export function buildDemoProfiles(count: number, seed: number, date: Date): DemoProfile[] {
  const rng = createRng(seed);
  const day = date.toISOString().slice(0, 10).replace(/-/g, "");
  const profiles: DemoProfile[] = [];

  for (let i = 0; i < count; i++) {
    const first = pick(rng, FIRST_NAMES);
    const last = pick(rng, LAST_NAMES);
    const archetype = pick(rng, ARCHETYPES);
    const suffix = Math.floor(rng() * 36 ** 4).toString(36).padStart(4, "0");
    const handle = `${slugify(first)}-${slugify(last)}-${day}-${suffix}`;

    profiles.push({
      email: `${handle}@${DEMO_EMAIL_DOMAIN}`,
      fullName: `${first} ${last}`,
      // Illustrated avatars: obviously not photos of real people.
      avatarUrl: `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(handle)}`,
      location: pick(rng, LOCATIONS),
      role: archetype.role,
      bio: `${DEMO_BIO_PREFIX} ${archetype.bio}`,
      buildGoal: archetype.buildGoal,
      buildVision: archetype.vision,
      strengths: archetype.strengths,
      interests: archetype.interests,
      values: archetype.values,
      skills: archetype.skills.slice(0, 2),
      streak: 1 + Math.floor(rng() * 14),
      introPost: archetype.intro,
    });
  }

  return profiles;
}
