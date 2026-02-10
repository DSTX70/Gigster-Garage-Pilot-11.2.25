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

export const MarketFocus = z.enum(["PHX_METRO", "AZ", "NATIONAL"]);
export type MarketFocus = z.infer<typeof MarketFocus>;

export const OfferType = z.enum(["PRODUCTS", "SERVICES", "BOTH"]);
export type OfferType = z.infer<typeof OfferType>;

export const PricingModel = z.enum(["ONE_TIME", "SUBSCRIPTION", "EVENT_BASED", "QUOTE_BASED"]);
export type PricingModel = z.infer<typeof PricingModel>;

export const PostingCapacity = z.enum(["LOW", "MED", "HIGH"]);
export type PostingCapacity = z.infer<typeof PostingCapacity>;

export const StartupGaragePersona = z.object({
  name: z.string().min(1).max(80),
  ageRange: z.string().optional(),
  incomeRange: z.string().optional(),
  jobRole: z.string().optional(),
  goals: z.array(z.string()).default([]),
  pains: z.array(z.string()).default([]),
  buyingTriggers: z.string().optional(),
  objections: z.array(z.string()).default([]),
  channels: z.array(z.string()).default([]),
  localness: z.string().optional(),
  notes: z.string().optional(),
});

export const StartupGarageCompetitor = z.object({
  name: z.string().min(1).max(120),
  url: z.string().url().optional(),
  socialHandle: z.string().optional(),
  pricingSignals: z.string().optional(),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const StartupGarageVendor = z.object({
  category: z.string().min(1).max(120),
  name: z.string().min(1).max(160),
  url: z.string().url().optional(),
  costNotes: z.string().optional(),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const StartupGarageSocialHandles = z.object({
  instagram: z.string().optional(),
  tiktok: z.string().optional(),
  facebook: z.string().optional(),
  pinterest: z.string().optional(),
  linkedin: z.string().optional(),
  youtube: z.string().optional(),
}).default({});

export const StartupGarageBrandAssets = z.object({
  logoProvided: z.boolean().default(false),
  collateralProvided: z.boolean().default(false),
  logoUploadHint: z.string().optional(),
  collateralUploadHint: z.string().optional(),
  brandVibeWords: z.array(z.string()).default([]),
}).default({ logoProvided: false, collateralProvided: false, brandVibeWords: [] });

export const StartupGarageOffer = z.object({
  offerType: OfferType.default("SERVICES"),
  pricingModel: PricingModel.default("ONE_TIME"),
  topOffers: z.array(
    z.object({
      name: z.string().min(1).max(160),
      price: z.string().optional(),
      margin: z.string().optional(),
      deliveryMethod: z.string().optional(),
      notes: z.string().optional(),
    })
  ).default([]),
}).default({ offerType: "SERVICES", pricingModel: "ONE_TIME", topOffers: [] });

export const StartupGarageGeography = z.object({
  primaryMarket: MarketFocus.default("PHX_METRO"),
  targetAreas: z.array(z.string()).default([]),
  serviceRadiusMiles: z.number().int().positive().optional(),
}).default({ primaryMarket: "PHX_METRO", targetAreas: [] });

export const StartupGarageWebsiteGoals = z.object({
  primaryConversionGoal: z.enum(["LEADS", "BOOKINGS", "SALES", "INQUIRIES"]).default("LEADS"),
  secondaryGoals: z.array(z.string()).default([]),
}).default({ primaryConversionGoal: "LEADS", secondaryGoals: [] });

export const StartupGarageOps = z.object({
  capacityConstraints: z.object({
    weeklyHours: z.number().int().positive().optional(),
    maxEventsPerMonth: z.number().int().positive().optional(),
    staffCount: z.number().int().positive().optional(),
  }).default({}),
  tools: z.object({
    crm: z.string().optional(),
    booking: z.string().optional(),
    emailMarketing: z.string().optional(),
  }).default({}),
}).default({ capacityConstraints: {}, tools: {} });

export const StartupGarageVendorsAndSourcing = z.object({
  vendorCategoriesNeeded: z.array(z.string()).default([]),
  currentVendors: z.array(StartupGarageVendor).default([]),
  constraints: z.object({
    budgetBand: z.string().optional(),
    localPreferred: z.boolean().optional(),
    leadTime: z.string().optional(),
    moq: z.string().optional(),
  }).default({}),
}).default({ vendorCategoriesNeeded: [], currentVendors: [], constraints: {} });

export const StartupGarageIntake = z.object({
  companyName: z.string().min(1).max(120),
  websiteUrl: z.string().optional().or(z.literal("")).transform(v => (v ? v : undefined)),
  industry: z.string().min(1).max(120),
  businessType: z.string().min(1).max(120),
  businessDescription: z.string().min(1).max(6000),

  stage: z.string().optional(),
  primaryGoals: z.array(z.string()).default([]),

  geography: StartupGarageGeography,
  offer: StartupGarageOffer,

  targetSegments: z.array(z.string()).default([]),
  personas: z.array(StartupGaragePersona).default([]),

  competitors: z.array(StartupGarageCompetitor).default([]),
  vendorsAndSourcing: StartupGarageVendorsAndSourcing,

  websiteGoals: StartupGarageWebsiteGoals,

  brandAssets: StartupGarageBrandAssets,
  socialHandles: StartupGarageSocialHandles,
  postingCapacity: PostingCapacity.default("MED"),
  socialPrMode: SocialPrMode.default("BOTH"),
});

export type StartupGarageIntake = z.infer<typeof StartupGarageIntake>;

export const StartupGarageMissingItem = z.object({
  key: z.string(),
  label: z.string(),
  whyItMatters: z.string(),
  exampleAnswer: z.string().optional(),
});

export const StartupGarageIntakeAuditResponse = z.object({
  missingRequired: z.array(StartupGarageMissingItem).default([]),
  missingRecommended: z.array(StartupGarageMissingItem).default([]),
  inferredFromProfile: z.array(z.object({
    key: z.string(),
    value: z.any(),
    source: z.string(),
  })).default([]),
});

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
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
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

export const CreateStartupGaragePlanRequest = z.object({ intake: StartupGarageIntake });
export const CreateStartupGaragePlanResponse = z.object({ planId: z.string() });

export const UpdateStartupGaragePlanIntakeRequest = z.object({
  patch: StartupGarageIntake.partial(),
  backfillCoreIntake: z.boolean().default(true),
});
export const UpdateStartupGaragePlanIntakeResponse = z.object({
  planId: z.string(),
  updated: z.boolean(),
});

export const GenerateStartupGarageOutputsRequest = z.object({
  modules: z.array(StartupGarageModuleKey).min(1),
});
export const GenerateStartupGarageOutputsResponse = z.object({
  runId: z.string(),
  outputs: z.array(StartupGarageOutput),
});

export const ListStartupGaragePlansResponse = z.object({
  plans: z.array(z.object({
    id: z.string(),
    title: z.string().optional().nullable(),
    companyName: z.string(),
    industry: z.string(),
    businessType: z.string(),
    status: StartupGaragePlanStatus,
    updatedAt: z.any(),
    createdAt: z.any(),
  })),
});

export const GetStartupGaragePlanResponse = z.object({
  plan: StartupGaragePlan,
});

export const GetStartupGarageOutputResponse = z.object({
  output: StartupGarageOutput,
});

export const ListStartupGarageOutputsResponse = z.object({ outputs: z.array(StartupGarageOutput) });
export const ListStartupGarageRunsResponse = z.object({
  runs: z.array(StartupGarageRun),
});

export const ActionPlanToTasksRequest = z.object({
  assignToSelf: z.boolean().default(true),
  priorityDefault: z.enum(["low","medium","high"]).default("medium"),
});
export const ActionPlanToTasksResponse = z.object({
  createdTaskIds: z.array(z.string()),
  counts: z.object({ days30: z.number(), days60: z.number(), days90: z.number() }),
});
