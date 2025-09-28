export const config = {
  mongodbUri: process.env.MONGODB_URI || "",
  mongodbDbName: process.env.MONGODB_DB_NAME || "bive",
  demo: {
    donorId: process.env.DEMO_DONOR_ID || "user-donor-001",
    organizationId: process.env.DEMO_ORGANIZATION_ID || "org-sunrise"
  }
};

export function assertConfig() {
  if (!config.mongodbUri) {
    throw new Error(
      "Missing MONGODB_URI. Please set it in .env.local based on the provided cluster connection string."
    );
  }
}
