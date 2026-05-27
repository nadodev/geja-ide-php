import fs from "node:fs";
import path from "node:path";
import type { FileNode } from "../../shared/ipc/contracts";

const MAX_DEPTH = 6;
const IGNORED_NAMES = new Set(["node_modules", ".git", "dist", "build"]);

export class WorkspaceService {
  private rootPath: string | null = null;

  getRootPath() {
    return this.rootPath;
  }

  setRootPath(rootPath: string) {
    const normalized = path.resolve(rootPath);
    this.rootPath = normalized;
  }

  clearRootPath() {
    this.rootPath = null;
  }

  ensureWorkspacePath(targetPath: string) {
    if (!this.rootPath) {
      throw new Error("No workspace selected");
    }

    const resolvedTarget = path.resolve(targetPath);
    const relative = path.relative(this.rootPath, resolvedTarget);

    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("Path outside workspace is not allowed");
    }

    return resolvedTarget;
  }

  getTree(): FileNode[] {
    if (!this.rootPath) {
      return [];
    }

    return this.readDirectory(this.rootPath, 0);
  }

  private readDirectory(dirPath: string, depth: number): FileNode[] {
    if (depth > MAX_DEPTH) {
      return [];
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      if (IGNORED_NAMES.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(dirPath, entry.name);
      const node: FileNode = {
        name: entry.name,
        path: fullPath,
        type: entry.isDirectory() ? "directory" : "file"
      };

      if (entry.isDirectory()) {
        node.children = this.readDirectory(fullPath, depth + 1);
      }

      nodes.push(node);
    }

    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "directory" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }
}
