"use server";

import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type AuthResult = { error?: string; needsEmailConfirmation?: boolean };

function safeInternalPath(path?: string | null): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return null;
  return path;
}

export async function signInWithEmail(
  email: string,
  password: string,
  next?: string
): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  redirect(safeInternalPath(next) ?? "/dashboard");
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${env.appUrl}/auth/callback`,
    },
  });
  if (error) return { error: error.message };
  if (!data.session) return { needsEmailConfirmation: true };
  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function signInWithOAuth(provider: "google" | "apple") {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${env.appUrl}/auth/callback`,
    },
  });
  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
  return { error: "Could not start OAuth flow" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function resetPassword(email: string): Promise<AuthResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.appUrl}/auth/callback?next=/settings%3Frecovery%3D1`,
  });
  if (error) return { error: error.message };
  return {};
}

export async function updatePassword(password: string): Promise<AuthResult> {
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}
