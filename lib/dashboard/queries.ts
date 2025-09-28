import { randomUUID } from "crypto";

import { getMongoClient } from "@/lib/db/mongodb";
import { getLedgerSummary } from "@/lib/domain/services";

import type {
  AdminDashboardSnapshot,
  DonorDashboardSnapshot,
  InventoryRow,
  Metric,
  OrganizationDashboardSnapshot,
  TaskItem,
  TimelineItem
} from "./types";

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short"
});

const DAY_IN_MS = 86_400_000;
const HOUR_IN_MS = 3_600_000;
const MINUTE_IN_MS = 60_000;

function safeDate(value: unknown): Date | undefined {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    const asDate = new Date(value);
    if (!Number.isNaN(asDate.getTime())) {
      return asDate;
    }
  }

  return undefined;
}

function formatRelativeOrAbsolute(date: Date | undefined) {
  if (!date) {
    return "Unknown";
  }

  const diff = Date.now() - date.getTime();
  const abs = Math.abs(diff);

  if (abs < MINUTE_IN_MS) {
    return diff >= 0 ? "Just now" : "In under a minute";
  }

  if (abs < HOUR_IN_MS) {
    const value = Math.round(abs / MINUTE_IN_MS);
    const unit = value === 1 ? "minute" : "minutes";
    return diff >= 0 ? `${value} ${unit} ago` : `in ${value} ${unit}`;
  }

  if (abs < DAY_IN_MS) {
    const value = Math.round(abs / HOUR_IN_MS);
    const unit = value === 1 ? "hour" : "hours";
    return diff >= 0 ? `${value} ${unit} ago` : `in ${value} ${unit}`;
  }

  if (abs < 7 * DAY_IN_MS) {
    const value = Math.round(abs / DAY_IN_MS);
    const unit = value === 1 ? "day" : "days";
    return diff >= 0 ? `${value} ${unit} ago` : `in ${value} ${unit}`;
  }

  return dateTimeFormatter.format(date);
}

function buildTimelineItem(partial: Omit<TimelineItem, "at"> & { at?: string; sortKey?: number }): TimelineItem & { sortKey: number } {
  const sortKey = partial.sortKey ?? Date.now();
  return {
    id: partial.id,
    title: partial.title,
    description: partial.description,
    status: partial.status,
    at: partial.at ?? "Unknown",
    sortKey
  };
}

function buildMetric(partial: Metric): Metric {
  return {
    label: partial.label,
    value: partial.value,
    change: partial.change,
    tone: partial.tone ?? "neutral"
  };
}

function buildTask(partial: TaskItem): TaskItem {
  return {
    id: partial.id,
    title: partial.title,
    detail: partial.detail,
    at: partial.at
  };
}

