import OpenAI from "openai";

function planSummary(plan: any): string {
  const parts = [
    `Company: ${plan.companyName}`,
    `Industry: ${plan.industry}`,
    `Business Type: ${plan.businessType}`,
    `Description: ${plan.businessDescription}`,
    plan.stage ? `Stage: ${plan.stage}` : "",
    plan.websiteUrl ? `Website: ${plan.websiteUrl}` : "",
    plan.primaryGoals?.length ? `Primary Goals: ${plan.primaryGoals.join(", ")}` : "",
    plan.personas?.length ? `Personas: ${JSON.stringify(plan.personas)}` : "",
    plan.geography && Object.keys(plan.geography).length ? `Geography: ${JSON.stringify(plan.geography)}` : "",
    plan.geoFocus && Object.keys(plan.geoFocus).length ? `Geo Focus: ${JSON.stringify(plan.geoFocus)}` : "",
    plan.offer && Object.keys(plan.offer).length ? `Offer: ${JSON.stringify(plan.offer)}` : "",
    plan.targetSegments?.length ? `Target Segments: ${plan.targetSegments.join(", ")}` : "",
    plan.competitors?.length ? `Competitors: ${JSON.stringify(plan.competitors)}` : "",
    plan.vendorsAndSourcing && Object.keys(plan.vendorsAndSourcing).length ? `Vendors & Sourcing: ${JSON.stringify(plan.vendorsAndSourcing)}` : "",
    plan.websiteGoals && Object.keys(plan.websiteGoals).length ? `Website Goals: ${JSON.stringify(plan.websiteGoals)}` : "",
    plan.brandAssets && Object.keys(plan.brandAssets).length ? `Brand Assets: ${JSON.stringify(plan.brandAssets)}` : "",
    plan.socialHandles && Object.keys(plan.socialHandles).length ? `Social Handles: ${JSON.stringify(plan.socialHandles)}` : "",
    plan.postingCapacity ? `Posting Capacity: ${plan.postingCapacity}` : "",
    plan.socialPrMode ? `Social/PR Mode: ${plan.socialPrMode}` : "",
    plan.channels && Object.keys(plan.channels).length ? `Channels: ${JSON.stringify(plan.channels)}` : "",
    plan.opsSourcing && Object.keys(plan.opsSourcing).length ? `Ops/Sourcing: ${JSON.stringify(plan.opsSourcing)}` : "",
  ];
  return parts.filter(Boolean).join("\n");
}

async function callOpenAI(
  openai: OpenAI,
  systemPrompt: string,
  userPrompt: string,
): Promise<any> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.4,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  return JSON.parse(raw);
}

