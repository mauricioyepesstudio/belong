import { createClient } from "@/lib/supabase/server";
import { ensureUserProfile, isPasswordRecoveryPath } from "@/lib/auth/ensure-profile";
import {
  AnalyticsScreen,
  AnalyticsSource,
  trackServerEvent,
} from "@/systems/analytics/track-server";
import { NextResponse } from "next/server";

function safeRedirectPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  if (next === "/") return "/dashboard";
  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const oauthError = searchParams.get("error");
  const oauthDescription = searchParams.get("error_description");

  if (oauthError) {
    const params = new URLSearchParams({ error: oauthError });
    if (oauthDescription) params.set("error_description", oauthDescription);
    return NextResponse.redirect(`${origin}/login?${params.toString()}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      const params = new URLSearchParams({ error: "auth_callback_failed" });
      params.set("error_description", error.message);
      return NextResponse.redirect(`${origin}/login?${params.toString()}`);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }

    const { data: existingProfile } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    const profile = await ensureUserProfile(supabase, user);
    const redirectTo = safeRedirectPath(next);

    if (isPasswordRecoveryPath(next) || isPasswordRecoveryPath(redirectTo)) {
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }

    if (!existingProfile) {
      await trackServerEvent({
        name: "signup_completed",
        userId: user.id,
        screen: AnalyticsScreen.AUTH_CALLBACK,
        source: AnalyticsSource.AUTH_OAUTH,
      });
    } else {
      await trackServerEvent({
        name: "login",
        userId: user.id,
        screen: AnalyticsScreen.AUTH_CALLBACK,
        source: AnalyticsSource.AUTH_OAUTH,
      });
    }

    if (!profile?.onboarding_completed) {
      return NextResponse.redirect(`${origin}/onboarding`);
    }

    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
