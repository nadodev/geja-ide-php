import { z } from "zod";

export const appInfoSchema = z.object({
  name: z.string(),
  version: z.string(),
  electron: z.string(),
  chrome: z.string(),
  node: z.string()
});

export const fileNodeSchema: z.ZodType<{
  name: string;
  path: string;
  type: "file" | "directory";
  children?: Array<any>;
}> = z.lazy(() =>
  z.object({
    name: z.string(),
    path: z.string(),
    type: z.enum(["file", "directory"]),
    children: z.array(fileNodeSchema).optional()
  })
);

export const workspaceStateSchema = z.object({
  rootPath: z.string().nullable(),
  tree: z.array(fileNodeSchema)
});

export const readFileRequestSchema = z.object({
  filePath: z.string()
});

export const writeFileRequestSchema = z.object({
  filePath: z.string(),
  content: z.string()
});

export const createFileRequestSchema = z.object({
  parentPath: z.string().nullable(),
  name: z.string().min(1)
});

export const createDirectoryRequestSchema = z.object({
  parentPath: z.string().nullable(),
  name: z.string().min(1)
});

export const renamePathRequestSchema = z.object({
  targetPath: z.string().min(1),
  newName: z.string().min(1)
});

export const deletePathRequestSchema = z.object({
  targetPath: z.string().min(1)
});

export const phpConfigSchema = z.object({
  executablePath: z.string().nullable()
});

export const setPhpExecutableRequestSchema = z.object({
  executablePath: z.string().min(1)
});

export const runPhpRequestSchema = z.object({
  code: z.string(),
  cwd: z.string().nullable().optional(),
  timeoutMs: z.number().int().positive().max(120000).optional()
});

export const runJsRequestSchema = z.object({
  code: z.string(),
  cwd: z.string().nullable().optional(),
  timeoutMs: z.number().int().positive().max(120000).optional()
});

export const runPhpResultSchema = z.object({
  stdout: z.string(),
  stderr: z.string(),
  exitCode: z.number(),
  durationMs: z.number(),
  timedOut: z.boolean()
});

export const runJsResultSchema = z.object({
  stdout: z.string(),
  stderr: z.string(),
  exitCode: z.number(),
  durationMs: z.number(),
  timedOut: z.boolean()
});

export const runTerminalRequestSchema = z.object({
  command: z.string().min(1),
  cwd: z.string().nullable().optional()
});

export const runTerminalResultSchema = z.object({
  stdout: z.string(),
  stderr: z.string(),
  exitCode: z.number()
});

export type AppInfo = z.infer<typeof appInfoSchema>;
export type FileNode = z.infer<typeof fileNodeSchema>;
export type WorkspaceState = z.infer<typeof workspaceStateSchema>;
export type ReadFileRequest = z.infer<typeof readFileRequestSchema>;
export type WriteFileRequest = z.infer<typeof writeFileRequestSchema>;
export type CreateFileRequest = z.infer<typeof createFileRequestSchema>;
export type CreateDirectoryRequest = z.infer<typeof createDirectoryRequestSchema>;
export type RenamePathRequest = z.infer<typeof renamePathRequestSchema>;
export type DeletePathRequest = z.infer<typeof deletePathRequestSchema>;
export type PhpConfig = z.infer<typeof phpConfigSchema>;
export type SetPhpExecutableRequest = z.infer<typeof setPhpExecutableRequestSchema>;
export type RunPhpRequest = z.infer<typeof runPhpRequestSchema>;
export type RunPhpResult = z.infer<typeof runPhpResultSchema>;
export type RunJsRequest = z.infer<typeof runJsRequestSchema>;
export type RunJsResult = z.infer<typeof runJsResultSchema>;
export type RunTerminalRequest = z.infer<typeof runTerminalRequestSchema>;
export type RunTerminalResult = z.infer<typeof runTerminalResultSchema>;

export const IPCChannels = {
  appGetInfo: "app:get-info",
  workspaceOpenDialog: "workspace:open-dialog",
  workspaceGetState: "workspace:get-state",
  workspaceChanged: "workspace:changed",
  fsReadFile: "fs:read-file",
  fsWriteFile: "fs:write-file",
  fsCreateFile: "fs:create-file",
  fsCreateDirectory: "fs:create-directory",
  fsRenamePath: "fs:rename-path",
  fsDeletePath: "fs:delete-path",
  phpGetConfig: "php:get-config",
  phpOpenExecutableDialog: "php:open-executable-dialog",
  phpSetExecutable: "php:set-executable",
  phpRunCode: "php:run-code",
  jsRunCode: "js:run-code",
  terminalRunCommand: "terminal:run-command"
} as const;
