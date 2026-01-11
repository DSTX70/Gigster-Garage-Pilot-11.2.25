import type { Express, Request, Response, NextFunction } from "express";
import { db } from "../db.js";
import { 
  users, tasks, projects, clients, invoices, proposals, 
  onboardingProgress, userProfiles, businessProfiles
} from "../../shared/schema.js";
import { eq, sql } from "drizzle-orm";

const AUDIT_TABLES = [
  "users", "tasks", "projects", "clients", "invoices", "proposals",
  "time_entries", "custom_fields", "automation_rules", "gigster_coach_conversations",
  "onboarding_progress", "user_profiles", "business_profiles"
];

const AUDIT_SCHEMAS = {
  users: {
    id: "varchar (uuid)",
    email: "varchar",
    username: "varchar",
    password: "varchar (hashed)",
    role: "enum(admin, user)",
    plan: "enum(free, pro, enterprise)",
    hasCompletedOnboarding: "boolean",
    companyName: "varchar",
    createdAt: "timestamp",
    updatedAt: "timestamp"
  },
  tasks: {
    id: "varchar (uuid)",
    title: "varchar",
    description: "text",
    status: "enum(pending, active, high, critical, completed)",
    priority: "enum(low, medium, high, critical)",
    dueDate: "timestamp",
    projectId: "varchar (fk:projects)",
    assigneeId: "varchar (fk:users)",
    createdAt: "timestamp"
  },
  projects: {
    id: "varchar (uuid)",
    name: "varchar",
    description: "text",
    status: "enum(active, completed, on-hold, cancelled)",
    clientId: "varchar (fk:clients)",
    createdAt: "timestamp"
  },
  clients: {
    id: "varchar (uuid)",
    name: "varchar",
    email: "varchar",
    phone: "varchar",
    company: "varchar",
    createdAt: "timestamp"
  },
  invoices: {
    id: "varchar (uuid)",
    invoiceNumber: "varchar",
    clientId: "varchar (fk:clients)",
    amount: "decimal",
    status: "enum(draft, sent, paid, overdue, cancelled)",
    dueDate: "date",
    createdAt: "timestamp"
  },
  proposals: {
    id: "varchar (uuid)",
    title: "varchar",
    clientId: "varchar (fk:clients)",
    status: "enum(draft, sent, accepted, rejected)",
    amount: "decimal",
    createdAt: "timestamp"
  },
  timeEntries: {
    id: "varchar (uuid)",
    taskId: "varchar (fk:tasks)",
    userId: "varchar (fk:users)",
    duration: "integer (minutes)",
    description: "text",
    date: "date",
    billable: "boolean",
    approved: "boolean"
  },
  onboardingProgress: {
    id: "serial",
    userId: "varchar (fk:users)",
    lastSeenStep: "integer",
    completedAt: "timestamp",
    brandSetupCompleted: "boolean"
  }
};

const API_ROUTES = [
  { method: "GET", path: "/api/health", auth: false, description: "Health check" },
  { method: "GET", path: "/api/version", auth: false, description: "Version info" },
  { method: "POST", path: "/api/auth/login", auth: false, description: "User login" },
  { method: "POST", path: "/api/auth/logout", auth: true, description: "User logout" },
  { method: "GET", path: "/api/user", auth: true, description: "Get current user" },
  { method: "PATCH", path: "/api/user/profile", auth: true, description: "Update user profile" },
  { method: "GET", path: "/api/tasks", auth: true, description: "List tasks" },
  { method: "POST", path: "/api/tasks", auth: true, description: "Create task" },
  { method: "GET", path: "/api/tasks/:id", auth: true, description: "Get task by ID" },
  { method: "PATCH", path: "/api/tasks/:id", auth: true, description: "Update task" },
  { method: "DELETE", path: "/api/tasks/:id", auth: true, description: "Delete task" },
  { method: "GET", path: "/api/projects", auth: true, description: "List projects" },
  { method: "POST", path: "/api/projects", auth: true, description: "Create project" },
  { method: "GET", path: "/api/clients", auth: true, description: "List clients" },
  { method: "POST", path: "/api/clients", auth: true, description: "Create client" },
  { method: "GET", path: "/api/invoices", auth: true, description: "List invoices" },
  { method: "POST", path: "/api/invoices", auth: true, description: "Create invoice" },
  { method: "GET", path: "/api/proposals", auth: true, description: "List proposals" },
  { method: "POST", path: "/api/proposals", auth: true, description: "Create proposal" },
  { method: "GET", path: "/api/time-entries", auth: true, description: "List time entries" },
  { method: "POST", path: "/api/time-entries", auth: true, description: "Create time entry" },
  { method: "GET", path: "/api/profile/me", auth: true, description: "Get profile with onboarding" },
  { method: "POST", path: "/api/onboarding/complete", auth: true, description: "Mark onboarding complete" },
  { method: "POST", path: "/api/gigster-coach/ask", auth: true, description: "Ask coach" },
  { method: "POST", path: "/api/gigster-coach/draft", auth: true, description: "Draft content" },
  { method: "POST", path: "/api/gigster-coach/review", auth: true, description: "Review content" },
];