export class StartupGarageService {
  private openai: OpenAI | null = null;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      console.warn("⚠️ StartupGarageService: OPENAI_API_KEY not set – generation disabled");
    }
  }

  private requireAI(): OpenAI {
    if (!this.openai) {
      throw Object.assign(
        new Error("StartupGarageService is not available – AI key not configured"),
        { status: 503 },
      );
    }
    return this.openai;
  }

  async generateModule(plan: any, moduleKey: string): Promise<any> {
    const dispatch: Record<string, (p: any) => Promise<any>> = {
      TEAM: (p) => this.generateTeamRoster(p),
      WEBSITE_AUDIT: (p) => this.generateWebsiteAudit(p),
      GTM: (p) => this.generateGtmPlan(p),
      SOCIAL_PR: (p) => this.generateSocialPr(p),
      POSTS_20: (p) => this.generatePosts20(p),
      CANVA_TEMPLATE: (p) => this.generateCanvaTemplate(p),
      ACTION_30_60_90: (p) => this.generateActionPlan3060_90(p),
    };

    const handler = dispatch[moduleKey];
    if (!handler) {
      throw new Error(`Unknown module key: ${moduleKey}`);
    }
    return handler(plan);
  }

  async generateTeamRoster(plan: any): Promise<object> {
    const openai = this.requireAI();
    const system = [
      "You are a startup team-building expert. Given a business plan, generate an ideal founding/early-stage team roster.",
      "Return valid JSON matching this schema exactly:",
      '{ "teamName": string, "corePodsIncluded": boolean, "members": [{ "role": string, "name": string, "bio": string, "skills": string[], "responsibilities": string[], "deliverables": string[], "collaboration": string[] }] }',
      "Generate 5-8 team members appropriate for the stage, industry, and goals.",
      '"corePodsIncluded" must be boolean true. The "collaboration" field must be an array of strings describing how that member works with others.',
    ].join("\n");

    const user = `Business Plan:\n${planSummary(plan)}\n\nGenerate the ideal team roster as JSON.`;
    return callOpenAI(openai, system, user);
  }

  async generateWebsiteAudit(plan: any): Promise<object> {
    const url = plan.websiteUrl;
    const findings: Record<string, any> = {
      url: url || null,
      isHttps: false,
      hasTitle: false,
      titleText: "",
      hasMetaDescription: false,
      metaDescriptionText: "",
      h1Count: 0,
      h1Texts: [] as string[],
      hasOgTitle: false,
      hasOgDescription: false,
      hasOgImage: false,
      hasViewport: false,
      totalImages: 0,
      imagesWithAlt: 0,
      imagesMissingAlt: 0,
      largeImageHints: [] as string[],
      fetchError: null as string | null,
    };

    if (url) {
      try {
        const parsed = new URL(url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error("Only http/https URLs supported");
        }
        const host = parsed.hostname.toLowerCase();
        if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1" ||
            host.startsWith("10.") || host.startsWith("192.168.") || host.endsWith(".local") ||
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) || host.startsWith("169.254.")) {
          throw new Error("Cannot audit private/internal URLs");
        }
        findings.isHttps = url.startsWith("https");
        const resp = await fetch(url, {
          headers: { "User-Agent": "GigsterGarage-Audit/1.0" },
          redirect: "follow",
          signal: AbortSignal.timeout(10000),
        });
        const html = await resp.text();

        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch) {
          findings.hasTitle = true;
          findings.titleText = titleMatch[1].trim();
        }

        const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i)
          || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
        if (metaDescMatch) {
          findings.hasMetaDescription = true;
          findings.metaDescriptionText = metaDescMatch[1].trim();
        }

        const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
        findings.h1Count = h1Matches.length;
        findings.h1Texts = h1Matches.map((m: string) => m.replace(/<[^>]+>/g, "").trim()).slice(0, 5);

        findings.hasOgTitle = /<meta[^>]*property=["']og:title["'][^>]*>/i.test(html);
        findings.hasOgDescription = /<meta[^>]*property=["']og:description["'][^>]*>/i.test(html);
        findings.hasOgImage = /<meta[^>]*property=["']og:image["'][^>]*>/i.test(html);

        findings.hasViewport = /<meta[^>]*name=["']viewport["'][^>]*>/i.test(html);

        const imgTags = html.match(/<img[^>]*>/gi) || [];
        findings.totalImages = imgTags.length;
        findings.imagesWithAlt = imgTags.filter((tag: string) => /alt=["'][^"']+["']/i.test(tag)).length;
        findings.imagesMissingAlt = findings.totalImages - findings.imagesWithAlt;

        const largeSrcHints = imgTags
          .map((tag: string) => {
            const src = tag.match(/src=["']([^"']+)["']/i);
            return src ? src[1] : null;
          })
          .filter((v): v is string => Boolean(v))
          .filter((src) => /\.(png|jpg|jpeg|bmp|tiff)/i.test(src))
          .slice(0, 10);
        findings.largeImageHints = largeSrcHints;
      } catch (err: any) {
        findings.fetchError = err.message || "Failed to fetch website";
      }
    }

    const openai = this.requireAI();
    const conversionGoal = plan.websiteGoals?.primaryConversionGoal || "LEADS";
    const system = [
      "You are a website audit expert producing a 'Sarah-grade' structured report. Given raw HTML analysis findings for a startup's website, produce a comprehensive audit.",
      `The client's primary conversion goal is: ${conversionGoal}.`,
      "Return valid JSON matching this schema exactly:",
      '{ "companyDescription": string, "offersSummary": string[], "socialProofAudit": { "hasTestimonials": boolean, "hasReviews": boolean, "hasCaseStudies": boolean, "recommendations": string[] }, "summary": { "overall": string, "top3Wins": string[], "top3Fixes": string[] }, "scorecards": [{ "category": string, "score": number, "maxScore": number, "details": string }], "priorityBacklog": [{ "priority": "P0"|"P1"|"P2", "issue": string, "recommendation": string, "effort": "low"|"medium"|"high" }], "notes": { "fetchError": string|null, "auditDate": string, "methodology": string } }',
      "Scorecards should cover: HTTPS, Title/Meta, Headings, Open Graph, Mobile Readiness, Image Optimization, Conversion Alignment, Social Proof.",
      "Score each out of 10. Be specific and actionable in recommendations.",
      "The companyDescription should describe what the company does based on the website content.",
      "offersSummary should list the main products/services found on the website.",
    ].join("\n");

    const user = `Business Plan:\n${planSummary(plan)}\n\nWebsite Analysis Findings:\n${JSON.stringify(findings, null, 2)}\n\nGenerate the website audit report as JSON.`;
    return callOpenAI(openai, system, user);
  }

  async generateGtmPlan(plan: any): Promise<object> {
    const openai = this.requireAI();
    const system = [
      "You are a Go-To-Market strategy expert. Given a startup business plan with competitive intelligence, produce a comprehensive GTM plan.",
      "Return valid JSON matching this schema exactly:",
      '{ "companyOverview": string, "targetPersonas": [{ "name": string, "demographics": string, "painPoints": string[], "buyingMotivations": string[], "channels": string[] }], "positioning": { "statement": string, "uniqueValueProp": string, "keyDifferentiators": string[] }, "competitiveLandscape": { "overview": string, "competitors": [{ "name": string, "strengths": string[], "weaknesses": string[], "marketShare": string }], "comparisonGrid": [{ "feature": string, "us": string, "competitors": Record<string, string> }], "differentiators": string[], "gaps": string[], "opportunities": string[] }, "vendorMatrix": [{ "category": string, "recommendation": string, "alternatives": string[], "cost": string, "pros": string[], "cons": string[] }], "pricingRecommendations": { "strategy": string, "tiers": [{ "name": string, "price": string, "features": string[], "target": string }], "rationale": string }, "channelPlan": { "primaryChannels": [{ "channel": string, "strategy": string, "budget": string, "expectedROI": string }], "secondaryChannels": string[] } }',
      "Be specific to the industry, stage, and geographic focus provided.",
      "The competitiveLandscape must include a comparisonGrid comparing features across us vs each competitor.",
      "The vendorMatrix should recommend tools/vendors the company should use, with alternatives and cost comparisons.",
    ].join("\n");

    const user = `Business Plan:\n${planSummary(plan)}\n\nGenerate the Go-To-Market plan as JSON.`;
    return callOpenAI(openai, system, user);
  }

  async generateSocialPr(plan: any): Promise<object> {
    const openai = this.requireAI();
    const mode = plan.socialPrMode || "BOTH";
    const capacity = plan.postingCapacity || "MED";
    const brandVibeWords = plan.brandAssets?.brandVibeWords?.length ? plan.brandAssets.brandVibeWords.join(", ") : "professional, modern";
    const system = [
      "You are a social media and PR strategy expert for startups.",
      `The client wants a ${mode} strategy (LOCAL, NATIONAL, or BOTH).`,
      `Posting capacity: ${capacity} (LOW = 3-5/week, MED = 5-10/week, HIGH = 10-15/week).`,
      `Brand vibe words: ${brandVibeWords}.`,
      "Return valid JSON matching this schema exactly:",
      '{ "mode": string, "platformRecommendations": [{ "platform": string, "priority": "primary"|"secondary"|"optional", "strategy": string, "postingFrequency": string, "contentMix": string[] }], "paidAdsAdvice": { "budget": string, "platforms": string[], "targeting": string, "expectedResults": string }, "hashtags": { "branded": string[], "industry": string[], "trending": string[] }, "localMediaPlan": { "outlets": [{ "name": string, "type": string, "pitchAngle": string }], "events": string[], "partnerships": string[] }, "nationalMediaPlan": { "outlets": [{ "name": string, "type": string, "pitchAngle": string }], "prAngles": string[], "pressReleaseTopics": string[] }, "brandingToolkit": { "voiceTone": string, "keyMessages": string[], "visualGuidelines": string, "contentPillars": string[], "brandKit": { "primaryColors": string[], "fontRecommendations": string[], "visualStyle": string } } }',
      "Tailor the plan to the business industry, stage, and geographic focus.",
      mode === "LOCAL" ? "Focus primarily on the local media plan; national can be minimal." : "",
      mode === "NATIONAL" ? "Focus primarily on the national media plan; local can be minimal." : "",
      "Include a brandKit section in brandingToolkit with color/font/style recommendations based on the brand vibe words.",
    ].filter(Boolean).join("\n");

    const user = `Business Plan:\n${planSummary(plan)}\n\nGenerate the Social Media & PR plan as JSON.`;
    return callOpenAI(openai, system, user);
  }

  async generatePosts20(plan: any): Promise<object> {
    const openai = this.requireAI();
    const system = [
      "You are a social media content creator for startups. Generate exactly 20 social media posts.",
      "Return valid JSON matching this schema exactly:",
      '{ "posts": [{ "id": number, "platform": string, "type": string, "goal": string, "caption": string, "imagery": string, "imagePrompts": string[], "cta": string, "hashtags": string[] }] }',
      "Mix platforms (Instagram, LinkedIn, Twitter/X, Facebook, TikTok) based on the business type.",
      'Post types should vary: educational, promotional, behind-the-scenes, testimonial, engagement, story, reel/short.',
      "Each post must have:",
      "- A compelling caption (100-300 chars)",
      "- A description of the imagery",
      "- 1-2 AI image generation prompts for creating the visual",
      "- A clear CTA",
      "- 3-7 relevant hashtags",
      "Ensure posts align with the business brand, industry, and target audience.",
    ].join("\n");

    const user = `Business Plan:\n${planSummary(plan)}\n\nGenerate 20 social media posts as JSON.`;
    return callOpenAI(openai, system, user);
  }

  async generateCanvaTemplate(plan: any): Promise<object> {
    const openai = this.requireAI();
    const brandVibeWords = plan.brandAssets?.brandVibeWords?.length ? plan.brandAssets.brandVibeWords.join(", ") : "professional, modern";
    const system = [
      "You are a graphic design expert specializing in Canva templates for social media.",
      `Brand vibe words: ${brandVibeWords}.`,
      "Generate Instagram Canva-ready template specifications for the startup.",
      "Return valid JSON matching this schema exactly:",
      '{ "brandKit": { "primaryColors": string[], "accentColors": string[], "fonts": { "heading": string, "body": string }, "visualStyle": string }, "templates": [{ "name": string, "size": string, "grid": { "columns": number, "rows": number, "gutterPx": number }, "components": [{ "type": string, "position": string, "styling": string }], "typeSystem": { "headingFont": string, "bodyFont": string, "headingSizePt": number, "bodySizePt": number, "lineHeight": number }, "exportNotes": string, "imagePromptPattern": string }] }',
      "Generate 4-6 templates covering: feed post, story, carousel slide, highlight cover, reel cover, and promotional banner.",
      "Use brand-appropriate colors and modern design principles that match the brand vibe words.",
      "The brandKit should extract/recommend colors and fonts based on the brand identity.",
      "The imagePromptPattern should be a reusable AI prompt template for generating visuals.",
    ].join("\n");

    const user = `Business Plan:\n${planSummary(plan)}\n\nGenerate the Canva template specifications as JSON.`;
    return callOpenAI(openai, system, user);
  }

  async generateActionPlan3060_90(plan: any): Promise<object> {
    const openai = this.requireAI();
    const system = [
      "You are a startup execution coach. Create a 30/60/90 day action plan for launching and growing this business.",
      "Return valid JSON matching this schema exactly:",
      '{ "days30": [{ "title": string, "owner": string, "details": string, "definitionOfDone": string, "dependencies": string[], "links": string[] }], "days60": [{ "title": string, "owner": string, "details": string, "definitionOfDone": string, "dependencies": string[], "links": string[] }], "days90": [{ "title": string, "owner": string, "details": string, "definitionOfDone": string, "dependencies": string[], "links": string[] }] }',
      "Each phase should have 5-8 actionable items.",
      "Days 1-30: Foundation & launch prep (legal, branding, MVP, initial marketing).",
      "Days 31-60: Launch & early traction (go-live, first customers, feedback loops).",
      "Days 61-90: Growth & optimization (scaling, partnerships, metrics review).",
      'Owner should reference team roles (e.g., "Founder", "Marketing Lead", "Tech Lead").',
      "Definition of Done must be measurable and specific.",
      "Dependencies should list which other items must complete first (by title).",
      "Links can be empty arrays; they will be populated by the system when tasks are created.",
      "These items will be converted into actual project tasks, so make them specific and actionable.",
    ].join("\n");

    const user = `Business Plan:\n${planSummary(plan)}\n\nGenerate the 30/60/90 day action plan as JSON.`;
    return callOpenAI(openai, system, user);
  }
}
