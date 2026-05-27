import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import type { RunPhpRequest, RunPhpResult } from "../../shared/ipc/contracts";

export class PhpRunnerService {
  async runCode(phpExecutablePath: string, request: RunPhpRequest): Promise<RunPhpResult> {
    const timeoutMs = request.timeoutMs ?? 10000;
    const startedAt = Date.now();

    const tempFile = path.join(os.tmpdir(), `php-playground-${Date.now()}.php`);
    fs.writeFileSync(tempFile, request.code, "utf8");

    const args = [
      "-d",
      "memory_limit=128M",
      "-d",
      `max_execution_time=${Math.max(1, Math.floor(timeoutMs / 1000))}`,
      tempFile
    ];

    return await new Promise((resolve, reject) => {
      const child = spawn(phpExecutablePath, args, {
        cwd: request.cwd ?? process.cwd(),
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"]
      });

      let stdout = "";
      let stderr = "";
      let timedOut = false;

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
      }, timeoutMs);

      child.on("error", (error) => {
        clearTimeout(timer);
        this.cleanupTempFile(tempFile);
        reject(error);
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        this.cleanupTempFile(tempFile);

        resolve({
          stdout,
          stderr,
          exitCode: typeof code === "number" ? code : 1,
          durationMs: Date.now() - startedAt,
          timedOut
        });
      });
    });
  }

  private cleanupTempFile(filePath: string) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      // Ignore cleanup errors from temp files.
    }
  }
}
