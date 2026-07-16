export function UnreadDot({ className }: { className?: string }) {
  return (
    <span
      className={className ?? "h-1.5 w-1.5 shrink-0 rounded-full bg-brand"}
      aria-label="Unread"
    />
  );
}
