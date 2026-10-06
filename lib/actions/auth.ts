"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import {
  clientIpFrom,
  consumeAuthRateLimit,
  RATE_LIMIT_MESSAGE,
  type RateLimitAction,
  type RpcClient,
} from "@/engines/auth/rate-limit";
import {
  AnalyticsScreen,
  AnalyticsSource,
  trackServerEvent,
} from "@/systems/analytics/track-server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type AuthResult = { error?: string; needsEmailConfirmation?: boolean };

// Uses the admin client: consume_auth_rate_limit is executable by service_role
// only. Without admin credentials the check is skipped (fails open).
async function isRateLimited(action: RateLimitAction, email?: string): Promise<boolean> {
  if (!isAdminConfigured()) {
    console.warn("[auth-rate-limit] check skipped: SUPABASE_SERVICE_ROLE_KEY not configured");
    return false;
  }
  const ip = clientIpFrom(await headers());
  // consume_auth_rate_limit is not in the generated Database types yet.
  const admin = createAdminClient() as unknown as RpcClient;
  return !(await consumeAuthRateLimit(admin, action, { email, ip }));
}

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
  if (await isRateLimited("login", email)) return { error: RATE_LIMIT_MESSAGE };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  if (data.user) {
    await trackServerEvent({
      name: "login",
      userId: data.user.id,
      screen: AnalyticsScreen.LOGIN,
      source: AnalyticsSource.AUTH_LOGIN_FORM,
    });
  }
  revalidatePath("/", "layout");
  redirect(safeInternalPath(next) ?? "/dashboard");
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResult> {
  const supabase = await createClient();
  if (await isRateLimited("signup")) return { error: RATE_LIMIT_MESSAGE };
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
  if (data.user) {
    await trackServerEvent({
      name: "signup_completed",
      userId: data.user.id,
      screen: AnalyticsScreen.REGISTER,
      source: AnalyticsSource.AUTH_REGISTER_FORM,
    });
  }
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
  if (await isRateLimited("password_reset", email)) return { error: RATE_LIMIT_MESSAGE };
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
