import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import type { RunJsRequest, RunJsResult } from "../../shared/ipc/contracts";

export class JsRunnerService {
  async runCode(request: RunJsRequest): Promise<RunJsResult> {
    const timeoutMs = request.timeoutMs ?? 10000;
    const startedAt = Date.now();

    const tempFile = path.join(os.tmpdir(), `js-playground-${Date.now()}.mjs`);
    fs.writeFileSync(tempFile, request.code, "utf8");

    return await new Promise((resolve, reject) => {
      const child = spawn("node", [tempFile], {
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