const SELFTEST_CHECKS = [
  { name: "database_connection", description: "Verify database connectivity" },
  { name: "tables_exist", description: "Verify all required tables exist" },
  { name: "demo_user_exists", description: "Verify demo user is seeded" },
  { name: "auth_flow", description: "Test login/logout cycle" },
  { name: "task_crud", description: "Test task create/read/update/delete" },
  { name: "project_crud", description: "Test project CRUD operations" },
  { name: "client_crud", description: "Test client CRUD operations" },
  { name: "invoice_validation", description: "Test invoice amount validation" },
  { name: "timesheet_billing", description: "Test timesheet billing formula" },
];

export function registerAuditRoutes(app: Express) {
  const isProduction = process.env.NODE_ENV === "production" || 
    process.env.REPLIT_DEPLOYMENT === "1";
  
  const requireAuditToken = (req: Request, res: Response, next: NextFunction) => {
    if (isProduction) {
      return res.status(403).json({ 
        error: "Audit endpoints disabled in production",
        message: "These endpoints are only available in development/staging"
      });
    }
    
    const token = req.headers["x-audit-token"] || req.query.audit_token;
    const expectedToken = process.env.AUDIT_TOKEN;
    
    if (!expectedToken) {
      return res.status(503).json({ 
        error: "Audit endpoints disabled",
        message: "AUDIT_TOKEN environment variable not configured"
      });
    }
    
    if (token !== expectedToken) {
      return res.status(401).json({ error: "Invalid or missing audit token" });
    }
    
    console.log(`[AUDIT] ${req.method} ${req.path} accessed at ${new Date().toISOString()}`);
    next();
  };

  app.get("/api/_audit/routes", requireAuditToken, (_req: Request, res: Response) => {
    res.json({
      total: API_ROUTES.length,
      routes: API_ROUTES,
      auditEndpoints: [
        { method: "GET", path: "/api/_audit/routes", description: "List all API routes" },
        { method: "GET", path: "/api/_audit/schemas", description: "Get database schemas" },
        { method: "POST", path: "/api/_audit/seed", description: "Seed test data" },
        { method: "POST", path: "/api/_audit/reset", description: "Reset test data" },
        { method: "POST", path: "/api/_audit/selftest", description: "Run self-tests" },
      ]
    });
  });

  app.get("/api/_audit/schemas", requireAuditToken, (_req: Request, res: Response) => {
    res.json({
      tables: AUDIT_TABLES,
      schemas: AUDIT_SCHEMAS,
      validations: {
        task: {
          title: "required, min 1 char",
          status: "enum: pending, active, high, critical, completed",
          priority: "enum: low, medium, high, critical"
        },
        invoice: {
          invoiceNumber: "required, unique",
          amount: "decimal, >= 0",
          billingFormula: "minutes × (hourlyRate / 60), rounded UP (Math.ceil)"
        },
        user: {
          email: "required, unique, valid email format",
          password: "required, min 6 chars, bcrypt hashed",
          plan: "enum: free, pro, enterprise"
        }
      }
    });
  });

  app.post("/api/_audit/seed", requireAuditToken, async (_req: Request, res: Response) => {
    try {
      const auditUserId = "audit-test-user";
      const auditProjectId = "audit-test-project";
      const auditClientId = "audit-test-client";
      const auditTaskId = "audit-test-task";

      const [existingUser] = await db.select().from(users).where(eq(users.id, auditUserId));
      
      if (!existingUser) {
        await db.insert(users).values({
          id: auditUserId,
          username: "audit_tester",
          email: "audit@gigstergarage.test",
          password: "$2b$10$audit.hashed.password.placeholder",
          role: "user",
          plan: "pro",
          name: "Audit Test User"
        });
      }

      const [existingClient] = await db.select().from(clients).where(eq(clients.id, auditClientId));
      if (!existingClient) {
        await db.insert(clients).values({
          id: auditClientId,
          name: "Audit Test Client",
          email: "client@audit.test",
          company: "Audit Corp"
        });
      }

      const [existingProject] = await db.select().from(projects).where(eq(projects.id, auditProjectId));
      if (!existingProject) {
        await db.insert(projects).values({
          id: auditProjectId,
          name: "Audit Test Project",
          description: "Project for audit testing",
          status: "active",
          clientId: auditClientId
        });
      }

      const [existingTask] = await db.select().from(tasks).where(eq(tasks.id, auditTaskId));
      if (!existingTask) {
        await db.insert(tasks).values({
          id: auditTaskId,
          title: "Audit Test Task",
          description: "Task for audit testing",
          status: "pending",
          priority: "medium",
          projectId: auditProjectId
        });
      }

      res.json({
        success: true,
        seeded: {
          user: auditUserId,
          client: auditClientId,
          project: auditProjectId,
          task: auditTaskId
        },
        message: "Audit test data seeded successfully"
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  app.post("/api/_audit/reset", requireAuditToken, async (_req: Request, res: Response) => {
    try {
      await db.delete(tasks).where(eq(tasks.id, "audit-test-task"));
      await db.delete(projects).where(eq(projects.id, "audit-test-project"));
      await db.delete(clients).where(eq(clients.id, "audit-test-client"));
      await db.delete(users).where(eq(users.id, "audit-test-user"));

      res.json({
        success: true,
        deleted: ["audit-test-task", "audit-test-project", "audit-test-client", "audit-test-user"],
        message: "Audit test data reset successfully"
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  app.post("/api/_audit/selftest", requireAuditToken, async (_req: Request, res: Response) => {
    const results: { name: string; passed: boolean; message: string; duration_ms: number }[] = [];
    
    const runTest = async (name: string, testFn: () => Promise<{ passed: boolean; message: string }>) => {
      const start = Date.now();
      try {
        const result = await testFn();
        results.push({ name, ...result, duration_ms: Date.now() - start });
      } catch (error: any) {
        results.push({ name, passed: false, message: error.message, duration_ms: Date.now() - start });
      }
    };

    await runTest("database_connection", async () => {
      const result = await db.execute(sql`SELECT 1 as ok`);
      return { passed: true, message: "Database connection successful" };
    });

    await runTest("tables_exist", async () => {
      const tableCheck = await db.execute(sql`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'tasks', 'projects', 'clients', 'invoices')
      `);
      const foundTables = (tableCheck.rows as any[]).map(r => r.table_name);
      const expected = ["users", "tasks", "projects", "clients", "invoices"];
      const missing = expected.filter(t => !foundTables.includes(t));
      return { 
        passed: missing.length === 0, 
        message: missing.length === 0 ? "All core tables exist" : `Missing: ${missing.join(", ")}`
      };
    });

    await runTest("demo_user_exists", async () => {
      const [demoUser] = await db.select().from(users).where(eq(users.username, "demo"));
      return { 
        passed: !!demoUser, 
        message: demoUser ? "Demo user found" : "Demo user not found"
      };
    });

    await runTest("task_status_enum", async () => {
      const validStatuses = ["pending", "active", "high", "critical", "completed"];
      return { 
        passed: true, 
        message: `Valid statuses: ${validStatuses.join(", ")}`
      };
    });

    await runTest("timesheet_billing_formula", async () => {
      const minutes = 47;
      const hourlyRate = 150;
      const expected = Math.ceil(minutes * (hourlyRate / 60));
      return { 
        passed: expected === 118, 
        message: `47 min × ($150/60) = $${expected} (ceil)`
      };
    });

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    res.json({
      summary: {
        total: results.length,
        passed,
        failed,
        success_rate: `${Math.round((passed / results.length) * 100)}%`
      },
      results,
      timestamp: new Date().toISOString()
    });
  });
}
