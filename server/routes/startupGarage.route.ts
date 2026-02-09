import { Router } from "express";
import {
  CreateStartupGaragePlanRequest,
  CreateStartupGaragePlanResponse,
  GenerateStartupGarageOutputsRequest,
  GenerateStartupGarageOutputsResponse,
  GetStartupGaragePlanResponse,
  ListStartupGaragePlansResponse,
  ListStartupGarageOutputsResponse,
  GetStartupGarageOutputResponse,
  ListStartupGarageRunsResponse,
  StartupGarageModuleKey,
} from "../../shared/contracts/startupGarage.js";
import { StartupGaragePlanService } from "../services/startupGaragePlan.service.js";

type Deps = {
  requireAuth: (req: any, res: any, next: any) => any;
};

function getUserId(req: any) {
  return req?.user?.id || req?.session?.user?.id;
}

export function startupGarageRoute(deps: Deps) {
  const r = Router();
  const svc = new StartupGaragePlanService();

  r.post("/plans", deps.requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const parsed = CreateStartupGaragePlanRequest.parse(req.body);
      const { planId } = await svc.createPlan(userId, parsed.intake);

      return res.json(CreateStartupGaragePlanResponse.parse({ planId }));
    } catch (err: any) {
      console.error("[startupGarage] create plan error", err);
      return res.status(400).json({ message: err?.message || "Failed to create plan" });
    }
  });

  r.get("/plans", deps.requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const plans = await svc.listPlans(userId);
      return res.json(ListStartupGaragePlansResponse.parse({ plans }));
    } catch (err: any) {
      console.error("[startupGarage] list plans error", err);
      return res.status(400).json({ message: err?.message || "Failed to list plans" });
    }
  });

  r.get("/plans/:planId", deps.requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const planId = String(req.params.planId);
      const plan = await svc.getPlanOrThrow(userId, planId);

      const intake = {
        companyName: (plan as any).companyName,
        websiteUrl: (plan as any).websiteUrl ?? undefined,
        industry: (plan as any).industry,
        businessType: (plan as any).businessType,
        businessDescription: (plan as any).businessDescription,
        stage: (plan as any).stage ?? undefined,
        primaryGoals: (plan as any).primaryGoals ?? [],
        personas: (plan as any).personas ?? [],
        competitors: (plan as any).competitors ?? [],
        socialPrMode: (plan as any).socialPrMode ?? "BOTH",
      };

      return res.json(
        GetStartupGaragePlanResponse.parse({
          plan: {
            id: (plan as any).id,
            userId: (plan as any).userId,
            title: (plan as any).title,
            status: (plan as any).status,
            intake,
            createdAt: (plan as any).createdAt,
            updatedAt: (plan as any).updatedAt,
          },
        })
      );
    } catch (err: any) {
      console.error("[startupGarage] get plan error", err);
      return res.status(404).json({ message: err?.message || "Plan not found" });
    }
  });

  r.post("/plans/:planId/generate", deps.requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const planId = String(req.params.planId);
      const parsed = GenerateStartupGarageOutputsRequest.parse(req.body);

      const modules = parsed.modules.filter((m) => StartupGarageModuleKey.options.includes(m as any));

      const result = await svc.generateModules(userId, planId, modules as any);

      return res.json(
        GenerateStartupGarageOutputsResponse.parse({
          runId: result.runId,
          outputs: result.outputs,
        })
      );
    } catch (err: any) {
      console.error("[startupGarage] generate error", err);
      return res.status(400).json({ message: err?.message || "Failed to generate outputs" });
    }
  });

  r.get("/plans/:planId/outputs", deps.requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const planId = String(req.params.planId);
      const outputs = await svc.listOutputs(userId, planId);

      return res.json(ListStartupGarageOutputsResponse.parse({ outputs }));
    } catch (err: any) {
      console.error("[startupGarage] list outputs error", err);
      return res.status(400).json({ message: err?.message || "Failed to list outputs" });
    }
  });

  r.get("/plans/:planId/outputs/:moduleKey", deps.requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const planId = String(req.params.planId);
      const moduleKey = StartupGarageModuleKey.parse(String(req.params.moduleKey));

      const output = await svc.getOutputOrThrow(userId, planId, moduleKey as any);
      return res.json(GetStartupGarageOutputResponse.parse({ output }));
    } catch (err: any) {
      console.error("[startupGarage] get output error", err);
      return res.status(404).json({ message: err?.message || "Output not found" });
    }
  });

  r.get("/plans/:planId/runs", deps.requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const planId = String(req.params.planId);
      const runs = await svc.listRuns(userId, planId);

      return res.json(ListStartupGarageRunsResponse.parse({ runs }));
    } catch (err: any) {
      console.error("[startupGarage] list runs error", err);
      return res.status(400).json({ message: err?.message || "Failed to list runs" });
    }
  });

  return r;
}
