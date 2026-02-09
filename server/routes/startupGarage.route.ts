import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage.js";
import { StartupGarageService } from "../services/startupGarage.service.js";
import {
  StartupGarageIntake,
  StartupGarageModuleKey,
  CreateStartupGaragePlanRequest,
  GenerateStartupGarageOutputsRequest,
  type StartupGarageModuleKey as StartupGarageModuleKeyT,
} from "../../shared/contracts/startupGarage.js";
import { StartupGaragePlanService } from "../services/startupGaragePlan.service.js";

const createPlanSchema = z.object({
  companyName: z.string().min(1),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  industry: z.string().min(1),
  businessType: z.string().min(1),
  businessDescription: z.string().min(1),
  stage: z.enum(["idea", "pre_launch", "launched", "growth"]).optional(),
  primaryGoals: z.array(z.string()).optional(),
  personas: z.array(z.any()).optional(),
  geoFocus: z.record(z.any()).optional(),
  offer: z.record(z.any()).optional(),
  channels: z.record(z.any()).optional(),
  competitors: z.array(z.any()).optional(),
  opsSourcing: z.record(z.any()).optional(),
  deliverablesRequested: z.array(z.string()).optional(),
  socialPrMode: z.enum(["LOCAL", "NATIONAL", "BOTH"]).optional(),
  title: z.string().optional(),
});

function isPrivateUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (!["http:", "https:"].includes(parsed.protocol)) return true;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1") return true;
    if (host.startsWith("10.") || host.startsWith("192.168.")) return true;
    if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)) return true;
    if (host.endsWith(".local") || host.endsWith(".internal")) return true;
    if (host.startsWith("169.254.")) return true;
    return false;
  } catch {
    return true;
  }
}

function normalizeServicePlan(intake: any) {
  return {
    companyName: intake.companyName,
    websiteUrl: intake.websiteUrl,
    industry: intake.industry,
    businessType: intake.businessType,
    businessDescription: intake.businessDescription,
    stage: intake.stage,
    primaryGoals: intake.primaryGoals ?? [],
    personas: intake.personas ?? [],
    competitors: intake.competitors ?? [],
    socialPrMode: intake.socialPrMode,
  };
}

type Deps = { requireAuth: any };

