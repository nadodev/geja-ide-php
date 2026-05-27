import { spawn } from "node:child_process";
import type { RunTerminalRequest, RunTerminalResult } from "../../shared/ipc/contracts";

export class TerminalRunnerService {
  async runCommand(request: RunTerminalRequest): Promise<RunTerminalResult> {
    return await new Promise((resolve, reject) => {
      const child = spawn(request.command, {
        cwd: request.cwd ?? process.cwd(),
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
        shell: process.env.ComSpec ?? true
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("error", (error) => {
        reject(error);
      });

      child.on("close", (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: typeof code === "number" ? code : 1
        });
      });
    });
  }
}
