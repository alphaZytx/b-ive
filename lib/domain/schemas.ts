import { z } from "zod";

export const bloodTypeSchema = z.enum([
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-"
]);

export const bloodComponentSchema = z.enum([
  "whole_blood",
  "packed_rbc",
  "plasma",
  "platelets",
  "cryoprecipitate"
]);

const objectIdLike = z.string().min(1, "id is required");

export const donationInputSchema = z.object({
  donorId: objectIdLike,
  organizationId: objectIdLike,
  bloodType: bloodTypeSchema,
  component: bloodComponentSchema,
  credits: z.number().int().positive(),
  volumeMl: z.number().int().positive().optional(),
  collectedAt: z.coerce.date().optional(),
  notes: z.string().max(1000).optional()
});

export const consentRequestSchema = z.object({
  creditOwnerId: objectIdLike,
  beneficiaryId: objectIdLike,
  organizationId: objectIdLike,
  credits: z.number().int().positive(),
  expiresAt: z.coerce.date().optional(),
  context: z
    .object({
      requestedBloodType: bloodTypeSchema.optional(),
      reason: z.string().max(2000).optional(),
      clinicalNotes: z.string().max(2000).optional()
    })
    .partial()
    .optional()
});

export const consentDecisionSchema = z.object({
  actorId: objectIdLike,
  decision: z.enum(["approve", "decline"]),
  note: z.string().max(2000).optional()
});

export const emergencyOverrideSchema = z.object({
  beneficiaryId: objectIdLike,
  organizationId: objectIdLike,
  initiatedBy: objectIdLike,
  credits: z.number().int().positive(),
  justification: z.string().max(2000),
  repaymentPlan: z.string().max(2000).optional(),
  repaymentDueAt: z.coerce.date().optional(),
  debtCeilingCredits: z.number().int().positive()
});

export const exchangeProposalSchema = z.object({
  requestingOrgId: objectIdLike,
  offeringOrgId: objectIdLike,
  requested: z.object({
    bloodType: bloodTypeSchema,
    credits: z.number().int().positive()
  }),
  offered: z.object({
    bloodType: bloodTypeSchema,
    credits: z.number().int().positive()
  }),
  notes: z.string().max(2000).optional()
});

export type DonationInput = z.infer<typeof donationInputSchema>;
export type ConsentRequestInput = z.infer<typeof consentRequestSchema>;
export type ConsentDecisionInput = z.infer<typeof consentDecisionSchema>;
export type EmergencyOverrideInput = z.infer<typeof emergencyOverrideSchema>;
export type ExchangeProposalInput = z.infer<typeof exchangeProposalSchema>;
