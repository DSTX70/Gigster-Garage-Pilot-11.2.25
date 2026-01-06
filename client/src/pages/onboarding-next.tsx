import { useLocation } from "wouter";
import { CheckCircle, ArrowRight, Palette } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

type ProfileResponse = {
  onboarding: {
    completedAt?: string | null;
    brandSetupCompleted?: boolean;
  } | null;
};

export default function OnboardingNext() {
  const [, setLocation] = useLocation();

  const { data } = useQuery<ProfileResponse>({
    queryKey: ["/api/profile/me"],
    staleTime: 1000 * 60 * 5,
  });

  const brandDone = data?.onboarding?.brandSetupCompleted ?? false;

  const steps = [
    { key: "quick", label: "Quick Setup", done: true },
    { key: "brand", label: "Brand Identity", done: brandDone },
    { key: "tools", label: "Connect Tools", done: false, optional: true },
    { key: "actions", label: "First Actions", done: false, optional: true },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 md:p-12 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold">
            Nice — your workspace is personalized.
          </h1>
          <p className="mt-3 text-slate-300">
            Two quick steps will make everything look and feel like{" "}
            <span className="text-emerald-400">your</span> business.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <button
              onClick={() => setLocation("/settings/brand")}
              className="w-full rounded-xl bg-emerald-500 px-5 py-3 font-medium text-slate-950 hover:bg-emerald-400 transition flex items-center justify-center gap-2"
              data-testid="button-brand-setup"
            >
              <Palette className="h-5 w-5" />
              Continue Setup: Brand Identity
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={() => setLocation("/")}
              className="w-full rounded-xl border border-slate-700 px-5 py-3 text-slate-200 hover:bg-slate-800/60 transition"
              data-testid="button-go-dashboard"
            >
              Go to Dashboard
            </button>
          </div>

          <p className="mt-6 text-xs text-slate-400">
            You can skip anything and come back later.
          </p>

          <div className="mt-10 border-t border-slate-800 pt-6">
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-4">
              Setup Progress
            </p>
            <div className="flex flex-col gap-2 text-left">
              {steps.map((s) => (
                <div key={s.key} className="flex items-center gap-3">
                  {s.done ? (
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-slate-600" />
                  )}
                  <span className={s.done ? "text-slate-100" : "text-slate-400"}>
                    {s.label}
                    {s.optional && (
                      <span className="ml-2 text-xs text-slate-500">(optional)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
