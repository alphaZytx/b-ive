import { requireRole } from "@/lib/auth/session";
import { getGovernmentDashboardSnapshot } from "@/lib/dashboard/queries";
import type { MetricTone, RiskLevel, TimelineStatus } from "@/lib/dashboard/types";

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

const severityStyles: Record<RiskLevel, { badge: string; label: string }> = {
  high: {
    badge: "bg-rose-500/20 text-rose-100 border border-rose-400/40",
    label: "High"
  },
  medium: {
    badge: "bg-amber-500/20 text-amber-100 border border-amber-400/40",
    label: "Medium"
  },
  low: {
    badge: "bg-emerald-500/20 text-emerald-100 border border-emerald-400/30",
    label: "Low"
  }
};

export default async function GovernmentWorkspace() {
  await requireRole(["government", "admin"], "/workspace/government");
  const { metrics, timeline, risks, inventory } = await getGovernmentDashboardSnapshot();

  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-lg font-semibold text-white">National coverage</h2>
        {metrics.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            No national metrics yet—seed the MongoDB database to populate the government workspace.
          </p>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-brand-accent">Network timeline</h3>
            <span className="text-xs uppercase tracking-wide text-slate-400">Compliance + exchanges</span>
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
            <p className="text-sm text-slate-300">No recent inter-organization or emergency activity captured yet.</p>
          )}
        </div>
        <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-lg font-semibold text-brand-accent">Risk radar</h3>
          {risks.length > 0 ? (
            <ul className="space-y-3">
              {risks.map((risk) => {
                const severity = severityStyles[risk.severity];
                return (
                  <li key={risk.id} className={`rounded-2xl px-4 py-3 text-sm text-slate-200 ${severity.badge}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-white">{risk.title}</p>
                      <span className="text-xs uppercase tracking-wide text-white/80">{severity.label}</span>
                    </div>
                    {risk.detail ? <p className="mt-1 text-xs text-slate-200/80">{risk.detail}</p> : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-300">All indicators are within expected thresholds.</p>
          )}
        </aside>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-brand-accent">Inventory coverage by blood type</h3>
          <span className="text-xs uppercase tracking-wide text-slate-400">Credits across organizations</span>
        </div>
        {inventory.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-white/5">
            <table className="min-w-full divide-y divide-white/10 text-sm text-slate-200">
              <thead className="bg-white/5 text-xs uppercase text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left">Blood type</th>
                  <th className="px-4 py-3 text-right">Credits in network</th>
                  <th className="px-4 py-3 text-right">Organizations</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((row) => (
                  <tr key={row.bloodType} className="odd:bg-white/[0.04]">
                    <td className="px-4 py-3 font-medium text-white">{row.bloodType}</td>
                    <td className="px-4 py-3 text-right">{row.totalCredits}</td>
                    <td className="px-4 py-3 text-right">{row.organizations}</td>
                    <td className={`px-4 py-3 text-left text-xs ${row.lowStock ? "text-amber-300" : "text-emerald-300"}`}>
                      {row.lowStock ? "Low reserves" : "Healthy"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-300">
            Inventory has not been recorded yet. As organizations log donations, coverage by blood type appears here.
          </p>
        )}
      </section>
    </div>
  );
}
