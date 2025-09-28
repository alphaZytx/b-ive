import Link from "next/link";

const stats = [
  { id: 1, label: "Credits tracked", value: "100ml = 1 credit" },
  { id: 2, label: "Organizations", value: "Hospitals & blood banks" },
  { id: 3, label: "Emergency support", value: "Admin & govt overrides" }
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary/20 blur-3xl" />
      <div className="absolute -left-24 bottom-10 h-64 w-64 rotate-12 rounded-full bg-brand-accent/20 blur-3xl" />
      <div className="absolute -right-32 top-10 h-80 w-80 -rotate-12 rounded-full bg-brand-dark/20 blur-3xl" />

      <section className="mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-6 pb-24 pt-32 md:flex-row md:items-center md:gap-24">
        <div className="flex-1 space-y-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-primary/40 bg-brand-primary/10 px-4 py-1 text-sm font-semibold uppercase tracking-wide text-brand-accent">
            Synchronize blood generosity
          </span>
          <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl">
            A consent-first blood credit network for donors, recipients, and regulators
          </h1>
          <p className="max-w-xl text-lg text-slate-300">
            B+ive keeps every drop accounted for—from donation to redemption—while empowering organizations to collaborate and governments to oversee policy compliance.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/docs/architecture"
              className="inline-flex items-center gap-2 rounded-full bg-brand-primary px-6 py-3 text-base font-semibold text-white shadow-lg shadow-brand-primary/40 transition hover:bg-brand-dark"
            >
              Explore architecture
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/workspace"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Open workspace prototype
              <span aria-hidden>⤳</span>
            </Link>

            <a
              href="https://www.figma.com/file/"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Watch concept demo
              <span aria-hidden>⏯</span>
            </a>
          </div>

          <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {stats.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                <dt className="font-semibold text-white">{item.label}</dt>
                <dd className="mt-1 text-lg text-brand-accent">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="relative aspect-square w-full max-w-sm">
            <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-b from-brand-primary via-brand-dark to-black opacity-80" />
            <div className="absolute inset-4 animate-[spin_18s_linear_infinite] rounded-full border border-white/10" />
            <div className="absolute inset-10 rounded-full border border-white/10" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-48 w-48 items-center justify-center rounded-full bg-brand-primary shadow-2xl shadow-brand-primary/50">
                <span className="text-3xl font-bold text-white">B+</span>
              </div>
            </div>
            <div className="absolute -bottom-10 left-1/2 flex w-72 -translate-x-1/2 flex-col gap-3 rounded-3xl border border-white/10 bg-slate-900/80 p-4 backdrop-blur">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-brand-accent">
                Snapshot
              </h2>
              <p className="text-sm text-slate-300">
                Track donor credits, request consent, and initiate emergency overrides in one unified workspace.
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-primary/20 px-3 py-1 text-brand-accent">
                  Credits: 24
                </span>
                <span>Organizations: 12</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto flex max-w-6xl flex-col gap-12 px-6 pb-32 text-slate-200"
      >
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold text-white">Phase-based delivery</h2>
          <p className="max-w-3xl text-base text-slate-300">
            Implementation follows the discovery roadmap captured in the architecture document. Phase one focuses on foundations—role-aware auth, MongoDB connectivity, and credit ledger scaffolding—before expanding into compliance and analytics.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Phase 1",
              description: "Bootstrap auth, data models, and seed dashboards for administrators, organizations, and donors."
            },
            {
              title: "Phase 2",
              description: "Deliver consent-driven credit redemption, organization inventory, and inter-organization exchanges."
            },
            {
              title: "Phase 3",
              description: "Harden compliance: audit logs, emergency override enforcement, reporting, and observability."
            }
          ].map((item) => (
            <article key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-xl font-semibold text-brand-accent">{item.title}</h3>
              <p className="mt-3 text-sm text-slate-300">{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