export async function getAdminDashboardSnapshot(): Promise<AdminDashboardSnapshot> {
  try {
    const client = await getMongoClient();
    const db = client.db("bive");

    const organizations = db.collection("organizations");
    const consentRequests = db.collection("consentRequests");
    const transactions = db.collection("transactions");
    const emergencyCases = db.collection("emergencyCases");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      activeOrganizations,
      pendingOrganizations,
      outstandingEmergency,
      consentsToday,
      pendingConsentsToday
    ] = await Promise.all([
      organizations.countDocuments({ status: "active" }),
      organizations.countDocuments({ status: "pending" }),
      emergencyCases.countDocuments({ status: "OUTSTANDING" }),
      consentRequests.countDocuments({ requestedAt: { $gte: startOfDay } }),
      consentRequests.countDocuments({ status: "PENDING", requestedAt: { $gte: startOfDay } })
    ]);

    const [recentTransactions, recentConsents] = await Promise.all([
      transactions
        .find({}, { projection: { _id: 1, type: 1, credits: 1, organizationId: 1, donorId: 1, beneficiaryId: 1, recordedAt: 1 } })
        .sort({ recordedAt: -1 })
        .limit(6)
        .toArray(),
      consentRequests
        .find({}, { projection: { _id: 1, status: 1, credits: 1, organizationId: 1, beneficiaryId: 1, decidedAt: 1, requestedAt: 1 } })
        .sort({ decidedAt: -1, requestedAt: -1 })
        .limit(4)
        .toArray()
    ]);

    const timeline = [
      ...recentTransactions.map((txn) => {
        const recordedAt = safeDate(txn.recordedAt);
        const at = formatRelativeOrAbsolute(recordedAt);
        let title = "Ledger activity";
        let description = `${txn.credits} credits processed by ${txn.organizationId}`;
        let status: TimelineItem["status"] = "info";

        if (txn.type === "DONATION") {
          title = "Donation recorded";
          description = `${txn.credits} credits donated by ${txn.donorId ?? "unknown donor"}`;
          status = "success";
        } else if (txn.type === "REDEMPTION") {
          title = "Consent redeemed";
          description = `${txn.credits} credits fulfilled for ${txn.beneficiaryId ?? "beneficiary"}`;
          status = "info";
        } else if (txn.type === "EMERGENCY_OVERRIDE") {
          title = "Emergency override";
          description = `${txn.credits} credits allocated to ${txn.beneficiaryId ?? "beneficiary"}`;
          status = "warning";
        }

        return buildTimelineItem({
          id: txn._id?.toString() ?? randomUUID(),
          title,
          description,
          status,
          at,
          sortKey: recordedAt?.getTime()
        });
      }),
      ...recentConsents.map((request) => {
        const decidedAt = safeDate(request.decidedAt) ?? safeDate(request.requestedAt);
        const at = formatRelativeOrAbsolute(decidedAt);
        let title = "Consent request";
        let status: TimelineItem["status"] = "warning";

        if (request.status === "APPROVED") {
          title = "Consent approved";
          status = "success";
        } else if (request.status === "DECLINED") {
          title = "Consent declined";
          status = "error";
        }

        return buildTimelineItem({
          id: request._id?.toString() ?? randomUUID(),
          title,
          description: `${request.credits} credits for ${request.beneficiaryId ?? "beneficiary"} via ${request.organizationId}`,
          status,
          at,
          sortKey: decidedAt?.getTime()
        });
      })
    ]
      .sort((a, b) => (b.sortKey ?? 0) - (a.sortKey ?? 0))
      .slice(0, 6)
      .map(({ sortKey, ...item }) => item);

    const metrics: Metric[] = [
      buildMetric({
        label: "Active organizations",
        value: `${activeOrganizations}`,
        change:
          pendingOrganizations > 0
            ? `${pendingOrganizations} awaiting verification`
            : "All partners verified",
        tone: pendingOrganizations > 0 ? "warning" : "positive"
      }),
      buildMetric({
        label: "Outstanding emergency overrides",
        value: `${outstandingEmergency}`,
        change:
          outstandingEmergency > 0
            ? "Follow repayment plans"
            : "No emergency debt",
        tone: outstandingEmergency > 0 ? "warning" : "positive"
      }),
      buildMetric({
        label: "Consent requests today",
        value: `${consentsToday}`,
        change:
          pendingConsentsToday > 0
            ? `${pendingConsentsToday} awaiting donor approval`
            : "All requests resolved",
        tone: pendingConsentsToday > 0 ? "warning" : "neutral"
      })
    ];

    const tasks: TaskItem[] = [];

    if (pendingOrganizations > 0) {
      tasks.push(
        buildTask({
          id: "task-pending-orgs",
          title: `Verify ${pendingOrganizations} pending organization${pendingOrganizations === 1 ? "" : "s"}`,
          detail: "Complete onboarding checks within the SLA."
        })
      );
    }

    if (outstandingEmergency > 0) {
      tasks.push(
        buildTask({
          id: "task-emergency-repayment",
          title: `Follow up on ${outstandingEmergency} emergency case${outstandingEmergency === 1 ? "" : "s"}`,
          detail: "Confirm repayment receipts or extend the repayment plan."
        })
      );
    }

    if (pendingConsentsToday > 0) {
      tasks.push(
        buildTask({
          id: "task-consent-followup",
          title: `Nudge donors on ${pendingConsentsToday} pending consent${pendingConsentsToday === 1 ? "" : "s"}`,
          detail: "Escalate urgent requests approaching expiry."
        })
      );
    }

    if (tasks.length === 0) {
      tasks.push(
        buildTask({
          id: "task-clear",
          title: "All critical queues are clear",
          detail: "Monitor dashboards for new activity."
        })
      );
    }

    return { metrics, timeline, tasks };
  } catch (error) {
    console.error("Failed to build admin dashboard snapshot", error);
    return { metrics: [], timeline: [], tasks: [] };
  }
}

