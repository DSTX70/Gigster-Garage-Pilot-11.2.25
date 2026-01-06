// FILE: shared/contracts/gigsterCoach.ts
import { z } from "zod";

export const CoachIntent = z.enum(["ask", "draft", "review", "suggest"]);
export type CoachIntent = z.infer<typeof CoachIntent>;

export const CoachContextRef = z.object({
  invoiceId: z.string().uuid().optional(),
  proposalId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
  bookingId: z.string().uuid().optional(),
  jobId: z.string().uuid().optional(),
  surface: z.enum(["hub", "invoice", "proposal", "contract", "message", "task", "other"]).default("hub"),
});

export type CoachContextRef = z.infer<typeof CoachContextRef>;

export const CoachDraftTarget = z.enum([
  "invoice_line_items",
  "invoice_terms",
  "proposal_outline",
  "proposal_scope",
  "contract_terms",
  "client_message",
  "service_description",
]);
export type CoachDraftTarget = z.infer<typeof CoachDraftTarget>;

export const CoachSuggestion = z.object({
  id: z.string(),
  title: z.string(),
  reason: z.string().optional(),
  severity: z.enum(["info", "warn", "critical"]).default("info"),
  actionType: z.enum(["insert_text", "add_checklist_item", "open_next_step", "none"]).default("none"),
  payload: z.record(z.any()).optional(),
});

export type CoachSuggestion = z.infer<typeof CoachSuggestion>;

export const CoachChecklistItem = z.object({
  id: z.string(),
  label: z.string(),
  isComplete: z.boolean().default(false),
  helpText: z.string().optional(),
});

export type CoachChecklistItem = z.infer<typeof CoachChecklistItem>;

export const CoachRequest = z.object({
  intent: CoachIntent,
  question: z.string().min(1).max(4000),
  draftTarget: CoachDraftTarget.optional(),
  artifactText: z.string().max(20000).optional(),
  structuredFields: z.record(z.any()).optional(),
  contextRef: CoachContextRef.optional(),
  requestedAutonomy: z.enum(["L0", "L1"]).default("L0"),
  coachContext: z.lazy(() => GigsterCoachContextSchema).optional(),
});

export type CoachRequest = z.infer<typeof CoachRequest>;

export const CoachResponse = z.object({
  answer: z.string(),
  suggestions: z.array(CoachSuggestion).default([]),
  checklist: z.array(CoachChecklistItem).default([]),
  model: z.string().optional(),
  tokensUsed: z.number().int().nonnegative().optional(),
});

export type CoachResponse = z.infer<typeof CoachResponse>;

export const CoachHistoryItem = z.object({
  id: z.string(),
  createdAt: z.string(),
  intent: CoachIntent,
  question: z.string(),
  answer: z.string(),
  contextRef: CoachContextRef.nullable().optional(),
  model: z.string().nullable().optional(),
  tokensUsed: z.number().int().nullable().optional(),
});

export type CoachHistoryItem = z.infer<typeof CoachHistoryItem>;

// v1.1 - Suggestions Inbox
export const SuggestionStatus = z.enum(["open", "applied", "dismissed"]);
export type SuggestionStatus = z.infer<typeof SuggestionStatus>;

export const CoachSuggestionRecord = z.object({
  id: z.string(),
  userId: z.string(),
  status: SuggestionStatus,
  sourceIntent: CoachIntent,
  title: z.string(),
  reason: z.string().nullable().optional(),
  severity: z.enum(["info", "warn", "critical"]).default("info"),
  actionType: z.enum(["insert_text", "add_checklist_item", "open_next_step", "none"]).default("none"),
  payload: z.record(z.any()).nullable().optional(),
  contextRef: CoachContextRef.nullable().optional(),
  createdAt: z.string(),
  appliedAt: z.string().nullable().optional(),
  dismissedAt: z.string().nullable().optional(),
});
export type CoachSuggestionRecord = z.infer<typeof CoachSuggestionRecord>;

