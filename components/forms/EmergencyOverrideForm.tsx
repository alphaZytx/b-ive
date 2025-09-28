"use client";

import { useState } from "react";

type StatusState = "idle" | "submitting" | "success" | "error";

type FormState = {
  beneficiaryId: string;
  organizationId: string;
  initiatedBy: string;
  credits: string;
  justification: string;
  repaymentPlan: string;
  repaymentDueAt: string;
  debtCeilingCredits: string;
};

interface EmergencyOverrideFormProps {
  defaultOrganizationId: string;
}

export function EmergencyOverrideForm({ defaultOrganizationId }: EmergencyOverrideFormProps) {
  const [form, setForm] = useState<FormState>({
    beneficiaryId: "",
    organizationId: defaultOrganizationId,
    initiatedBy: "",
    credits: "1",
    justification: "",
    repaymentPlan: "",
    repaymentDueAt: "",
    debtCeilingCredits: "3"
  });
  const [status, setStatus] = useState<{ state: StatusState; message?: string }>({ state: "idle" });

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const credits = Number.parseInt(form.credits, 10);
    const ceiling = Number.parseInt(form.debtCeilingCredits, 10);

    if (!Number.isInteger(credits) || credits <= 0) {
      setStatus({ state: "error", message: "Override credits must be a positive integer." });
      return;
    }

    if (!Number.isInteger(ceiling) || ceiling <= 0) {
      setStatus({ state: "error", message: "Debt ceiling must be a positive integer." });
      return;
    }

    if (!form.justification.trim()) {
      setStatus({ state: "error", message: "Provide a justification for the override." });
      return;
    }

    const payload: Record<string, unknown> = {
      beneficiaryId: form.beneficiaryId.trim(),
      organizationId: form.organizationId.trim(),
      initiatedBy: form.initiatedBy.trim(),
      credits,
      justification: form.justification.trim(),
      debtCeilingCredits: ceiling
    };

    if (form.repaymentPlan.trim()) {
      payload.repaymentPlan = form.repaymentPlan.trim();
    }

    if (form.repaymentDueAt) {
      payload.repaymentDueAt = new Date(form.repaymentDueAt).toISOString();
    }

    setStatus({ state: "submitting" });

    try {
      const response = await fetch("/api/emergency-overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = typeof body.error === "string" ? body.error : "Unable to apply emergency override.";
        setStatus({ state: "error", message });
        return;
      }

      setStatus({
        state: "success",
        message:
          typeof body.caseId === "string"
            ? `Emergency override logged (case ${body.caseId}).`
            : "Emergency override applied."
      });

      setForm((prev) => ({
        ...prev,
        credits: "1",
        justification: "",
        repaymentPlan: "",
        repaymentDueAt: ""
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error while applying override.";
      setStatus({ state: "error", message });
    }
  }

  const isSubmitting = status.state === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="beneficiaryId" className="text-sm font-medium text-slate-200">
            Beneficiary ID
          </label>
          <input
            id="beneficiaryId"
            name="beneficiaryId"
            value={form.beneficiaryId}
            onChange={(event) => updateField("beneficiaryId", event.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="organizationId" className="text-sm font-medium text-slate-200">
            Organization ID
          </label>
          <input
            id="organizationId"
            name="organizationId"
            value={form.organizationId}
            onChange={(event) => updateField("organizationId", event.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="initiatedBy" className="text-sm font-medium text-slate-200">
            Initiated by (admin/government)
          </label>
          <input
            id="initiatedBy"
            name="initiatedBy"
            value={form.initiatedBy}
            onChange={(event) => updateField("initiatedBy", event.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="credits" className="text-sm font-medium text-slate-200">
            Override credits
          </label>
          <input
            id="credits"
            name="credits"
            type="number"
            min={1}
            step={1}
            value={form.credits}
            onChange={(event) => updateField("credits", event.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="debtCeilingCredits" className="text-sm font-medium text-slate-200">
            Debt ceiling credits
          </label>
          <input
            id="debtCeilingCredits"
            name="debtCeilingCredits"
            type="number"
            min={1}
            step={1}
            value={form.debtCeilingCredits}
            onChange={(event) => updateField("debtCeilingCredits", event.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="justification" className="text-sm font-medium text-slate-200">
            Justification
          </label>
          <textarea
            id="justification"
            name="justification"
            rows={3}
            value={form.justification}
            onChange={(event) => updateField("justification", event.target.value)}
            required
            placeholder="Summarize the emergency need and approvals"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="repaymentPlan" className="text-sm font-medium text-slate-200">
            Repayment plan
          </label>
          <textarea
            id="repaymentPlan"
            name="repaymentPlan"
            rows={3}
            value={form.repaymentPlan}
            onChange={(event) => updateField("repaymentPlan", event.target.value)}
            placeholder="Outline how the credits will be replenished"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="repaymentDueAt" className="text-sm font-medium text-slate-200">
            Repayment due date
          </label>
          <input
            id="repaymentDueAt"
            name="repaymentDueAt"
            type="date"
            value={form.repaymentDueAt}
            onChange={(event) => updateField("repaymentDueAt", event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Posting override…" : "Post override"}
        </button>
        <p className="text-xs text-slate-400">
          Overrides create a temporary negative balance until repayment clears.
        </p>
      </div>
      <div aria-live="polite" className="min-h-[1.5rem] text-sm">
        {status.state === "success" && status.message ? (
          <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-emerald-200">
            {status.message}
          </p>
        ) : null}
        {status.state === "error" && status.message ? (
          <p className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-rose-200">
            {status.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
