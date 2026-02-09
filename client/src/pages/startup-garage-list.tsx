import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { listPlans } from "@/lib/startup-garage/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StartupGarageListPage() {
  const q = useQuery({ queryKey: ["startupGarage", "plans"], queryFn: listPlans });

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold" data-testid="text-startup-garage-title">Start-up Garage</h1>
          <p className="text-sm text-muted-foreground mt-1">Create plans, generate modules, and revisit outputs any time.</p>
        </div>
        <Link href="/startup-garage/new">
          <Button data-testid="button-create-plan">Create new plan</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {q.isLoading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : q.isError ? (
            <div className="text-sm text-destructive" data-testid="text-plans-error">{(q.error as any)?.message || "Failed to load plans"}</div>
          ) : q.data?.plans?.length ? (
            <div className="space-y-3">
              {q.data.plans.map((p) => (
                <Link key={p.id} href={`/startup-garage/${p.id}`}>
                  <a className="block rounded-lg border p-4 hover:bg-muted/40 transition" data-testid={`card-plan-${p.id}`}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="font-medium">{p.title || `${p.companyName} — Start-up Garage Plan`}</div>
                      <Badge variant="secondary" data-testid={`badge-status-${p.id}`}>{p.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {p.companyName} · {p.industry} · {p.businessType}
                    </div>
                  </a>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground" data-testid="text-no-plans">
              No plans yet. Create your first Start-up Garage plan to generate GTM, team, audit, and social assets.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