export async function getOrganizationDashboardSnapshot(
  organizationId: string
): Promise<OrganizationDashboardSnapshot> {
  try {
    const client = await getMongoClient();
    const db = client.db("bive");

    const organizations = db.collection("organizations");
    const consentRequests = db.collection("consentRequests");
    const transactions = db.collection("transactions");
    const exchanges = db.collection("exchanges");
    const inventoryCollection = db.collection("inventory");

    const organization = await organizations.findOne({ organizationId });

    const [inventoryDocs, approvedCount, totalRequests, pendingRequests, openExchanges, recentConsents, exchangeEvents] =
      await Promise.all([
        inventoryCollection
          .find({ organizationId })
          .project({
            _id: 1,
            organizationId: 1,
            bloodType: 1,
            availableCredits: 1,
            availableUnits: 1,
            nextExpiryAt: 1,
            movements: { $slice: -3 }
          })
          .toArray(),
        consentRequests.countDocuments({ organizationId, status: "APPROVED" }),
        consentRequests.countDocuments({ organizationId }),
        consentRequests.countDocuments({ organizationId, status: "PENDING" }),
        exchanges.countDocuments({
          status: "PENDING",
          $or: [{ requestingOrgId: organizationId }, { offeringOrgId: organizationId }]
        }),
        consentRequests
          .find({ organizationId })
          .sort({ decidedAt: -1, requestedAt: -1 })
          .limit(4)
          .toArray(),
        exchanges
          .find({
            $or: [{ requestingOrgId: organizationId }, { offeringOrgId: organizationId }]
          })
          .sort({ proposedAt: -1 })
          .limit(3)
          .toArray()
      ]);

    const totalCredits = inventoryDocs.reduce((sum, item) => sum + (item.availableCredits ?? 0), 0);
    const fulfillmentRate = totalRequests > 0 ? Math.round((approvedCount / totalRequests) * 100) : 100;

    const metrics: Metric[] = [
      buildMetric({
        label: "Credits available",
        value: `${totalCredits} credits`,
        change: `${inventoryDocs.length} blood type${inventoryDocs.length === 1 ? "" : "s"} tracked`,
        tone: totalCredits > 0 ? "positive" : "warning"
      }),
      buildMetric({
        label: "Fulfillment SLA",
        value: `${fulfillmentRate}%`,
        change:
          totalRequests > 0
            ? `${pendingRequests} request${pendingRequests === 1 ? "" : "s"} awaiting donor consent`
            : "No requests yet",
        tone: fulfillmentRate >= 90 ? "positive" : "warning"
      }),
      buildMetric({
        label: "Open exchanges",
        value: `${openExchanges}`,
        change: openExchanges > 0 ? "Coordinate with partner orgs" : "All exchanges settled",
        tone: openExchanges > 0 ? "warning" : "neutral"
      })
    ];

    const inventory: InventoryRow[] = inventoryDocs.map((doc) => {
      const nextExpiry = safeDate(doc.nextExpiryAt);
      const expiresSoon = nextExpiry ? nextExpiry.getTime() - Date.now() < 3 * DAY_IN_MS : false;
      const units = typeof doc.availableUnits === "number" ? doc.availableUnits : doc.availableCredits ?? 0;

      return {
        bloodType: doc.bloodType ?? "Unknown",
        credits: doc.availableCredits ?? 0,
        units,
        expiresSoon
      };
    });

    const transactionEvents = await transactions
      .find({ organizationId })
      .sort({ recordedAt: -1 })
      .limit(3)
      .toArray();

    const timeline = [
      ...transactionEvents.map((txn) => {
        const recordedAt = safeDate(txn.recordedAt);
        const at = formatRelativeOrAbsolute(recordedAt);
        let title = "Ledger activity";
        let description = `${txn.credits} credits processed`;
        let status: TimelineItem["status"] = "info";

        if (txn.type === "DONATION") {
          title = "Donation captured";
          description = `${txn.credits} credits added to inventory`;
          status = "success";
        } else if (txn.type === "REDEMPTION") {
          title = "Consent fulfilled";
          description = `${txn.credits} credits redeemed for ${txn.beneficiaryId ?? "beneficiary"}`;
          status = "info";
        } else if (txn.type === "EMERGENCY_OVERRIDE") {
          title = "Emergency override supported";
          description = `${txn.credits} credits allocated to ${txn.beneficiaryId ?? "beneficiary"}`;
          status = "warning";
        }

        return buildTimelineItem({
          id: txn._id?.toString() ?? randomUUID(),
          title,
          description,
          status,
          at,
          sortKey: recordedAt?.getTime()
        });
      }),
      ...recentConsents.map((request) => {
        const decisionDate = safeDate(request.decidedAt) ?? safeDate(request.requestedAt);
        const at = formatRelativeOrAbsolute(decisionDate);
        let title = "Consent request";
        let status: TimelineItem["status"] = "warning";

        if (request.status === "APPROVED") {
          title = "Consent approved";
          status = "success";
        } else if (request.status === "DECLINED") {
          title = "Consent declined";
          status = "error";
        }

        return buildTimelineItem({
          id: request._id?.toString() ?? randomUUID(),
          title,
          description: `${request.credits} credits for ${request.beneficiaryId ?? "beneficiary"}`,
          status,
          at,
          sortKey: decisionDate?.getTime()
        });
      }),
      ...exchangeEvents.map((exchange) => {
        const proposedAt = safeDate(exchange.proposedAt);
        const at = formatRelativeOrAbsolute(proposedAt);
        const status: TimelineItem["status"] = exchange.status === "PENDING" ? "warning" : "success";
        const title = exchange.status === "PENDING" ? "Exchange proposed" : "Exchange completed";
        const description = `${exchange.requestingOrgId} ↔ ${exchange.offeringOrgId} (${exchange.requested?.credits ?? 0}:${
          exchange.offered?.credits ?? 0
        })`;

        return buildTimelineItem({
          id: exchange._id?.toString() ?? randomUUID(),
          title,
          description,
          status,
          at,
          sortKey: proposedAt?.getTime()
        });
      }),
      ...inventoryDocs.flatMap((doc) => {
        const movements = Array.isArray(doc.movements) ? doc.movements : [];
        return movements.map((movement: any) => {
          const movementDate = safeDate(movement.at);
          const at = formatRelativeOrAbsolute(movementDate);
          const title = movement.type === "FULFILLMENT" ? "Inventory fulfillment" : "Inventory update";
          const status: TimelineItem["status"] = movement.type === "FULFILLMENT" ? "info" : "success";

          return buildTimelineItem({
            id: `${doc._id?.toString() ?? doc.bloodType}-${movement.transactionId ?? randomUUID()}`,
            title,
            description: `${movement.credits ?? 0} credits · ${doc.bloodType}`,
            status,
            at,
            sortKey: movementDate?.getTime()
          });
        });
      })
    ]
      .sort((a, b) => (b.sortKey ?? 0) - (a.sortKey ?? 0))
      .slice(0, 8)
      .map(({ sortKey, ...item }) => item);

    return {
      organization: organization
        ? {
            organizationId: organization.organizationId,
            name: organization.name,
            status: organization.status,
            city: organization.city
          }
        : undefined,
      metrics,
      inventory,
      timeline
    };
  } catch (error) {
    console.error("Failed to build organization dashboard snapshot", error);
    return { metrics: [], inventory: [], timeline: [] };
  }
}

