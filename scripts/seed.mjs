import { randomUUID } from "crypto";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "bive";

if (!uri) {
  console.error("Missing MONGODB_URI. Set it before running the seed script.");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 5000
});

const now = new Date();

const hoursAgo = (hours) => new Date(now.getTime() - hours * 60 * 60 * 1000);
const hoursFromNow = (hours) => new Date(now.getTime() + hours * 60 * 60 * 1000);

const donationTransactionId = "txn-donation-001";
const redemptionTransactionId = "txn-redemption-001";
const emergencyTransactionId = "txn-emergency-001";

const users = [
  {
    demoSeed: true,
    userId: "user-donor-001",
    name: "Ritu Sharma",
    roles: ["donor"],
    bloodType: "B+",
    contact: {
      email: "ritu.sharma@example.com",
      phone: "+91-90000-00001",
      city: "Delhi"
    },
    credits: {
      balance: 14,
      totalEarned: 24,
      totalRedeemed: 10,
      events: [
        {
          type: "DONATION",
          credits: 4,
          organizationId: "org-sunrise",
          transactionId: donationTransactionId,
          at: hoursAgo(24 * 7)
        },
        {
          type: "REDEMPTION",
          credits: 2,
          organizationId: "org-sunrise",
          beneficiaryId: "user-beneficiary-001",
          transactionId: redemptionTransactionId,
          at: hoursAgo(12)
        }
      ],
      emergency: { active: false }
    },
    eligibility: {
      lastDonationAt: hoursAgo(24 * 7),
      nextDonationAt: hoursFromNow(24 * 10)
    }
  },
  {
    demoSeed: true,
    userId: "user-beneficiary-001",
    name: "Arjun Patel",
    roles: ["recipient"],
    bloodType: "A+",
    contact: {
      email: "arjun.patel@example.com",
      phone: "+91-90000-00002",
      city: "Mumbai"
    },
    credits: {
      balance: 0,
      totalEarned: 0,
      totalRedeemed: 2,
      events: [
        {
          type: "REDEMPTION",
          credits: 2,
          organizationId: "org-sunrise",
          transactionId: redemptionTransactionId,
          at: hoursAgo(12)
        }
      ]
    }
  },
  {
    demoSeed: true,
    userId: "user-beneficiary-002",
    name: "Rahul Iyer",
    roles: ["recipient"],
    bloodType: "A+",
    contact: {
      email: "rahul.iyer@example.com",
      phone: "+91-90000-00004",
      city: "Pune"
    },
    credits: {
      balance: 0,
      totalEarned: 0,
      totalRedeemed: 0,
      events: []
    }
  },
  {
    demoSeed: true,
    userId: "user-beneficiary-urgent",
    name: "Neha Verma",
    roles: ["recipient"],
    bloodType: "O-",
    contact: {
      email: "neha.verma@example.com",
      phone: "+91-90000-00003",
      city: "Jaipur"
    },
    credits: {
      balance: -3,
      totalEarned: 0,
      totalRedeemed: 3,
      emergency: {
        active: true,
        overrideId: emergencyTransactionId,
        credits: 3,
        initiatedAt: hoursAgo(6),
        organizationId: "org-red-valley",
        justification: "Post-operative emergency transfusion",
        repaymentPlan: "Family to donate equivalent credits within 30 days",
        repaymentDueAt: hoursFromNow(24 * 20)
      },
      events: [
        {
          type: "EMERGENCY_OVERRIDE",
          credits: 3,
          organizationId: "org-red-valley",
          transactionId: emergencyTransactionId,
          at: hoursAgo(6)
        }
      ]
    }
  }
];

