import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { createPlan } from "@/lib/startup-garage/api";
import { SocialPrMode } from "../../../../shared/contracts/startupGarage";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function StartupGarageNewPage() {
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [socialPrMode, setSocialPrMode] = useState<typeof SocialPrMode._type>("BOTH");

  const m = useMutation({
    mutationFn: async () => {
      return createPlan({
        intake: {
          companyName,
          websiteUrl: websiteUrl.trim() || undefined,
          industry,
          businessType,
          businessDescription,
          personas: [],
          competitors: [],
          primaryGoals: [],
          socialPrMode,
        },
      });
    },
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ["startupGarage", "plans"] });
      setLocation(`/startup-garage/${data.planId}`);
    },
  });

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold" data-testid="text-new-plan-title">Create Start-up Garage Plan</h1>
        <p className="text-sm text-muted-foreground mt-1">This saves a plan first — then you generate modules from the plan page.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Intake</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Company name</label>
            <Input data-testid="input-company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Website URL (optional)</label>
            <Input data-testid="input-website-url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://…" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Industry</label>
              <Input data-testid="input-industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Business type</label>
              <Input data-testid="input-business-type" value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Business description</label>
            <Textarea data-testid="input-business-description" value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} className="min-h-[140px]" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Social + PR coverage</label>
            <Select value={socialPrMode} onValueChange={(v: any) => setSocialPrMode(v)}>
              <SelectTrigger data-testid="select-social-pr-mode"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LOCAL">Local (Phoenix)</SelectItem>
                <SelectItem value="NATIONAL">National</SelectItem>
                <SelectItem value="BOTH">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Button
              data-testid="button-create-plan-submit"
              onClick={() => m.mutate()}
              disabled={m.isPending || !companyName.trim() || !industry.trim() || !businessType.trim() || !businessDescription.trim()}
            >
              {m.isPending ? "Creating…" : "Create plan"}
            </Button>
            {m.isError ? <div className="text-sm text-destructive" data-testid="text-create-error">{(m.error as any)?.message}</div> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
