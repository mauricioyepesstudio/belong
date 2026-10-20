// BELONG demo profiles runner.
//
//   npx --yes tsx@4 scripts/demo-profiles.ts generate [--count 3] [--max 60] [--dry-run]
//   npx --yes tsx@4 scripts/demo-profiles.ts count
//   npx --yes tsx@4 scripts/demo-profiles.ts delete-all [--confirm]
//
// Needs NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.
// Only touches accounts whose auth app_metadata.is_demo is true; see
// systems/demo-profiles/generator.ts for how demo accounts are marked.

import { randomBytes, randomInt } from "node:crypto";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { buildDemoProfiles, isDemoEmail, type DemoProfile } from "../systems/demo-profiles/generator";

type Command = "generate" | "count" | "delete-all";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

function flag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function intArg(name: string, fallback: number, min: number, max: number): number {
  const raw = arg(name);
  if (raw === undefined || raw === "") return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`--${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

function adminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function isDemoUser(user: User): boolean {
  // Both marks must agree: the app_metadata flag (only settable by the service
  // role) and the reserved email domain. A real account never matches both.
  return user.app_metadata?.is_demo === true && isDemoEmail(user.email);
}

async function listDemoUsers(supabase: SupabaseClient): Promise<User[]> {
  const demo: User[] = [];
  const perPage = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    demo.push(...data.users.filter(isDemoUser));
    if (data.users.length < perPage) break;
  }
  return demo;
}

async function createDemoProfile(supabase: SupabaseClient, profile: DemoProfile, batch: string) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: profile.email,
    // Random throwaway password that is never stored: nobody can sign in.
    password: randomBytes(32).toString("base64url"),
    email_confirm: true,
    user_metadata: { full_name: profile.fullName, avatar_url: profile.avatarUrl },
    app_metadata: { is_demo: true, demo_batch: batch },
  });
  if (error || !data.user) throw error ?? new Error("createUser returned no user");
  const id = data.user.id;

  // public.users row is created by the on_auth_user_created trigger.
  const steps = [
    supabase
      .from("users")
      .update({
        full_name: profile.fullName,
        avatar_url: profile.avatarUrl,
        location: profile.location,
        role: profile.role,
        bio: profile.bio,
        build_goal: profile.buildGoal,
        build_vision: profile.buildVision,
        onboarding_completed: true,
      })
      .eq("id", id),
    supabase.from("identity_profiles").upsert({
      user_id: id,
      strengths: profile.strengths,
      interests: profile.interests,
      values: profile.values,
    }),
    supabase.from("user_skills").insert(profile.skills.map((skill) => ({ user_id: id, skill }))),
    supabase.from("user_momentum").upsert({
      user_id: id,
      current_streak: profile.streak,
      longest_streak: profile.streak,
      last_active_date: batch,
      weekly_completions: Math.min(profile.streak, 5),
    }),
    supabase.from("social_posts").insert({ author_id: id, post_type: "text", body: profile.introPost }),
  ];

  for (const step of steps) {
    const { error: stepError } = await step;
    if (stepError) {
      // Leave no half-built account behind; cascades remove related rows.
      await supabase.auth.admin.deleteUser(id);
      throw stepError;
    }
  }
  return id;
}

async function generate() {
  const count = intArg("count", 3, 1, 20);
  const max = intArg("max", 60, 1, 1000);
  const dryRun = flag("dry-run");
  const now = new Date();
  const batch = now.toISOString().slice(0, 10);
  const profiles = buildDemoProfiles(count, randomInt(2 ** 31), now);

  if (dryRun) {
    console.log(`[dry-run] Would create ${profiles.length} demo profiles:`);
    for (const p of profiles) console.log(`  - ${p.fullName} · ${p.role} · ${p.location} · ${p.email}`);
    return;
  }

  const supabase = adminClient();
  const existing = (await listDemoUsers(supabase)).length;
  const room = Math.max(0, max - existing);
  if (room === 0) {
    console.log(`Demo cap reached (${existing}/${max}). Nothing created.`);
    return;
  }

  let created = 0;
  for (const profile of profiles.slice(0, room)) {
    await createDemoProfile(supabase, profile, batch);
    created++;
    console.log(`Created ${profile.fullName} (${profile.role}, ${profile.location})`);
  }
  console.log(`Done: ${created} created, ${existing + created}/${max} demo profiles in total.`);
}

async function count() {
  const users = await listDemoUsers(adminClient());
  console.log(`Demo profiles: ${users.length}`);
}

async function deleteAll() {
  const supabase = adminClient();
  const users = await listDemoUsers(supabase);
  if (!flag("confirm")) {
    console.log(`Would delete ${users.length} demo profiles. Re-run with --confirm to delete.`);
    return;
  }
  for (const user of users) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw error;
  }
  console.log(`Deleted ${users.length} demo profiles.`);
}

async function main() {
  const command = (process.argv[2] ?? "generate") as Command;
  if (command === "generate") return generate();
  if (command === "count") return count();
  if (command === "delete-all") return deleteAll();
  throw new Error(`Unknown command "${command}". Use generate, count or delete-all.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
