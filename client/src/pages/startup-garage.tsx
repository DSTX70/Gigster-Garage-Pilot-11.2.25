import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Search, ArrowLeft, ArrowRight, ChevronRight, Loader2, Trash2,
  Building2, Globe, Briefcase, Target, Users, ShoppingBag, Megaphone,
  BarChart3, FileText, Palette, Calendar, CheckCircle2, XCircle, Clock,
  RefreshCw, Rocket, Eye, Layout, Hash, Lightbulb, MapPin, DollarSign,
  Package, Truck
} from "lucide-react";
import type { StartupGaragePlan, StartupGarageOutput } from "@shared/schema";

const INDUSTRY_OPTIONS = [
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "food_beverage", label: "Food & Beverage" },
  { value: "retail", label: "Retail" },
  { value: "professional_services", label: "Professional Services" },
  { value: "construction", label: "Construction" },
  { value: "education", label: "Education" },
  { value: "finance", label: "Finance" },
  { value: "entertainment", label: "Entertainment" },
  { value: "real_estate", label: "Real Estate" },
  { value: "transportation", label: "Transportation" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "other", label: "Other" },
];

const BUSINESS_TYPE_OPTIONS = [
  { value: "b2b", label: "B2B" },
  { value: "b2c", label: "B2C" },
  { value: "b2b2c", label: "B2B2C" },
  { value: "marketplace", label: "Marketplace" },
  { value: "saas", label: "SaaS" },
  { value: "service", label: "Service" },
  { value: "product", label: "Product" },
  { value: "hybrid", label: "Hybrid" },
];

const STAGE_OPTIONS = [
  { value: "idea", label: "Idea" },
  { value: "pre_launch", label: "Pre-Launch" },
  { value: "launched", label: "Launched" },
  { value: "growth", label: "Growth" },
];

const GOAL_OPTIONS = [
  { value: "revenue_growth", label: "Revenue Growth" },
  { value: "brand_awareness", label: "Brand Awareness" },
  { value: "customer_acquisition", label: "Customer Acquisition" },
  { value: "product_launch", label: "Product Launch" },
  { value: "market_expansion", label: "Market Expansion" },
  { value: "fundraising", label: "Fundraising" },
  { value: "team_building", label: "Team Building" },
  { value: "process_optimization", label: "Process Optimization" },
];

