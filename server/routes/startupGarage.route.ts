import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import {
  CreateStartupGaragePlanRequest,
  CreateStartupGaragePlanResponse,
  GenerateStartupGarageOutputsRequest,
  GenerateStartupGarageOutputsResponse,
  GetStartupGaragePlanResponse,
  GetStartupGarageOutputResponse,
  ListStartupGaragePlansResponse,
  ListStartupGarageOutputsResponse,
  ListStartupGarageRunsResponse,
  StartupGarageModuleKey,
  StartupGarageIntakeAuditResponse,
  UpdateStartupGaragePlanIntakeRequest,
  UpdateStartupGaragePlanIntakeResponse,
  ActionPlanToTasksRequest,
  ActionPlanToTasksResponse,
} from "../../shared/contracts/startupGarage.js";
import { StartupGaragePlanService } from "../services/startupGaragePlan.service.js";
import { StartupGarageIntakeAuditService } from "../services/startupGarageIntakeAudit.service.js";
import { generateStartupGaragePDF, generateStartupGarageDocx } from "../services/startupGarageExport.service.js";
import { db } from "../db.js";
import { tasks } from "../../shared/schema.js";

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
        geography: (plan as any).geoFocus ?? {},
        offer: (plan as any).offer ?? {},
        targetSegments: (plan as any).targetSegments ?? [],
        personas: (plan as any).personas ?? [],
        competitors: (plan as any).competitors ?? [],
        vendorsAndSourcing: (plan as any).vendorsAndSourcing ?? {},
        websiteGoals: (plan as any).websiteGoals ?? {},
        brandAssets: (plan as any).brandAssets ?? {},
        socialHandles: (plan as any).socialHandles ?? {},
        postingCapacity: (plan as any).postingCapacity ?? "MED",
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

  r.get("/plans/:planId/export/pdf", deps.requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const planId = String(req.params.planId);
      const plan = await svc.getPlanOrThrow(userId, planId);
      const outputs = await svc.listOutputs(userId, planId);

      const readyOutputs = (outputs as any[]).filter((o) => o.status === "READY");
      const buf = await generateStartupGaragePDF(
        (plan as any).title,
        (plan as any).companyName,
        readyOutputs
      );

      const filename = `${((plan as any).companyName || "plan").replace(/[^a-zA-Z0-9]/g, "_")}_Business_Plan.pdf`;
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(buf);
    } catch (err: any) {
      console.error("[startupGarage] export PDF error", err);
      return res.status(400).json({ message: err?.message || "Failed to export PDF" });
    }
  });

  r.get("/plans/:planId/export/docx", deps.requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const planId = String(req.params.planId);
      const plan = await svc.getPlanOrThrow(userId, planId);
      const outputs = await svc.listOutputs(userId, planId);

      const readyOutputs = (outputs as any[]).filter((o) => o.status === "READY");
      const buf = await generateStartupGarageDocx(
        (plan as any).title,
        (plan as any).companyName,
        readyOutputs
      );

      const filename = `${((plan as any).companyName || "plan").replace(/[^a-zA-Z0-9]/g, "_")}_Business_Plan.docx`;
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.send(buf);
    } catch (err: any) {
      console.error("[startupGarage] export DOCX error", err);
      return res.status(400).json({ message: err?.message || "Failed to export DOCX" });
    }
  });

  r.get("/plans/:planId/intake-audit", deps.requireAuth, async (req, res) => {
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
        geography: (plan as any).geoFocus ?? undefined,
        offer: (plan as any).offer ?? undefined,
        targetSegments: (plan as any).targetSegments ?? [],
        personas: (plan as any).personas ?? [],
        competitors: (plan as any).competitors ?? [],
        vendorsAndSourcing: (plan as any).vendorsAndSourcing ?? undefined,
        websiteGoals: (plan as any).websiteGoals ?? undefined,
        brandAssets: (plan as any).brandAssets ?? undefined,
        socialHandles: (plan as any).socialHandles ?? undefined,
        postingCapacity: (plan as any).postingCapacity ?? undefined,
        socialPrMode: (plan as any).socialPrMode ?? "BOTH",
      };

      const auditSvc = new StartupGarageIntakeAuditService();
      const audit = auditSvc.audit(intake as any);

      return res.json(StartupGarageIntakeAuditResponse.parse(audit));
    } catch (err: any) {
      console.error("[startupGarage] intake audit error", err);
      return res.status(400).json({ message: err?.message || "Failed to run intake audit" });
    }
  });

  r.patch("/plans/:planId/intake", deps.requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });
      const planId = String(req.params.planId);

      const parsed = UpdateStartupGaragePlanIntakeRequest.parse(req.body);
      await svc.updatePlanIntake(userId, planId, parsed.patch, parsed.backfillCoreIntake);

      return res.json(UpdateStartupGaragePlanIntakeResponse.parse({ planId, updated: true }));
    } catch (err: any) {
      console.error("[startupGarage] update intake error", err);
      return res.status(400).json({ message: err?.message || "Failed to update plan intake" });
    }
  });

  r.post("/plans/:planId/action-plan/to-tasks", deps.requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const planId = String(req.params.planId);
      const parsed = ActionPlanToTasksRequest.parse(req.body);

      await svc.getPlanOrThrow(userId, planId);

      const actionOut = await svc.getOutputOrThrow(userId, planId, "ACTION_30_60_90" as any);
      if ((actionOut as any).status !== "READY" || !(actionOut as any).content) {
        return res.status(400).json({ message: "ACTION_30_60_90 output not ready" });
      }

      const sourceLink = `startup-garage://plan/${planId}#ACTION_30_60_90`;
      const [dupCheck] = await db.select({ cnt: sql<number>`count(*)::int` })
        .from(tasks)
        .where(sql`${tasks.links}::jsonb @> ${JSON.stringify([sourceLink])}::jsonb`);
      if (dupCheck && dupCheck.cnt > 0) {
        return res.status(409).json({ message: "Tasks from this action plan have already been created. Delete existing tasks first to re-import." });
      }

      const content = (actionOut as any).content || {};
      const days30 = Array.isArray(content.days30) ? content.days30 : [];
      const days60 = Array.isArray(content.days60) ? content.days60 : [];
      const days90 = Array.isArray(content.days90) ? content.days90 : [];

      const createdTaskIds: string[] = [];
      const createdById = userId;
      const assignedToId = parsed.assignToSelf ? userId : null;

      const dueDateFor = (bucket: "30"|"60"|"90") => {
        const d = new Date();
        const add = bucket === "30" ? 30 : bucket === "60" ? 60 : 90;
        d.setDate(d.getDate() + add);
        return d;
      }

      const insertItems = async (items: any[], bucket: "30"|"60"|"90") => {
        for (const item of items) {
          const title = item.title || item.name || `Action item (${bucket}d)`;
          const details = item.details || item.description || "";
          const dod = item.definitionOfDone ? `\n\nDefinition of Done:\n- ${item.definitionOfDone}` : "";
          const deps = Array.isArray(item.dependencies) && item.dependencies.length
            ? `\n\nDependencies:\n- ${item.dependencies.join("\n- ")}`
            : "";
          const owner = item.owner ? `\n\nOwner (pod): ${item.owner}` : "";
          const source = `\n\nSource: Start-up Garage plan ${planId} (ACTION_30_60_90)`;

          const notes = (item.notes || "") + owner + source;

          const links = [
            ...(Array.isArray(item.links) ? item.links : []),
            `startup-garage://plan/${planId}#ACTION_30_60_90`,
          ];

          const [row] = await db.insert(tasks).values({
            title,
            description: `${details}${dod}${deps}`.trim() || null,
            status: "pending",
            priority: parsed.priorityDefault,
            dueDate: dueDateFor(bucket),
            assignedToId: assignedToId as any,
            createdById: createdById as any,
            notes: notes || null,
            links,
            completed: false,
            updatedAt: new Date(),
          } as any).returning({ id: tasks.id });

          createdTaskIds.push(row.id);
        }
      }

      await insertItems(days30, "30");
      await insertItems(days60, "60");
      await insertItems(days90, "90");

      return res.json(ActionPlanToTasksResponse.parse({
        createdTaskIds,
        counts: { days30: days30.length, days60: days60.length, days90: days90.length },
      }));
    } catch (err: any) {
      console.error("[startupGarage] action-plan to tasks error", err);
      return res.status(400).json({ message: err?.message || "Failed to create tasks from action plan" });
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
