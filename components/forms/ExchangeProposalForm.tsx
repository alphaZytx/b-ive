"use client";

import { useState } from "react";

type StatusState = "idle" | "submitting" | "success" | "error";

type FormState = {
  requestingOrgId: string;
  offeringOrgId: string;
  requestedBloodType: string;
  requestedCredits: string;
  offeredBloodType: string;
  offeredCredits: string;
  notes: string;
};

interface ExchangeProposalFormProps {
  defaultOrganizationId: string;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function ExchangeProposalForm({ defaultOrganizationId }: ExchangeProposalFormProps) {
  const [form, setForm] = useState<FormState>({
    requestingOrgId: defaultOrganizationId,
    offeringOrgId: "",
    requestedBloodType: BLOOD_TYPES[0],
    requestedCredits: "2",
    offeredBloodType: BLOOD_TYPES[1],
    offeredCredits: "2",
    notes: ""
  });
  const [status, setStatus] = useState<{ state: StatusState; message?: string }>({ state: "idle" });

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const requestedCredits = Number.parseInt(form.requestedCredits, 10);
    const offeredCredits = Number.parseInt(form.offeredCredits, 10);

    if (!Number.isInteger(requestedCredits) || requestedCredits <= 0) {
      setStatus({ state: "error", message: "Requested credits must be a positive integer." });
      return;
    }

    if (!Number.isInteger(offeredCredits) || offeredCredits <= 0) {
      setStatus({ state: "error", message: "Offered credits must be a positive integer." });
      return;
    }

    const payload = {
      requestingOrgId: form.requestingOrgId.trim(),
      offeringOrgId: form.offeringOrgId.trim(),
      requested: {
        bloodType: form.requestedBloodType,
        credits: requestedCredits
      },
      offered: {
        bloodType: form.offeredBloodType,
        credits: offeredCredits
      },
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {})
    };

    setStatus({ state: "submitting" });

    try {
      const response = await fetch("/api/exchanges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = typeof body.error === "string" ? body.error : "Unable to log exchange.";
        setStatus({ state: "error", message });
        return;
      }

      setStatus({
        state: "success",
        message:
          typeof body.exchangeId === "string"
            ? `Exchange proposal ${body.exchangeId} recorded.`
            : "Exchange proposal recorded."
      });

      setForm((prev) => ({
        ...prev,
        offeringOrgId: "",
        offeredCredits: "2",
        notes: ""
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error while logging exchange.";
      setStatus({ state: "error", message });
    }
  }

  const isSubmitting = status.state === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="requestingOrgId" className="text-sm font-medium text-slate-200">
            Requesting organization ID
          </label>
          <input
            id="requestingOrgId"
            name="requestingOrgId"
            value={form.requestingOrgId}
            onChange={(event) => updateField("requestingOrgId", event.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="offeringOrgId" className="text-sm font-medium text-slate-200">
            Partner organization ID
          </label>
          <input
            id="offeringOrgId"
            name="offeringOrgId"
            value={form.offeringOrgId}
            onChange={(event) => updateField("offeringOrgId", event.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="requestedBloodType" className="text-sm font-medium text-slate-200">
            Requesting blood type
          </label>
          <select
            id="requestedBloodType"
            name="requestedBloodType"
            value={form.requestedBloodType}
            onChange={(event) => updateField("requestedBloodType", event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          >
            {BLOOD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="requestedCredits" className="text-sm font-medium text-slate-200">
            Credits requested
          </label>
          <input
            id="requestedCredits"
            name="requestedCredits"
            type="number"
            min={1}
            step={1}
            value={form.requestedCredits}
            onChange={(event) => updateField("requestedCredits", event.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="offeredBloodType" className="text-sm font-medium text-slate-200">
            Offered blood type
          </label>
          <select
            id="offeredBloodType"
            name="offeredBloodType"
            value={form.offeredBloodType}
            onChange={(event) => updateField("offeredBloodType", event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          >
            {BLOOD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="offeredCredits" className="text-sm font-medium text-slate-200">
            Credits offered
          </label>
          <input
            id="offeredCredits"
            name="offeredCredits"
            type="number"
            min={1}
            step={1}
            value={form.offeredCredits}
            onChange={(event) => updateField("offeredCredits", event.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="notes" className="text-sm font-medium text-slate-200">
            Negotiation notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            placeholder="Capture commitments or delivery timelines"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Logging exchange…" : "Log exchange"}
        </button>
        <p className="text-xs text-slate-400">Ledger differentials flag make-up deliveries automatically.</p>
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
