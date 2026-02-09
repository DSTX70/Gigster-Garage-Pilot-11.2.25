import { Badge } from "@/components/ui/badge";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items?.length) return null;
  return (
    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
}

function KeyValue({ label, value }: { label: string; value: any }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="font-medium text-foreground min-w-[140px]">{label}:</span>
      <span className="text-muted-foreground">{String(value)}</span>
    </div>
  );
}

function TeamRosterRenderer({ data }: { data: any }) {
  const members = data?.members || [];
  return (
    <div className="space-y-4">
      {data?.teamName && <h3 className="text-lg font-semibold">{data.teamName}</h3>}
      <div className="grid gap-4 md:grid-cols-2">
        {members.map((m: any, i: number) => (
          <div key={i} className="rounded-lg border p-4 space-y-2" data-testid={`team-member-${i}`}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{m.role}</span>
              {m.name && <Badge variant="secondary">{m.name}</Badge>}
            </div>
            {m.bio && <p className="text-sm text-muted-foreground">{m.bio}</p>}
            {m.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {m.skills.map((s: string, j: number) => <Badge key={j} variant="outline" className="text-xs">{s}</Badge>)}
              </div>
            )}
            {m.responsibilities?.length > 0 && (
              <div><span className="text-xs font-medium">Responsibilities:</span><BulletList items={m.responsibilities} /></div>
            )}
            {m.deliverables?.length > 0 && (
              <div><span className="text-xs font-medium">Deliverables:</span><BulletList items={m.deliverables} /></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function WebsiteAuditRenderer({ data }: { data: any }) {
  const summary = data?.summary;
  const scorecards = data?.scorecards || [];
  const backlog = data?.priorityBacklog || [];
  return (
    <div className="space-y-5">
      {summary && (
        <Section title="Summary">
          <p className="text-sm text-muted-foreground">{summary.overall}</p>
          {summary.top3Wins?.length > 0 && <div><span className="text-sm font-medium text-green-600 dark:text-green-400">Top Wins</span><BulletList items={summary.top3Wins} /></div>}
          {summary.top3Fixes?.length > 0 && <div><span className="text-sm font-medium text-amber-600 dark:text-amber-400">Top Fixes Needed</span><BulletList items={summary.top3Fixes} /></div>}
        </Section>
      )}
      {scorecards.length > 0 && (
        <Section title="Scorecards">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {scorecards.map((sc: any, i: number) => (
              <div key={i} className="rounded-lg border p-3 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">{sc.category}</span>
                  <Badge variant={sc.score >= 7 ? "default" : sc.score >= 4 ? "secondary" : "destructive"}>{sc.score}/{sc.maxScore}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{sc.details}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
      {backlog.length > 0 && (
        <Section title="Priority Backlog">
          <div className="space-y-2">
            {backlog.map((item: any, i: number) => (
              <div key={i} className="rounded border p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={item.priority === "P0" ? "destructive" : item.priority === "P1" ? "secondary" : "outline"}>{item.priority}</Badge>
                  <span className="text-sm font-medium">{item.issue}</span>
                  <Badge variant="outline" className="text-xs ml-auto">{item.effort}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{item.recommendation}</p>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function GtmPlanRenderer({ data }: { data: any }) {
  return (
    <div className="space-y-5">
      {data?.companyOverview && <Section title="Company Overview"><p className="text-sm text-muted-foreground">{data.companyOverview}</p></Section>}
      {data?.positioning && (
        <Section title="Positioning">
          <KeyValue label="Statement" value={data.positioning.statement} />
          <KeyValue label="Value Prop" value={data.positioning.uniqueValueProp} />
          {data.positioning.keyDifferentiators?.length > 0 && <BulletList items={data.positioning.keyDifferentiators} />}
        </Section>
      )}
      {data?.targetPersonas?.length > 0 && (
        <Section title="Target Personas">
          <div className="grid gap-3 md:grid-cols-2">
            {data.targetPersonas.map((p: any, i: number) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <span className="font-medium text-sm">{p.name}</span>
                <KeyValue label="Demographics" value={p.demographics} />
                {p.painPoints?.length > 0 && <div><span className="text-xs font-medium">Pain Points:</span><BulletList items={p.painPoints} /></div>}
                {p.buyingMotivations?.length > 0 && <div><span className="text-xs font-medium">Motivations:</span><BulletList items={p.buyingMotivations} /></div>}
              </div>
            ))}
          </div>
        </Section>
      )}
      {data?.pricingRecommendations && (
        <Section title="Pricing">
          <KeyValue label="Strategy" value={data.pricingRecommendations.strategy} />
          <KeyValue label="Rationale" value={data.pricingRecommendations.rationale} />
          {data.pricingRecommendations.tiers?.map((t: any, i: number) => (
            <div key={i} className="rounded border p-2 space-y-1 mt-2">
              <div className="flex justify-between"><span className="font-medium text-sm">{t.name}</span><Badge variant="secondary">{t.price}</Badge></div>
              <KeyValue label="Target" value={t.target} />
              {t.features?.length > 0 && <BulletList items={t.features} />}
            </div>
          ))}
        </Section>
      )}
      {data?.channelPlan?.primaryChannels?.length > 0 && (
        <Section title="Channel Plan">
          {data.channelPlan.primaryChannels.map((ch: any, i: number) => (
            <div key={i} className="rounded border p-2 space-y-1 mt-1">
              <span className="font-medium text-sm">{ch.channel}</span>
              <KeyValue label="Strategy" value={ch.strategy} />
              <KeyValue label="Budget" value={ch.budget} />
              <KeyValue label="Expected ROI" value={ch.expectedROI} />
            </div>
          ))}
        </Section>
      )}
    </div>
  );
}

function SocialPrRenderer({ data }: { data: any }) {
  return (
    <div className="space-y-5">
      <KeyValue label="Mode" value={data?.mode} />
      {data?.platformRecommendations?.length > 0 && (
        <Section title="Platform Recommendations">
          <div className="grid gap-3 sm:grid-cols-2">
            {data.platformRecommendations.map((p: any, i: number) => (
              <div key={i} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between"><span className="font-medium text-sm">{p.platform}</span><Badge variant={p.priority === "primary" ? "default" : "secondary"}>{p.priority}</Badge></div>
                <KeyValue label="Strategy" value={p.strategy} />
                <KeyValue label="Frequency" value={p.postingFrequency} />
                {p.contentMix?.length > 0 && <BulletList items={p.contentMix} />}
              </div>
            ))}
          </div>
        </Section>
      )}
      {data?.paidAdsAdvice && (
        <Section title="Paid Ads">
          <KeyValue label="Budget" value={data.paidAdsAdvice.budget} />
          <KeyValue label="Targeting" value={data.paidAdsAdvice.targeting} />
          <KeyValue label="Expected Results" value={data.paidAdsAdvice.expectedResults} />
        </Section>
      )}
      {data?.hashtags && (
        <Section title="Hashtags">
          {data.hashtags.branded?.length > 0 && <div className="flex flex-wrap gap-1">{data.hashtags.branded.map((h: string, i: number) => <Badge key={i} variant="default" className="text-xs">{h}</Badge>)}</div>}
          {data.hashtags.industry?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{data.hashtags.industry.map((h: string, i: number) => <Badge key={i} variant="secondary" className="text-xs">{h}</Badge>)}</div>}
        </Section>
      )}
      {data?.brandingToolkit && (
        <Section title="Branding Toolkit">
          <KeyValue label="Voice & Tone" value={data.brandingToolkit.voiceTone} />
          <KeyValue label="Visual Guidelines" value={data.brandingToolkit.visualGuidelines} />
          {data.brandingToolkit.keyMessages?.length > 0 && <BulletList items={data.brandingToolkit.keyMessages} />}
          {data.brandingToolkit.contentPillars?.length > 0 && <div><span className="text-xs font-medium">Content Pillars:</span><BulletList items={data.brandingToolkit.contentPillars} /></div>}
        </Section>
      )}
    </div>
  );
}

function Posts20Renderer({ data }: { data: any }) {
  const posts = data?.posts || [];
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{posts.length} posts generated</p>
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post: any, i: number) => (
          <div key={i} className="rounded-lg border p-4 space-y-2" data-testid={`post-${i}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm">#{post.id || i + 1}</span>
              <div className="flex gap-1">
                <Badge variant="secondary">{post.platform}</Badge>
                <Badge variant="outline">{post.type}</Badge>
              </div>
            </div>
            <KeyValue label="Goal" value={post.goal} />
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.caption}</p>
            {post.imagery && <KeyValue label="Imagery" value={post.imagery} />}
            {post.cta && <KeyValue label="CTA" value={post.cta} />}
            {post.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1">{post.hashtags.map((h: string, j: number) => <Badge key={j} variant="outline" className="text-xs">{h}</Badge>)}</div>
            )}
            {post.imagePrompts?.length > 0 && (
              <div className="bg-muted rounded p-2 mt-1">
                <span className="text-xs font-medium">Image Prompts:</span>
                <BulletList items={post.imagePrompts} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function CanvaTemplateRenderer({ data }: { data: any }) {
  const templates = data?.templates || [];
  return (
    <div className="space-y-4">
      {templates.map((t: any, i: number) => (
        <div key={i} className="rounded-lg border p-4 space-y-2" data-testid={`template-${i}`}>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sm">{t.name}</span>
            <Badge variant="secondary">{t.size}</Badge>
          </div>
          {t.typeSystem && (
            <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              <KeyValue label="Heading Font" value={t.typeSystem.headingFont} />
              <KeyValue label="Body Font" value={t.typeSystem.bodyFont} />
            </div>
          )}
          {t.components?.length > 0 && (
            <div><span className="text-xs font-medium">Components:</span>
              <div className="space-y-1 mt-1">
                {t.components.map((c: any, j: number) => (
                  <div key={j} className="text-xs rounded bg-muted p-2">
                    <span className="font-medium">{c.type}</span> — {c.position}
                    {c.styling && <span className="text-muted-foreground ml-1">({c.styling})</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {t.imagePromptPattern && <KeyValue label="Image Prompt" value={t.imagePromptPattern} />}
          {t.exportNotes && <KeyValue label="Export Notes" value={t.exportNotes} />}
        </div>
      ))}
    </div>
  );
}

function ActionPlanRenderer({ data }: { data: any }) {
  const phases = [
    { key: "days30", label: "Days 1–30: Foundation & Launch Prep", items: data?.days30 || [] },
    { key: "days60", label: "Days 31–60: Launch & Early Traction", items: data?.days60 || [] },
    { key: "days90", label: "Days 61–90: Growth & Optimization", items: data?.days90 || [] },
  ];
  return (
    <div className="space-y-5">
      {phases.map((phase) => (
        <Section key={phase.key} title={phase.label}>
          <div className="space-y-2">
            {phase.items.map((item: any, i: number) => (
              <div key={i} className="rounded border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{item.title}</span>
                  <Badge variant="outline">{item.owner}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.details}</p>
                <div className="text-xs"><span className="font-medium text-green-600 dark:text-green-400">Done when: </span><span className="text-muted-foreground">{item.definitionOfDone}</span></div>
              </div>
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}

const RENDERERS: Record<string, (props: { data: any }) => JSX.Element> = {
  TEAM: TeamRosterRenderer,
  WEBSITE_AUDIT: WebsiteAuditRenderer,
  GTM: GtmPlanRenderer,
  SOCIAL_PR: SocialPrRenderer,
  POSTS_20: Posts20Renderer,
  CANVA_TEMPLATE: CanvaTemplateRenderer,
  ACTION_30_60_90: ActionPlanRenderer,
};

export function ModuleOutputRenderer({ moduleKey, content }: { moduleKey: string; content: any }) {
  const Renderer = RENDERERS[moduleKey];
  if (!Renderer) {
    return <pre className="text-xs bg-muted rounded p-3 overflow-auto max-h-[400px]">{JSON.stringify(content, null, 2)}</pre>;
  }
  return <Renderer data={content} />;
}
