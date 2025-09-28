import Link from "next/link";

import { getCurrentSession } from "@/lib/auth/session";
import { workspaceHighlights } from "@/lib/dashboard/constants";

export default async function WorkspaceLanding() {
  const session = await getCurrentSession();
  const roles = session?.user?.roles ?? [];

  const availableHighlights = workspaceHighlights.filter(
    (item) => !item.roles || item.roles.some((role) => roles.includes(role))
  );

  if (availableHighlights.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        Your account is provisioned, but it has not been assigned to any workspace. Contact an administrator to join an
        organization or request access.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {availableHighlights.map((item) => (
        <article key={item.role} className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-brand-accent">{item.role}</h2>
            <p className="text-sm text-slate-300">{item.summary}</p>
          </div>
          <Link
            href={item.href}
            className="mt-auto inline-flex w-fit items-center gap-2 rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            {item.cta}
            <span aria-hidden>→</span>
          </Link>
        </article>
      ))}
    </div>
  );
}