const organizations = [
  {
    demoSeed: true,
    organizationId: "org-sunrise",
    name: "Sunrise Hospital",
    city: "Delhi",
    status: "active",
    verifiedAt: hoursAgo(24 * 30),
    contact: {
      email: "ops@sunrise-hospital.example.com",
      phone: "+91-90000-10001"
    },
    compliance: {
      licenseNumber: "DL-2024-001",
      licenseExpiry: hoursFromNow(24 * 240)
    }
  },
  {
    demoSeed: true,
    organizationId: "org-red-valley",
    name: "Red Valley Hospital",
    city: "Jaipur",
    status: "active",
    verifiedAt: hoursAgo(24 * 20),
    contact: {
      email: "transfusion@redvalley.example.com",
      phone: "+91-90000-10002"
    }
  },
  {
    demoSeed: true,
    organizationId: "org-green-cross",
    name: "Green Cross Blood Center",
    city: "Lucknow",
    status: "pending",
    submittedAt: hoursAgo(24 * 2),
    contact: {
      email: "director@greencross.example.com",
      phone: "+91-90000-10003"
    }
  }
];

const transactions = [
  {
    _id: donationTransactionId,
    demoSeed: true,
    type: "DONATION",
    donorId: "user-donor-001",
    organizationId: "org-sunrise",
    credits: 4,
    volumeMl: 400,
    component: "whole_blood",
    bloodType: "B+",
    recordedAt: hoursAgo(24 * 7)
  },
  {
    _id: redemptionTransactionId,
    demoSeed: true,
    type: "REDEMPTION",
    creditOwnerId: "user-donor-001",
    beneficiaryId: "user-beneficiary-001",
    organizationId: "org-sunrise",
    credits: 2,
    consentRequestId: "req-1000",
    recordedAt: hoursAgo(12)
  },
  {
    _id: emergencyTransactionId,
    demoSeed: true,
    type: "EMERGENCY_OVERRIDE",
    beneficiaryId: "user-beneficiary-urgent",
    organizationId: "org-red-valley",
    initiatedBy: "admin-global",
    credits: 3,
    justification: "Post-operative emergency transfusion",
    repaymentPlan: "Family to replenish credits in 30 days",
    repaymentDueAt: hoursFromNow(24 * 20),
    recordedAt: hoursAgo(6)
  }
];

const inventory = [
  {
    demoSeed: true,
    organizationId: "org-sunrise",
    bloodType: "B+",
    availableCredits: 24,
    availableUnits: 12,
    totalDonatedCredits: 48,
    nextExpiryAt: hoursFromNow(24 * 2),
    movements: [
      {
        type: "DONATION",
        credits: 4,
        transactionId: donationTransactionId,
        at: hoursAgo(24 * 7)
      },
      {
        type: "FULFILLMENT",
        credits: 2,
        consentRequestId: "req-1000",
        at: hoursAgo(12)
      }
    ]
  },
  {
    demoSeed: true,
    organizationId: "org-sunrise",
    bloodType: "O-",
    availableCredits: 10,
    availableUnits: 5,
    totalDonatedCredits: 18,
    nextExpiryAt: hoursFromNow(24 * 5),
    movements: [
      {
        type: "DONATION",
        credits: 5,
        transactionId: randomUUID(),
        at: hoursAgo(24 * 3)
      }
    ]
  },
  {
    demoSeed: true,
    organizationId: "org-red-valley",
    bloodType: "O-",
    availableCredits: 6,
    availableUnits: 3,
    totalDonatedCredits: 20,
    nextExpiryAt: hoursFromNow(24),
    movements: [
      {
        type: "EMERGENCY_OVERRIDE",
        credits: 3,
        transactionId: emergencyTransactionId,
        at: hoursAgo(6)
      }
    ]
  }
];

