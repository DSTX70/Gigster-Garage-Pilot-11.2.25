import { db } from "./db";
import { dthRegistry, dthSyncLogs, dthAccessLogs } from "@shared/schema";
import type { DthRegistry, InsertDthRegistry, DthSyncLog, InsertDthSyncLog, DthAccessLog, InsertDthAccessLog } from "@shared/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";
import path from "node:path";
import { promises as fs } from "node:fs";

const MAX_BYTES = 250_000;

const DEFAULT_ALLOWED_PREFIXES = ["client/", "server/", "shared/", "docs/"];
const DEFAULT_BLOCKED_PREFIXES = [".git", "node_modules", "dist", "build", ".env", ".replit", "replit.nix", ".config", ".ssh"];

function isBlocked(p: string, blockedPaths: string[]): boolean {
  const lower = p.toLowerCase();
  return blockedPaths.some((b) => lower.startsWith(b.toLowerCase()) || lower.includes(`/${b.toLowerCase()}`));
}

function normalizeSafeRelativePath(p: string, allowedPaths: string[], blockedPaths: string[]): string | null {
  if (!p || typeof p !== "string") return null;
  if (p.startsWith("http://") || p.startsWith("https://")) return null;
  if (path.isAbsolute(p)) return null;

  const norm = path.posix.normalize(p.replace(/\\/g, "/"));
  if (norm.startsWith("../") || norm.includes("/../") || norm === "..") return null;
  const cleanPath = norm.startsWith("./") ? norm.slice(2) : norm;

  if (!allowedPaths.some((pre) => cleanPath.startsWith(pre))) return null;
  if (isBlocked(cleanPath, blockedPaths)) return null;

  return cleanPath;
}

export type FileResult = { 
  path: string; 
  ok: boolean; 
  content?: string; 
  error?: string;
  size?: number;
};

export class DthService {
  async createRegistry(data: InsertDthRegistry): Promise<DthRegistry> {
    const [registry] = await db.insert(dthRegistry).values(data).returning();
    return registry;
  }

  async getRegistry(id: string): Promise<DthRegistry | undefined> {
    const [registry] = await db.select().from(dthRegistry).where(eq(dthRegistry.id, id));
    return registry;
  }

  async getAllRegistries(): Promise<DthRegistry[]> {
    return db.select().from(dthRegistry).orderBy(desc(dthRegistry.createdAt));
  }

  async getActiveRegistries(): Promise<DthRegistry[]> {
    return db.select().from(dthRegistry)
      .where(eq(dthRegistry.status, "active"))
      .orderBy(desc(dthRegistry.createdAt));
  }

