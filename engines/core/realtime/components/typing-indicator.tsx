"use client";

import { cn } from "@/lib/utils";

export function TypingIndicator({
  users,
  className,
}: {
  users: { userId: string; fullName: string | null }[];
  className?: string;
}) {
  if (users.length === 0) return null;

  const names = users.map((u) => u.fullName ?? "Someone");
  const text =
    names.length === 1
      ? `${names[0]} is typing…`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing…`
        : `${names[0]} and ${names.length - 1} others are typing…`;

  return (
    <p className={cn("text-caption text-fg-muted", className)} aria-live="polite">
      <span className="inline-flex gap-0.5">
        <span className="animate-bounce [animation-delay:0ms]">·</span>
        <span className="animate-bounce [animation-delay:150ms]">·</span>
        <span className="animate-bounce [animation-delay:300ms]">·</span>
      </span>{" "}
      {text}
    </p>
  );
}
