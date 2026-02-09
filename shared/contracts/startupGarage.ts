import { z } from "zod";

export const StartupGarageModuleKey = z.enum([
  "TEAM",
  "WEBSITE_AUDIT",
  "GTM",
  "SOCIAL_PR",
  "POSTS_20",
  "CANVA_TEMPLATE",
  "ACTION_30_60_90",
]);
export type StartupGarageModuleKey = z.infer<typeof StartupGarageModuleKey>;

export const SocialPrMode = z.enum(["LOCAL", "NATIONAL", "BOTH"]);
export type SocialPrMode = z.infer<typeof SocialPrMode>;

export const StartupGaragePersona = z.object({
  name: z.string().min(1).max(80),
  ageRange: z.string().optional(),
  incomeRange: z.string().optional(),
  jobRole: z.string().optional(),
  goals: z.array(z.string()).default([]),
  pains: z.array(z.string()).default([]),
  buyingTriggers: z.string().optional(),
  channels: z.array(z.string()).default([]),
  localness: z.string().optional(),
  notes: z.string().optional(),
});

export const StartupGarageCompetitor = z.object({
  name: z.string().min(1).max(120),
  url: z.string().url().optional(),
  notes: z.string().optional(),
});

export const StartupGarageIntake = z.object({
  companyName: z.string().min(1).max(120),
  websiteUrl: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined)),
  industry: z.string().min(1).max(120),
  businessType: z.string().min(1).max(120),
  businessDescription: z.string().min(1).max(4000),

  stage: z.string().optional(),
  primaryGoals: z.array(z.string()).default([]),

  personas: z.array(StartupGaragePersona).default([]),
  competitors: z.array(StartupGarageCompetitor).default([]),

  socialPrMode: SocialPrMode.default("BOTH"),
});

export type StartupGarageIntake = z.infer<typeof StartupGarageIntake>;

export const StartupGaragePlanStatus = z.enum(["draft", "generating", "complete", "error"]);
export type StartupGaragePlanStatus = z.infer<typeof StartupGaragePlanStatus>;

export const StartupGaragePlan = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().optional().nullable(),
  status: StartupGaragePlanStatus,
  intake: StartupGarageIntake,
  createdAt: z.string().or(z.date() as any),
  updatedAt: z.string().or(z.date() as any),
});

export const StartupGarageOutputStatus = z.enum(["PENDING", "READY", "ERROR"]);
export type StartupGarageOutputStatus = z.infer<typeof StartupGarageOutputStatus>;

export const StartupGarageOutput = z.object({
  id: z.string(),
  planId: z.string(),
  moduleKey: StartupGarageModuleKey,
  status: StartupGarageOutputStatus,
  content: z.any().optional().nullable(),
  errorMessage: z.string().optional().nullable(),
  createdAt: z.string().or(z.date() as any).optional(),
  updatedAt: z.string().or(z.date() as any).optional(),
});

export const StartupGarageRunStatus = z.enum(["running", "completed", "failed"]);
export type StartupGarageRunStatus = z.infer<typeof StartupGarageRunStatus>;

export const StartupGarageRun = z.object({
  id: z.string(),
  planId: z.string(),
  requestedModules: z.array(StartupGarageModuleKey),
  modelInfo: z.any().optional().nullable(),
  status: StartupGarageRunStatus,
  startedAt: z.string().or(z.date() as any).optional(),
  finishedAt: z.string().or(z.date() as any).optional(),
});

export const CreateStartupGaragePlanRequest = z.object({
  intake: StartupGarageIntake,
});
export const CreateStartupGaragePlanResponse = z.object({
  planId: z.string(),
});

export const ListStartupGaragePlansResponse = z.object({
  plans: z.array(
    z.object({
      id: z.string(),
      title: z.string().optional().nullable(),
      companyName: z.string(),
      industry: z.string(),
      businessType: z.string(),
      status: StartupGaragePlanStatus,
      updatedAt: z.string().or(z.date() as any),
      createdAt: z.string().or(z.date() as any),
    })
  ),
});

export const GetStartupGaragePlanResponse = z.object({
  plan: StartupGaragePlan,
});

export const GenerateStartupGarageOutputsRequest = z.object({
  modules: z.array(StartupGarageModuleKey).min(1),
});
export const GenerateStartupGarageOutputsResponse = z.object({
  runId: z.string(),
  outputs: z.array(StartupGarageOutput),
});

export const ListStartupGarageOutputsResponse = z.object({
  outputs: z.array(StartupGarageOutput),
});
export const GetStartupGarageOutputResponse = z.object({
  output: StartupGarageOutput,
});

export const ListStartupGarageRunsResponse = z.object({
  runs: z.array(StartupGarageRun),
});
