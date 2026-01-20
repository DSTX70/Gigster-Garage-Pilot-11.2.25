import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";

type ProfileMeResponse = {
  userProfile: any | null;
  businessProfile: any | null;
  onboarding: { completedAt?: string | null; lastSeenStep?: number; personalizeUsingProfile?: boolean } | null;
};

const STORAGE_KEY = "gigster_onboarding_draft";

type OnboardingDraft = {
  step: number;
  preferredName: string;
  role: string;
  goals: string[];
  timeAvailable: string;
  businessName: string;
  industry: string;
  entityType: string;
  employeesRange: string;
  businessStage: string;
  revenueRange: string;
  yearsInBusiness: string;
  offerings: string[];
  pricingModel: string;
  serviceArea: string;
  leadSources: string[];
  toolsUsed: string[];
  painPoints: string[];
  personalizeUsingProfile: boolean;
  savedAt: number;
};

function saveToLocalStorage(draft: Partial<OnboardingDraft>) {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    const current = existing ? JSON.parse(existing) : {};
    const updated = { ...current, ...draft, savedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage might be unavailable
  }
}

function loadFromLocalStorage(): OnboardingDraft | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only use if saved within last 7 days
      if (parsed.savedAt && Date.now() - parsed.savedAt < 7 * 24 * 60 * 60 * 1000) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function clearLocalStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

const ROLE_OPTIONS = [
  "Gig worker / Freelancer",
  "Solo business owner",
  "Small business operator",
  "Creator / Artist",
  "Consultant",
  "Agency / Studio owner",
  "Nonprofit operator",
  "Other",
];

const GOAL_OPTIONS = [
  "Get organized (systems + workflow)",
  "Increase income (more clients / higher rates)",
  "Improve cash flow (invoicing + getting paid)",
  "Marketing consistency",
  "Tax readiness",
  "Reduce overwhelm (clear next steps)",
];

const TIME_OPTIONS = ["< 1 hr/week", "1–2 hrs/week", "3–5 hrs/week", "6–10 hrs/week", "10+ hrs/week"];

const INDUSTRY_OPTIONS = [
  "Professional services (consulting, coaching)",
  "Home services (cleaning, repair, landscaping)",
  "Health & wellness (trainer, massage, etc.)",
  "Creative (design, photo/video, music)",
  "E-commerce (online shop)",
  "Food & beverage",
  "Education / tutoring",
  "Tech / IT services",
  "Transportation / delivery",
  "Events / hospitality",
  "Real estate services",
  "Trades (electrical, plumbing)",
  "Retail (in-person)",
  "Nonprofit / community",
  "Other",
];

const ENTITY_OPTIONS = [
  "Sole proprietor",
  "LLC (single-member)",
  "LLC (multi-member)",
  "S-Corp",
  "C-Corp",
  "Partnership",
  "Nonprofit",
  "Not sure yet",
];

const STAGE_OPTIONS = [
  "Idea → planning (not launched yet)",
  "Just launched (0–3 months)",
  "Early traction (3–12 months)",
  "Established (1–3 years)",
  "Scaling (3+ years, hiring/growing)",
  "Rebuilding / pivoting",
];

const EMPLOYEE_OPTIONS = ["Just me", "2–5", "6–10", "11–25", "26–50", "50+"];

const OFFERING_OPTIONS = [
  "Services (hourly)",
  "Services (project-based)",
  "Retainers / subscriptions",
  "Digital products (templates, courses)",
  "Physical products",
  "Content creation / brand deals",
  "Commissions",
  "Events / workshops",
  "Membership community",
];

const PRICING_OPTIONS = ["Hourly", "Project-based", "Retainer", "Subscription", "Per-item", "Not sure yet"];

const SERVICE_AREA_OPTIONS = ["Local", "Remote", "Hybrid", "Multi-state", "International"];

const LEAD_SOURCE_OPTIONS = [
  "Referrals / word of mouth",
  "Instagram / TikTok",
  "LinkedIn",
  "Facebook groups",
  "Google search / SEO",
  "Ads",
  "Marketplaces (Upwork/Fiverr/etc.)",
  "Local networking",
  "Email list",
  "Website contact form",
  "Repeat clients",
];

