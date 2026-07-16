import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  label?: string;
};

export function PageHeader({ title, description, action, label }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-10">
      <div>
        {label && <p className="text-label mb-3">{label}</p>}
        <h1 className="text-display text-fg-primary">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-body">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
