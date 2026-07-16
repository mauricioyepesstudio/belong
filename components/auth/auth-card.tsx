import { Logo } from "@/components/ui";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-10 animate-fade-up">
        <Logo href="/login" size="lg" />
      </div>
      <div className="w-full max-w-[420px] animate-fade-up">
        <div className="surface-glass rounded-2xl p-8 shadow-lg">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight text-fg-primary">{title}</h1>
            {description && <p className="mt-2 text-sm text-fg-muted">{description}</p>}
          </div>
          {children}
          {footer && (
            <div className="mt-6 border-t border-border-subtle pt-6 text-center text-sm text-fg-muted">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
