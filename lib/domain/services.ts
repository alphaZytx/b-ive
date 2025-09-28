import { randomUUID } from "crypto";
import type { ClientSession, Db } from "mongodb";

import { getMongoClient } from "@/lib/db/mongodb";
import {
  consentDecisionSchema,
  consentRequestSchema,
  donationInputSchema,
  emergencyOverrideSchema,
  exchangeProposalSchema,
  type ConsentDecisionInput,
  type ConsentRequestInput,
  type DonationInput,
  type EmergencyOverrideInput,
  type ExchangeProposalInput
} from "./schemas";
import {
  ConflictError,
  DomainError,
  InsufficientCreditsError,
  NotFoundError
} from "./errors";

type CollectionMap = {
  users: ReturnType<Db["collection"]>;
  transactions: ReturnType<Db["collection"]>;
  consentRequests: ReturnType<Db["collection"]>;
  inventory: ReturnType<Db["collection"]>;
  emergencyCases: ReturnType<Db["collection"]>;
  exchanges: ReturnType<Db["collection"]>;
};

async function withCollections() {
  const client = await getMongoClient();
  const db = client.db("bive");
  const collections: CollectionMap = {
    users: db.collection("users"),
    transactions: db.collection("transactions"),
    consentRequests: db.collection("consentRequests"),
    inventory: db.collection("inventory"),
    emergencyCases: db.collection("emergencyCases"),
    exchanges: db.collection("exchanges")
  };

  return { db, collections };
}

async function runInTransaction<T>(handler: (deps: { db: Db; collections: CollectionMap; session: ClientSession }) => Promise<T>) {
  const client = await getMongoClient();
  const session = client.startSession();

  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      const deps = await withCollections();
      result = await handler({ ...deps, session });
    });
    if (typeof result === "undefined") {
      throw new DomainError("Transaction did not return a result");
    }
    return result;
  } finally {
    await session.endSession();
  }
}

export async function recordDonation(input: DonationInput) {
  const data = donationInputSchema.parse(input);
  const recordedAt = new Date();
  const collectedAt = data.collectedAt ?? recordedAt;

  return runInTransaction(async ({ collections, session }) => {
    const transactionId = randomUUID();

    const donationDoc = {
      _id: transactionId,
      type: "DONATION" as const,
      donorId: data.donorId,
      organizationId: data.organizationId,
      credits: data.credits,
      volumeMl: data.volumeMl ?? data.credits * 100,
      component: data.component,
      bloodType: data.bloodType,
      collectedAt,
      recordedAt,
      notes: data.notes ?? null
    };

    const donorUpdate = await collections.users.updateOne(
      { userId: data.donorId },
      {
        $inc: {
          "credits.balance": data.credits,
          "credits.totalEarned": data.credits
        },
        $push: {
          "credits.events": {
            type: "DONATION",
            credits: data.credits,
            organizationId: data.organizationId,
            transactionId,
            at: recordedAt
          }
        }
      },
      { session }
    );

    if (donorUpdate.matchedCount === 0) {
      throw new NotFoundError("Donor profile not found");
    }

    await collections.transactions.insertOne(donationDoc, { session });

    await collections.inventory.updateOne(
      { organizationId: data.organizationId, bloodType: data.bloodType },
      {
        $setOnInsert: {
          organizationId: data.organizationId,
          bloodType: data.bloodType,
          createdAt: recordedAt
        },
        $set: { updatedAt: recordedAt },
        $inc: {
          availableCredits: data.credits,
          totalDonatedCredits: data.credits
        },
        $push: {
          movements: {
            type: "DONATION",
            credits: data.credits,
            transactionId,
            at: recordedAt
          }
        }
      },
      { session, upsert: true }
    );

    return { transactionId };
  });
}

export async function createConsentRequest(input: ConsentRequestInput) {
  const data = consentRequestSchema.parse(input);
  const requestedAt = new Date();
  const requestId = randomUUID();

  const document = {
    _id: requestId,
    status: "PENDING" as const,
    ...data,
    context: data.context ?? {},
    requestedAt
  };

  const client = await getMongoClient();
  const db = client.db("bive");
  const { insertedId } = await db.collection("consentRequests").insertOne(document);

  return { requestId: insertedId.toString(), status: document.status, requestedAt };
}

