import type { ReactNode } from "react";

interface ActionCardProps {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export function ActionCard({ title, description, children, className }: ActionCardProps) {
  const baseClass =
    "rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-black/20 backdrop-blur";
  const combinedClass = className ? `${baseClass} ${className}` : baseClass;

  return (
    <section className={combinedClass}>
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <p className="mt-2 text-sm text-slate-300">{description}</p>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}