const CHANNEL_OPTIONS = [
  { value: "website", label: "Website" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "tiktok", label: "TikTok" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter / X" },
  { value: "youtube", label: "YouTube" },
  { value: "email", label: "Email" },
  { value: "seo", label: "SEO" },
  { value: "paid_ads", label: "Paid Ads" },
  { value: "events", label: "Events" },
  { value: "partnerships", label: "Partnerships" },
  { value: "referrals", label: "Referrals" },
  { value: "direct_sales", label: "Direct Sales" },
];

const SALES_MODEL_OPTIONS = [
  { value: "online", label: "Online" },
  { value: "local_service", label: "Local Service" },
  { value: "subscription", label: "Subscription" },
  { value: "marketplace", label: "Marketplace" },
  { value: "retail", label: "Retail" },
  { value: "events", label: "Events" },
  { value: "wholesale", label: "Wholesale" },
];

const VENDOR_CATEGORY_OPTIONS = [
  { value: "packaging", label: "Packaging" },
  { value: "printing", label: "Printing" },
  { value: "ingredients", label: "Ingredients" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "logistics", label: "Logistics" },
  { value: "marketing", label: "Marketing" },
  { value: "legal", label: "Legal" },
  { value: "accounting", label: "Accounting" },
  { value: "technology", label: "Technology" },
  { value: "design", label: "Design" },
];

const MODULE_OPTIONS = [
  { value: "TEAM", label: "Team Roster", icon: Users, desc: "Ideal founding team structure" },
  { value: "WEBSITE_AUDIT", label: "Website Audit", icon: Globe, desc: "SEO & UX audit of your site" },
  { value: "GTM", label: "Go-to-Market Plan", icon: Rocket, desc: "Positioning, personas, pricing, channels" },
  { value: "SOCIAL_PR", label: "Social & PR Strategy", icon: Megaphone, desc: "Platform recs, ads, media plans" },
  { value: "POSTS_20", label: "20 Social Posts", icon: Hash, desc: "Ready-to-publish content calendar" },
  { value: "CANVA_TEMPLATE", label: "Canva Templates", icon: Palette, desc: "Brand template specifications" },
  { value: "ACTION_30_60_90", label: "30/60/90 Action Plan", icon: Calendar, desc: "Milestone-based action items" },
];

const CUSTOMER_SEGMENT_OPTIONS = [
  { value: "consumers", label: "Individual Consumers" },
  { value: "small_business", label: "Small Businesses" },
  { value: "enterprise", label: "Enterprise" },
  { value: "government", label: "Government" },
  { value: "nonprofit", label: "Nonprofits" },
  { value: "students", label: "Students" },
  { value: "professionals", label: "Professionals" },
];

const PHOENIX_AREAS = [
  "Downtown Phoenix", "Scottsdale", "Tempe", "Mesa", "Chandler",
  "Gilbert", "Glendale", "Peoria", "Surprise", "Goodyear",
  "Avondale", "Buckeye", "Queen Creek", "Cave Creek", "Fountain Hills",
];

function statusBadge(status: string) {
  switch (status) {
    case "draft": return <Badge variant="secondary" data-testid="badge-status-draft">Draft</Badge>;
    case "generating": return <Badge className="bg-yellow-500 text-white" data-testid="badge-status-generating"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Generating</Badge>;
    case "complete": return <Badge className="bg-green-600 text-white" data-testid="badge-status-complete"><CheckCircle2 className="w-3 h-3 mr-1" />Complete</Badge>;
    case "error": return <Badge variant="destructive" data-testid="badge-status-error"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
}

function moduleStatusBadge(status: string | undefined) {
  switch (status) {
    case "PENDING": return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case "READY": return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Ready</Badge>;
    case "ERROR": return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
    default: return <Badge variant="outline">Not Generated</Badge>;
  }
}

function labelFor(value: string, options: { value: string; label: string }[]) {
  return options.find(o => o.value === value)?.label ?? value;
}

// ───────────────────────────────────────────────────────────────
// Plans List
// ───────────────────────────────────────────────────────────────
export function StartupGaragePlans() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const { toast } = useToast();

  const { data: plans = [], isLoading } = useQuery<StartupGaragePlan[]>({
    queryKey: ["/api/startup-garage/plans"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/startup-garage/plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/startup-garage/plans"] });
      toast({ title: "Plan deleted" });
    },
    onError: () => toast({ title: "Failed to delete plan", variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    return plans.filter(p => {
      if (search && !p.companyName.toLowerCase().includes(search.toLowerCase())) return false;
      if (stageFilter !== "all" && p.stage !== stageFilter) return false;
      return true;
    });
  }, [plans, search, stageFilter]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" data-testid="startup-garage-plans-page">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-page-title">Start-up Garage</h1>
            <p className="text-muted-foreground">AI-powered business plans for your startup</p>
          </div>
          <Button onClick={() => setLocation("/startup-garage/new")} data-testid="button-create-plan">
            <Plus className="w-4 h-4 mr-2" />Create New Plan
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-plans"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-full sm:w-44" data-testid="select-stage-filter">
              <SelectValue placeholder="Filter by stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {STAGE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i}><CardContent className="p-6 space-y-3">
                <Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-1/3" />
              </CardContent></Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-12 text-center" data-testid="text-empty-state">
            <Rocket className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">No plans yet</h3>
            <p className="text-muted-foreground mb-4">Create your first startup business plan to get started.</p>
            <Button onClick={() => setLocation("/startup-garage/new")} data-testid="button-create-plan-empty">
              <Plus className="w-4 h-4 mr-2" />Create New Plan
            </Button>
          </CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(plan => (
              <Card
                key={plan.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setLocation(`/startup-garage/${plan.id}`)}
                data-testid={`card-plan-${plan.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base line-clamp-1">{plan.title}</CardTitle>
                    {statusBadge(plan.status ?? "draft")}
                  </div>
                  <CardDescription className="line-clamp-1">{plan.companyName}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{labelFor(plan.industry, INDUSTRY_OPTIONS)}</span>
                    <span className="flex items-center gap-1"><Target className="w-3 h-3" />{labelFor(plan.stage ?? "idea", STAGE_OPTIONS)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : "—"}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={e => { e.stopPropagation(); deleteMutation.mutate(plan.id); }}
                      data-testid={`button-delete-plan-${plan.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Wizard
// ───────────────────────────────────────────────────────────────
interface Persona {
  name: string; ageRange: string; incomeRange: string; jobRole: string;
  goals: string; pains: string; buyingTriggers: string; channels: string;
  localness: string; notes: string;
}

const emptyPersona = (): Persona => ({
  name: "", ageRange: "", incomeRange: "", jobRole: "",
  goals: "", pains: "", buyingTriggers: "", channels: "",
  localness: "", notes: "",
});

interface Competitor { name: string; url: string; }

const WIZARD_STEPS = [
  "Basics", "Customer & Personas", "Offer & Pricing", "Channels",
  "Competitors", "Operations & Sourcing", "Deliverables", "Generate",
];

export function StartupGarageWizard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(0);

  const [companyName, setCompanyName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [stage, setStage] = useState("idea");
  const [primaryGoals, setPrimaryGoals] = useState<string[]>([]);

  const [whoDoYouServe, setWhoDoYouServe] = useState("");
  const [primaryCustomerSegment, setPrimaryCustomerSegment] = useState("");
  const [phoenixMetro, setPhoenixMetro] = useState(false);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([emptyPersona()]);

  const [offerType, setOfferType] = useState("services");
  const [currentPricing, setCurrentPricing] = useState("");
  const [desiredPricePosition, setDesiredPricePosition] = useState("mid");
  const [marginConstraints, setMarginConstraints] = useState("");
  const [salesModel, setSalesModel] = useState("");

  const [currentChannels, setCurrentChannels] = useState<string[]>([]);
  const [plannedChannels, setPlannedChannels] = useState<string[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<Record<string, string>>({});

  const [competitors, setCompetitors] = useState<Competitor[]>([{ name: "", url: "" }]);
  const [inspirationBrands, setInspirationBrands] = useState("");
  const [differentiatorHypothesis, setDifferentiatorHypothesis] = useState("");

  const [hasInventoryNeeds, setHasInventoryNeeds] = useState(false);
  const [inventoryDetails, setInventoryDetails] = useState("");
  const [vendorCategories, setVendorCategories] = useState<string[]>([]);
  const [leadTime, setLeadTime] = useState("");
  const [moq, setMoq] = useState("");
  const [localSuppliers, setLocalSuppliers] = useState("");
  const [budgetRange, setBudgetRange] = useState("");

  const [deliverablesRequested, setDeliverablesRequested] = useState<string[]>(["TEAM", "GTM", "ACTION_30_60_90"]);
  const [socialPrMode, setSocialPrMode] = useState<"LOCAL" | "NATIONAL" | "BOTH">("BOTH");

  const toggleGoal = (g: string) => setPrimaryGoals(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  const toggleChannel = (c: string, setter: typeof setCurrentChannels) => setter(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleDeliverable = (d: string) => setDeliverablesRequested(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  const toggleVendorCat = (v: string) => setVendorCategories(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  const toggleArea = (a: string) => setSelectedAreas(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const body = {
        companyName,
        websiteUrl: websiteUrl || undefined,
        industry,
        businessType,
        businessDescription,
        stage,
        primaryGoals,
        personas,
        geoFocus: { phoenixMetro, areas: selectedAreas, whoDoYouServe, primaryCustomerSegment },
        offer: { offerType, currentPricing, desiredPricePosition, marginConstraints, salesModel },
        channels: { currentChannels, plannedChannels, socialAccounts },
        competitors,
        opsSourcing: {
          hasInventoryNeeds, inventoryDetails, vendorCategories,
          constraints: { leadTime, moq, localSuppliers, budgetRange },
          inspirationBrands, differentiatorHypothesis,
        },
        deliverablesRequested,
        socialPrMode,
        status: "draft",
      };
      const plan = await apiRequest<StartupGaragePlan>("POST", "/api/startup-garage/plans", body);
      const genRes = await apiRequest<{ runId: string }>("POST", `/api/startup-garage/plans/${plan.id}/generate`, { modules: deliverablesRequested });
      return plan;
    },
    onSuccess: (plan) => {
      queryClient.invalidateQueries({ queryKey: ["/api/startup-garage/plans"] });
      toast({ title: "Plan created! Generation started." });
      setLocation(`/startup-garage/${plan.id}`);
    },
    onError: (e: any) => toast({ title: "Failed to create plan", description: e.message, variant: "destructive" }),
  });

  const canProceed = () => {
    if (step === 0) return companyName && industry && businessType && businessDescription;
    if (step === 6) return deliverablesRequested.length > 0;
    return true;
  };

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Inc." data-testid="input-company-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL</Label>
              <Input id="websiteUrl" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://example.com" data-testid="input-website-url" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Industry *</Label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger data-testid="select-industry"><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>{INDUSTRY_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Business Type *</Label>
              <Select value={businessType} onValueChange={setBusinessType}>
                <SelectTrigger data-testid="select-business-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>{BUSINESS_TYPE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessDescription">Business Description *</Label>
            <Textarea id="businessDescription" value={businessDescription} onChange={e => setBusinessDescription(e.target.value)} rows={4} placeholder="Describe your business…" data-testid="input-business-description" />
          </div>
          <div className="space-y-2">
            <Label>Stage</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger data-testid="select-stage"><SelectValue /></SelectTrigger>
              <SelectContent>{STAGE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Primary Goals</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {GOAL_OPTIONS.map(g => (
                <label key={g.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={primaryGoals.includes(g.value)} onCheckedChange={() => toggleGoal(g.value)} data-testid={`checkbox-goal-${g.value}`} />
                  {g.label}
                </label>
              ))}
            </div>
          </div>
        </div>
      );

      case 1: return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Who Do You Serve?</Label>
            <Textarea value={whoDoYouServe} onChange={e => setWhoDoYouServe(e.target.value)} rows={3} placeholder="Describe your target audience…" data-testid="input-who-serve" />
          </div>
          <div className="space-y-2">
            <Label>Primary Customer Segment</Label>
            <Select value={primaryCustomerSegment} onValueChange={setPrimaryCustomerSegment}>
              <SelectTrigger data-testid="select-customer-segment"><SelectValue placeholder="Select segment" /></SelectTrigger>
              <SelectContent>{CUSTOMER_SEGMENT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch checked={phoenixMetro} onCheckedChange={setPhoenixMetro} data-testid="switch-phoenix-metro" />
              <Label>Phoenix Metro Focus</Label>
            </div>
            {phoenixMetro && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PHOENIX_AREAS.map(a => (
                  <label key={a} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox checked={selectedAreas.includes(a)} onCheckedChange={() => toggleArea(a)} data-testid={`checkbox-area-${a.replace(/\s/g, "-")}`} />
                    {a}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Personas (up to 5)</Label>
              {personas.length < 5 && (
                <Button variant="outline" size="sm" onClick={() => setPersonas(p => [...p, emptyPersona()])} data-testid="button-add-persona">
                  <Plus className="w-3 h-3 mr-1" />Add Persona
                </Button>
              )}
            </div>
            {personas.map((p, i) => (
              <Card key={i} className="relative">
                <CardContent className="pt-4 space-y-3">
                  {personas.length > 1 && (
                    <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => setPersonas(prev => prev.filter((_, idx) => idx !== i))} data-testid={`button-remove-persona-${i}`}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1"><Label className="text-xs">Name</Label><Input value={p.name} onChange={e => { const c = [...personas]; c[i] = { ...c[i], name: e.target.value }; setPersonas(c); }} placeholder="Persona name" data-testid={`input-persona-name-${i}`} /></div>
                    <div className="space-y-1"><Label className="text-xs">Job Role</Label><Input value={p.jobRole} onChange={e => { const c = [...personas]; c[i] = { ...c[i], jobRole: e.target.value }; setPersonas(c); }} placeholder="e.g. Marketing Manager" data-testid={`input-persona-job-${i}`} /></div>
                    <div className="space-y-1"><Label className="text-xs">Age Range</Label><Input value={p.ageRange} onChange={e => { const c = [...personas]; c[i] = { ...c[i], ageRange: e.target.value }; setPersonas(c); }} placeholder="e.g. 25-34" data-testid={`input-persona-age-${i}`} /></div>
                    <div className="space-y-1"><Label className="text-xs">Income Range</Label><Input value={p.incomeRange} onChange={e => { const c = [...personas]; c[i] = { ...c[i], incomeRange: e.target.value }; setPersonas(c); }} placeholder="e.g. $50k-$75k" data-testid={`input-persona-income-${i}`} /></div>
                  </div>
                  <div className="space-y-1"><Label className="text-xs">Goals</Label><Textarea value={p.goals} onChange={e => { const c = [...personas]; c[i] = { ...c[i], goals: e.target.value }; setPersonas(c); }} rows={2} data-testid={`input-persona-goals-${i}`} /></div>
                  <div className="space-y-1"><Label className="text-xs">Pains</Label><Textarea value={p.pains} onChange={e => { const c = [...personas]; c[i] = { ...c[i], pains: e.target.value }; setPersonas(c); }} rows={2} data-testid={`input-persona-pains-${i}`} /></div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1"><Label className="text-xs">Buying Triggers</Label><Input value={p.buyingTriggers} onChange={e => { const c = [...personas]; c[i] = { ...c[i], buyingTriggers: e.target.value }; setPersonas(c); }} data-testid={`input-persona-triggers-${i}`} /></div>
                    <div className="space-y-1"><Label className="text-xs">Channels</Label><Input value={p.channels} onChange={e => { const c = [...personas]; c[i] = { ...c[i], channels: e.target.value }; setPersonas(c); }} data-testid={`input-persona-channels-${i}`} /></div>
                    <div className="space-y-1"><Label className="text-xs">Localness</Label><Input value={p.localness} onChange={e => { const c = [...personas]; c[i] = { ...c[i], localness: e.target.value }; setPersonas(c); }} placeholder="e.g. Lives in Scottsdale" data-testid={`input-persona-localness-${i}`} /></div>
                    <div className="space-y-1"><Label className="text-xs">Notes</Label><Input value={p.notes} onChange={e => { const c = [...personas]; c[i] = { ...c[i], notes: e.target.value }; setPersonas(c); }} data-testid={`input-persona-notes-${i}`} /></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );

      case 2: return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Offer Type</Label>
            <Select value={offerType} onValueChange={setOfferType}>
              <SelectTrigger data-testid="select-offer-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="products">Products</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Current Pricing</Label>
            <Input value={currentPricing} onChange={e => setCurrentPricing(e.target.value)} placeholder="e.g. $49/mo, $500 per project" data-testid="input-current-pricing" />
          </div>
          <div className="space-y-2">
            <Label>Desired Price Position</Label>
            <Select value={desiredPricePosition} onValueChange={setDesiredPricePosition}>
              <SelectTrigger data-testid="select-price-position"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="mid">Mid-Range</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Margin Constraints</Label>
            <Input value={marginConstraints} onChange={e => setMarginConstraints(e.target.value)} placeholder="e.g. Minimum 40% margin" data-testid="input-margin-constraints" />
          </div>
          <div className="space-y-2">
            <Label>Sales Model</Label>
            <Select value={salesModel} onValueChange={setSalesModel}>
              <SelectTrigger data-testid="select-sales-model"><SelectValue placeholder="Select sales model" /></SelectTrigger>
              <SelectContent>{SALES_MODEL_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      );

      case 3: return (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-base font-semibold">Current Channels</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CHANNEL_OPTIONS.map(c => (
                <label key={c.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={currentChannels.includes(c.value)} onCheckedChange={() => toggleChannel(c.value, setCurrentChannels)} data-testid={`checkbox-current-channel-${c.value}`} />
                  {c.label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-base font-semibold">Planned Channels</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CHANNEL_OPTIONS.map(c => (
                <label key={c.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={plannedChannels.includes(c.value)} onCheckedChange={() => toggleChannel(c.value, setPlannedChannels)} data-testid={`checkbox-planned-channel-${c.value}`} />
                  {c.label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-base font-semibold">Social Account Handles</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {["instagram", "facebook", "tiktok", "linkedin", "twitter", "youtube"].map(platform => (
                <div key={platform} className="space-y-1">
                  <Label className="text-xs capitalize">{platform === "twitter" ? "Twitter / X" : platform}</Label>
                  <Input
                    value={socialAccounts[platform] ?? ""}
                    onChange={e => setSocialAccounts(prev => ({ ...prev, [platform]: e.target.value }))}
                    placeholder={`@${platform}handle`}
                    data-testid={`input-social-${platform}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      );

      case 4: return (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Competitors</Label>
              <Button variant="outline" size="sm" onClick={() => setCompetitors(prev => [...prev, { name: "", url: "" }])} data-testid="button-add-competitor">
                <Plus className="w-3 h-3 mr-1" />Add
              </Button>
            </div>
            {competitors.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input value={c.name} onChange={e => { const n = [...competitors]; n[i] = { ...n[i], name: e.target.value }; setCompetitors(n); }} placeholder="Competitor name" data-testid={`input-competitor-name-${i}`} />
                <Input value={c.url} onChange={e => { const n = [...competitors]; n[i] = { ...n[i], url: e.target.value }; setCompetitors(n); }} placeholder="URL" data-testid={`input-competitor-url-${i}`} />
                {competitors.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => setCompetitors(prev => prev.filter((_, idx) => idx !== i))} data-testid={`button-remove-competitor-${i}`}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <Label>Inspiration Brands</Label>
            <Textarea value={inspirationBrands} onChange={e => setInspirationBrands(e.target.value)} rows={3} placeholder="Brands you admire…" data-testid="input-inspiration-brands" />
          </div>
          <div className="space-y-2">
            <Label>Differentiator Hypothesis</Label>
            <Textarea value={differentiatorHypothesis} onChange={e => setDifferentiatorHypothesis(e.target.value)} rows={3} placeholder="What makes you unique…" data-testid="input-differentiator" />
          </div>
        </div>
      );

      case 5: return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={hasInventoryNeeds} onCheckedChange={setHasInventoryNeeds} data-testid="switch-inventory" />
            <Label>Has Inventory / Physical Product Needs</Label>
          </div>
          {hasInventoryNeeds && (
            <div className="space-y-2">
              <Label>Inventory Details</Label>
              <Textarea value={inventoryDetails} onChange={e => setInventoryDetails(e.target.value)} rows={3} placeholder="Describe your inventory needs…" data-testid="input-inventory-details" />
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Vendor Categories</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VENDOR_CATEGORY_OPTIONS.map(v => (
                <label key={v.value} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={vendorCategories.includes(v.value)} onCheckedChange={() => toggleVendorCat(v.value)} data-testid={`checkbox-vendor-${v.value}`} />
                  {v.label}
                </label>
              ))}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Lead Time</Label>
              <Input value={leadTime} onChange={e => setLeadTime(e.target.value)} placeholder="e.g. 2-4 weeks" data-testid="input-lead-time" />
            </div>
            <div className="space-y-2">
              <Label>MOQ (Minimum Order Quantity)</Label>
              <Input value={moq} onChange={e => setMoq(e.target.value)} placeholder="e.g. 100 units" data-testid="input-moq" />
            </div>
            <div className="space-y-2">
              <Label>Local Suppliers</Label>
              <Input value={localSuppliers} onChange={e => setLocalSuppliers(e.target.value)} placeholder="Any preferred local suppliers" data-testid="input-local-suppliers" />
            </div>
            <div className="space-y-2">
              <Label>Budget Range</Label>
              <Input value={budgetRange} onChange={e => setBudgetRange(e.target.value)} placeholder="e.g. $5k-$20k" data-testid="input-budget-range" />
            </div>
          </div>
        </div>
      );

      case 6: return (
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Select Deliverables</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {MODULE_OPTIONS.map(m => {
                const Icon = m.icon;
                return (
                  <label key={m.value} className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors">
                    <Checkbox checked={deliverablesRequested.includes(m.value)} onCheckedChange={() => toggleDeliverable(m.value)} className="mt-0.5" data-testid={`checkbox-deliverable-${m.value}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" />
                        <span className="font-medium text-sm">{m.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
          {deliverablesRequested.includes("SOCIAL_PR") && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Social/PR Mode</Label>
              <div className="flex gap-4">
                {(["LOCAL", "NATIONAL", "BOTH"] as const).map(mode => (
                  <label key={mode} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="socialPrMode"
                      value={mode}
                      checked={socialPrMode === mode}
                      onChange={() => setSocialPrMode(mode)}
                      className="accent-primary"
                      data-testid={`radio-social-pr-${mode.toLowerCase()}`}
                    />
                    <span className="text-sm">{mode === "BOTH" ? "Both" : mode.charAt(0) + mode.slice(1).toLowerCase()}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      );

      case 7: return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Review & Generate</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card><CardContent className="pt-4 space-y-1">
              <p className="text-xs text-muted-foreground">Company</p>
              <p className="font-medium" data-testid="text-summary-company">{companyName || "—"}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 space-y-1">
              <p className="text-xs text-muted-foreground">Industry</p>
              <p className="font-medium">{labelFor(industry, INDUSTRY_OPTIONS) || "—"}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 space-y-1">
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="font-medium">{labelFor(businessType, BUSINESS_TYPE_OPTIONS) || "—"}</p>
            </CardContent></Card>
            <Card><CardContent className="pt-4 space-y-1">
              <p className="text-xs text-muted-foreground">Stage</p>
              <p className="font-medium">{labelFor(stage, STAGE_OPTIONS)}</p>
            </CardContent></Card>
          </div>
          {websiteUrl && <p className="text-sm"><span className="text-muted-foreground">Website:</span> {websiteUrl}</p>}
          <div>
            <p className="text-sm font-medium mb-2">Selected Deliverables ({deliverablesRequested.length})</p>
            <div className="flex flex-wrap gap-2">
              {deliverablesRequested.map(d => (
                <Badge key={d} variant="secondary" data-testid={`badge-deliverable-${d}`}>{MODULE_OPTIONS.find(m => m.value === d)?.label ?? d}</Badge>
              ))}
            </div>
          </div>
          <Button
            className="w-full"
            size="lg"
            disabled={!canProceed() || createMutation.isPending}
            onClick={() => createMutation.mutate()}
            data-testid="button-generate-plan"
          >
            {createMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</> : <><Rocket className="w-4 h-4 mr-2" />Generate Plan</>}
          </Button>
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" data-testid="startup-garage-wizard-page">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/startup-garage")} data-testid="button-back-to-plans">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">New Business Plan</h1>
            <p className="text-sm text-muted-foreground">Step {step + 1} of {WIZARD_STEPS.length}: {WIZARD_STEPS[step]}</p>
          </div>
        </div>

        <div className="flex gap-1">
          {WIZARD_STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{WIZARD_STEPS[step]}</CardTitle>
          </CardHeader>
          <CardContent>{renderStep()}</CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep(s => s - 1)} data-testid="button-wizard-back">
            <ArrowLeft className="w-4 h-4 mr-2" />Back
          </Button>
          {step < WIZARD_STEPS.length - 1 && (
            <Button disabled={!canProceed()} onClick={() => setStep(s => s + 1)} data-testid="button-wizard-next">
              Next<ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Plan Detail
// ───────────────────────────────────────────────────────────────
type PlanWithOutputs = StartupGaragePlan & { outputs?: StartupGarageOutput[] };

export function StartupGaragePlanDetail() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const planId = params.id;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: plan, isLoading, refetch } = useQuery<PlanWithOutputs>({
    queryKey: ["/api/startup-garage/plans", planId],
    refetchInterval: (query) => {
      const d = query.state.data as PlanWithOutputs | undefined;
      if (d?.status === "generating") return 5000;
      if (d?.outputs?.some(o => o.status === "PENDING")) return 5000;
      return false;
    },
  });

  const generateMutation = useMutation({
    mutationFn: (modules: string[]) => apiRequest("POST", `/api/startup-garage/plans/${planId}/generate`, { modules }),
    onSuccess: () => {
      toast({ title: "Generation started" });
      queryClient.invalidateQueries({ queryKey: ["/api/startup-garage/plans", planId] });
    },
    onError: (e: any) => toast({ title: "Generation failed", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 sm:grid-cols-3"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-5xl mx-auto text-center py-20">
          <h2 className="text-xl font-bold mb-2">Plan not found</h2>
          <Button onClick={() => setLocation("/startup-garage")} data-testid="button-back-not-found">Back to Plans</Button>
        </div>
      </div>
    );
  }

  const outputs = plan.outputs ?? [];
  const getOutput = (key: string) => outputs.find(o => o.moduleKey === key);
  const isGenerating = plan.status === "generating";

  const renderModuleContent = (moduleKey: string) => {
    const output = getOutput(moduleKey);
    if (!output) return <p className="text-muted-foreground py-8 text-center">This module has not been generated yet.</p>;
    if (output.status === "PENDING") return <div className="flex items-center justify-center py-12 gap-2"><Loader2 className="w-5 h-5 animate-spin" /><span>Generating…</span></div>;
    if (output.status === "ERROR") return <div className="text-center py-8"><XCircle className="w-8 h-8 text-destructive mx-auto mb-2" /><p className="text-destructive">{output.errorMessage || "Generation failed"}</p></div>;
    const content = output.content as any;
    if (!content) return <p className="text-muted-foreground text-center py-8">No content available.</p>;

    switch (moduleKey) {
      case "TEAM": return <TeamTab content={content} />;
      case "WEBSITE_AUDIT": return <WebsiteAuditTab content={content} />;
      case "GTM": return <GtmTab content={content} />;
      case "SOCIAL_PR": return <SocialPrTab content={content} />;
      case "POSTS_20": return <PostsTab content={content} />;
      case "CANVA_TEMPLATE": return <CanvaTemplateTab content={content} />;
      case "ACTION_30_60_90": return <ActionPlanTab content={content} />;
      default: return <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(content, null, 2)}</pre>;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8" data-testid="startup-garage-detail-page">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/startup-garage")} data-testid="button-back-to-plans-detail">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold" data-testid="text-plan-title">{plan.title}</h1>
            <p className="text-sm text-muted-foreground">{plan.companyName} · {labelFor(plan.industry, INDUSTRY_OPTIONS)}</p>
          </div>
          {statusBadge(plan.status ?? "draft")}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            {MODULE_OPTIONS.map(m => {
              const out = getOutput(m.value);
              return (
                <TabsTrigger key={m.value} value={m.value} data-testid={`tab-${m.value}`} className="gap-1">
                  {m.label}
                  {out?.status === "PENDING" && <Loader2 className="w-3 h-3 animate-spin" />}
                  {out?.status === "READY" && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                  {out?.status === "ERROR" && <XCircle className="w-3 h-3 text-destructive" />}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div><p className="text-xs text-muted-foreground">Company</p><p className="font-medium">{plan.companyName}</p></div>
                  <div><p className="text-xs text-muted-foreground">Industry</p><p className="font-medium">{labelFor(plan.industry, INDUSTRY_OPTIONS)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Type</p><p className="font-medium">{labelFor(plan.businessType, BUSINESS_TYPE_OPTIONS)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Stage</p><p className="font-medium">{labelFor(plan.stage ?? "idea", STAGE_OPTIONS)}</p></div>
                  {plan.websiteUrl && <div><p className="text-xs text-muted-foreground">Website</p><a href={plan.websiteUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline">{plan.websiteUrl}</a></div>}
                  <div><p className="text-xs text-muted-foreground">Created</p><p className="font-medium">{plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : "—"}</p></div>
                </div>
                {plan.businessDescription && (
                  <div><p className="text-xs text-muted-foreground mb-1">Description</p><p className="text-sm">{plan.businessDescription}</p></div>
                )}
                <div>
                  <p className="text-sm font-semibold mb-3">Module Status</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {MODULE_OPTIONS.map(m => {
                      const out = getOutput(m.value);
                      const Icon = m.icon;
                      return (
                        <div key={m.value} className="flex items-center justify-between p-3 rounded-lg border" data-testid={`module-status-${m.value}`}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{m.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {moduleStatusBadge(out?.status ?? undefined)}
                            {(!out || out.status === "ERROR") && !isGenerating && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={generateMutation.isPending}
                                onClick={() => generateMutation.mutate([m.value])}
                                data-testid={`button-generate-${m.value}`}
                              >
                                {out?.status === "ERROR" ? "Retry" : "Generate"}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {MODULE_OPTIONS.map(m => (
            <TabsContent key={m.value} value={m.value}>
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-lg">{m.label}</CardTitle>
                  {getOutput(m.value)?.status !== "PENDING" && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={generateMutation.isPending || isGenerating}
                      onClick={() => generateMutation.mutate([m.value])}
                      data-testid={`button-regenerate-${m.value}`}
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />{getOutput(m.value) ? "Regenerate" : "Generate"}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>{renderModuleContent(m.value)}</CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Module Content Tabs
// ───────────────────────────────────────────────────────────────

function TeamTab({ content }: { content: any }) {
  const members = content.members ?? [];
  return (
    <div className="space-y-4">
      {content.teamName && <h3 className="font-semibold text-lg" data-testid="text-team-name">{content.teamName}</h3>}
      {content.corePodsIncluded && (
        <div className="flex flex-wrap gap-1">{content.corePodsIncluded.map((p: string, i: number) => <Badge key={i} variant="outline">{p}</Badge>)}</div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {members.map((m: any, i: number) => (
          <Card key={i} data-testid={`card-team-member-${i}`}>
            <CardContent className="pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-semibold">{m.role}</span>
              </div>
              <p className="text-sm font-medium">{m.name}</p>
              <p className="text-sm text-muted-foreground">{m.bio}</p>
              {m.skills && <div className="flex flex-wrap gap-1">{m.skills.map((s: string, j: number) => <Badge key={j} variant="secondary" className="text-xs">{s}</Badge>)}</div>}
              {m.responsibilities && (
                <div><p className="text-xs font-medium mt-2">Responsibilities</p><ul className="text-xs text-muted-foreground list-disc pl-4">{m.responsibilities.map((r: string, j: number) => <li key={j}>{r}</li>)}</ul></div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function WebsiteAuditTab({ content }: { content: any }) {
  return (
    <div className="space-y-6">
      {content.summary && <div><h3 className="font-semibold mb-2">Summary</h3><p className="text-sm">{content.summary}</p></div>}
      {content.url && <p className="text-sm text-muted-foreground">Audited URL: {content.url}</p>}
      {content.scorecards && (
        <div>
          <h3 className="font-semibold mb-3">Scorecards</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(content.scorecards).map(([key, val]: [string, any]) => (
              <Card key={key}><CardContent className="pt-4">
                <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, " ")}</p>
                <p className="text-2xl font-bold">{typeof val === "object" ? val.score ?? JSON.stringify(val) : String(val)}</p>
                {typeof val === "object" && val.notes && <p className="text-xs text-muted-foreground mt-1">{val.notes}</p>}
              </CardContent></Card>
            ))}
          </div>
        </div>
      )}
      {content.priorityBacklog && (
        <div>
          <h3 className="font-semibold mb-3">Priority Backlog</h3>
          <div className="space-y-2">
            {(Array.isArray(content.priorityBacklog) ? content.priorityBacklog : []).map((item: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 border rounded-lg">
                <Badge variant={item.priority === "high" ? "destructive" : item.priority === "medium" ? "default" : "secondary"} className="text-xs">{item.priority ?? "—"}</Badge>
                <div><p className="text-sm font-medium">{item.title ?? item.issue ?? JSON.stringify(item)}</p>{item.recommendation && <p className="text-xs text-muted-foreground">{item.recommendation}</p>}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {!content.scorecards && !content.priorityBacklog && <JsonFallback content={content} />}
    </div>
  );
}

function GtmTab({ content }: { content: any }) {
  return (
    <div className="space-y-6">
      {content.companyOverview && <Section title="Company Overview" text={content.companyOverview} />}
      {content.personas && (
        <div>
          <h3 className="font-semibold mb-3">Target Personas</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Array.isArray(content.personas) ? content.personas : []).map((p: any, i: number) => (
              <Card key={i}><CardContent className="pt-4 space-y-1">
                <p className="font-medium">{p.name ?? `Persona ${i + 1}`}</p>
                {p.description && <p className="text-sm text-muted-foreground">{p.description}</p>}
                {p.demographics && <p className="text-xs text-muted-foreground">{p.demographics}</p>}
              </CardContent></Card>
            ))}
          </div>
        </div>
      )}
      {content.positioning && <Section title="Positioning" text={typeof content.positioning === "string" ? content.positioning : JSON.stringify(content.positioning, null, 2)} />}
      {content.competitiveLandscape && <Section title="Competitive Landscape" text={typeof content.competitiveLandscape === "string" ? content.competitiveLandscape : JSON.stringify(content.competitiveLandscape, null, 2)} />}
      {content.pricing && <Section title="Pricing Strategy" text={typeof content.pricing === "string" ? content.pricing : JSON.stringify(content.pricing, null, 2)} />}
      {content.vendors && <Section title="Vendors" text={typeof content.vendors === "string" ? content.vendors : JSON.stringify(content.vendors, null, 2)} />}
      {content.channels && <Section title="Channels" text={typeof content.channels === "string" ? content.channels : JSON.stringify(content.channels, null, 2)} />}
      {!content.companyOverview && !content.personas && <JsonFallback content={content} />}
    </div>
  );
}

function SocialPrTab({ content }: { content: any }) {
  return (
    <div className="space-y-6">
      {content.platformRecommendations && <Section title="Platform Recommendations" text={typeof content.platformRecommendations === "string" ? content.platformRecommendations : JSON.stringify(content.platformRecommendations, null, 2)} />}
      {content.paidAds && <Section title="Paid Ads Strategy" text={typeof content.paidAds === "string" ? content.paidAds : JSON.stringify(content.paidAds, null, 2)} />}
      {content.hashtags && (
        <div>
          <h3 className="font-semibold mb-2">Hashtags</h3>
          <div className="flex flex-wrap gap-1">{(Array.isArray(content.hashtags) ? content.hashtags : []).map((h: string, i: number) => <Badge key={i} variant="secondary">#{h}</Badge>)}</div>
        </div>
      )}
      {content.mediaPlans && <Section title="Media Plans" text={typeof content.mediaPlans === "string" ? content.mediaPlans : JSON.stringify(content.mediaPlans, null, 2)} />}
      {content.brandingToolkit && <Section title="Branding Toolkit" text={typeof content.brandingToolkit === "string" ? content.brandingToolkit : JSON.stringify(content.brandingToolkit, null, 2)} />}
      {!content.platformRecommendations && !content.hashtags && <JsonFallback content={content} />}
    </div>
  );
}

function PostsTab({ content }: { content: any }) {
  const posts = content.posts ?? (Array.isArray(content) ? content : []);
  if (posts.length === 0) return <JsonFallback content={content} />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post: any, i: number) => (
        <Card key={i} data-testid={`card-post-${i}`}>
          <CardContent className="pt-4 space-y-2">
            <Badge variant="outline" className="text-xs">Post {i + 1}</Badge>
            {post.caption && <p className="text-sm">{post.caption}</p>}
            {post.imagery && <p className="text-xs text-muted-foreground"><span className="font-medium">Imagery:</span> {post.imagery}</p>}
            {post.prompt && <p className="text-xs text-muted-foreground"><span className="font-medium">Prompt:</span> {post.prompt}</p>}
            {post.hashtags && (
              <div className="flex flex-wrap gap-1">{(Array.isArray(post.hashtags) ? post.hashtags : post.hashtags.split(/\s+/)).map((h: string, j: number) => <Badge key={j} variant="secondary" className="text-xs">#{h.replace("#", "")}</Badge>)}</div>
            )}
            {post.platform && <Badge variant="outline" className="text-xs">{post.platform}</Badge>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CanvaTemplateTab({ content }: { content: any }) {
  const templates = content.templates ?? (Array.isArray(content) ? content : [content]);
  return (
    <div className="space-y-4">
      {templates.map((t: any, i: number) => (
        <Card key={i} data-testid={`card-template-${i}`}>
          <CardContent className="pt-4 space-y-2">
            {t.name && <p className="font-medium">{t.name}</p>}
            {t.type && <Badge variant="outline">{t.type}</Badge>}
            {t.dimensions && <p className="text-sm text-muted-foreground">Dimensions: {t.dimensions}</p>}
            {t.description && <p className="text-sm">{t.description}</p>}
            {t.elements && <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">{JSON.stringify(t.elements, null, 2)}</pre>}
            {t.specs && <pre className="text-xs bg-muted p-2 rounded whitespace-pre-wrap">{JSON.stringify(t.specs, null, 2)}</pre>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ActionPlanTab({ content }: { content: any }) {
  const periods = [
    { key: "day30", label: "30-Day Actions", items: content.day30 ?? content["30"] ?? [] },
    { key: "day60", label: "60-Day Actions", items: content.day60 ?? content["60"] ?? [] },
    { key: "day90", label: "90-Day Actions", items: content.day90 ?? content["90"] ?? [] },
  ];

  const hasData = periods.some(p => p.items.length > 0);
  if (!hasData) return <JsonFallback content={content} />;

  return (
    <div className="space-y-6">
      {periods.map(period => (
        <div key={period.key}>
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" />{period.label}</h3>
          {period.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items</p>
          ) : (
            <div className="space-y-2">
              {period.items.map((item: any, i: number) => (
                <div key={i} className="flex items-start gap-3 p-3 border rounded-lg" data-testid={`action-item-${period.key}-${i}`}>
                  <CheckCircle2 className="w-4 h-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{typeof item === "string" ? item : item.title ?? item.action ?? JSON.stringify(item)}</p>
                    {typeof item === "object" && item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                    {typeof item === "object" && item.owner && <Badge variant="outline" className="text-xs mt-1">{item.owner}</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm whitespace-pre-wrap">{text}</p>
    </div>
  );
}

function JsonFallback({ content }: { content: any }) {
  return <pre className="text-xs whitespace-pre-wrap bg-muted p-4 rounded-lg overflow-auto max-h-96">{JSON.stringify(content, null, 2)}</pre>;
}
