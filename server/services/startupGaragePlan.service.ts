import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../db.js";
import {
  startupGaragePlans,
  startupGarageOutputs,
  startupGarageRuns,
} from "../../shared/schema.js";
import { StartupGarageService } from "./startupGarage.service.js";
import type { StartupGarageModuleKey } from "../../shared/contracts/startupGarage.js";

type PlanRow = typeof startupGaragePlans.$inferSelect;
type OutputRow = typeof startupGarageOutputs.$inferSelect;

function now() {
  return new Date();
}

export class StartupGaragePlanService {
  async createPlan(userId: string, intake: any): Promise<{ planId: string }> {
    const title = `${intake.companyName} — Start-up Garage Plan`;
    const [row] = await db
      .insert(startupGaragePlans)
      .values({
        userId,
        title,
        status: "draft",
        companyName: intake.companyName,
        websiteUrl: intake.websiteUrl ?? null,
        industry: intake.industry,
        businessType: intake.businessType,
        businessDescription: intake.businessDescription,
        stage: intake.stage ?? null,
        primaryGoals: intake.primaryGoals ?? [],
        personas: intake.personas ?? [],
        competitors: intake.competitors ?? [],
        socialPrMode: intake.socialPrMode ?? "BOTH",
        updatedAt: now(),
        createdAt: now(),
      } as any)
      .returning({ id: startupGaragePlans.id });

    return { planId: row.id };
  }

  async listPlans(userId: string) {
    const rows = await db
      .select({
        id: startupGaragePlans.id,
        title: startupGaragePlans.title,
        companyName: startupGaragePlans.companyName,
        industry: startupGaragePlans.industry,
        businessType: startupGaragePlans.businessType,
        status: startupGaragePlans.status,
        createdAt: startupGaragePlans.createdAt,
        updatedAt: startupGaragePlans.updatedAt,
      })
      .from(startupGaragePlans)
      .where(eq(startupGaragePlans.userId, userId))
      .orderBy(desc(startupGaragePlans.updatedAt));

    return rows;
  }

  async getPlanOrThrow(userId: string, planId: string): Promise<PlanRow> {
    const [plan] = await db
      .select()
      .from(startupGaragePlans)
      .where(and(eq(startupGaragePlans.id, planId), eq(startupGaragePlans.userId, userId)))
      .limit(1);

    if (!plan) throw new Error("Plan not found");
    return plan;
  }

  async listOutputs(userId: string, planId: string): Promise<OutputRow[]> {
    await this.getPlanOrThrow(userId, planId);
    return db
      .select()
      .from(startupGarageOutputs)
      .where(eq(startupGarageOutputs.planId, planId))
      .orderBy(desc(startupGarageOutputs.updatedAt));
  }

  async getOutputOrThrow(userId: string, planId: string, moduleKey: StartupGarageModuleKey): Promise<OutputRow> {
    await this.getPlanOrThrow(userId, planId);
    const [out] = await db
      .select()
      .from(startupGarageOutputs)
      .where(and(eq(startupGarageOutputs.planId, planId), eq(startupGarageOutputs.moduleKey, moduleKey as any)))
      .limit(1);

    if (!out) throw new Error("Output not found");
    return out;
  }

  async listRuns(userId: string, planId: string) {
    await this.getPlanOrThrow(userId, planId);
    return db
      .select()
      .from(startupGarageRuns)
      .where(eq(startupGarageRuns.planId, planId))
      .orderBy(desc(startupGarageRuns.startedAt));
  }

  private normalizePlanForGenerator(plan: PlanRow) {
    return {
      companyName: (plan as any).companyName,
      websiteUrl: (plan as any).websiteUrl,
      industry: (plan as any).industry,
      businessType: (plan as any).businessType,
      businessDescription: (plan as any).businessDescription,
      stage: (plan as any).stage,
      primaryGoals: (plan as any).primaryGoals ?? [],
      personas: (plan as any).personas ?? [],
      competitors: (plan as any).competitors ?? [],
      socialPrMode: (plan as any).socialPrMode ?? "BOTH",
      geoFocus: (plan as any).geoFocus,
      offer: (plan as any).offer,
      channels: (plan as any).channels,
      opsSourcing: (plan as any).opsSourcing,
    };
  }

  async generateModules(userId: string, planId: string, modules: StartupGarageModuleKey[]) {
    const plan = await this.getPlanOrThrow(userId, planId);

    const [run] = await db
      .insert(startupGarageRuns)
      .values({
        planId,
        requestedModules: modules,
        status: "running",
        startedAt: now(),
        modelInfo: null,
        finishedAt: null,
      } as any)
      .returning({ id: startupGarageRuns.id });

    await db
      .update(startupGaragePlans)
      .set({ status: "generating", updatedAt: now() } as any)
      .where(eq(startupGaragePlans.id, planId));

    await db
      .delete(startupGarageOutputs)
      .where(and(eq(startupGarageOutputs.planId, planId), inArray(startupGarageOutputs.moduleKey as any, modules as any)));

    await db.insert(startupGarageOutputs).values(
      modules.map((m) => ({
        planId,
        moduleKey: m as any,
        status: "PENDING",
        content: null,
        errorMessage: null,
        createdAt: now(),
        updatedAt: now(),
      })) as any
    );

    const generator = new StartupGarageService();
    const generatorPlan = this.normalizePlanForGenerator(plan);

    const outputs: OutputRow[] = [];

    try {
      for (const moduleKey of modules) {
        try {
          const content = await generator.generateModule(generatorPlan as any, moduleKey as any);

          const [saved] = await db
            .update(startupGarageOutputs)
            .set({
              status: "READY",
              content,
              errorMessage: null,
              updatedAt: now(),
            } as any)
            .where(and(eq(startupGarageOutputs.planId, planId), eq(startupGarageOutputs.moduleKey, moduleKey as any)))
            .returning();

          outputs.push(saved);
        } catch (moduleErr: any) {
          const [saved] = await db
            .update(startupGarageOutputs)
            .set({
              status: "ERROR",
              content: null,
              errorMessage: moduleErr?.message || String(moduleErr),
              updatedAt: now(),
            } as any)
            .where(and(eq(startupGarageOutputs.planId, planId), eq(startupGarageOutputs.moduleKey, moduleKey as any)))
            .returning();

          outputs.push(saved);
        }
      }

      const anyError = outputs.some((o) => (o as any).status === "ERROR");
      await db
        .update(startupGaragePlans)
        .set({ status: anyError ? "error" : "complete", updatedAt: now() } as any)
        .where(eq(startupGaragePlans.id, planId));

      await db
        .update(startupGarageRuns)
        .set({ status: anyError ? "failed" : "completed", finishedAt: now() } as any)
        .where(eq(startupGarageRuns.id, run.id));

      return { runId: run.id, outputs };
    } catch (err: any) {
      await db
        .update(startupGaragePlans)
        .set({ status: "error", updatedAt: now() } as any)
        .where(eq(startupGaragePlans.id, planId));

      await db
        .update(startupGarageRuns)
        .set({ status: "failed", finishedAt: now() } as any)
        .where(eq(startupGarageRuns.id, run.id));

      throw err;
    }
  }
}
