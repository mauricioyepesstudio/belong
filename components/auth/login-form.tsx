"use client";

import { AuthCard } from "@/components/auth/auth-card";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button, ErrorMessage, Input, Label } from "@/components/ui";
import { signInWithEmail } from "@/lib/actions/auth";
import Link from "next/link";
import { useState, useTransition } from "react";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError("");
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    startTransition(async () => {
      const result = await signInWithEmail(email, password);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <AuthCard
      title="Welcome back"
      description="Sign in to continue building with your community."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-brand hover:underline">Create one</Link>
        </>
      }
    >
      <form action={handleSubmit} className="space-y-5">
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-brand hover:underline">Forgot password?</Link>
          </div>
          <Input id="password" name="password" type="password" placeholder="••••••••" required autoComplete="current-password" />
        </div>
        <Button type="submit" className="w-full" size="lg" isLoading={pending}>
          Sign in
        </Button>
      </form>
      <div className="mt-6">
        <OAuthButtons />
      </div>
    </AuthCard>
  );
}
