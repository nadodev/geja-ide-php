import { app, BrowserWindow, dialog, ipcMain } from "electron";
import fs from "node:fs";
import path from "node:path";
import {
  appInfoSchema,
  createDirectoryRequestSchema,
  createFileRequestSchema,
  deletePathRequestSchema,
  IPCChannels,
  phpConfigSchema,
  readFileRequestSchema,
  renamePathRequestSchema,
  runJsRequestSchema,
  runPhpRequestSchema,
  runTerminalRequestSchema,
  setPhpExecutableRequestSchema,
  workspaceStateSchema,
  writeFileRequestSchema
} from "../../shared/ipc/contracts";
import { WorkspaceService } from "../services/workspace-service";
import { PhpRunnerService } from "../services/php-runner";
import { JsRunnerService } from "../services/js-runner";
import { TerminalRunnerService } from "../services/terminal-runner";

const settingsFilePath = path.join(app.getPath("userData"), "settings.json");

const loadSettings = (): { phpExecutablePath: string | null } => {
  try {
    const raw = fs.readFileSync(settingsFilePath, "utf8");
    const parsed = JSON.parse(raw) as { phpExecutablePath?: string };
    return { phpExecutablePath: parsed.phpExecutablePath ?? null };
  } catch {
    return { phpExecutablePath: null };
  }
};

const saveSettings = (value: { phpExecutablePath: string | null }) => {
  fs.mkdirSync(path.dirname(settingsFilePath), { recursive: true });
  fs.writeFileSync(settingsFilePath, JSON.stringify(value, null, 2), "utf8");
};

const assertValidName = (name: string) => {
  if (!name.trim()) {
    throw new Error("Name cannot be empty");
  }

  if (name.includes("/") || name.includes("\\")) {
    throw new Error("Name cannot contain path separators");
  }
};

