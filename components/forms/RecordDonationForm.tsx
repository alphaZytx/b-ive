"use client";

import { useState } from "react";

type StatusState = "idle" | "submitting" | "success" | "error";

type FormState = {
  donorId: string;
  organizationId: string;
  bloodType: string;
  component: string;
  credits: string;
  volumeMl: string;
  collectedAt: string;
  notes: string;
};

interface RecordDonationFormProps {
  defaultDonorId: string;
  defaultOrganizationId: string;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const BLOOD_COMPONENTS: Array<{ value: string; label: string }> = [
  { value: "whole_blood", label: "Whole blood" },
  { value: "packed_rbc", label: "Packed RBC" },
  { value: "plasma", label: "Plasma" },
  { value: "platelets", label: "Platelets" },
  { value: "cryoprecipitate", label: "Cryoprecipitate" }
];

export function RecordDonationForm({ defaultDonorId, defaultOrganizationId }: RecordDonationFormProps) {
  const [form, setForm] = useState<FormState>({
    donorId: defaultDonorId,
    organizationId: defaultOrganizationId,
    bloodType: BLOOD_TYPES[0],
    component: BLOOD_COMPONENTS[0].value,
    credits: "1",
    volumeMl: "",
    collectedAt: "",
    notes: ""
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

    const volume = form.volumeMl ? Number.parseInt(form.volumeMl, 10) : undefined;
    if (form.volumeMl && (!Number.isInteger(volume!) || volume! <= 0)) {
      setStatus({ state: "error", message: "Volume must be a positive integer." });
      return;
    }

    const payload: Record<string, unknown> = {
      donorId: form.donorId.trim(),
      organizationId: form.organizationId.trim(),
      bloodType: form.bloodType,
      component: form.component,
      credits
    };

    if (typeof volume === "number") {
      payload.volumeMl = volume;
    }

    if (form.collectedAt) {
      payload.collectedAt = new Date(form.collectedAt).toISOString();
    }

    if (form.notes.trim()) {
      payload.notes = form.notes.trim();
    }

    setStatus({ state: "submitting" });

    try {
      const response = await fetch("/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = typeof body.error === "string" ? body.error : "Unable to record donation.";
        setStatus({ state: "error", message });
        return;
      }

      setStatus({
        state: "success",
        message:
          typeof body.transactionId === "string"
            ? `Donation recorded (transaction ${body.transactionId}).`
            : "Donation recorded successfully."
      });

      setForm((prev) => ({
        ...prev,
        credits: "1",
        volumeMl: "",
        collectedAt: "",
        notes: ""
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error while recording donation.";
      setStatus({ state: "error", message });
    }
  }

  const isSubmitting = status.state === "submitting";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="donorId" className="text-sm font-medium text-slate-200">
            Donor ID
          </label>
          <input
            id="donorId"
            name="donorId"
            value={form.donorId}
            onChange={(event) => updateField("donorId", event.target.value)}
            required
            autoComplete="off"
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
            autoComplete="off"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white placeholder-slate-400 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="bloodType" className="text-sm font-medium text-slate-200">
            Blood type
          </label>
          <select
            id="bloodType"
            name="bloodType"
            value={form.bloodType}
            onChange={(event) => updateField("bloodType", event.target.value)}
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
          <label htmlFor="component" className="text-sm font-medium text-slate-200">
            Component
          </label>
          <select
            id="component"
            name="component"
            value={form.component}
            onChange={(event) => updateField("component", event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          >
            {BLOOD_COMPONENTS.map((component) => (
              <option key={component.value} value={component.value}>
                {component.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor="credits" className="text-sm font-medium text-slate-200">
            Credits
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
          <label htmlFor="volumeMl" className="text-sm font-medium text-slate-200">
            Volume (ml)
          </label>
          <input
            id="volumeMl"
            name="volumeMl"
            type="number"
            min={100}
            step={50}
            value={form.volumeMl}
            onChange={(event) => updateField("volumeMl", event.target.value)}
            placeholder="Optional"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="collectedAt" className="text-sm font-medium text-slate-200">
            Collected at
          </label>
          <input
            id="collectedAt"
            name="collectedAt"
            type="datetime-local"
            value={form.collectedAt}
            onChange={(event) => updateField("collectedAt", event.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2 text-sm text-white focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label htmlFor="notes" className="text-sm font-medium text-slate-200">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={form.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            placeholder="Optional context for audit trail"
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
          {isSubmitting ? "Recording donation…" : "Record donation"}
        </button>
        <p className="text-xs text-slate-400">
          Donations increment donor credits and organizational inventory in a single transaction.
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
