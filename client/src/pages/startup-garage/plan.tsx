import { useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPlan, generate, listOutputs, listRuns } from "@/lib/startup-garage/api";
import { StartupGarageModuleKey } from "../../../../shared/contracts/startupGarage";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const MODULES: { key: typeof StartupGarageModuleKey._type; label: string }[] = [
  { key: "TEAM", label: "Customize Team" },
  { key: "WEBSITE_AUDIT", label: "Website Review & Audit" },
  { key: "GTM", label: "Go-To-Market Plan" },
  { key: "SOCIAL_PR", label: "Social + PR Plan" },
  { key: "POSTS_20", label: "20 Posts + Prompts" },
  { key: "CANVA_TEMPLATE", label: "Instagram Template Spec" },
  { key: "ACTION_30_60_90", label: "30/60/90 Action Plan" },
];

function safeJson(val: any) {
  try { return JSON.stringify(val, null, 2); } catch { return String(val); }
}

export default function StartupGaragePlanPage() {
  const params = useParams() as any;
  const planId = String(params.planId || "");

  const qc = useQueryClient();

  const planQ = useQuery({ queryKey: ["startupGarage", "plan", planId], queryFn: () => getPlan(planId), enabled: !!planId });
  const outputsQ = useQuery({ queryKey: ["startupGarage", "outputs", planId], queryFn: () => listOutputs(planId), enabled: !!planId });
  const runsQ = useQuery({ queryKey: ["startupGarage", "runs", planId], queryFn: () => listRuns(planId), enabled: !!planId });

  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MODULES.map((m) => [m.key, true]))
  );

  const selectedModules = useMemo(
    () => MODULES.filter((m) => selected[m.key]).map((m) => m.key),
    [selected]
  );

  const genM = useMutation({
    mutationFn: async () => generate(planId, { modules: selectedModules }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["startupGarage", "plan", planId] });
      await qc.invalidateQueries({ queryKey: ["startupGarage", "outputs", planId] });
      await qc.invalidateQueries({ queryKey: ["startupGarage", "runs", planId] });
    },
  });

  const plan = planQ.data?.plan;
  const outputs = outputsQ.data?.outputs || [];

  const outputByKey = useMemo(() => {
    const map: Record<string, any> = {};
    for (const o of outputs) map[o.moduleKey] = o;
    return map;
  }, [outputs]);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-semibold" data-testid="text-plan-title">{plan?.title || "Start-up Garage Plan"}</h1>
            {plan ? <Badge variant="secondary" data-testid="badge-plan-status">{plan.status}</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {plan ? `${plan.intake.companyName} · ${plan.intake.industry} · ${plan.intake.businessType}` : "Loading…"}
          </p>
        </div>

        <Link href="/startup-garage">
          <Button variant="outline" data-testid="button-back-to-plans">Back to plans</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate modules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            {MODULES.map((m) => (
              <div key={m.key} className="flex items-center gap-3 rounded-lg border p-3" data-testid={`module-checkbox-${m.key}`}>
                <Checkbox
                  checked={!!selected[m.key]}
                  onCheckedChange={(v) => setSelected((prev) => ({ ...prev, [m.key]: !!v }))}
                />
                <div className="flex items-center justify-between w-full gap-3">
                  <div className="font-medium">{m.label}</div>
                  <Badge variant="secondary">{m.key}</Badge>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button data-testid="button-generate" onClick={() => genM.mutate()} disabled={genM.isPending || selectedModules.length === 0}>
              {genM.isPending ? "Generating…" : "Generate selected"}
            </Button>
            {genM.isError ? <div className="text-sm text-destructive" data-testid="text-generate-error">{(genM.error as any)?.message}</div> : null}
            {genM.data?.runId ? <Badge variant="secondary" data-testid="badge-run-id">Run: {genM.data.runId}</Badge> : null}
          </div>

          <div className="text-xs text-muted-foreground">
            Runs: {runsQ.data?.runs?.length ?? 0} · Outputs saved per moduleKey (READY / ERROR).
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Outputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {outputsQ.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading outputs…</div>
          ) : outputs.length === 0 ? (
            <div className="text-sm text-muted-foreground" data-testid="text-no-outputs">No outputs yet. Generate modules to see results.</div>
          ) : (
            MODULES.map((m) => {
              const o = outputByKey[m.key];
              return (
                <div key={m.key} className="rounded-lg border p-4" data-testid={`output-card-${m.key}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="font-medium">{m.label}</div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{m.key}</Badge>
                      <Badge variant="secondary" data-testid={`badge-output-status-${m.key}`}>{o?.status ?? "—"}</Badge>
                      {o?.status === "READY" ? (
                        <Button size="sm" variant="outline" data-testid={`button-copy-${m.key}`} onClick={() => navigator.clipboard.writeText(safeJson(o.content))}>
                          Copy JSON
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {o?.status === "ERROR" ? (
                    <div className="mt-3 text-sm text-destructive" data-testid={`text-error-${m.key}`}>{o.errorMessage || "Module failed"}</div>
                  ) : o?.status === "READY" ? (
                    <pre className="mt-3 max-h-[520px] overflow-auto rounded-md bg-muted p-3 text-xs" data-testid={`output-content-${m.key}`}>
                      {safeJson(o.content)}
                    </pre>
                  ) : (
                    <div className="mt-3 text-sm text-muted-foreground">Not generated yet.</div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
