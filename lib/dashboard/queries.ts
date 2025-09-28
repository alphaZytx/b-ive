import { randomUUID } from "crypto";

import { getDatabase } from "@/lib/db/mongodb";
import { getLedgerSummary } from "@/lib/domain/services";

import type {
  AdminDashboardSnapshot,
  DonorDashboardSnapshot,
  GovernmentDashboardSnapshot,
  InventoryOverviewRow,
  InventoryRow,
  Metric,
  OrganizationDashboardSnapshot,
  RiskItem,
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
    const db = await getDatabase();

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

export async function getGovernmentDashboardSnapshot(): Promise<GovernmentDashboardSnapshot> {
  try {
    const db = await getDatabase();

    const organizations = db.collection("organizations");
    const users = db.collection("users");
    const transactions = db.collection("transactions");
    const emergencyCases = db.collection("emergencyCases");
    const exchanges = db.collection("exchanges");
    const inventoryCollection = db.collection("inventory");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      totalOrganizations,
      activeOrganizations,
      pendingOrganizations,
      registeredDonors,
      outstandingEmergencies,
      pendingExchanges,
      donationsToday,
      redemptionsToday
    ] = await Promise.all([
      organizations.countDocuments({}),
      organizations.countDocuments({ status: "active" }),
      organizations.countDocuments({ status: "pending" }),
      users.countDocuments({ roles: "donor" }),
      emergencyCases.countDocuments({ status: "OUTSTANDING" }),
      exchanges.countDocuments({ status: "PENDING" }),
      transactions.countDocuments({ type: "DONATION", recordedAt: { $gte: startOfDay } }),
      transactions.countDocuments({ type: "REDEMPTION", recordedAt: { $gte: startOfDay } })
    ]);

    const inventoryDocs = await inventoryCollection
      .aggregate([
        {
          $group: {
            _id: "$bloodType",
            totalCredits: { $sum: { $ifNull: ["$availableCredits", 0] } },
            organizations: { $addToSet: "$organizationId" }
          }
        },
        { $sort: { _id: 1 } }
      ])
      .toArray();

    const [recentEmergencies, recentExchanges, recentOrgEvents] = await Promise.all([
      emergencyCases.find({}).sort({ updatedAt: -1, createdAt: -1 }).limit(4).toArray(),
      exchanges.find({}).sort({ proposedAt: -1 }).limit(4).toArray(),
      organizations.find({}).sort({ verifiedAt: -1, submittedAt: -1 }).limit(4).toArray()
    ]);

    const inventory: InventoryOverviewRow[] = inventoryDocs.map((doc) => {
      const totalCredits = typeof doc.totalCredits === "number" ? doc.totalCredits : 0;
      const organizationCount = Array.isArray(doc.organizations) ? doc.organizations.length : 0;
      const lowStock = totalCredits < 10;

      return {
        bloodType: doc._id ?? "Unknown",
        totalCredits,
        organizations: organizationCount,
        lowStock
      };
    });

    const metrics: Metric[] = [
      buildMetric({
        label: "Verified organizations",
        value: `${activeOrganizations}`,
        change:
          pendingOrganizations > 0
            ? `${pendingOrganizations} awaiting verification`
            : `${totalOrganizations} total enrolled`,
        tone: pendingOrganizations > 0 ? "warning" : "positive"
      }),
      buildMetric({
        label: "Registered donors",
        value: `${registeredDonors}`,
        change:
          donationsToday + redemptionsToday > 0
            ? `${donationsToday} donations · ${redemptionsToday} redemptions today`
            : "No ledger movement today",
        tone: registeredDonors > 0 ? "positive" : "neutral"
      }),
      buildMetric({
        label: "Emergency overrides open",
        value: `${outstandingEmergencies}`,
        change:
          outstandingEmergencies > 0
            ? "Monitor repayment and follow-up"
            : "All emergency debt settled",
        tone: outstandingEmergencies > 0 ? "warning" : "positive"
      }),
      buildMetric({
        label: "Pending exchanges",
        value: `${pendingExchanges}`,
        change: pendingExchanges > 0 ? "Coordinate balancing deliveries" : "No pending swaps",
        tone: pendingExchanges > 0 ? "warning" : "neutral"
      })
    ];

    const timeline = [
      ...recentEmergencies.map((event) => {
        const updatedAt = safeDate(event.updatedAt) ?? safeDate(event.createdAt);
        const at = formatRelativeOrAbsolute(updatedAt);
        const status: TimelineItem["status"] = event.status === "OUTSTANDING" ? "warning" : "success";
        const title = event.status === "OUTSTANDING" ? "Emergency override active" : "Emergency resolved";
        const description = `${event.beneficiaryId ?? "beneficiary"} · ${event.credits ?? 0} credits via ${
          event.organizationId ?? "organization"
        }`;

        return buildTimelineItem({
          id: event._id?.toString() ?? randomUUID(),
          title,
          description,
          status,
          at,
          sortKey: updatedAt?.getTime()
        });
      }),
      ...recentExchanges.map((exchange) => {
        const proposedAt = safeDate(exchange.completedAt) ?? safeDate(exchange.proposedAt);
        const at = formatRelativeOrAbsolute(proposedAt);
        const status: TimelineItem["status"] = exchange.status === "COMPLETED" ? "success" : "info";
        const title = exchange.status === "COMPLETED" ? "Exchange completed" : "Exchange proposed";
        const description = `${exchange.requestingOrgId} ↔ ${exchange.offeringOrgId} (${exchange.requested?.bloodType ?? "?"}/${
          exchange.offered?.bloodType ?? "?"
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
      ...recentOrgEvents.map((org) => {
        const status = typeof org.status === "string" ? org.status : "unknown";
        const referenceDate = safeDate(org.verifiedAt) ?? safeDate(org.submittedAt);
        const at = formatRelativeOrAbsolute(referenceDate);
        const isPending = status === "pending";

        return buildTimelineItem({
          id: org.organizationId ?? randomUUID(),
          title: isPending ? "Organization awaiting approval" : "Organization verified",
          description: `${org.name ?? org.organizationId ?? "Organization"} · ${status}`,
          status: isPending ? "warning" : "success",
          at,
          sortKey: referenceDate?.getTime()
        });
      })
    ]
      .sort((a, b) => (b.sortKey ?? 0) - (a.sortKey ?? 0))
      .slice(0, 8)
      .map(({ sortKey, ...item }) => item);

    const risks: RiskItem[] = [];

    if (outstandingEmergencies > 0) {
      risks.push({
        id: "risk-emergency",
        title: "Outstanding emergency overrides",
        detail: `${outstandingEmergencies} cases require repayment tracking`,
        severity: "high"
      });
    }

    if (pendingOrganizations > 0) {
      risks.push({
        id: "risk-pending-orgs",
        title: "Organizations awaiting verification",
        detail: `${pendingOrganizations} onboarding checks still open`,
        severity: "medium"
      });
    }

    if (pendingExchanges > 0) {
      risks.push({
        id: "risk-pending-exchanges",
        title: "Credit exchanges awaiting action",
        detail: `${pendingExchanges} proposals pending counterpart review`,
        severity: "medium"
      });
    }

    inventory.forEach((row) => {
      if (row.lowStock) {
        risks.push({
          id: `risk-low-${row.bloodType}`,
          title: `${row.bloodType} credits running low`,
          detail: `${row.totalCredits} credits across ${row.organizations} org${row.organizations === 1 ? "" : "s"}`,
          severity: row.totalCredits <= 5 ? "high" : "medium"
        });
      }
    });

    if (risks.length === 0) {
      risks.push({
        id: "risk-all-clear",
        title: "No outstanding risks",
        detail: "All monitored indicators are within expected thresholds",
        severity: "low"
      });
    }

    return { metrics, timeline, risks, inventory };
  } catch (error) {
    console.error("Failed to build government dashboard snapshot", error);
    return { metrics: [], timeline: [], risks: [], inventory: [] };
  }
}

export async function getOrganizationDashboardSnapshot(
  organizationId: string
): Promise<OrganizationDashboardSnapshot> {
  try {
    const db = await getDatabase();

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
    const db = await getDatabase();

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