export async function getDonorDashboardSnapshot(userId: string): Promise<DonorDashboardSnapshot> {
  try {
    const { user, recentTransactions } = await getLedgerSummary(userId);
    const client = await getMongoClient();
    const db = client.db("bive");

    const consentRequests = await db
      .collection("consentRequests")
      .find({ creditOwnerId: userId, status: "PENDING" })
      .sort({ requestedAt: -1 })
      .limit(5)
      .toArray();

    const pendingCount = consentRequests.length;
    const balance = user.credits?.balance ?? 0;
    const earned = user.credits?.totalEarned ?? 0;
    const redeemed = user.credits?.totalRedeemed ?? 0;
    const emergency = user.credits?.emergency;

    const metrics: Metric[] = [
      buildMetric({
        label: "Current balance",
        value: `${balance} credits`,
        change: `${earned} earned · ${redeemed} spent`,
        tone: balance > 0 ? "neutral" : balance === 0 ? "neutral" : "warning"
      }),
      buildMetric({
        label: "Emergency debt",
        value: emergency?.active ? `${emergency.credits ?? 0} credits` : "0 credits",
        change: emergency?.active
          ? `Due ${formatRelativeOrAbsolute(safeDate(emergency.repaymentDueAt))}`
          : "In good standing",
        tone: emergency?.active ? "warning" : "positive"
      }),
      buildMetric({
        label: "Pending requests",
        value: `${pendingCount}`,
        change:
          pendingCount > 0
            ? `${pendingCount} awaiting your decision`
            : "No approvals required",
        tone: pendingCount > 0 ? "warning" : "positive"
      })
    ];

    const timeline = recentTransactions.map((txn: any) => {
      const recordedAt = safeDate(txn.recordedAt);
      const at = formatRelativeOrAbsolute(recordedAt);
      let title = "Ledger activity";
      let description = `${txn.credits} credits`;
      let status: TimelineItem["status"] = "info";

      if (txn.type === "DONATION") {
        title = "Donation recorded";
        description = `${txn.credits} credits donated at ${txn.organizationId}`;
        status = "success";
      } else if (txn.type === "REDEMPTION") {
        title = "Credits redeemed";
        description = `${txn.credits} credits for ${txn.beneficiaryId ?? "beneficiary"}`;
        status = "info";
      } else if (txn.type === "EMERGENCY_OVERRIDE") {
        title = "Emergency override";
        description = `${txn.credits} credits advanced by ${txn.organizationId}`;
        status = "warning";
      }

      return buildTimelineItem({
        id: txn._id?.toString() ?? randomUUID(),
        title,
        description,
        status,
        at,
        sortKey: recordedAt?.getTime()
      });
    });

    const upcoming: TaskItem[] = [];

    consentRequests.forEach((request: any) => {
      const expiresAt = safeDate(request.expiresAt);
      upcoming.push(
        buildTask({
          id: request._id?.toString() ?? randomUUID(),
          title: `Review ${request.credits} credit request`,
          detail: `${request.organizationId} → ${request.beneficiaryId}`,
          at: expiresAt ? `Expires ${formatRelativeOrAbsolute(expiresAt)}` : undefined
        })
      );
    });

    if (user.eligibility?.nextDonationAt) {
      const nextDonationAt = safeDate(user.eligibility.nextDonationAt);
      upcoming.push(
        buildTask({
          id: "task-next-donation",
          title: "Next eligible donation",
          detail: dateTimeFormatter.format(nextDonationAt ?? new Date()),
          at: formatRelativeOrAbsolute(nextDonationAt)
        })
      );
    }

    if (emergency?.active) {
      upcoming.push(
        buildTask({
          id: "task-emergency-repayment",
          title: "Emergency repayment plan",
          detail: emergency.repaymentPlan ?? "Coordinate with administrators",
          at: emergency.repaymentDueAt ? dateTimeFormatter.format(safeDate(emergency.repaymentDueAt) ?? new Date()) : undefined
        })
      );
    }

    if (upcoming.length === 0) {
      upcoming.push(
        buildTask({
          id: "task-all-clear",
          title: "No outstanding tasks",
          detail: "We will notify you when new consent requests arrive."
        })
      );
    }

    return {
      donor: {
        userId: user.userId,
        name: user.name,
        bloodType: user.bloodType
      },
      metrics,
      timeline: timeline
        .sort((a, b) => (b.sortKey ?? 0) - (a.sortKey ?? 0))
        .map(({ sortKey, ...item }) => item),
      upcoming
    };
  } catch (error) {
    console.error(`Failed to build donor dashboard snapshot for ${userId}`, error);
    return { metrics: [], timeline: [], upcoming: [] };
  }
}
