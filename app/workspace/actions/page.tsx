import { ActionCard } from "@/components/forms/ActionCard";
import { CreateConsentRequestForm } from "@/components/forms/CreateConsentRequestForm";
import { EmergencyOverrideForm } from "@/components/forms/EmergencyOverrideForm";
import { ExchangeProposalForm } from "@/components/forms/ExchangeProposalForm";
import { RecordDonationForm } from "@/components/forms/RecordDonationForm";
import { RespondConsentForm } from "@/components/forms/RespondConsentForm";
import { config } from "@/lib/config";

export default function WorkspaceActionsPage() {
  const defaults = {
    donorId: config.demo.donorId,
    organizationId: config.demo.organizationId
  };

  return (
    <div className="space-y-8">
      <p className="text-sm text-slate-300">
        Use these action consoles to exercise the phase-two Mongo-backed APIs directly. Each form calls the
        Next.js API routes so you can validate request payloads, inspect audit logs, and refresh the dashboards
        with live data.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <ActionCard
          title="Record a donation"
          description="Post a donor credit, update the ledger, and sync organizational inventory in one transaction."
        >
          <RecordDonationForm
            defaultDonorId={defaults.donorId}
            defaultOrganizationId={defaults.organizationId}
          />
        </ActionCard>
        <ActionCard
          title="Request consent"
          description="Ask a donor to release credits for a beneficiary, capturing contextual details for auditing."
        >
          <CreateConsentRequestForm
            defaultOwnerId={defaults.donorId}
            defaultOrganizationId={defaults.organizationId}
          />
        </ActionCard>
        <ActionCard
          title="Respond to consent"
          description="Approve or decline pending consent requests. Approvals debit credits immediately."
        >
          <RespondConsentForm defaultActorId={defaults.donorId} />
        </ActionCard>
        <ActionCard
          title="Apply emergency override"
          description="Authorize a one-time negative balance when urgent care requires immediate blood allocation."
        >
          <EmergencyOverrideForm defaultOrganizationId={defaults.organizationId} />
        </ActionCard>
      </div>
      <ActionCard
        title="Log inter-organization exchange"
        description="Capture paired credit swaps so compliance teams can reconcile blood-type specific agreements."
        className="lg:col-span-2"
      >
        <ExchangeProposalForm defaultOrganizationId={defaults.organizationId} />
      </ActionCard>
    </div>
  );
}