export async function respondToConsentRequest(requestId: string, decisionInput: ConsentDecisionInput) {
  const decision = consentDecisionSchema.parse(decisionInput);

  return runInTransaction(async ({ collections, session }) => {
    const request = await collections.consentRequests.findOne({ _id: requestId }, { session });

    if (!request) {
      throw new NotFoundError("Consent request not found");
    }

    if (request.status !== "PENDING") {
      throw new ConflictError("Consent request already resolved");
    }

    const resolvedAt = new Date();
    const newStatus = decision.decision === "approve" ? "APPROVED" : "DECLINED";

    const update = await collections.consentRequests.findOneAndUpdate(
      { _id: requestId },
      {
        $set: {
          status: newStatus,
          decidedBy: decision.actorId,
          decisionNote: decision.note ?? null,
          decidedAt: resolvedAt
        }
      },
      { session, returnDocument: "after" }
    );

    if (!update.value) {
      throw new DomainError("Failed to update consent request");
    }

    if (newStatus === "APPROVED") {
      const owner = await collections.users.findOne({ userId: request.creditOwnerId }, { session });

      if (!owner) {
        throw new NotFoundError("Credit owner not found");
      }

      const currentBalance = owner.credits?.balance ?? 0;
      if (currentBalance < request.credits) {
        throw new InsufficientCreditsError("Insufficient credits for approval");
      }

      const transactionId = randomUUID();
      const recordedAt = resolvedAt;

      await collections.users.updateOne(
        { userId: request.creditOwnerId },
        {
          $inc: {
            "credits.balance": -request.credits,
            "credits.totalRedeemed": request.credits
          },
          $push: {
            "credits.events": {
              type: "REDEMPTION",
              credits: request.credits,
              organizationId: request.organizationId,
              transactionId,
              beneficiaryId: request.beneficiaryId,
              at: recordedAt
            }
          }
        },
        { session }
      );

      await collections.transactions.insertOne(
        {
          _id: transactionId,
          type: "REDEMPTION",
          creditOwnerId: request.creditOwnerId,
          beneficiaryId: request.beneficiaryId,
          organizationId: request.organizationId,
          credits: request.credits,
          consentRequestId: requestId,
          recordedAt
        },
        { session }
      );

      if (request.context?.requestedBloodType) {
        await collections.inventory.updateOne(
          { organizationId: request.organizationId, bloodType: request.context.requestedBloodType },
          {
            $set: { updatedAt: recordedAt },
            $inc: { availableCredits: -request.credits },
            $push: {
              movements: {
                type: "FULFILLMENT",
                credits: request.credits,
                consentRequestId: requestId,
                at: recordedAt
              }
            }
          },
          { session }
        );
      }
    }

    return { request: update.value };
  });
}

export async function applyEmergencyOverride(input: EmergencyOverrideInput) {
  const data = emergencyOverrideSchema.parse(input);
  const initiatedAt = new Date();

  return runInTransaction(async ({ collections, session }) => {
    const user = await collections.users.findOne({ userId: data.beneficiaryId }, { session });

    if (!user) {
      throw new NotFoundError("Beneficiary not found");
    }

    const currentBalance = user.credits?.balance ?? 0;
    if (currentBalance < 0) {
      throw new ConflictError("Beneficiary already has an outstanding emergency debt");
    }

    const projectedBalance = currentBalance - data.credits;
    if (Math.abs(projectedBalance) > data.debtCeilingCredits) {
      throw new ConflictError("Emergency request exceeds configured debt ceiling");
    }

    const transactionId = randomUUID();

    await collections.users.updateOne(
      { userId: data.beneficiaryId },
      {
        $inc: {
          "credits.balance": -data.credits,
          "credits.totalRedeemed": data.credits
        },
        $set: {
          "credits.emergency": {
            active: true,
            overrideId: transactionId,
            credits: data.credits,
            initiatedAt,
            organizationId: data.organizationId,
            justification: data.justification,
            repaymentPlan: data.repaymentPlan ?? null,
            repaymentDueAt: data.repaymentDueAt ?? null
          }
        },
        $push: {
          "credits.events": {
            type: "EMERGENCY_OVERRIDE",
            credits: data.credits,
            organizationId: data.organizationId,
            transactionId,
            at: initiatedAt
          }
        }
      },
      { session }
    );

    await collections.transactions.insertOne(
      {
        _id: transactionId,
        type: "EMERGENCY_OVERRIDE",
        beneficiaryId: data.beneficiaryId,
        organizationId: data.organizationId,
        initiatedBy: data.initiatedBy,
        credits: data.credits,
        justification: data.justification,
        repaymentPlan: data.repaymentPlan ?? null,
        repaymentDueAt: data.repaymentDueAt ?? null,
        recordedAt: initiatedAt
      },
      { session }
    );

    await collections.emergencyCases.insertOne(
      {
        _id: transactionId,
        beneficiaryId: data.beneficiaryId,
        organizationId: data.organizationId,
        initiatedBy: data.initiatedBy,
        credits: data.credits,
        status: "OUTSTANDING",
        justification: data.justification,
        repaymentPlan: data.repaymentPlan ?? null,
        repaymentDueAt: data.repaymentDueAt ?? null,
        createdAt: initiatedAt,
        updatedAt: initiatedAt
      },
      { session }
    );

    return { transactionId };
  });
}

export async function createExchangeProposal(input: ExchangeProposalInput) {
  const data = exchangeProposalSchema.parse(input);
  const proposedAt = new Date();
  const exchangeId = randomUUID();

  const doc = {
    _id: exchangeId,
    status: "PENDING" as const,
    ...data,
    proposedAt
  };

  const client = await getMongoClient();
  const db = client.db("bive");
  await db.collection("exchanges").insertOne(doc);

  return { exchangeId, status: doc.status, proposedAt };
}

export async function getLedgerSummary(userId: string) {
  const client = await getMongoClient();
  const db = client.db("bive");

  const projection = {
    _id: 0,
    userId: 1,
    name: 1,
    bloodType: 1,
    "credits.balance": 1,
    "credits.totalEarned": 1,
    "credits.totalRedeemed": 1,
    "credits.emergency": 1
  };

  const user = await db.collection("users").findOne({ userId }, { projection });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const transactions = await db
    .collection("transactions")
    .find({ $or: [{ donorId: userId }, { creditOwnerId: userId }, { beneficiaryId: userId }] })
    .sort({ recordedAt: -1 })
    .limit(50)
    .toArray();

  return { user, recentTransactions: transactions };
}

export async function getInventoryForOrganization(organizationId: string) {
  const client = await getMongoClient();
  const db = client.db("bive");

  const inventory = await db
    .collection("inventory")
    .find({ organizationId })
    .project({ _id: 0, organizationId: 1, bloodType: 1, availableCredits: 1, updatedAt: 1 })
    .toArray();

  return { organizationId, inventory };
}
