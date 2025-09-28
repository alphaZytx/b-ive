"use client";

import { useState } from "react";

type StatusState = "idle" | "submitting" | "success" | "error";

type FormState = {
  creditOwnerId: string;
  beneficiaryId: string;
  organizationId: string;
  credits: string;
  expiresAt: string;
  requestedBloodType: string;
  reason: string;
  clinicalNotes: string;
};

interface CreateConsentRequestFormProps {
  defaultOwnerId: string;
  defaultOrganizationId: string;
}

const BLOOD_TYPES = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function CreateConsentRequestForm({
  defaultOwnerId,
  defaultOrganizationId
}: CreateConsentRequestFormProps) {
  const [form, setForm] = useState<FormState>({
    creditOwnerId: defaultOwnerId,
    beneficiaryId: "",
    organizationId: defaultOrganizationId,
    credits: "1",
    expiresAt: "",
    requestedBloodType: "",
    reason: "",
    clinicalNotes: ""
  });
  const [status, setStatus] = useState<{ state: StatusState; message?: string }>({ state: "idle" });

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const credits = Number.parseInt(form.credits, 10);
    if (!Number.isInteger(credits) || credits <= 0) {
      setStatus({ state: "error", message: "Credits must be a positive integer." });
      return;
    }

    const payload: Record<string, unknown> = {
      creditOwnerId: form.creditOwnerId.trim(),
      beneficiaryId: form.beneficiaryId.trim(),
      organizationId: form.organizationId.trim(),
      credits
    };

    if (form.expiresAt) {
      payload.expiresAt = new Date(form.expiresAt).toISOString();
    }

    const context: Record<string, string> = {};
    if (form.requestedBloodType) {
      context.requestedBloodType = form.requestedBloodType;
    }
    if (form.reason.trim()) {
      context.reason = form.reason.trim();
    }
    if (form.clinicalNotes.trim()) {
      context.clinicalNotes = form.clinicalNotes.trim();
    }

    if (Object.keys(context).length > 0) {
      payload.context = context;
    }

    setStatus({ state: "submitting" });

    try {
      const response = await fetch("/api/consents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = typeof body.error === "string" ? body.error : "Unable to create consent request.";
        setStatus({ state: "error", message });
        return;
      }

      setStatus({
        state: "success",
        message:
          typeof body.requestId === "string"
            ? `Consent request ${body.requestId} created.`
            : "Consent request created."
      });

      setForm((prev) => ({
        ...prev,
        beneficiaryId: "",
        credits: "1",
        expiresAt: "",
        requestedBloodType: "",
        reason: "",
        clinicalNotes: ""
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error while creating consent request.";
      setStatus({ state: "error", message });
    }
  }

  const isSubmitting = status.state === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="creditOwnerId" className="text-sm font-medium text-slate-200">
            Credit owner ID
          </label>
          <input
            id="creditOwnerId"
            name="creditOwnerId"
            value={form.creditOwnerId}
            onChange={(event) => updateField("creditOwnerId", event.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
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
          <label htmlFor="credits" className="text-sm font-medium text-slate-200">
            Credits requested
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
          <label htmlFor="expiresAt" className="text-sm font-medium text-slate-200">
            Expires at
          </label>
          <input
            id="expiresAt"
            name="expiresAt"
            type="datetime-local"
            value={form.expiresAt}
            onChange={(event) => updateField("expiresAt", event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="requestedBloodType" className="text-sm font-medium text-slate-200">
            Requested blood type
          </label>
          <select
            id="requestedBloodType"
            name="requestedBloodType"
            value={form.requestedBloodType}
            onChange={(event) => updateField("requestedBloodType", event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          >
            {BLOOD_TYPES.map((type) => (
              <option key={type || "none"} value={type}>
                {type || "Any"}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="reason" className="text-sm font-medium text-slate-200">
            Reason shared with credit owner
          </label>
          <textarea
            id="reason"
            name="reason"
            rows={3}
            value={form.reason}
            onChange={(event) => updateField("reason", event.target.value)}
            placeholder="Explain why the credits are needed"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="clinicalNotes" className="text-sm font-medium text-slate-200">
            Clinical notes (internal)
          </label>
          <textarea
            id="clinicalNotes"
            name="clinicalNotes"
            rows={3}
            value={form.clinicalNotes}
            onChange={(event) => updateField("clinicalNotes", event.target.value)}
            placeholder="Optional details visible to auditors"
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
          {isSubmitting ? "Creating request…" : "Create request"}
        </button>
        <p className="text-xs text-slate-400">
          The credit owner receives the beneficiary profile before approving.
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