export function startupGarageRoute(deps: Deps) {
  const r = Router();
  const service = new StartupGarageService();

  const StatelessGenerateRequest = z.object({
    intake: StartupGarageIntake.extend({
      modules: z.array(StartupGarageModuleKey).min(1),
    }),
  });

  r.post("/generate", deps.requireAuth, async (req: any, res: any) => {
    try {
      const parsed = StatelessGenerateRequest.parse(req.body);
      const intake = parsed.intake;
      const plan = normalizeServicePlan(intake);

      const modules = (intake as any).modules.filter((m: string) =>
        StartupGarageModuleKey.options.includes(m as any)
      ) as StartupGarageModuleKeyT[];

      if (modules.length === 0) {
        return res.status(400).json({ message: "No valid modules selected" });
      }

      if (plan.websiteUrl && isPrivateUrl(plan.websiteUrl)) {
        return res.status(400).json({ message: "Cannot audit private/internal URLs" });
      }

      const outputs: Record<string, any> = {};
      for (const moduleKey of modules) {
        outputs[moduleKey] = await service.generateModule(plan as any, moduleKey as any);
      }

      return res.json({ outputs });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: err.errors });
      }
      console.error("[startupGarage] generate error", err);
      return res.status(400).json({ message: err?.message || "Failed to generate Start-up Garage outputs" });
    }
  });

  r.get("/plans", deps.requireAuth, async (req: any, res: any) => {
    try {
      const userId = req.session.user!.id;
      const plans = await storage.getStartupGaragePlans(userId);
      res.json(plans);
    } catch (e: any) {
      res.status(500).json({ message: e.message ?? "Failed to fetch plans" });
    }
  });

  r.post("/plans", deps.requireAuth, async (req: any, res: any) => {
    try {
      const parsed = createPlanSchema.parse(req.body);
      const userId = req.session.user!.id;
      const data = {
        ...parsed,
        userId,
        title: parsed.title || `${parsed.companyName} — Start-up Garage Plan`,
      };
      const plan = await storage.createStartupGaragePlan(data);
      res.json(plan);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: e.errors });
      }
      res.status(400).json({ message: e.message ?? "Failed to create plan" });
    }
  });

  r.get("/plans/:id", deps.requireAuth, async (req: any, res: any) => {
    try {
      const plan = await storage.getStartupGaragePlan(req.params.id);
      if (!plan) return res.status(404).json({ message: "Plan not found" });
      const userId = req.session.user!.id;
      const isAdmin = req.session.user!.role === "admin";
      if (plan.userId !== userId && !isAdmin) {
        return res.status(403).json({ message: "Forbidden" });
      }
      const outputs = await storage.getStartupGarageOutputs(plan.id);
      res.json({ ...plan, outputs });
    } catch (e: any) {
      res.status(500).json({ message: e.message ?? "Failed to fetch plan" });
    }
  });

  r.patch("/plans/:id", deps.requireAuth, async (req: any, res: any) => {
    try {
      const plan = await storage.getStartupGaragePlan(req.params.id);
      if (!plan) return res.status(404).json({ message: "Plan not found" });
      const userId = req.session.user!.id;
      if (plan.userId !== userId && req.session.user!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const updated = await storage.updateStartupGaragePlan(plan.id, req.body);
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message ?? "Failed to update plan" });
    }
  });

  r.delete("/plans/:id", deps.requireAuth, async (req: any, res: any) => {
    try {
      const plan = await storage.getStartupGaragePlan(req.params.id);
      if (!plan) return res.status(404).json({ message: "Plan not found" });
      const userId = req.session.user!.id;
      if (plan.userId !== userId && req.session.user!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      await storage.deleteStartupGaragePlan(plan.id);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message ?? "Failed to delete plan" });
    }
  });

  r.get("/plans/:id/outputs", deps.requireAuth, async (req: any, res: any) => {
    try {
      const plan = await storage.getStartupGaragePlan(req.params.id);
      if (!plan) return res.status(404).json({ message: "Plan not found" });
      const userId = req.session.user!.id;
      if (plan.userId !== userId && req.session.user!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const outputs = await storage.getStartupGarageOutputs(plan.id);
      res.json(outputs);
    } catch (e: any) {
      res.status(500).json({ message: e.message ?? "Failed to fetch outputs" });
    }
  });

  r.get("/plans/:id/outputs/:moduleKey", deps.requireAuth, async (req: any, res: any) => {
    try {
      const plan = await storage.getStartupGaragePlan(req.params.id);
      if (!plan) return res.status(404).json({ message: "Plan not found" });
      const userId = req.session.user!.id;
      if (plan.userId !== userId && req.session.user!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const output = await storage.getStartupGarageOutput(plan.id, req.params.moduleKey);
      if (!output) return res.status(404).json({ message: "Output not found" });
      res.json(output);
    } catch (e: any) {
      res.status(500).json({ message: e.message ?? "Failed to fetch output" });
    }
  });

  r.post("/plans/:id/generate", deps.requireAuth, async (req: any, res: any) => {
    try {
      const plan = await storage.getStartupGaragePlan(req.params.id);
      if (!plan) return res.status(404).json({ message: "Plan not found" });
      const userId = req.session.user!.id;
      if (plan.userId !== userId && req.session.user!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      const modules: string[] = (req.body.modules || plan.deliverablesRequested || []) as string[];
      const validKeys = StartupGarageModuleKey.options as readonly string[];
      const filteredModules = modules.filter((m) => validKeys.includes(m));
      if (filteredModules.length === 0) {
        return res.status(400).json({ message: "No modules selected for generation" });
      }

      await storage.updateStartupGaragePlan(plan.id, { status: "generating" } as any);

      const run = await storage.createStartupGarageRun({
        planId: plan.id,
        requestedModules: filteredModules,
        modelInfo: { model: "gpt-4o", version: "latest" },
        status: "running",
      });

      for (const moduleKey of filteredModules) {
        await storage.upsertStartupGarageOutput({
          planId: plan.id,
          moduleKey: moduleKey as any,
          status: "PENDING",
          content: null,
          sources: null,
          errorMessage: null,
        });
      }

      res.json({ runId: run.id, modules: filteredModules, status: "generating" });

      (async () => {
        let allSuccess = true;
        for (const moduleKey of filteredModules) {
          try {
            const content = await service.generateModule(plan, moduleKey);
            await storage.upsertStartupGarageOutput({
              planId: plan.id,
              moduleKey: moduleKey as any,
              status: "READY",
              content,
              sources: null,
              errorMessage: null,
            });
          } catch (err: any) {
            allSuccess = false;
            await storage.upsertStartupGarageOutput({
              planId: plan.id,
              moduleKey: moduleKey as any,
              status: "ERROR",
              content: null,
              sources: null,
              errorMessage: err.message ?? "Generation failed",
            });
          }
        }

        await storage.updateStartupGarageRun(run.id, {
          status: allSuccess ? "completed" : "failed",
          finishedAt: new Date(),
        } as any);

        await storage.updateStartupGaragePlan(plan.id, {
          status: allSuccess ? "complete" : "error",
        } as any);
      })().catch(console.error);
    } catch (e: any) {
      res.status(500).json({ message: e.message ?? "Failed to start generation" });
    }
  });

  r.post("/audit/website", deps.requireAuth, async (req: any, res: any) => {
    try {
      const { websiteUrl } = req.body;
      if (!websiteUrl) {
        return res.status(400).json({ message: "websiteUrl is required" });
      }
      if (isPrivateUrl(websiteUrl)) {
        return res.status(400).json({ message: "Cannot audit private/internal URLs" });
      }
      const result = await service.generateModule(
        { websiteUrl, companyName: "Ad-hoc Audit", businessDescription: "", industry: "", businessType: "" },
        "WEBSITE_AUDIT"
      );
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message ?? "Website audit failed" });
    }
  });

  return r;
}
