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
  websiteUrl: z.string().url().optional().or(z.literal("")).transform(v => (v ? v : undefined)),
  industry: z.string().min(1).max(120),
  businessType: z.string().min(1).max(120),
  businessDescription: z.string().min(1).max(4000),

  stage: z.string().optional(),
  primaryGoals: z.array(z.string()).default([]),

  personas: z.array(StartupGaragePersona).default([]),

  competitors: z.array(StartupGarageCompetitor).default([]),

  socialPrMode: SocialPrMode.default("BOTH"),

  modules: z.array(StartupGarageModuleKey).min(1),
});

export type StartupGarageIntake = z.infer<typeof StartupGarageIntake>;

export const StartupGarageGenerateRequest = z.object({
  intake: StartupGarageIntake,
});

export const StartupGarageGenerateResponse = z.object({
  outputs: z.record(z.string(), z.any()),
});

export type StartupGarageGenerateRequest = z.infer<typeof StartupGarageGenerateRequest>;
export type StartupGarageGenerateResponse = z.infer<typeof StartupGarageGenerateResponse>;
