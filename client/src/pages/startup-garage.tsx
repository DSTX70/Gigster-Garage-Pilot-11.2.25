import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { StartupGarageGenerateResponse, StartupGarageModuleKey, SocialPrMode } from "../../../shared/contracts/startupGarage";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Outputs = z.infer<typeof StartupGarageGenerateResponse>["outputs"];

const MODULES: { key: z.infer<typeof StartupGarageModuleKey>; label: string; hint: string }[] = [
  { key: "TEAM", label: "Customize Team", hint: "Builds the specialized pod roster (industry + marketing + PR + sourcing)." },
  { key: "WEBSITE_AUDIT", label: "Website Review & Audit", hint: "Reviews URL and returns improvements + key takeaways." },
  { key: "GTM", label: "Go-To-Market Plan", hint: "Integrated GTM (personas, competitive landscape, pricing, vendors, channels)." },
  { key: "SOCIAL_PR", label: "Social + PR Plan", hint: "Local/National/Both media + platform strategy, paid ads, hashtags." },
  { key: "POSTS_20", label: "20 Posts + Prompts", hint: "20 post ideas with captions + imagery prompts for Agency Hub." },
  { key: "CANVA_TEMPLATE", label: "Instagram Template Spec", hint: "Canva-ready template recipe (layout + type system + rules)." },
  { key: "ACTION_30_60_90", label: "30/60/90 Action Plan", hint: "Detailed phased execution plan with owners + DoD." },
];

function safeJson(val: any) {
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

export default function StartupGaragePage() {
  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");

  const [socialPrMode, setSocialPrMode] = useState<z.infer<typeof SocialPrMode>>("BOTH");

  const [competitor1, setCompetitor1] = useState("");
  const [competitor2, setCompetitor2] = useState("");
  const [competitor3, setCompetitor3] = useState("");

  const [modules, setModules] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(MODULES.map((m) => [m.key, true]))
  );

  const selectedModules = useMemo(
    () => MODULES.filter((m) => modules[m.key]).map((m) => m.key),
    [modules]
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const competitors = [competitor1, competitor2, competitor3]
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({ name }));

      const body = {
        intake: {
          companyName,
          websiteUrl: websiteUrl.trim() || undefined,
          industry,
          businessType,
          businessDescription,
          personas: [],
          competitors,
          socialPrMode,
          modules: selectedModules,
        },
      };

      const res = await fetch("/api/startup-garage/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message || "Failed to generate Start-up Garage outputs");
      }

      const json = await res.json();
      return StartupGarageGenerateResponse.parse(json);
    },
  });

  const outputs: Outputs | null = mutation.data?.outputs ?? null;

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold" data-testid="text-page-title">Start-up Garage</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build a GTM plan, team pod, website audit, social/PR plan, posts + templates, and a 30/60/90 plan — from one intake.
          </p>
        </div>
        <Badge variant="secondary" data-testid="badge-structured-json">Structured JSON modules</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Intake</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Company name</label>
              <Input data-testid="input-company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Coffee Co." />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Website URL (optional)</label>
              <Input data-testid="input-website-url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://…" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Industry</label>
              <Input data-testid="input-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Food & Beverage" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Business type</label>
              <Input data-testid="input-business-type" value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="Mobile coffee truck" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Business description</label>
            <Textarea
              data-testid="input-business-description"
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="What you sell, who you serve, what makes you different…"
              className="min-h-[140px]"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Social + PR coverage</label>
              <Select value={socialPrMode} onValueChange={(v: any) => setSocialPrMode(v)}>
                <SelectTrigger data-testid="select-social-pr-mode">
                  <SelectValue placeholder="Select coverage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOCAL">Local (Phoenix)</SelectItem>
                  <SelectItem value="NATIONAL">National</SelectItem>
                  <SelectItem value="BOTH">Both (staged)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                This selector informs the media + activation strategy in the Social/PR module.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Competitors (optional)</label>
              <div className="space-y-2">
                <Input data-testid="input-competitor-1" value={competitor1} onChange={(e) => setCompetitor1(e.target.value)} placeholder="Competitor 1" />
                <Input data-testid="input-competitor-2" value={competitor2} onChange={(e) => setCompetitor2(e.target.value)} placeholder="Competitor 2" />
                <Input data-testid="input-competitor-3" value={competitor3} onChange={(e) => setCompetitor3(e.target.value)} placeholder="Competitor 3" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <label className="text-sm font-medium">Deliverables to generate</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-select-all"
                  onClick={() => setModules(Object.fromEntries(MODULES.map((m) => [m.key, true])))}
                >
                  Select all
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  data-testid="button-select-none"
                  onClick={() => setModules(Object.fromEntries(MODULES.map((m) => [m.key, false])))}
                >
                  Select none
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {MODULES.map((m) => (
                <div key={m.key} className="flex items-start gap-3 rounded-lg border p-3" data-testid={`module-card-${m.key}`}>
                  <Checkbox
                    data-testid={`checkbox-module-${m.key}`}
                    checked={!!modules[m.key]}
                    onCheckedChange={(v) => setModules((prev) => ({ ...prev, [m.key]: !!v }))}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{m.label}</div>
                      <Badge variant="secondary">{m.key}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{m.hint}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              data-testid="button-generate"
              onClick={() => mutation.mutate()}
              disabled={
                mutation.isPending ||
                !companyName.trim() ||
                !industry.trim() ||
                !businessType.trim() ||
                !businessDescription.trim() ||
                selectedModules.length === 0
              }
            >
              {mutation.isPending ? "Generating…" : "Generate Start-up Garage Plan"}
            </Button>

            {mutation.isError ? (
              <div className="text-sm text-destructive" data-testid="text-error">{(mutation.error as any)?.message || "Generation failed"}</div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Outputs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {!outputs ? (
            <div className="text-sm text-muted-foreground" data-testid="text-outputs-empty">
              Generate to see results here. Outputs are returned as structured JSON from the Start-up Garage service.
            </div>
          ) : (
            <div className="space-y-5">
              {selectedModules.map((k) => (
                <div key={k} className="rounded-lg border p-4" data-testid={`output-card-${k}`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="font-medium">{MODULES.find((m) => m.key === k)?.label ?? k}</div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="secondary">{k}</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`button-copy-${k}`}
                        onClick={() => navigator.clipboard.writeText(safeJson(outputs[k]))}
                      >
                        Copy JSON
                      </Button>
                    </div>
                  </div>
                  <pre className="mt-3 max-h-[520px] overflow-auto rounded-md bg-muted p-3 text-xs" data-testid={`output-json-${k}`}>
                    {safeJson(outputs[k])}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
