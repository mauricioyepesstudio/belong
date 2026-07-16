"use client";

import { AuthCard } from "@/components/auth/auth-card";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button, ErrorMessage, Input, Label } from "@/components/ui";
import { signUpWithEmail } from "@/lib/actions/auth";
import Link from "next/link";
import { useState, useTransition } from "react";

export default function RegisterForm() {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError("");
    const fullName = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    startTransition(async () => {
      const result = await signUpWithEmail(email, password, fullName);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <AuthCard
      title="Join BELONG"
      description="Start building meaningful connections today."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="text-brand hover:underline">Sign in</Link>
        </>
      }
    >
      <form action={handleSubmit} className="space-y-5">
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" type="text" placeholder="Your name" required autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" placeholder="••••••••" required autoComplete="new-password" minLength={8} />
        </div>
        <Button type="submit" className="w-full" size="lg" isLoading={pending}>
          Create account
        </Button>
      </form>
      <div className="mt-6">
        <OAuthButtons />
      </div>
    </AuthCard>
  );
}