export const GetSuggestionsQuery = z.object({
  status: SuggestionStatus.optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});
export type GetSuggestionsQuery = z.infer<typeof GetSuggestionsQuery>;

export const ApplySuggestionRequest = z.object({
  appliedPayload: z.record(z.any()).optional(),
});
export type ApplySuggestionRequest = z.infer<typeof ApplySuggestionRequest>;

export const ApplySuggestionResponse = z.object({
  ok: z.boolean(),
  id: z.string(),
  status: SuggestionStatus,
});
export type ApplySuggestionResponse = z.infer<typeof ApplySuggestionResponse>;

// Business stage type for Coach context
export type GigsterBusinessStage =
  | "Idea → planning (not launched yet)"
  | "Just launched (0–3 months)"
  | "Early traction (3–12 months)"
  | "Established (1–3 years)"
  | "Scaling (3+ years, hiring/growing)"
  | "Rebuilding / pivoting"
  | string;

// Zod schema for Coach context (permissive, optional fields)
export const GigsterCoachContextSchema = z
  .object({
    user: z
      .object({
        preferredName: z.string().nullable().optional(),
        role: z.string().nullable().optional(),
        primaryGoals: z.array(z.string()).optional(),
        timeAvailable: z.string().nullable().optional(),
        tonePreference: z.string().optional(),
        experienceLevel: z.string().optional(),
      })
      .optional()
      .default({}),
    business: z
      .object({
        businessName: z.string().nullable().optional(),
        industry: z.string().nullable().optional(),
        entityType: z.string().nullable().optional(),
        businessStage: z.string().nullable().optional(),
        employeesRange: z.string().nullable().optional(),
        offerings: z.array(z.string()).optional(),
        pricingModel: z.string().nullable().optional(),
        serviceArea: z.string().nullable().optional(),
        leadSources: z.array(z.string()).optional(),
        toolsUsed: z.array(z.string()).optional(),
        painPoints: z.array(z.string()).optional(),
        yearsInBusiness: z.string().nullable().optional(),
        revenueRange: z.string().nullable().optional(),
      })
      .optional()
      .default({}),
    signals: z
      .object({
        invoicesCreatedLast14d: z.number().int().nonnegative().optional(),
        clientsAddedLast14d: z.number().int().nonnegative().optional(),
        proposalsSentLast14d: z.number().int().nonnegative().optional(),
      })
      .optional(),
    flags: z
      .object({
        onboardingCompleted: z.boolean().optional(),
        personalizeUsingProfile: z.boolean().optional(),
      })
      .optional(),
  })
  .optional();

// Inferred type from Zod schema
export type GigsterCoachContext = z.infer<typeof GigsterCoachContextSchema>;

// Compact summary for prompt building
export function coachContextToSummary(ctx?: GigsterCoachContext): string {
  if (!ctx) return "";

  const u = ctx.user ?? {};
  const b = ctx.business ?? {};

  const parts: string[] = [];
  if (u.role) parts.push(`Role: ${u.role}`);
  if (b.businessStage) parts.push(`Stage: ${b.businessStage}`);
  if (b.industry) parts.push(`Industry: ${b.industry}`);
  if (b.entityType) parts.push(`Entity: ${b.entityType}`);
  if (b.employeesRange) parts.push(`Team: ${b.employeesRange}`);

  const offerings = Array.isArray(b.offerings) ? b.offerings : [];
  const leads = Array.isArray(b.leadSources) ? b.leadSources : [];
  const pains = Array.isArray(b.painPoints) ? b.painPoints : [];

  if (offerings.length) parts.push(`Offerings: ${offerings.slice(0, 6).join(", ")}`);
  if (leads.length) parts.push(`Lead sources: ${leads.slice(0, 6).join(", ")}`);
  if (pains.length) parts.push(`Pain points: ${pains.slice(0, 6).join(", ")}`);

  return parts.join(" | ");
}