const TOOL_OPTIONS = [
  "Google Workspace",
  "Microsoft 365",
  "Notion",
  "Trello",
  "Asana",
  "QuickBooks",
  "Wave",
  "Stripe",
  "PayPal",
  "Square",
  "Canva",
  "Calendly",
  "HoneyBook",
  "Dubsado",
  "Other",
];

const PAIN_OPTIONS = [
  "Finding consistent work",
  "Pricing my services",
  "Time management / scheduling",
  "Tracking income/expenses",
  "Invoicing and getting paid",
  "Client communication",
  "Contracts / scope creep",
  "Marketing content creation",
  "Taxes and compliance",
  "Hiring / delegation",
];

function ChipMulti({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <div className="text-sm font-medium text-slate-100">{label}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              className={[
                "rounded-full px-3 py-2 text-sm border transition",
                selected
                  ? "bg-emerald-500 text-slate-950 border-emerald-400"
                  : "bg-slate-900/40 text-slate-200 border-slate-700 hover:bg-slate-800/60",
              ].join(" ")}
              onClick={() => {
                if (selected) onChange(value.filter((x) => x !== opt));
                else onChange([...value, opt]);
              }}
              data-testid={`chip-${opt.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-100">{label}</div>
      <select
        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`select-${label.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Text({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="text-sm font-medium text-slate-100">{label}</div>
      <input
        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        data-testid={`input-${label.replace(/\s+/g, '-').toLowerCase()}`}
      />
    </label>
  );
}

export default function OnboardingWizard() {
  const [, setLocation] = useLocation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [savedStep, setSavedStep] = useState(1);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [lastSaveStatus, setLastSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [step, setStep] = useState(1);

  const [preferredName, setPreferredName] = useState("");
  const [role, setRole] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [timeAvailable, setTimeAvailable] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [entityType, setEntityType] = useState("");
  const [employeesRange, setEmployeesRange] = useState("Just me");

  const [businessStage, setBusinessStage] = useState("");
  const [revenueRange, setRevenueRange] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");

  const [offerings, setOfferings] = useState<string[]>([]);
  const [pricingModel, setPricingModel] = useState("");
  const [serviceArea, setServiceArea] = useState("");

  const [leadSources, setLeadSources] = useState<string[]>([]);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [painPoints, setPainPoints] = useState<string[]>([]);

  const [personalizeUsingProfile, setPersonalizeUsingProfile] = useState(true);

  // Keep session alive with periodic pings (every 20 seconds)
  useEffect(() => {
    const pingSession = async () => {
      try {
        const res = await fetch("/api/auth/user", { credentials: "include" });
        if (res.status === 401) {
          setSessionExpired(true);
        }
      } catch {
        // Network error - don't mark as expired yet
      }
    };

    // Initial ping
    pingSession();

    // Set up interval
    keepAliveRef.current = setInterval(pingSession, 20000);

    return () => {
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current);
      }
    };
  }, []);

  // Save to localStorage immediately on any change
  const saveLocalDraft = useCallback(() => {
    saveToLocalStorage({
      step,
      preferredName,
      role,
      goals,
      timeAvailable,
      businessName,
      industry,
      entityType,
      employeesRange,
      businessStage,
      revenueRange,
      yearsInBusiness,
      offerings,
      pricingModel,
      serviceArea,
      leadSources,
      toolsUsed,
      painPoints,
      personalizeUsingProfile,
    });
  }, [
    step, preferredName, role, goals, timeAvailable, businessName, industry,
    entityType, employeesRange, businessStage, revenueRange, yearsInBusiness,
    offerings, pricingModel, serviceArea, leadSources, toolsUsed, painPoints,
    personalizeUsingProfile,
  ]);

  // Save to localStorage on every change (immediate, not debounced)
  useEffect(() => {
    if (!loading) {
      saveLocalDraft();
    }
  }, [loading, saveLocalDraft]);

  const eta = useMemo(() => {
    const remaining = Math.max(0, 6 - step);
    if (remaining >= 4) return "About 3 minutes left";
    if (remaining >= 2) return "About 2 minutes left";
    return "About 1 minute left";
  }, [step]);

  useEffect(() => {
    (async () => {
      try {
        // First, check localStorage for any saved draft
        const localDraft = loadFromLocalStorage();

        const r = await fetch("/api/profile/me", { credentials: "include" });
        if (r.ok) {
          const j = (await r.json()) as ProfileMeResponse;
          const up = j.userProfile ?? {};
          const bp = j.businessProfile ?? {};
          const ob = j.onboarding ?? {};

          // Merge: prefer localStorage if it was saved more recently (within last hour)
          // and has more progress than server. Otherwise use server data.
          const localIsRecent = localDraft && localDraft.savedAt && 
            (Date.now() - localDraft.savedAt < 60 * 60 * 1000); // within last hour
          const localHasMoreProgress = localDraft && localDraft.step > (ob.lastSeenStep ?? 1);
          const useLocal = localIsRecent && localHasMoreProgress;

          setPreferredName(useLocal && localDraft.preferredName ? localDraft.preferredName : (up.preferredName ?? ""));
          setRole(useLocal && localDraft.role ? localDraft.role : (up.role ?? ""));
          setGoals(useLocal && localDraft.goals?.length ? localDraft.goals : (up.primaryGoals ?? []));
          setTimeAvailable(useLocal && localDraft.timeAvailable ? localDraft.timeAvailable : (up.timeAvailable ?? ""));

          setBusinessName(useLocal && localDraft.businessName ? localDraft.businessName : (bp.businessName ?? ""));
          setIndustry(useLocal && localDraft.industry ? localDraft.industry : (bp.industry ?? ""));
          setEntityType(useLocal && localDraft.entityType ? localDraft.entityType : (bp.entityType ?? ""));
          setEmployeesRange(useLocal && localDraft.employeesRange ? localDraft.employeesRange : (bp.employeesRange ?? "Just me"));

          setBusinessStage(useLocal && localDraft.businessStage ? localDraft.businessStage : (bp.businessStage ?? ""));
          setRevenueRange(useLocal && localDraft.revenueRange ? localDraft.revenueRange : (bp.revenueRange ?? ""));
          setYearsInBusiness(useLocal && localDraft.yearsInBusiness ? localDraft.yearsInBusiness : (bp.yearsInBusiness ?? ""));

          setOfferings(useLocal && localDraft.offerings?.length ? localDraft.offerings : (bp.offerings ?? []));
          setPricingModel(useLocal && localDraft.pricingModel ? localDraft.pricingModel : (bp.pricingModel ?? ""));
          setServiceArea(useLocal && localDraft.serviceArea ? localDraft.serviceArea : (bp.serviceArea ?? ""));

          setLeadSources(useLocal && localDraft.leadSources?.length ? localDraft.leadSources : (bp.leadSources ?? []));
          setToolsUsed(useLocal && localDraft.toolsUsed?.length ? localDraft.toolsUsed : (bp.toolsUsed ?? []));
          setPainPoints(useLocal && localDraft.painPoints?.length ? localDraft.painPoints : (bp.painPoints ?? []));

          setPersonalizeUsingProfile(localDraft?.personalizeUsingProfile ?? ob.personalizeUsingProfile ?? true);
          
          const serverStep = ob.lastSeenStep ?? 1;
          const localStep = localDraft?.step ?? 1;
          const lastStep = Math.max(serverStep, localStep);
          
          if (lastStep > 1) {
            setSavedStep(lastStep);
            setShowResumeBanner(true);
            setStep(1);
          } else {
            setStep(1);
          }
        } else if (r.status === 401) {
          // Session expired but we have local data
          if (localDraft) {
            setPreferredName(localDraft.preferredName ?? "");
            setRole(localDraft.role ?? "");
            setGoals(localDraft.goals ?? []);
            setTimeAvailable(localDraft.timeAvailable ?? "");
            setBusinessName(localDraft.businessName ?? "");
            setIndustry(localDraft.industry ?? "");
            setEntityType(localDraft.entityType ?? "");
            setEmployeesRange(localDraft.employeesRange ?? "Just me");
            setBusinessStage(localDraft.businessStage ?? "");
            setRevenueRange(localDraft.revenueRange ?? "");
            setYearsInBusiness(localDraft.yearsInBusiness ?? "");
            setOfferings(localDraft.offerings ?? []);
            setPricingModel(localDraft.pricingModel ?? "");
            setServiceArea(localDraft.serviceArea ?? "");
            setLeadSources(localDraft.leadSources ?? []);
            setToolsUsed(localDraft.toolsUsed ?? []);
            setPainPoints(localDraft.painPoints ?? []);
            setPersonalizeUsingProfile(localDraft.personalizeUsingProfile ?? true);
            if (localDraft.step > 1) {
              setSavedStep(localDraft.step);
              setShowResumeBanner(true);
            }
          }
          setSessionExpired(true);
        }
      } catch {
        // Network error - try to restore from localStorage
        const localDraft = loadFromLocalStorage();
        if (localDraft) {
          setPreferredName(localDraft.preferredName ?? "");
          setRole(localDraft.role ?? "");
          setGoals(localDraft.goals ?? []);
          setTimeAvailable(localDraft.timeAvailable ?? "");
          setBusinessName(localDraft.businessName ?? "");
          setIndustry(localDraft.industry ?? "");
          setEntityType(localDraft.entityType ?? "");
          setEmployeesRange(localDraft.employeesRange ?? "Just me");
          setBusinessStage(localDraft.businessStage ?? "");
          setRevenueRange(localDraft.revenueRange ?? "");
          setYearsInBusiness(localDraft.yearsInBusiness ?? "");
          setOfferings(localDraft.offerings ?? []);
          setPricingModel(localDraft.pricingModel ?? "");
          setServiceArea(localDraft.serviceArea ?? "");
          setLeadSources(localDraft.leadSources ?? []);
          setToolsUsed(localDraft.toolsUsed ?? []);
          setPainPoints(localDraft.painPoints ?? []);
          setPersonalizeUsingProfile(localDraft.personalizeUsingProfile ?? true);
          if (localDraft.step > 1) {
            setSavedStep(localDraft.step);
            setShowResumeBanner(true);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (loading || sessionExpired) return;
    const t = setTimeout(async () => {
      try {
        setSaving(true);
        setLastSaveStatus("saving");
        const res = await fetch("/api/profile/me", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            userProfile: {
              preferredName,
              role,
              primaryGoals: goals,
              timeAvailable,
              tonePreference: "reassuring",
            },
            businessProfile: {
              businessName,
              industry,
              entityType,
              businessStage,
              employeesRange,
              offerings,
              pricingModel,
              serviceArea,
              leadSources,
              toolsUsed,
              painPoints,
              revenueRange,
              yearsInBusiness,
            },
            onboarding: {
              lastSeenStep: step,
              personalizeUsingProfile,
            },
          }),
        });
        
        if (res.status === 401) {
          setSessionExpired(true);
          setLastSaveStatus("error");
        } else if (res.ok) {
          setLastSaveStatus("saved");
        } else {
          setLastSaveStatus("error");
        }
      } catch {
        // Network error - data is still saved locally
        setLastSaveStatus("error");
      } finally {
        setSaving(false);
      }
    }, 650);

    return () => clearTimeout(t);
  }, [
    loading,
    sessionExpired,
    step,
    preferredName,
    role,
    goals,
    timeAvailable,
    businessName,
    industry,
    entityType,
    employeesRange,
    businessStage,
    revenueRange,
    yearsInBusiness,
    offerings,
    pricingModel,
    serviceArea,
    leadSources,
    toolsUsed,
    painPoints,
    personalizeUsingProfile,
  ]);

  async function finish() {
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ personalizeUsingProfile }),
      });
      
      if (res.status === 401) {
        setSessionExpired(true);
        return;
      }
      
      // Clear localStorage on successful completion
      clearLocalStorage();
      setLocation("/onboarding/next");
    } catch {
      // If network error, still try to proceed
      setLocation("/onboarding/next");
    }
  }

  function handleReLogin() {
    // Save current state and redirect to login
    saveLocalDraft();
    window.location.href = "/login?next=" + encodeURIComponent("/onboarding-wizard");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-slate-300">Loading setup…</div>
      </div>
    );
  }

  const getSaveStatusText = () => {
    if (sessionExpired) return "Session expired - saved locally";
    if (lastSaveStatus === "saving" || saving) return "Saving…";
    if (lastSaveStatus === "error") return "Saved locally";
    return "Saved";
  };

  const getSaveStatusColor = () => {
    if (sessionExpired || lastSaveStatus === "error") return "text-amber-400";
    if (lastSaveStatus === "saving" || saving) return "text-slate-400";
    return "text-emerald-400";
  };

  const StepTitle = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-slate-300">
          Step {step} of 6 · {eta}
        </p>
        <p className={`text-xs ${getSaveStatusColor()}`}>{getSaveStatusText()}</p>
      </div>
      <h1 className="mt-3 text-2xl md:text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-slate-200">{subtitle}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        {sessionExpired && (
          <div className="mb-6 rounded-2xl border border-amber-600/50 bg-amber-950/40 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-medium text-amber-300">Session expired</p>
                <p className="text-sm text-slate-300 mt-1">
                  Don't worry — your progress is saved locally. Log back in to sync your data.
                </p>
              </div>
              <button
                className="rounded-xl bg-amber-500 px-4 py-2 font-medium text-slate-950 hover:bg-amber-400 transition whitespace-nowrap"
                onClick={handleReLogin}
                data-testid="button-relogin"
              >
                Log back in
              </button>
            </div>
          </div>
        )}
        {showResumeBanner && !sessionExpired && (
          <div className="mb-6 rounded-2xl border border-emerald-700/50 bg-emerald-950/40 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-medium text-emerald-300">Welcome back!</p>
                <p className="text-sm text-slate-300 mt-1">
                  You were on step {savedStep} of 6. Pick up where you left off, or start fresh.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  className="rounded-xl bg-emerald-500 px-4 py-2 font-medium text-slate-950 hover:bg-emerald-400 transition"
                  onClick={() => {
                    setStep(savedStep);
                    setShowResumeBanner(false);
                  }}
                  data-testid="button-resume"
                >
                  Continue where I left off
                </button>
                <button
                  className="rounded-xl border border-slate-600 px-4 py-2 text-slate-200 hover:bg-slate-800/60 transition"
                  onClick={() => setShowResumeBanner(false)}
                  data-testid="button-start-fresh"
                >
                  Start fresh
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 md:p-10">
          {step === 1 && (
            <div className="space-y-6">
              <StepTitle
                title="Let's personalize your workspace"
                subtitle="A few quick picks — then you'll get tailored next actions and coach suggestions."
              />
              <Text label="Preferred name (optional)" value={preferredName} onChange={setPreferredName} placeholder="e.g., Dustin" />
              <Select label="Which best describes you?" value={role} onChange={setRole} options={ROLE_OPTIONS} />
              <ChipMulti label="What would make this month a win?" value={goals} onChange={setGoals} options={GOAL_OPTIONS} />
              <Select label="Time you can realistically give this each week" value={timeAvailable} onChange={setTimeAvailable} options={TIME_OPTIONS} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <StepTitle title="Business basics" subtitle="Just enough context to make the tools smarter." />
              <Text label="Business name (optional)" value={businessName} onChange={setBusinessName} placeholder="You can change this anytime" />
              <Select label="Type of business" value={industry} onChange={setIndustry} options={INDUSTRY_OPTIONS} />
              <Select label="Business structure" value={entityType} onChange={setEntityType} options={ENTITY_OPTIONS} />
              <Select label="Team size" value={employeesRange} onChange={setEmployeesRange} options={EMPLOYEE_OPTIONS} />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <StepTitle title="Where are you today?" subtitle="This powers your startup vs established recommendations." />
              <Select label="Business stage" value={businessStage} onChange={setBusinessStage} options={STAGE_OPTIONS} />
              <Text label="Years in business (optional)" value={yearsInBusiness} onChange={setYearsInBusiness} placeholder='e.g., "6 months" or "2 years"' />
              <Text label="Revenue range (optional)" value={revenueRange} onChange={setRevenueRange} placeholder='e.g., "$0–$2k/mo", "Prefer not to say"' />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <StepTitle title="What do you sell?" subtitle="We'll tailor templates and next actions to how you earn." />
              <ChipMulti label="Products / services offered" value={offerings} onChange={setOfferings} options={OFFERING_OPTIONS} />
              <Select label="Pricing model" value={pricingModel} onChange={setPricingModel} options={PRICING_OPTIONS} />
              <Select label="Service area" value={serviceArea} onChange={setServiceArea} options={SERVICE_AREA_OPTIONS} />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <StepTitle title="Your workflow" subtitle="Tell us what's real so the 'Next Actions' feel immediately useful." />
              <ChipMulti label="Where do leads come from?" value={leadSources} onChange={setLeadSources} options={LEAD_SOURCE_OPTIONS} />
              <ChipMulti label="Tools you use today" value={toolsUsed} onChange={setToolsUsed} options={TOOL_OPTIONS} />
              <ChipMulti label="Biggest pain points" value={painPoints} onChange={setPainPoints} options={PAIN_OPTIONS} />
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <StepTitle title="Review + finish" subtitle="You can edit this anytime in Settings → Business Profile." />

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-200 space-y-2">
                <div><span className="text-slate-400">Role:</span> {role || "—"}</div>
                <div><span className="text-slate-400">Stage:</span> {businessStage || "—"}</div>
                <div><span className="text-slate-400">Industry:</span> {industry || "—"}</div>
                <div><span className="text-slate-400">Entity:</span> {entityType || "—"}</div>
                <div><span className="text-slate-400">Team:</span> {employeesRange || "—"}</div>
                <div><span className="text-slate-400">Offerings:</span> {offerings.length ? offerings.join(", ") : "—"}</div>
                <div><span className="text-slate-400">Pain points:</span> {painPoints.length ? painPoints.join(", ") : "—"}</div>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <input
                  type="checkbox"
                  checked={personalizeUsingProfile}
                  onChange={(e) => setPersonalizeUsingProfile(e.target.checked)}
                  data-testid="checkbox-personalize"
                />
                <div>
                  <div className="font-medium">Personalize suggestions using this profile</div>
                  <div className="text-sm text-slate-300">
                    This helps Gigster Coach stay grounded in your real context. You can turn this off anytime.
                  </div>
                </div>
              </label>

              <div className="rounded-xl bg-slate-900/40 border border-slate-800 p-4 text-sm text-slate-200">
                <div className="font-medium">Quick privacy note</div>
                <div className="text-slate-300 mt-1">
                  We use your answers to personalize your workspace. You're always in control — edit or delete your profile anytime.
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              className="rounded-xl border border-slate-700 px-4 py-2 text-slate-100 hover:bg-slate-800/60 transition"
              onClick={() => (step > 1 ? setStep(step - 1) : setLocation("/"))}
              data-testid="button-back"
            >
              {step > 1 ? "Back" : "Exit"}
            </button>

            {step < 6 ? (
              <button
                className="rounded-xl bg-emerald-500 px-5 py-2.5 font-medium text-slate-950 hover:bg-emerald-400 transition"
                onClick={() => setStep(step + 1)}
                data-testid="button-continue"
              >
                Continue
              </button>
            ) : (
              <button
                className="rounded-xl bg-emerald-500 px-5 py-2.5 font-medium text-slate-950 hover:bg-emerald-400 transition"
                onClick={finish}
                data-testid="button-finish"
              >
                Finish → Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
