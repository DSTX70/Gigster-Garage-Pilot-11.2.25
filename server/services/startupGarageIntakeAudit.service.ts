import type { StartupGarageIntake } from "../../shared/contracts/startupGarage.js";

type AuditItem = { key: string; label: string; whyItMatters: string; exampleAnswer?: string };

function isEmpty(v: any) {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return v.trim().length === 0;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === "object") return Object.keys(v).length === 0;
  return false;
}

export class StartupGarageIntakeAuditService {
  audit(intake: Partial<StartupGarageIntake>) {
    const missingRequired: AuditItem[] = [];
    const missingRecommended: AuditItem[] = [];

    if (isEmpty(intake.companyName)) missingRequired.push({
      key: "companyName", label: "Company name", whyItMatters: "Used in plan outputs, positioning, and templates."
    });
    if (isEmpty(intake.businessDescription)) missingRequired.push({
      key: "businessDescription", label: "Company description", whyItMatters: "Drives GTM, website copy deck, and persona creation.",
      exampleAnswer: "We provide … for … in Phoenix, specializing in …"
    });
    if (isEmpty(intake.offer?.topOffers)) missingRequired.push({
      key: "offer.topOffers", label: "Top products/services", whyItMatters: "Needed for pricing, messaging, website offer pages, and content pillars.",
      exampleAnswer: "1) … 2) … 3) …"
    });

    if ((intake.personas?.length ?? 0) < 2) missingRequired.push({
      key: "personas", label: "Target personas (min 2)", whyItMatters: "GTM + social strategy depends on specific buyers and triggers.",
      exampleAnswer: "Persona 1: … Persona 2: …"
    });

    if ((intake.competitors?.length ?? 0) < 3) missingRequired.push({
      key: "competitors", label: "Competitive set (min 3)", whyItMatters: "Needed for competitive landscape report + comparison grid + gaps."
    });

    if ((intake.vendorsAndSourcing?.vendorCategoriesNeeded?.length ?? 0) === 0) missingRecommended.push({
      key: "vendorsAndSourcing.vendorCategoriesNeeded", label: "Vendor categories needed", whyItMatters: "Enables vendor matrix (pros/cons + pricing comparisons).",
      exampleAnswer: "Packaging, flowers, printing, event permits…"
    });

    if (!isEmpty(intake.websiteUrl) && isEmpty(intake.websiteGoals?.primaryConversionGoal)) missingRecommended.push({
      key: "websiteGoals.primaryConversionGoal", label: "Website primary conversion goal", whyItMatters: "Audit recommendations depend on your conversion goal."
    });

    if (!intake.brandAssets?.logoProvided) missingRecommended.push({
      key: "brandAssets.logoProvided", label: "Upload logo (recommended)", whyItMatters: "Enables font/color extraction and on-brand templates."
    });
    if (!intake.brandAssets?.collateralProvided) missingRecommended.push({
      key: "brandAssets.collateralProvided", label: "Upload collateral (recommended)", whyItMatters: "Improves brand extraction + messaging consistency."
    });

    const handles = intake.socialHandles || {};
    if (isEmpty((handles as any).instagram) && isEmpty((handles as any).tiktok) && isEmpty((handles as any).facebook) && isEmpty((handles as any).linkedin)) {
      missingRecommended.push({
        key: "socialHandles", label: "Social handles", whyItMatters: "Helps align current presence + competitor comparisons and audit of existing content."
      });
    }

    return { missingRequired, missingRecommended, inferredFromProfile: [] as any[] };
  }
}
