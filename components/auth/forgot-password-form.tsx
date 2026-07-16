"use client";

import { AuthCard } from "@/components/auth/auth-card";
import { Button, ErrorMessage, Input, Label } from "@/components/ui";
import { resetPassword } from "@/lib/actions/auth";
import Link from "next/link";
import { useState, useTransition } from "react";

export default function ForgotPasswordForm() {
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    setError("");
    const email = formData.get("email") as string;

    startTransition(async () => {
      const result = await resetPassword(email);
      if (result.error) {
        setError(result.error);
      } else {
        setSent(true);
      }
    });
  };

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        description="We sent a password reset link to your email address."
        footer={
          <Link href="/login" className="text-brand hover:underline">Back to sign in</Link>
        }
      >
        <p className="text-sm text-fg-muted leading-relaxed">
          Did not receive it? Check your spam folder or{" "}
          <button type="button" onClick={() => setSent(false)} className="text-brand hover:underline">
            try again
          </button>
          .
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset password"
      description="Enter your email and we will send you a reset link."
      footer={
        <>
          Remember your password?{" "}
          <Link href="/login" className="text-brand hover:underline">Sign in</Link>
        </>
      }
    >
      <form action={handleSubmit} className="space-y-5">
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
        </div>
        <Button type="submit" className="w-full" size="lg" isLoading={pending}>
          Send reset link
        </Button>
      </form>
    </AuthCard>
  );
}
