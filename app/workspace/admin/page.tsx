import { getAdminDashboardSnapshot } from "@/lib/dashboard/queries";

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

export default async function AdminWorkspace() {
  const { metrics, timeline, tasks } = await getAdminDashboardSnapshot();

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-lg font-semibold text-white">Compliance snapshot</h2>
        {metrics.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {metrics.map((metric) => (
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
            No compliance metrics are available yet. Seed the database to explore the live snapshot.
          </p>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-brand-accent">Latest activity</h3>
            <span className="text-xs uppercase tracking-wide text-slate-400">Audit trail</span>
          </div>
          {timeline.length > 0 ? (
            <ul className="space-y-4">
              {timeline.map((event) => (
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
            <p className="text-sm text-slate-300">No recent ledger activity yet.</p>
          )}
        </div>
        <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-brand-accent">Next steps</h3>
          {tasks.length > 0 ? (
            <ul className="space-y-3 text-sm text-slate-300">
              {tasks.map((task) => (
                <li key={task.id} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="font-medium text-white">{task.title}</p>
                  {task.detail ? <p className="text-xs text-slate-300">{task.detail}</p> : null}
                  {task.at ? <p className="text-xs text-slate-400">{task.at}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-300">All compliance queues are clear.</p>
          )}
        </aside>
      </section>
    </div>
  );
}