export const registerIpcHandlers = () => {
  const workspaceService = new WorkspaceService();
  const phpRunner = new PhpRunnerService();
  const jsRunner = new JsRunnerService();
  const terminalRunner = new TerminalRunnerService();
  let settings = loadSettings();
  let workspaceWatcher: fs.FSWatcher | null = null;
  let watchDebounceTimer: NodeJS.Timeout | null = null;

  const emitWorkspaceChanged = () => {
    BrowserWindow.getAllWindows().forEach((window) => {
      window.webContents.send(IPCChannels.workspaceChanged);
    });
  };

  const setupWorkspaceWatcher = () => {
    if (workspaceWatcher) {
      workspaceWatcher.close();
      workspaceWatcher = null;
    }

    const rootPath = workspaceService.getRootPath();
    if (!rootPath) {
      return;
    }

    try {
      workspaceWatcher = fs.watch(rootPath, { recursive: true }, () => {
        if (watchDebounceTimer) {
          clearTimeout(watchDebounceTimer);
        }

        watchDebounceTimer = setTimeout(() => {
          emitWorkspaceChanged();
        }, 150);
      });

      workspaceWatcher.on("error", () => {
        if (workspaceWatcher) {
          workspaceWatcher.close();
          workspaceWatcher = null;
        }
      });
    } catch {
      workspaceWatcher = null;
    }
  };

  ipcMain.handle(IPCChannels.appGetInfo, () => {
    return appInfoSchema.parse({
      name: "GEJA PHP IDE",
      version: app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node
    });
  });

  ipcMain.handle(IPCChannels.workspaceOpenDialog, async () => {
    const result = await dialog.showOpenDialog({
      title: "Selecione uma pasta de workspace",
      properties: ["openDirectory"]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return workspaceStateSchema.parse({
        rootPath: workspaceService.getRootPath(),
        tree: workspaceService.getTree()
      });
    }

    workspaceService.setRootPath(result.filePaths[0]);
    setupWorkspaceWatcher();

    return workspaceStateSchema.parse({
      rootPath: workspaceService.getRootPath(),
      tree: workspaceService.getTree()
    });
  });

  ipcMain.handle(IPCChannels.workspaceGetState, () => {
    return workspaceStateSchema.parse({
      rootPath: workspaceService.getRootPath(),
      tree: workspaceService.getTree()
    });
  });

  ipcMain.handle(IPCChannels.fsReadFile, (_event, payload) => {
    const request = readFileRequestSchema.parse(payload);
    const filePath = workspaceService.ensureWorkspacePath(request.filePath);
    return fs.readFileSync(filePath, "utf8");
  });

  ipcMain.handle(IPCChannels.fsWriteFile, (_event, payload) => {
    const request = writeFileRequestSchema.parse(payload);
    const filePath = workspaceService.ensureWorkspacePath(request.filePath);
    fs.writeFileSync(filePath, request.content, "utf8");
    return { ok: true };
  });

  ipcMain.handle(IPCChannels.fsCreateFile, (_event, payload) => {
    const request = createFileRequestSchema.parse(payload);
    const workspaceRoot = workspaceService.getRootPath();

    if (!workspaceRoot) {
      throw new Error("No workspace selected");
    }

    assertValidName(request.name);
    const parentPath = request.parentPath
      ? workspaceService.ensureWorkspacePath(request.parentPath)
      : workspaceRoot;
    const targetPath = workspaceService.ensureWorkspacePath(path.join(parentPath, request.name));

    if (fs.existsSync(targetPath)) {
      throw new Error("Arquivo já existe");
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, "", "utf8");
    emitWorkspaceChanged();

    return { ok: true, filePath: targetPath };
  });

  ipcMain.handle(IPCChannels.fsCreateDirectory, (_event, payload) => {
    const request = createDirectoryRequestSchema.parse(payload);
    const workspaceRoot = workspaceService.getRootPath();

    if (!workspaceRoot) {
      throw new Error("Não há workspace selecionado");
    }

    assertValidName(request.name);
    const parentPath = request.parentPath
      ? workspaceService.ensureWorkspacePath(request.parentPath)
      : workspaceRoot;
    const directoryPath = workspaceService.ensureWorkspacePath(path.join(parentPath, request.name));

    if (fs.existsSync(directoryPath)) {
      throw new Error("Pasta já existe");
    }

    fs.mkdirSync(directoryPath, { recursive: true });
    emitWorkspaceChanged();
    return { ok: true, directoryPath };
  });

  ipcMain.handle(IPCChannels.fsRenamePath, (_event, payload) => {
    const request = renamePathRequestSchema.parse(payload);
    assertValidName(request.newName);

    const targetPath = workspaceService.ensureWorkspacePath(request.targetPath);
    if (!fs.existsSync(targetPath)) {
      throw new Error("Caminho não encontrado");
    }

    const renamedPath = workspaceService.ensureWorkspacePath(path.join(path.dirname(targetPath), request.newName));
    if (fs.existsSync(renamedPath)) {
      throw new Error("Nome de destino já existe");
    }

    fs.renameSync(targetPath, renamedPath);
    emitWorkspaceChanged();
    return { ok: true, newPath: renamedPath };
  });

  ipcMain.handle(IPCChannels.fsDeletePath, (_event, payload) => {
    const request = deletePathRequestSchema.parse(payload);
    const targetPath = workspaceService.ensureWorkspacePath(request.targetPath);

    if (!fs.existsSync(targetPath)) {
      throw new Error("Path not found");
    }

    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      fs.rmSync(targetPath, { recursive: true, force: false });
    } else {
      fs.unlinkSync(targetPath);
    }

    emitWorkspaceChanged();
    return { ok: true };
  });

  ipcMain.handle(IPCChannels.phpGetConfig, () => {
    return phpConfigSchema.parse({ executablePath: settings.phpExecutablePath });
  });

  ipcMain.handle(IPCChannels.phpOpenExecutableDialog, async () => {
    const result = await dialog.showOpenDialog({
      title: "Selecione php.exe",
      properties: ["openFile"],
      filters: [{ name: "Executável PHP", extensions: ["exe"] }]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return phpConfigSchema.parse({ executablePath: settings.phpExecutablePath });
    }

    const selectedPath = result.filePaths[0];
    settings = { phpExecutablePath: selectedPath };
    saveSettings(settings);

    return phpConfigSchema.parse({ executablePath: settings.phpExecutablePath });
  });

  ipcMain.handle(IPCChannels.phpSetExecutable, (_event, payload) => {
    const request = setPhpExecutableRequestSchema.parse(payload);
    if (!fs.existsSync(request.executablePath)) {
      throw new Error("Executável PHP não encontrado");
    }

    settings = { phpExecutablePath: request.executablePath };
    saveSettings(settings);

    return phpConfigSchema.parse({ executablePath: settings.phpExecutablePath });
  });

  ipcMain.handle(IPCChannels.phpRunCode, async (_event, payload) => {
    const request = runPhpRequestSchema.parse(payload);

    const phpExecutablePath = settings.phpExecutablePath;
    if (!phpExecutablePath) {
      throw new Error("Executável PHP não está configurado");
    }

    if (!fs.existsSync(phpExecutablePath)) {
      throw new Error("Executável PHP configurado não existe");
    }

    const cwd = request.cwd ? workspaceService.ensureWorkspacePath(request.cwd) : workspaceService.getRootPath();

    return phpRunner.runCode(phpExecutablePath, {
      ...request,
      cwd: cwd ?? process.cwd()
    });
  });

  ipcMain.handle(IPCChannels.jsRunCode, async (_event, payload) => {
    const request = runJsRequestSchema.parse(payload);
    const cwd = request.cwd ? workspaceService.ensureWorkspacePath(request.cwd) : workspaceService.getRootPath();

    return jsRunner.runCode({
      ...request,
      cwd: cwd ?? process.cwd()
    });
  });

  ipcMain.handle(IPCChannels.terminalRunCommand, async (_event, payload) => {
    const request = runTerminalRequestSchema.parse(payload);
    const cwd = request.cwd ? workspaceService.ensureWorkspacePath(request.cwd) : workspaceService.getRootPath();

    return terminalRunner.runCommand({
      ...request,
      cwd: cwd ?? process.cwd()
    });
  });
};