  async updateRegistry(id: string, data: Partial<InsertDthRegistry>): Promise<DthRegistry | undefined> {
    const [updated] = await db.update(dthRegistry)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dthRegistry.id, id))
      .returning();
    return updated;
  }

  async deleteRegistry(id: string): Promise<boolean> {
    const result = await db.delete(dthRegistry).where(eq(dthRegistry.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async updateHealthStatus(id: string, status: "healthy" | "degraded" | "unhealthy" | "unknown"): Promise<void> {
    await db.update(dthRegistry)
      .set({ 
        healthStatus: status, 
        lastHealthCheck: new Date(),
        updatedAt: new Date()
      })
      .where(eq(dthRegistry.id, id));
  }

  async createSyncLog(data: InsertDthSyncLog): Promise<DthSyncLog> {
    const [log] = await db.insert(dthSyncLogs).values(data).returning();
    return log;
  }

  async updateSyncLog(id: string, data: Partial<DthSyncLog>): Promise<DthSyncLog | undefined> {
    const [updated] = await db.update(dthSyncLogs)
      .set(data)
      .where(eq(dthSyncLogs.id, id))
      .returning();
    return updated;
  }

  async getSyncLogs(registryId: string, limit = 50): Promise<DthSyncLog[]> {
    return db.select().from(dthSyncLogs)
      .where(eq(dthSyncLogs.registryId, registryId))
      .orderBy(desc(dthSyncLogs.startedAt))
      .limit(limit);
  }

  async getRecentSyncLogs(limit = 100): Promise<DthSyncLog[]> {
    return db.select().from(dthSyncLogs)
      .orderBy(desc(dthSyncLogs.startedAt))
      .limit(limit);
  }

  async logAccess(data: InsertDthAccessLog): Promise<DthAccessLog> {
    const [log] = await db.insert(dthAccessLogs).values(data).returning();
    return log;
  }

  async getAccessLogs(registryId: string, limit = 100): Promise<DthAccessLog[]> {
    return db.select().from(dthAccessLogs)
      .where(eq(dthAccessLogs.registryId, registryId))
      .orderBy(desc(dthAccessLogs.createdAt))
      .limit(limit);
  }

  async getRecentAccessLogs(limit = 100): Promise<DthAccessLog[]> {
    return db.select().from(dthAccessLogs)
      .orderBy(desc(dthAccessLogs.createdAt))
      .limit(limit);
  }

  async getAccessStats(registryId: string, since?: Date): Promise<{
    total: number;
    allowed: number;
    blocked: number;
    notFound: number;
    errors: number;
  }> {
    const conditions = registryId ? [eq(dthAccessLogs.registryId, registryId)] : [];
    if (since) {
      conditions.push(gte(dthAccessLogs.createdAt, since));
    }

    const logs = await db.select({
      accessResult: dthAccessLogs.accessResult,
      count: sql<number>`count(*)::int`
    })
    .from(dthAccessLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(dthAccessLogs.accessResult);

    const stats = {
      total: 0,
      allowed: 0,
      blocked: 0,
      notFound: 0,
      errors: 0
    };

    for (const row of logs) {
      const count = Number(row.count);
      stats.total += count;
      switch (row.accessResult) {
        case "allowed":
          stats.allowed = count;
          break;
        case "blocked":
          stats.blocked = count;
          break;
        case "not_found":
          stats.notFound = count;
          break;
        case "error":
        case "too_large":
          stats.errors += count;
          break;
      }
    }

    return stats;
  }

  async readFile(
    relPath: string, 
    registryId?: string,
    syncLogId?: string,
    clientIp?: string,
    userAgent?: string
  ): Promise<FileResult> {
    const registry = registryId ? await this.getRegistry(registryId) : null;
    const allowedPaths = (registry?.allowedPaths as string[]) || DEFAULT_ALLOWED_PREFIXES;
    const blockedPaths = (registry?.blockedPaths as string[]) || DEFAULT_BLOCKED_PREFIXES;
    
    const safe = normalizeSafeRelativePath(relPath, allowedPaths, blockedPaths);
    
    if (!safe) {
      await this.logAccess({
        registryId: registryId || null,
        syncLogId: syncLogId || null,
        requestedPath: relPath,
        normalizedPath: null,
        accessResult: "blocked",
        errorMessage: "Path not allowed",
        clientIp: clientIp || null,
        userAgent: userAgent || null,
      });
      return { path: relPath, ok: false, error: "Path not allowed" };
    }

    const abs = path.join(process.cwd(), safe);
    try {
      const st = await fs.stat(abs);
      if (!st.isFile()) {
        await this.logAccess({
          registryId: registryId || null,
          syncLogId: syncLogId || null,
          requestedPath: relPath,
          normalizedPath: safe,
          accessResult: "error",
          errorMessage: "Not a file",
          clientIp: clientIp || null,
          userAgent: userAgent || null,
        });
        return { path: safe, ok: false, error: "Not a file" };
      }
      
      if (st.size > MAX_BYTES) {
        await this.logAccess({
          registryId: registryId || null,
          syncLogId: syncLogId || null,
          requestedPath: relPath,
          normalizedPath: safe,
          accessResult: "too_large",
          fileSize: st.size,
          errorMessage: `File too large (${st.size} bytes, max ${MAX_BYTES})`,
          clientIp: clientIp || null,
          userAgent: userAgent || null,
        });
        return { path: safe, ok: false, error: "File too large" };
      }

      const content = await fs.readFile(abs, "utf-8");
      
      await this.logAccess({
        registryId: registryId || null,
        syncLogId: syncLogId || null,
        requestedPath: relPath,
        normalizedPath: safe,
        accessResult: "allowed",
        fileSize: st.size,
        clientIp: clientIp || null,
        userAgent: userAgent || null,
      });
      
      return { path: safe, ok: true, content, size: st.size };
    } catch (e: any) {
      const errorMsg = e?.code === "ENOENT" ? "File not found" : (e?.message || "Read failed");
      const result = e?.code === "ENOENT" ? "not_found" : "error";
      
      await this.logAccess({
        registryId: registryId || null,
        syncLogId: syncLogId || null,
        requestedPath: relPath,
        normalizedPath: safe,
        accessResult: result,
        errorMessage: errorMsg,
        clientIp: clientIp || null,
        userAgent: userAgent || null,
      });
      
      return { path: safe, ok: false, error: errorMsg };
    }
  }

  async readMultipleFiles(
    paths: string[], 
    registryId?: string,
    userId?: string
  ): Promise<{ files: FileResult[]; syncLog?: DthSyncLog }> {
    const startTime = Date.now();
    
    let syncLog: DthSyncLog | undefined;
    if (registryId) {
      syncLog = await this.createSyncLog({
        registryId,
        syncType: "files",
        status: "in_progress",
        filesRequested: paths.length,
        requestedPaths: paths,
        initiatedBy: userId ? "user" : "system",
        initiatedById: userId || null,
      });
    }

    const files = await Promise.all(
      paths.map((p) => this.readFile(String(p), registryId, syncLog?.id))
    );

    const succeeded = files.filter(f => f.ok).length;
    const failed = files.filter(f => !f.ok).length;
    const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);
    const failedPaths = files.filter(f => !f.ok).map(f => f.path);

    if (syncLog) {
      syncLog = await this.updateSyncLog(syncLog.id, {
        status: failed === 0 ? "completed" : (succeeded > 0 ? "completed" : "failed"),
        filesSucceeded: succeeded,
        filesFailed: failed,
        totalBytes,
        failedPaths,
        durationMs: Date.now() - startTime,
        completedAt: new Date(),
      });

      if (registryId) {
        await db.update(dthRegistry)
          .set({ lastSyncAt: new Date(), updatedAt: new Date() })
          .where(eq(dthRegistry.id, registryId));
      }
    }

    return { files, syncLog };
  }

  async performHealthCheck(registryId: string): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const registry = await this.getRegistry(registryId);
    if (!registry) {
      return { healthy: false, latencyMs: 0, error: "Registry not found" };
    }

    const startTime = Date.now();
    
    try {
      const testResult = await this.readFile("shared/schema.ts", registryId);
      const latencyMs = Date.now() - startTime;
      
      if (testResult.ok) {
        await this.updateHealthStatus(registryId, "healthy");
        return { healthy: true, latencyMs };
      } else {
        await this.updateHealthStatus(registryId, "degraded");
        return { healthy: false, latencyMs, error: testResult.error };
      }
    } catch (e: any) {
      const latencyMs = Date.now() - startTime;
      await this.updateHealthStatus(registryId, "unhealthy");
      return { healthy: false, latencyMs, error: e?.message || "Health check failed" };
    }
  }

  async getDashboardStats(): Promise<{
    totalRegistries: number;
    activeRegistries: number;
    healthyRegistries: number;
    totalSyncs: number;
    recentSyncs: number;
    totalFilesAccessed: number;
    accessStats: { allowed: number; blocked: number; errors: number };
  }> {
    const allRegistries = await this.getAllRegistries();
    const activeRegistries = allRegistries.filter(r => r.status === "active");
    const healthyRegistries = allRegistries.filter(r => r.healthStatus === "healthy");

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const [syncCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(dthSyncLogs);
    
    const [recentSyncCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(dthSyncLogs)
      .where(gte(dthSyncLogs.startedAt, oneDayAgo));

    const [accessCount] = await db.select({ count: sql<number>`count(*)::int` })
      .from(dthAccessLogs);

    const accessStats = await this.getAccessStats("", oneDayAgo);

    return {
      totalRegistries: allRegistries.length,
      activeRegistries: activeRegistries.length,
      healthyRegistries: healthyRegistries.length,
      totalSyncs: Number(syncCount?.count || 0),
      recentSyncs: Number(recentSyncCount?.count || 0),
      totalFilesAccessed: Number(accessCount?.count || 0),
      accessStats: {
        allowed: accessStats.allowed,
        blocked: accessStats.blocked,
        errors: accessStats.errors,
      },
    };
  }
}

export const dthService = new DthService();
