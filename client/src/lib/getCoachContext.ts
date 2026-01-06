import type { GigsterCoachContext } from "../../../shared/contracts/gigsterCoach";

type ProfileMeResponse = {
  userProfile: any | null;
  businessProfile: any | null;
  onboarding: {
    completedAt?: string | null;
    lastSeenStep?: number;
    personalizeUsingProfile?: boolean;
  } | null;
};

let _cache:
  | { ctx: GigsterCoachContext; fetchedAt: number }
  | null = null;

const TTL_MS = 2 * 60 * 1000; // 2 minutes

function safeArr(v: any): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}

function buildContext(me: ProfileMeResponse): GigsterCoachContext {
  const up = me.userProfile ?? {};
  const bp = me.businessProfile ?? {};
  const ob = me.onboarding ?? {};

  return {
    user: {
      preferredName: up.preferredName ?? null,
      role: up.role ?? null,
      primaryGoals: safeArr(up.primaryGoals),
      timeAvailable: up.timeAvailable ?? null,
      tonePreference: up.tonePreference ?? "reassuring",
      experienceLevel: up.experienceLevel ?? "new",
    },
    business: {
      businessName: bp.businessName ?? null,
      industry: bp.industry ?? null,
      entityType: bp.entityType ?? null,
      businessStage: bp.businessStage ?? null,
      employeesRange: bp.employeesRange ?? null,

      offerings: safeArr(bp.offerings),
      pricingModel: bp.pricingModel ?? null,
      serviceArea: bp.serviceArea ?? null,

      leadSources: safeArr(bp.leadSources),
      toolsUsed: safeArr(bp.toolsUsed),
      painPoints: safeArr(bp.painPoints),

      yearsInBusiness: bp.yearsInBusiness ?? null,
      revenueRange: bp.revenueRange ?? null,
    },
    signals: undefined,
    flags: {
      onboardingCompleted: Boolean(ob.completedAt),
      personalizeUsingProfile: ob.personalizeUsingProfile ?? true,
    },
  };
}

export async function getCoachContext(): Promise<GigsterCoachContext | undefined> {
  try {
    const now = Date.now();
    if (_cache && now - _cache.fetchedAt < TTL_MS) return _cache.ctx;

    const r = await fetch("/api/profile/me", { credentials: "include" });
    if (!r.ok) return undefined;

    const me = (await r.json()) as ProfileMeResponse;
    const ctx = buildContext(me);

    _cache = { ctx, fetchedAt: now };
    return ctx;
  } catch {
    return undefined;
  }
}
