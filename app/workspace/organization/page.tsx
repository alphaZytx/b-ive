import { config } from "@/lib/config";
import { getOrganizationDashboardSnapshot } from "@/lib/dashboard/queries";

import type { MetricTone, TimelineStatus } from "@/lib/dashboard/types";

const toneClasses: Record<MetricTone, string> = {
  positive: "text-emerald-300",
  warning: "text-amber-300",
  negative: "text-rose-300",
  neutral: "text-slate-300"
};

const statusBullets: Record<TimelineStatus, string> = {
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  error: "bg-rose-500",
  info: "bg-sky-400"
};

export default async function OrganizationWorkspace() {
  const organizationId = config.demo.organizationId;
  const snapshot = await getOrganizationDashboardSnapshot(organizationId);

  return (
    <div className="space-y-12">
      {snapshot.organization?.name ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-brand-accent">{snapshot.organization.name}</h2>
          <p className="text-sm text-slate-300">
            {snapshot.organization.city ? `${snapshot.organization.city} · ` : null}
            {snapshot.organization.status ? snapshot.organization.status : "Status unknown"}
          </p>
        </div>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-white">Operational metrics</h2>
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
            No operational metrics yet—seed the organization data to explore this view.
          </p>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-brand-accent">Inventory by blood type</h3>
            <span className="text-xs uppercase tracking-wide text-slate-400">Synced with ledger</span>
          </div>
          {snapshot.inventory.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-white/5">
              <table className="min-w-full divide-y divide-white/10 text-sm text-slate-200">
                <thead className="bg-white/5 text-xs uppercase text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left">Blood type</th>
                    <th className="px-4 py-3 text-right">Credits</th>
                    <th className="px-4 py-3 text-right">Units</th>
                    <th className="px-4 py-3 text-left">Alerts</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.inventory.map((row) => (
                    <tr key={row.bloodType} className="odd:bg-white/[0.04]">
                      <td className="px-4 py-3 font-medium text-white">{row.bloodType}</td>
                      <td className="px-4 py-3 text-right">{row.credits}</td>
                      <td className="px-4 py-3 text-right">{row.units}</td>
                      <td className="px-4 py-3 text-left text-xs text-amber-300">
                        {row.expiresSoon ? "Expiring soon" : "Stable"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-300">No inventory tracked for this organization yet.</p>
          )}
        </div>
        <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-brand-accent">Recent activity</h3>
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
            <p className="text-sm text-slate-300">No recent activity recorded for this organization.</p>
          )}
        </aside>
      </section>

      <section className="rounded-3xl border border-dashed border-brand-primary/40 bg-brand-primary/10 p-6 text-sm text-slate-200">
        <h3 className="text-lg font-semibold text-brand-accent">Exchange playbook</h3>
        <p className="mt-2">
          Coordinate with partner organizations using paired credit trades, such as swapping <span className="font-semibold">2
          O-</span> credits for <span className="font-semibold">3 A+</span> credits. The ledger tracks any imbalances and signals
          administrators when make-up deliveries are due.
        </p>
        <p className="mt-4 text-xs text-slate-300">
          Tip: capture negotiation notes in the exchange record so compliance teams can audit approvals later.
        </p>
      </section>
    </div>
  );
}
