import type { Metadata } from "next";
import { Spinner } from "@/components/ui";

export const metadata: Metadata = { title: "Loading" };

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
