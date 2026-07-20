import LoginForm from "@/components/auth/login-form";
import { Spinner } from "@/components/ui";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