const consentRequests = [
  {
    _id: "req-1000",
    demoSeed: true,
    status: "APPROVED",
    creditOwnerId: "user-donor-001",
    beneficiaryId: "user-beneficiary-001",
    organizationId: "org-sunrise",
    credits: 2,
    requestedAt: hoursAgo(18),
    decidedAt: hoursAgo(12),
    decidedBy: "user-donor-001",
    context: {
      requestedBloodType: "A+",
      reason: "Planned surgery"
    }
  },
  {
    _id: "req-1001",
    demoSeed: true,
    status: "PENDING",
    creditOwnerId: "user-donor-001",
    beneficiaryId: "user-beneficiary-002",
    organizationId: "org-sunrise",
    credits: 2,
    requestedAt: hoursAgo(1),
    expiresAt: hoursFromNow(3),
    context: {
      requestedBloodType: "A+",
      reason: "Platelet support",
      clinicalNotes: "Urgent oncology procedure"
    }
  }
];

const emergencyCases = [
  {
    _id: emergencyTransactionId,
    demoSeed: true,
    beneficiaryId: "user-beneficiary-urgent",
    organizationId: "org-red-valley",
    initiatedBy: "admin-global",
    credits: 3,
    status: "OUTSTANDING",
    justification: "Post-operative emergency transfusion",
    repaymentPlan: "Family to replenish credits in 30 days",
    repaymentDueAt: hoursFromNow(24 * 20),
    createdAt: hoursAgo(6),
    updatedAt: hoursAgo(6)
  }
];

const exchanges = [
  {
    _id: "ex-2001",
    demoSeed: true,
    requestingOrgId: "org-sunrise",
    offeringOrgId: "org-red-valley",
    requested: {
      bloodType: "O-",
      credits: 2
    },
    offered: {
      bloodType: "A+",
      credits: 3
    },
    status: "PENDING",
    proposedAt: hoursAgo(4),
    notes: "Balance differential once transport confirmed"
  },
  {
    _id: "ex-2002",
    demoSeed: true,
    requestingOrgId: "org-red-valley",
    offeringOrgId: "org-sunrise",
    requested: {
      bloodType: "B+",
      credits: 2
    },
    offered: {
      bloodType: "O-",
      credits: 2
    },
    status: "COMPLETED",
    proposedAt: hoursAgo(48),
    completedAt: hoursAgo(30)
  }
];

async function seed() {
  await client.connect();
  const db = client.db(dbName);

  await Promise.all([
    db.collection("users").createIndex({ userId: 1 }, { unique: true }),
    db.collection("organizations").createIndex({ organizationId: 1 }, { unique: true }),
    db.collection("transactions").createIndex({ recordedAt: -1 }),
    db.collection("consentRequests").createIndex({ status: 1, requestedAt: -1 }),
    db.collection("inventory").createIndex({ organizationId: 1, bloodType: 1 }, { unique: true })
  ]);

  await Promise.all([
    db.collection("users").deleteMany({ demoSeed: true }),
    db.collection("organizations").deleteMany({ demoSeed: true }),
    db.collection("transactions").deleteMany({ demoSeed: true }),
    db.collection("consentRequests").deleteMany({ demoSeed: true }),
    db.collection("inventory").deleteMany({ demoSeed: true }),
    db.collection("emergencyCases").deleteMany({ demoSeed: true }),
    db.collection("exchanges").deleteMany({ demoSeed: true })
  ]);

  await db.collection("users").insertMany(users);
  await db.collection("organizations").insertMany(organizations);
  await db.collection("transactions").insertMany(transactions);
  await db.collection("inventory").insertMany(inventory);
  await db.collection("consentRequests").insertMany(consentRequests);
  await db.collection("emergencyCases").insertMany(emergencyCases);
  await db.collection("exchanges").insertMany(exchanges);

  console.log("Seed data loaded successfully.");
  console.log("  Users:", users.length);
  console.log("  Organizations:", organizations.length);
  console.log("  Transactions:", transactions.length);
  console.log("  Consent requests:", consentRequests.length);
  console.log("  Emergency cases:", emergencyCases.length);
  console.log("  Exchanges:", exchanges.length);
}

seed()
  .catch((error) => {
    console.error("Failed to seed MongoDB:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.close();
  });
