import type { ReactNode } from "react";

import { WorkspaceNav } from "@/components/dashboard/WorkspaceNav";

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 pb-24 pt-4">
      <header className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-white md:text-4xl">Operations workspace</h1>
          <p className="max-w-3xl text-base text-slate-300">
            Explore phase-two dashboards and action consoles for administrators, organizations, and donors. Run live
            transactions against MongoDB, then review how the consent-driven ledger, inventory insights, and emergency
            policies respond across each view.
          </p>
        </div>
        <WorkspaceNav />
      </header>
      <section className="space-y-8">{children}</section>
    </div>
  );
}
