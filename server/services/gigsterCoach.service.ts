// FILE: server/services/gigsterCoach.service.ts
import fs from "node:fs";
import path from "node:path";
import OpenAI from "openai";
import { CoachRequest, CoachResponse, coachContextToSummary } from "../../shared/contracts/gigsterCoach.js";
import { getPlanFeatures } from "../../shared/plans.js";

type UserSession = {
  id: string;
  role: "admin" | "user" | "tester" | null;
  plan?: "free" | "pro" | "enterprise" | null;
  featuresOverride?: Record<string, boolean | number> | null;
};

function loadPolicy() {
  try {
    const p = path.join(process.cwd(), "policy", "agent_exposure_policy.json");
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function isAgentExposed(policy: any, agentId: string) {
  if (!policy?.agents) return false;
  const agent = policy.agents.find((a: any) => a.id === agentId);
  return Boolean(agent);
}

function enforceAutonomy(policy: any, requested: "L0" | "L1") {
  if (requested === "L0") return { allowed: true, level: "L0" as const };
  const ok = policy?.autonomy_levels?.includes("L1") ?? false;
  return { allowed: ok, level: ok ? ("L1" as const) : ("L0" as const) };
}

export class GigsterCoachService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      console.warn("⚠️ GigsterCoach: OPENAI_API_KEY not set - coach features disabled");
    }
  }

  async run(user: UserSession, raw: unknown) {
    if (!this.openai) {
      throw Object.assign(new Error("GigsterCoach is not available - AI key not configured"), { status: 503 });
    }

    const req = CoachRequest.parse(raw);

    const plan = (user.plan ?? "free") as "free" | "pro" | "enterprise";
    const features = getPlanFeatures(plan, user.featuresOverride as any);

    if (!features.gigsterCoachBase) {
      throw Object.assign(new Error("GigsterCoach not enabled"), { status: 402, code: "PLAN_REQUIRED" });
    }
    if (req.intent === "ask" && !features.gigsterCoachAskExpert) {
      throw Object.assign(new Error("Ask-an-Expert requires plan upgrade"), { status: 402 });
    }
    if (req.intent === "suggest" && !features.gigsterCoachProactive) {
      throw Object.assign(new Error("Proactive coaching requires Pro"), { status: 402 });
    }

    const policy = loadPolicy();
    const policyAgentOk = isAgentExposed(policy, "agent.planner") || isAgentExposed(policy, "agent.ledger");
    const autonomy = enforceAutonomy(policy, req.requestedAutonomy);
    const effectiveAutonomy = policyAgentOk && autonomy.allowed ? autonomy.level : "L0";

    const ctxSummary = req.coachContext ? coachContextToSummary(req.coachContext) : "";

    const isDeepDive = req.coachingMode === "deep";
    const isQuestionsPhase = isDeepDive && req.deepDivePhase !== "answer";
    const hasAnswers = req.clarifyingAnswers && req.clarifyingAnswers.length > 0;

    const system = [
      "You are GigsterCoach — a lightweight business coach for gig workers.",
      "You must obey these rules:",
      "- Never claim you sent messages, invoices, or posts.",
      "- Provide drafts and suggestions only; user must take final action.",
      isDeepDive && isQuestionsPhase
        ? "- DEEP DIVE MODE: First ask 2-3 focused clarifying questions to fully understand the user's situation before providing advice. Format as a numbered list."
        : "- QUICK ANSWER MODE: Provide direct, actionable guidance. Only ask a clarifying question if absolutely critical context is missing.",
      "- Return concise, actionable guidance with checklists when appropriate.",
      `- Effective autonomy: ${effectiveAutonomy} (L0 assist-only, L1 still human-in-loop).`,
      ctxSummary ? `User/Business Context (ground truth): ${ctxSummary}` : "",
      ctxSummary ? "When giving suggestions, explicitly reference the user's stage/industry when relevant (e.g., \"Since you're in Early traction…\")." : "",
      hasAnswers ? "- The user has answered your clarifying questions. Now provide comprehensive, tailored advice based on their answers." : "",
    ]
      .filter(Boolean)
      .join("\n");

    const clarifyingAnswersText = hasAnswers
      ? `\n\nUser's answers to clarifying questions:\n${req.clarifyingAnswers!.map((a, i) => `Q${i + 1}: ${a.question}\nA${i + 1}: ${a.answer}`).join("\n\n")}`
      : "";

    const userMsg = [
      `Intent: ${req.intent}`,
      `Coaching Mode: ${isDeepDive ? "Deep Dive" : "Quick Answer"}`,
      req.draftTarget ? `DraftTarget: ${req.draftTarget}` : "",
      req.contextRef ? `ContextRef: ${JSON.stringify(req.contextRef)}` : "",
      req.structuredFields ? `StructuredFields: ${JSON.stringify(req.structuredFields)}` : "",
      req.artifactText ? `ArtifactText:\n${req.artifactText}` : "",
      `Question:\n${req.question}`,
      clarifyingAnswersText,
    ]
      .filter(Boolean)
      .join("\n\n");

    const model = process.env.GIGSTERCOACH_MODEL ?? "gpt-4o-mini";

    const completion = await this.openai.chat.completions.create({
      model,
      temperature: 0.3,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userMsg },
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "No response.";
    const tokensUsed = completion.usage?.total_tokens ?? undefined;

    const suggestions: any[] = [];
    const checklist: any[] = [];

    if (req.intent === "review") {
      checklist.push(
        { id: "scope", label: "Scope is clear (deliverables + exclusions)", isComplete: false },
        { id: "timeline", label: "Timeline/milestones are stated", isComplete: false },
        { id: "payment", label: "Payment terms are explicit (due date/late fees)", isComplete: false },
        { id: "revisions", label: "Revision policy is included", isComplete: false }
      );
    }

    if (req.intent === "draft" && req.draftTarget === "invoice_terms") {
      suggestions.push({
        id: "terms-latefee",
        title: "Add a late fee clause",
        reason: "Reduces overdue risk and sets expectations.",
        severity: "info",
        actionType: "insert_text",
        payload: {
          type: "append_text",
          payload: {
            target: "invoice.terms",
            text: "\nLate fee: Payments past due may incur a late fee of X% per month (or $X) unless prohibited by law.\n",
          },
        },
      });
    }

    // v1.1: Add baseline business coach suggestions for suggest intent
    if (req.intent === "suggest") {
      suggestions.push(
        {
          id: "followup-cadence",
          title: "Create a 2-touch follow-up cadence for overdue invoices",
          reason: "Consistent follow-ups reduce late payments without sounding aggressive.",
          severity: "info",
          actionType: "open_next_step",
          payload: {
            type: "append_text",
            payload: { target: "invoice.notes", text: "\nFollowup sequence initiated." },
          },
        },
        {
          id: "package-offer",
          title: "Turn your most common request into a 3-tier package",
          reason: "Packages improve conversion and reduce custom-scoping time.",
          severity: "info",
          actionType: "open_next_step",
          payload: { next: "service_packaging_wizard" },
        },
        {
          id: "terms-revisions",
          title: "Add a revision limit to your proposal templates",
          reason: "Revision limits prevent scope creep and protect profitability.",
          severity: "warn",
          actionType: "insert_text",
          payload: {
            type: "append_text",
            payload: {
              target: "proposal.terms",
              text: "\nRevisions: Includes up to two revision rounds. Additional revisions billed at $X/hour.\n",
            },
          },
        }
      );
    }

    // For Deep Dive questions phase, mark as awaiting clarification
    const awaitingClarification = isDeepDive && isQuestionsPhase && !hasAnswers;

    const resp = CoachResponse.parse({
      answer: content,
      suggestions,
      checklist,
      model,
      tokensUsed,
      awaitingClarification: awaitingClarification || undefined,
    });

    return resp;
  }
}
