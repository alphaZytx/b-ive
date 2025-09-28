import { config } from "@/lib/config";
import { getDonorDashboardSnapshot } from "@/lib/dashboard/queries";

import type { MetricTone, TimelineStatus } from "@/lib/dashboard/types";

const toneClasses: Record<MetricTone, string> = {
  positive: "text-emerald-300",
  negative: "text-rose-300",
  warning: "text-amber-300",
  neutral: "text-slate-300"
};

const statusBullets: Record<TimelineStatus, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  error: "bg-rose-500",
  info: "bg-sky-400"
};

export default async function DonorWorkspace() {
  const donorId = config.demo.donorId;
  const snapshot = await getDonorDashboardSnapshot(donorId);

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-lg font-semibold text-white">Credit overview</h2>
        {snapshot.metrics.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {snapshot.metrics.map((metric) => (
              <div key={metric.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm text-slate-300">{metric.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{metric.value}</p>
                {metric.change ? (
                  <p className={`mt-2 text-xs font-medium ${toneClasses[metric.tone ?? "neutral"]}`}>{metric.change}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-300">
            No credit metrics yet—seed the database to view a donor profile snapshot.
          </p>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-brand-accent">Recent activity</h3>
            <span className="text-xs uppercase tracking-wide text-slate-400">Audit ready</span>
          </div>
          {snapshot.timeline.length > 0 ? (
            <ul className="space-y-4">
              {snapshot.timeline.map((event) => (
                <li key={event.id} className="flex gap-3">
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${statusBullets[event.status ?? "info"]}`} aria-hidden />
                  <div>
                    <p className="font-medium text-white">{event.title}</p>
                    <p className="text-sm text-slate-300">{event.description}</p>
                    <p className="text-xs text-slate-400">{event.at}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-300">No recent ledger activity recorded yet.</p>
          )}
        </div>
        <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-brand-accent">Upcoming tasks</h3>
          {snapshot.upcoming.length > 0 ? (
            <ul className="space-y-3">
              {snapshot.upcoming.map((item) => (
                <li key={item.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  {item.detail ? <p className="text-xs text-slate-300">{item.detail}</p> : null}
                  {item.at ? <p className="text-xs text-slate-400">{item.at}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-300">All tasks are complete—new requests will appear here.</p>
          )}
          <p className="text-xs text-slate-400">
            Need emergency support? Reach out to administrators directly—the override ledger keeps repayment plans and due dates
            transparent.
          </p>
        </aside>
      </section>

      <section className="rounded-3xl border border-dashed border-brand-primary/40 bg-brand-primary/10 p-6 text-sm text-slate-200">
        <h3 className="text-lg font-semibold text-brand-accent">How consent works</h3>
        <p className="mt-2">
          When organizations request to spend your credits, you receive the full beneficiary context before approving. Declines
          keep your balance untouched, while approvals trigger a real-time debit and confirmation receipt.
        </p>
        <p className="mt-4 text-xs text-slate-300">
          Emergency overrides remain one-time debts—your dashboard highlights them in red until the balance returns to zero.
        </p>
      </section>
    </div>
  );
}
