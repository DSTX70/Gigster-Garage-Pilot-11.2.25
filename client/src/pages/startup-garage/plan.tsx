import { useMemo, useState } from "react";
import { useParams, Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPlan, generate, listOutputs, listRuns, intakeAudit, updateIntake, actionPlanToTasks } from "@/lib/startup-garage/api";
import { StartupGarageModuleKey } from "../../../../shared/contracts/startupGarage";
import { ModuleOutputRenderer } from "./module-renderer";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  FileDown, FileText, AlertTriangle, CheckCircle, Info, Plus, Trash2, ListTodo, ClipboardCheck
} from "lucide-react";

const MODULES: { key: typeof StartupGarageModuleKey._type; label: string }[] = [
  { key: "TEAM", label: "Customize Team" },
  { key: "WEBSITE_AUDIT", label: "Website Review & Audit" },
  { key: "GTM", label: "Go-To-Market Plan" },
  { key: "SOCIAL_PR", label: "Social + PR Plan" },
  { key: "POSTS_20", label: "20 Posts + Prompts" },
  { key: "CANVA_TEMPLATE", label: "Instagram Template Spec" },
  { key: "ACTION_30_60_90", label: "30/60/90 Action Plan" },
];

function PersonaEditor({ personas, onChange }: { personas: any[]; onChange: (v: any[]) => void }) {
  function addPersona() {
    onChange([...personas, { name: "", goals: [], pains: [], objections: [], channels: [] }]);
  }
  function removePersona(i: number) {
    onChange(personas.filter((_, idx) => idx !== i));
  }
  function updatePersona(i: number, field: string, value: any) {
    const updated = [...personas];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Target Personas</Label>
        <Button variant="outline" size="sm" onClick={addPersona} data-testid="button-add-persona"><Plus className="h-3 w-3 mr-1" /> Add</Button>
      </div>
      {personas.map((p, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Persona {i + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => removePersona(i)}><Trash2 className="h-3 w-3" /></Button>
          </div>
          <Input placeholder="Name / Label" value={p.name || ""} onChange={(e) => updatePersona(i, "name", e.target.value)} data-testid={`input-persona-name-${i}`} />
          <Input placeholder="Age range" value={p.ageRange || ""} onChange={(e) => updatePersona(i, "ageRange", e.target.value)} />
          <Input placeholder="Job role / title" value={p.jobRole || ""} onChange={(e) => updatePersona(i, "jobRole", e.target.value)} />
          <Input placeholder="Goals (comma-separated)" value={(p.goals || []).join(", ")} onChange={(e) => updatePersona(i, "goals", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} />
          <Input placeholder="Pain points (comma-separated)" value={(p.pains || []).join(", ")} onChange={(e) => updatePersona(i, "pains", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} />
          <Input placeholder="Buying triggers" value={p.buyingTriggers || ""} onChange={(e) => updatePersona(i, "buyingTriggers", e.target.value)} />
        </div>
      ))}
    </div>
  );
}

function CompetitorEditor({ competitors, onChange }: { competitors: any[]; onChange: (v: any[]) => void }) {
  function addCompetitor() {
    onChange([...competitors, { name: "", strengths: [], weaknesses: [] }]);
  }
  function removeCompetitor(i: number) {
    onChange(competitors.filter((_, idx) => idx !== i));
  }
  function updateCompetitor(i: number, field: string, value: any) {
    const updated = [...competitors];
    updated[i] = { ...updated[i], [field]: value };
    onChange(updated);
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Competitors</Label>
        <Button variant="outline" size="sm" onClick={addCompetitor} data-testid="button-add-competitor"><Plus className="h-3 w-3 mr-1" /> Add</Button>
      </div>
      {competitors.map((c, i) => (
        <div key={i} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Competitor {i + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => removeCompetitor(i)}><Trash2 className="h-3 w-3" /></Button>
          </div>
          <Input placeholder="Name" value={c.name || ""} onChange={(e) => updateCompetitor(i, "name", e.target.value)} data-testid={`input-competitor-name-${i}`} />
          <Input placeholder="Website URL" value={c.url || ""} onChange={(e) => updateCompetitor(i, "url", e.target.value)} />
          <Input placeholder="Social handle" value={c.socialHandle || ""} onChange={(e) => updateCompetitor(i, "socialHandle", e.target.value)} />
          <Input placeholder="Strengths (comma-separated)" value={(c.strengths || []).join(", ")} onChange={(e) => updateCompetitor(i, "strengths", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} />
          <Input placeholder="Weaknesses (comma-separated)" value={(c.weaknesses || []).join(", ")} onChange={(e) => updateCompetitor(i, "weaknesses", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} />
        </div>
      ))}
    </div>
  );
}

function OfferEditor({ offer, onChange }: { offer: any; onChange: (v: any) => void }) {
  const topOffers = offer?.topOffers ?? [];
  function addOffer() {
    onChange({ ...offer, topOffers: [...topOffers, { name: "", price: "", notes: "" }] });
  }
  function removeOffer(i: number) {
    onChange({ ...offer, topOffers: topOffers.filter((_: any, idx: number) => idx !== i) });
  }
  function updateOffer(i: number, field: string, value: any) {
    const updated = [...topOffers];
    updated[i] = { ...updated[i], [field]: value };
    onChange({ ...offer, topOffers: updated });
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Products / Services</Label>
        <Button variant="outline" size="sm" onClick={addOffer} data-testid="button-add-offer"><Plus className="h-3 w-3 mr-1" /> Add</Button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Offer Type</Label>
          <Select value={offer?.offerType || "SERVICES"} onValueChange={(v) => onChange({ ...offer, offerType: v })}>
            <SelectTrigger data-testid="select-offer-type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PRODUCTS">Products</SelectItem>
              <SelectItem value="SERVICES">Services</SelectItem>
              <SelectItem value="BOTH">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Pricing Model</Label>
          <Select value={offer?.pricingModel || "ONE_TIME"} onValueChange={(v) => onChange({ ...offer, pricingModel: v })}>
            <SelectTrigger data-testid="select-pricing-model"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ONE_TIME">One-time</SelectItem>
              <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
              <SelectItem value="EVENT_BASED">Event-based</SelectItem>
              <SelectItem value="QUOTE_BASED">Quote-based</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {topOffers.map((o: any, i: number) => (
        <div key={i} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Offer {i + 1}</span>
            <Button variant="ghost" size="sm" onClick={() => removeOffer(i)}><Trash2 className="h-3 w-3" /></Button>
          </div>
          <Input placeholder="Name" value={o.name || ""} onChange={(e) => updateOffer(i, "name", e.target.value)} data-testid={`input-offer-name-${i}`} />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Price" value={o.price || ""} onChange={(e) => updateOffer(i, "price", e.target.value)} />
            <Input placeholder="Margin" value={o.margin || ""} onChange={(e) => updateOffer(i, "margin", e.target.value)} />
          </div>
          <Input placeholder="Delivery method" value={o.deliveryMethod || ""} onChange={(e) => updateOffer(i, "deliveryMethod", e.target.value)} />
        </div>
      ))}
    </div>
  );
}

export default function StartupGaragePlanPage() {
  const params = useParams() as any;
  const planId = String(params.planId || "");
  const { toast } = useToast();
  const qc = useQueryClient();

  const planQ = useQuery({ queryKey: ["startupGarage", "plan", planId], queryFn: () => getPlan(planId), enabled: !!planId });
  const outputsQ = useQuery({ queryKey: ["startupGarage", "outputs", planId], queryFn: () => listOutputs(planId), enabled: !!planId });
  const runsQ = useQuery({ queryKey: ["startupGarage", "runs", planId], queryFn: () => listRuns(planId), enabled: !!planId });
  const auditQ = useQuery({ queryKey: ["startupGarage", "audit", planId], queryFn: () => intakeAudit(planId), enabled: !!planId });

  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MODULES.map((m) => [m.key, true]))
  );

  const selectedModules = useMemo(
    () => MODULES.filter((m) => selected[m.key]).map((m) => m.key),
    [selected]
  );

  const plan = planQ.data?.plan;
  const intake = plan?.intake;
  const outputs = outputsQ.data?.outputs || [];
  const hasReadyOutputs = outputs.some((o: any) => o.status === "READY");
  const audit = auditQ.data;

  const [intakeForm, setIntakeForm] = useState<any>(null);

  const currentIntake = intakeForm ?? intake;

  function initIntakeForm() {
    if (!intakeForm && intake) {
      setIntakeForm(JSON.parse(JSON.stringify(intake)));
    }
  }

  function updateField(path: string, value: any) {
    initIntakeForm();
    setIntakeForm((prev: any) => {
      const copy = JSON.parse(JSON.stringify(prev || intake || {}));
      const parts = path.split(".");
      let obj = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
      return copy;
    });
  }

  const saveIntakeM = useMutation({
    mutationFn: async () => {
      if (!intakeForm) throw new Error("No changes to save");
      return updateIntake(planId, { patch: intakeForm, backfillCoreIntake: true });
    },
    onSuccess: () => {
      toast({ title: "Intake saved" });
      setIntakeForm(null);
      qc.invalidateQueries({ queryKey: ["startupGarage", "plan", planId] });
      qc.invalidateQueries({ queryKey: ["startupGarage", "audit", planId] });
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err?.message, variant: "destructive" });
    },
  });

  const genM = useMutation({
    mutationFn: async () => generate(planId, { modules: selectedModules }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["startupGarage", "plan", planId] });
      await qc.invalidateQueries({ queryKey: ["startupGarage", "outputs", planId] });
      await qc.invalidateQueries({ queryKey: ["startupGarage", "runs", planId] });
    },
  });

  const toTasksM = useMutation({
    mutationFn: async () => actionPlanToTasks(planId, { assignToSelf: true, priorityDefault: "medium" }),
    onSuccess: (data) => {
      toast({ title: "Tasks created!", description: `${data.createdTaskIds.length} tasks added to your task list.` });
      qc.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (err: any) => {
      toast({ title: "Failed to create tasks", description: err?.message, variant: "destructive" });
    },
  });

  const outputByKey = useMemo(() => {
    const map: Record<string, any> = {};
    for (const o of outputs) map[o.moduleKey] = o;
    return map;
  }, [outputs]);

  function downloadFile(format: "pdf" | "docx") {
    const url = `/api/startup-garage/plans/${planId}/export/${format}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-semibold" data-testid="text-plan-title">{plan?.title || "Start-up Garage Plan"}</h1>
            {plan ? <Badge variant="secondary" data-testid="badge-plan-status">{plan.status}</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {plan ? `${intake?.companyName} · ${intake?.industry} · ${intake?.businessType}` : "Loading…"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasReadyOutputs && (
            <>
              <Button variant="outline" size="sm" data-testid="button-download-pdf" onClick={() => downloadFile("pdf")}>
                <FileDown className="h-4 w-4 mr-1" /> PDF
              </Button>
              <Button variant="outline" size="sm" data-testid="button-download-docx" onClick={() => downloadFile("docx")}>
                <FileText className="h-4 w-4 mr-1" /> Word
              </Button>
            </>
          )}
          <Link href="/startup-garage">
            <Button variant="outline" data-testid="button-back-to-plans">Back to plans</Button>
          </Link>
        </div>
      </div>

      {audit && (audit.missingRequired.length > 0 || audit.missingRecommended.length > 0) && (
        <Card className="border-amber-300 dark:border-amber-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> Intake Audit</CardTitle>
            <CardDescription>Items that will improve your generated outputs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {audit.missingRequired.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-sm">Required for best results ({audit.missingRequired.length})</span>
                </div>
                <div className="space-y-2">
                  {audit.missingRequired.map((item, i) => (
                    <div key={i} className="border-l-2 border-destructive pl-3 py-1" data-testid={`audit-required-${item.key}`}>
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.whyItMatters}</div>
                      {item.exampleAnswer && <div className="text-xs text-muted-foreground italic mt-0.5">Example: {item.exampleAnswer}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {audit.missingRecommended.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4 text-amber-500" />
                  <span className="font-medium text-sm">Recommended ({audit.missingRecommended.length})</span>
                </div>
                <div className="space-y-2">
                  {audit.missingRecommended.map((item, i) => (
                    <div key={i} className="border-l-2 border-amber-400 pl-3 py-1" data-testid={`audit-recommended-${item.key}`}>
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground">{item.whyItMatters}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Intake Details (v2)</CardTitle>
          <CardDescription>Add deeper information to improve the quality of generated outputs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Company Name</Label>
              <Input value={currentIntake?.companyName || ""} onChange={(e) => updateField("companyName", e.target.value)} data-testid="input-company-name" />
            </div>
            <div>
              <Label className="text-xs">Website URL</Label>
              <Input value={currentIntake?.websiteUrl || ""} onChange={(e) => updateField("websiteUrl", e.target.value)} data-testid="input-website-url" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Business Description</Label>
            <Textarea rows={3} value={currentIntake?.businessDescription || ""} onChange={(e) => updateField("businessDescription", e.target.value)} data-testid="input-business-description" />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Industry</Label>
              <Input value={currentIntake?.industry || ""} onChange={(e) => updateField("industry", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Business Type</Label>
              <Input value={currentIntake?.businessType || ""} onChange={(e) => updateField("businessType", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Stage</Label>
              <Input value={currentIntake?.stage || ""} onChange={(e) => updateField("stage", e.target.value)} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Primary Goals (comma-separated)</Label>
            <Input value={(currentIntake?.primaryGoals || []).join(", ")} onChange={(e) => updateField("primaryGoals", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} data-testid="input-primary-goals" />
          </div>

          <Separator />

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Primary Market</Label>
              <Select value={currentIntake?.geography?.primaryMarket || "PHX_METRO"} onValueChange={(v) => updateField("geography.primaryMarket", v)}>
                <SelectTrigger data-testid="select-primary-market"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHX_METRO">Phoenix Metro</SelectItem>
                  <SelectItem value="AZ">Arizona</SelectItem>
                  <SelectItem value="NATIONAL">National</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Target Areas (comma-separated)</Label>
              <Input value={(currentIntake?.geography?.targetAreas || []).join(", ")} onChange={(e) => updateField("geography.targetAreas", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} />
            </div>
          </div>

          <Separator />

          <OfferEditor offer={currentIntake?.offer || {}} onChange={(v) => updateField("offer", v)} />

          <Separator />

          <PersonaEditor personas={currentIntake?.personas || []} onChange={(v) => updateField("personas", v)} />

          <Separator />

          <CompetitorEditor competitors={currentIntake?.competitors || []} onChange={(v) => updateField("competitors", v)} />

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Social Handles</Label>
            <div className="grid md:grid-cols-3 gap-3">
              {["instagram", "tiktok", "facebook", "pinterest", "linkedin", "youtube"].map((platform) => (
                <div key={platform}>
                  <Label className="text-xs capitalize">{platform}</Label>
                  <Input placeholder={`@handle`} value={(currentIntake?.socialHandles as any)?.[platform] || ""} onChange={(e) => updateField(`socialHandles.${platform}`, e.target.value)} data-testid={`input-social-${platform}`} />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs">Social/PR Mode</Label>
              <Select value={currentIntake?.socialPrMode || "BOTH"} onValueChange={(v) => updateField("socialPrMode", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOCAL">Local</SelectItem>
                  <SelectItem value="NATIONAL">National</SelectItem>
                  <SelectItem value="BOTH">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Posting Capacity</Label>
              <Select value={currentIntake?.postingCapacity || "MED"} onValueChange={(v) => updateField("postingCapacity", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MED">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Website Conversion Goal</Label>
              <Select value={currentIntake?.websiteGoals?.primaryConversionGoal || "LEADS"} onValueChange={(v) => updateField("websiteGoals.primaryConversionGoal", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LEADS">Leads</SelectItem>
                  <SelectItem value="BOOKINGS">Bookings</SelectItem>
                  <SelectItem value="SALES">Sales</SelectItem>
                  <SelectItem value="INQUIRIES">Inquiries</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Brand Assets</Label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={currentIntake?.brandAssets?.logoProvided || false} onCheckedChange={(v) => updateField("brandAssets.logoProvided", !!v)} />
                Logo provided
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={currentIntake?.brandAssets?.collateralProvided || false} onCheckedChange={(v) => updateField("brandAssets.collateralProvided", !!v)} />
                Collateral provided
              </label>
            </div>
            <div>
              <Label className="text-xs">Brand Vibe Words (comma-separated)</Label>
              <Input value={(currentIntake?.brandAssets?.brandVibeWords || []).join(", ")} onChange={(e) => updateField("brandAssets.brandVibeWords", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))} data-testid="input-brand-vibe" />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button data-testid="button-save-intake" onClick={() => saveIntakeM.mutate()} disabled={saveIntakeM.isPending || !intakeForm}>
              {saveIntakeM.isPending ? "Saving…" : "Save Intake"}
            </Button>
            {intakeForm && <span className="text-xs text-amber-600">Unsaved changes</span>}
            {saveIntakeM.isError && <span className="text-xs text-destructive">{(saveIntakeM.error as any)?.message}</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate Modules</CardTitle>
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
          <div className="flex items-center justify-between">
            <CardTitle>Outputs</CardTitle>
            {hasReadyOutputs && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" data-testid="button-download-pdf-bottom" onClick={() => downloadFile("pdf")}>
                  <FileDown className="h-4 w-4 mr-1" /> Download PDF
                </Button>
                <Button variant="outline" size="sm" data-testid="button-download-docx-bottom" onClick={() => downloadFile("docx")}>
                  <FileText className="h-4 w-4 mr-1" /> Download Word
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {outputsQ.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading outputs…</div>
          ) : outputs.length === 0 ? (
            <div className="text-sm text-muted-foreground" data-testid="text-no-outputs">No outputs yet. Generate modules to see results.</div>
          ) : (
            MODULES.map((m) => {
              const o = outputByKey[m.key];
              if (!o) return null;
              return (
                <div key={m.key} className="rounded-lg border p-4" data-testid={`output-card-${m.key}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                    <div className="font-semibold text-lg">{m.label}</div>
                    <div className="flex items-center gap-2">
                      {m.key === "ACTION_30_60_90" && o.status === "READY" && (
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid="button-add-to-tasks"
                          onClick={() => toTasksM.mutate()}
                          disabled={toTasksM.isPending}
                        >
                          <ListTodo className="h-4 w-4 mr-1" />
                          {toTasksM.isPending ? "Adding…" : "Add to Tasks"}
                        </Button>
                      )}
                      <Badge variant={o.status === "READY" ? "default" : o.status === "ERROR" ? "destructive" : "secondary"} data-testid={`badge-output-status-${m.key}`}>
                        {o.status}
                      </Badge>
                    </div>
                  </div>

                  {m.key === "ACTION_30_60_90" && toTasksM.isSuccess && (
                    <div className="mb-3 flex items-center gap-2 text-sm text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      {toTasksM.data?.createdTaskIds.length} tasks created (30d: {toTasksM.data?.counts.days30}, 60d: {toTasksM.data?.counts.days60}, 90d: {toTasksM.data?.counts.days90})
                    </div>
                  )}

                  {o.status === "ERROR" ? (
                    <div className="text-sm text-destructive" data-testid={`text-error-${m.key}`}>{o.errorMessage || "Module failed"}</div>
                  ) : o.status === "READY" ? (
                    <div data-testid={`output-content-${m.key}`}>
                      <ModuleOutputRenderer moduleKey={m.key} content={o.content} />
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Generating…</div>
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
