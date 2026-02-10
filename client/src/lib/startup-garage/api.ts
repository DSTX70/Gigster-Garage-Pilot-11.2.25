import {
  CreateStartupGaragePlanResponse,
  CreateStartupGaragePlanRequest,
  ListStartupGaragePlansResponse,
  GetStartupGaragePlanResponse,
  GenerateStartupGarageOutputsRequest,
  GenerateStartupGarageOutputsResponse,
  ListStartupGarageOutputsResponse,
  ListStartupGarageRunsResponse,
  StartupGarageIntakeAuditResponse,
  UpdateStartupGaragePlanIntakeRequest,
  UpdateStartupGaragePlanIntakeResponse,
  ActionPlanToTasksRequest,
  ActionPlanToTasksResponse,
} from "../../../../shared/contracts/startupGarage";

async function jsonFetch(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Request failed (${res.status})`);
  }
  return res.json();
}

export async function listPlans() {
  const json = await jsonFetch("/api/startup-garage/plans");
  return ListStartupGaragePlansResponse.parse(json);
}

export async function createPlan(body: unknown) {
  const parsed = CreateStartupGaragePlanRequest.parse(body);
  const json = await jsonFetch("/api/startup-garage/plans", { method: "POST", body: JSON.stringify(parsed) });
  return CreateStartupGaragePlanResponse.parse(json);
}

export async function getPlan(planId: string) {
  const json = await jsonFetch(`/api/startup-garage/plans/${planId}`);
  return GetStartupGaragePlanResponse.parse(json);
}

export async function generate(planId: string, body: unknown) {
  const parsed = GenerateStartupGarageOutputsRequest.parse(body);
  const json = await jsonFetch(`/api/startup-garage/plans/${planId}/generate`, {
    method: "POST",
    body: JSON.stringify(parsed),
  });
  return GenerateStartupGarageOutputsResponse.parse(json);
}

export async function listOutputs(planId: string) {
  const json = await jsonFetch(`/api/startup-garage/plans/${planId}/outputs`);
  return ListStartupGarageOutputsResponse.parse(json);
}

export async function listRuns(planId: string) {
  const json = await jsonFetch(`/api/startup-garage/plans/${planId}/runs`);
  return ListStartupGarageRunsResponse.parse(json);
}

export async function intakeAudit(planId: string) {
  const json = await jsonFetch(`/api/startup-garage/plans/${planId}/intake-audit`);
  return StartupGarageIntakeAuditResponse.parse(json);
}

export async function updateIntake(planId: string, body: unknown) {
  const parsed = UpdateStartupGaragePlanIntakeRequest.parse(body);
  const json = await jsonFetch(`/api/startup-garage/plans/${planId}/intake`, { method: "PATCH", body: JSON.stringify(parsed) });
  return UpdateStartupGaragePlanIntakeResponse.parse(json);
}

export async function actionPlanToTasks(planId: string, body: unknown) {
  const parsed = ActionPlanToTasksRequest.parse(body);
  const json = await jsonFetch(`/api/startup-garage/plans/${planId}/action-plan/to-tasks`, { method: "POST", body: JSON.stringify(parsed) });
  return ActionPlanToTasksResponse.parse(json);
}
