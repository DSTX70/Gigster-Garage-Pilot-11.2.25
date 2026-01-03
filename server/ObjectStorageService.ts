import { createReadStream, promises as fsp } from "node:fs";
import { mkdir, stat, rm, access } from "node:fs/promises";
import { dirname, join, normalize, basename } from "node:path";
import type { Readable } from "node:stream";
import crypto from "crypto";

export class ObjectNotFoundError extends Error {
  constructor(path: string) {
    super(`Object not found: ${path}`);
    this.name = 'ObjectNotFoundError';
  }
}

interface ObjectAclPolicy {
  owner: string;
  visibility: "public" | "private";
}

interface UploadURLInfo {
  uploadURL: string;
  objectPath: string;
  token: string;
}

export interface ObjectFile {
  stream: Readable;
  size: number;
  contentType: string;
  path: string;
  metadata?: {
    aclPolicy?: ObjectAclPolicy;
  };
}

const pendingUploads = new Map<string, { objectPath: string; expires: number }>();

export function parseObjectPath(rawPath: string): string {
  const clean = rawPath
    .replace(/^\/objects\//, '')
    .replace(/^(https?:\/\/[^\/]+)?/, '');
  
  const normalized = normalize(clean).replace(/^(\.\.(\/|\\|$))+/, "");
  if (normalized.startsWith("..")) {
    throw new Error("Invalid object path: path traversal detected");
  }
  return normalized.replace(/^\/+/, "");
}

export class ObjectStorageService {
  private privateDir: string;
  private publicDir: string;

  constructor() {
    this.privateDir = process.env.PRIVATE_OBJECT_DIR || 'private-objects';
    this.publicDir = process.env.PUBLIC_OBJECT_DIR || 'public-objects';
    
    if (!this.privateDir.startsWith('/home/runner')) {
      this.privateDir = join('/home/runner/workspace', this.privateDir.replace(/^\//, ''));
    }
    if (!this.publicDir.startsWith('/home/runner')) {
      this.publicDir = join('/home/runner/workspace', this.publicDir.replace(/^\//, ''));
    }
  }

  getPrivateObjectDir(): string {
    return this.privateDir;
  }

  getPublicObjectDir(): string {
    return this.publicDir;
  }

  private safeKey(key: string): string {
    const clean = normalize(key).replace(/^(\.\.(\/|\\|$))+/, "");
    if (clean.startsWith("..")) throw new Error("Invalid object key");
    return clean.replace(/^\/+/, "");
  }

  private fullPath(objectKey: string, isPublic: boolean = false): string {
    const baseDir = isPublic ? this.publicDir : this.privateDir;
    return join(baseDir, this.safeKey(objectKey));
  }

  async getObjectEntityUploadURL(): Promise<UploadURLInfo> {
    const token = crypto.randomBytes(32).toString('hex');
    const objectPath = `uploads/${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    
    pendingUploads.set(token, {
      objectPath,
      expires: Date.now() + 3600000
    });

    setTimeout(() => pendingUploads.delete(token), 3600000);
    
    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : 'http://localhost:5000';
    
    return {
      uploadURL: `${baseUrl}/api/objects/direct-upload?token=${token}`,
      objectPath,
      token
    };
  }

  async validateUploadToken(token: string): Promise<{ valid: boolean; objectPath?: string }> {
    const pending = pendingUploads.get(token);
    if (!pending || pending.expires < Date.now()) {
      pendingUploads.delete(token);
      return { valid: false };
    }
    return { valid: true, objectPath: pending.objectPath };
  }

  async trySetObjectEntityAclPolicy(
    objectPath: string,
    aclPolicy: ObjectAclPolicy
  ): Promise<string> {
    const normalizedPath = parseObjectPath(objectPath);
    const fullPath = this.fullPath(normalizedPath);
    const metadataPath = `${fullPath}.meta.json`;
    
    await mkdir(dirname(fullPath), { recursive: true });
    
    await fsp.writeFile(metadataPath, JSON.stringify({
      aclPolicy,
      createdAt: new Date().toISOString(),
    }));

    return normalizedPath;
  }

  private async getMetadata(objectPath: string): Promise<{ aclPolicy?: ObjectAclPolicy } | null> {
    try {
      const cleanPath = parseObjectPath(objectPath);
      const metadataPath = `${this.fullPath(cleanPath)}.meta.json`;
      await access(metadataPath);
      const content = await fsp.readFile(metadataPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async getObjectEntityFile(objectPath: string): Promise<ObjectFile | null> {
    try {
      const cleanPath = parseObjectPath(objectPath);
      const fullPath = this.fullPath(cleanPath);
      
      await access(fullPath);
      const stats = await stat(fullPath);
      
      const ext = basename(fullPath).split('.').pop()?.toLowerCase() || '';
      const contentTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'txt': 'text/plain',
        'json': 'application/json',
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
      };

      const metadata = await this.getMetadata(objectPath);

      return {
        stream: createReadStream(fullPath),
        size: stats.size,
        contentType: contentTypes[ext] || 'application/octet-stream',
        path: cleanPath,
        metadata: metadata || undefined,
      };
    } catch (error) {
      console.log('Object file not found:', objectPath);
      return null;
    }
  }

  async downloadObject(objectPath: string): Promise<{ stream: Readable; size: number; contentType: string }> {
    const objectFile = await this.getObjectEntityFile(objectPath);
    if (!objectFile) {
      throw new ObjectNotFoundError(objectPath);
    }
    return {
      stream: objectFile.stream,
      size: objectFile.size,
      contentType: objectFile.contentType,
    };
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    objectPath,
    requestedPermission,
  }: {
    userId?: string;
    objectFile?: ObjectFile | null;
    objectPath?: string;
    requestedPermission: 'read' | 'write';
  }): Promise<boolean> {
    try {
      let aclPolicy: ObjectAclPolicy | undefined;
      
      if (objectFile?.metadata?.aclPolicy) {
        aclPolicy = objectFile.metadata.aclPolicy;
      } else if (objectPath) {
        const metadata = await this.getMetadata(objectPath);
        aclPolicy = metadata?.aclPolicy;
      }

      if (!aclPolicy) {
        return userId ? true : false;
      }

      if (aclPolicy.visibility === 'public' && requestedPermission === 'read') {
        return true;
      }

      if (aclPolicy.owner === userId) {
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  async searchPublicObject(filePath: string): Promise<ObjectFile | null> {
    try {
      const fullPath = join(this.publicDir, this.safeKey(filePath));
      await access(fullPath);
      const stats = await stat(fullPath);
      
      const ext = basename(fullPath).split('.').pop()?.toLowerCase() || '';
      const contentTypes: Record<string, string> = {
        'pdf': 'application/pdf',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
      };

      return {
        stream: createReadStream(fullPath),
        size: stats.size,
        contentType: contentTypes[ext] || 'application/octet-stream',
        path: filePath,
      };
    } catch {
      return null;
    }
  }

  async put(objectKey: string, data: Buffer, options: { contentType?: string; isPublic?: boolean } = {}): Promise<string> {
    const fullPath = this.fullPath(objectKey, options.isPublic);
    await mkdir(dirname(fullPath), { recursive: true });
    await fsp.writeFile(fullPath, data);
    return fullPath;
  }

  async get(objectKey: string, isPublic: boolean = false): Promise<{ stream: Readable; size: number } | null> {
    try {
      const fullPath = this.fullPath(objectKey, isPublic);
      const stats = await stat(fullPath);
      return { stream: createReadStream(fullPath), size: stats.size };
    } catch {
      return null;
    }
  }

  async delete(objectKey: string, isPublic: boolean = false): Promise<void> {
    const fullPath = this.fullPath(objectKey, isPublic);
    await rm(fullPath, { force: true });
    try {
      await rm(`${fullPath}.meta.json`, { force: true });
    } catch {}
  }

  async exists(objectKey: string, isPublic: boolean = false): Promise<boolean> {
    try {
      await access(this.fullPath(objectKey, isPublic));
      return true;
    } catch {
      return false;
    }
  }
}

export const objectStorageClient = new ObjectStorageService();
