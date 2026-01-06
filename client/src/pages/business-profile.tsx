import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

export default function BusinessProfile() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/profile/me");
        if (r.ok) setData(await r.json());
      } catch {
        // ignore
      }
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      toast({
        title: "Profile saved",
        description: "Your business profile has been updated.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save profile.",
        variant: "destructive",
      });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8 flex items-center justify-center">
        <div className="text-slate-300">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <button
          onClick={() => setLocation("/settings")}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-6 transition"
          data-testid="button-back-settings"
        >
          <ArrowLeft size={18} />
          Back to Settings
        </button>

        <h1 className="text-2xl font-semibold">Business Profile</h1>
        <p className="mt-2 text-slate-300">Edit your setup anytime. This keeps Gigster Coach grounded in your real context.</p>

        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block">
              <div className="text-sm font-medium text-slate-100">Preferred name</div>
              <input
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100"
                value={data?.userProfile?.preferredName ?? ""}
                onChange={(e) =>
                  setData((prev: any) => ({
                    ...prev,
                    userProfile: { ...(prev?.userProfile ?? {}), preferredName: e.target.value },
                  }))
                }
                data-testid="input-preferred-name"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-slate-100">Role</div>
              <input
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100"
                value={data?.userProfile?.role ?? ""}
                onChange={(e) =>
                  setData((prev: any) => ({
                    ...prev,
                    userProfile: { ...(prev?.userProfile ?? {}), role: e.target.value },
                  }))
                }
                data-testid="input-role"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block">
              <div className="text-sm font-medium text-slate-100">Business name</div>
              <input
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100"
                value={data?.businessProfile?.businessName ?? ""}
                onChange={(e) =>
                  setData((prev: any) => ({
                    ...prev,
                    businessProfile: { ...(prev?.businessProfile ?? {}), businessName: e.target.value },
                  }))
                }
                data-testid="input-business-name"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-slate-100">Industry</div>
              <input
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100"
                value={data?.businessProfile?.industry ?? ""}
                onChange={(e) =>
                  setData((prev: any) => ({
                    ...prev,
                    businessProfile: { ...(prev?.businessProfile ?? {}), industry: e.target.value },
                  }))
                }
                data-testid="input-industry"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block">
              <div className="text-sm font-medium text-slate-100">Business stage</div>
              <input
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100"
                value={data?.businessProfile?.businessStage ?? ""}
                onChange={(e) =>
                  setData((prev: any) => ({
                    ...prev,
                    businessProfile: { ...(prev?.businessProfile ?? {}), businessStage: e.target.value },
                  }))
                }
                data-testid="input-business-stage"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-slate-100">Entity type</div>
              <input
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100"
                value={data?.businessProfile?.entityType ?? ""}
                onChange={(e) =>
                  setData((prev: any) => ({
                    ...prev,
                    businessProfile: { ...(prev?.businessProfile ?? {}), entityType: e.target.value },
                  }))
                }
                data-testid="input-entity-type"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="block">
              <div className="text-sm font-medium text-slate-100">Team size</div>
              <input
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100"
                value={data?.businessProfile?.employeesRange ?? ""}
                onChange={(e) =>
                  setData((prev: any) => ({
                    ...prev,
                    businessProfile: { ...(prev?.businessProfile ?? {}), employeesRange: e.target.value },
                  }))
                }
                data-testid="input-team-size"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-slate-100">Pricing model</div>
              <input
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-slate-100"
                value={data?.businessProfile?.pricingModel ?? ""}
                onChange={(e) =>
                  setData((prev: any) => ({
                    ...prev,
                    businessProfile: { ...(prev?.businessProfile ?? {}), pricingModel: e.target.value },
                  }))
                }
                data-testid="input-pricing-model"
              />
            </label>
          </div>

          <div className="flex items-center gap-4 pt-4">
            <Button
              onClick={save}
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium"
              data-testid="button-save-profile"
            >
              {saving ? (
                "Saving…"
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Profile
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation("/onboarding-wizard")}
              className="border-slate-700 text-slate-200 hover:bg-slate-800/60"
              data-testid="button-run-wizard"
            >
              Run Setup Wizard Again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
