import { contextBridge, ipcRenderer } from "electron";
import {
  createDirectoryRequestSchema,
  createFileRequestSchema,
  deletePathRequestSchema,
  IPCChannels,
  readFileRequestSchema,
  renamePathRequestSchema,
  runJsRequestSchema,
  runPhpRequestSchema,
  runTerminalRequestSchema,
  setPhpExecutableRequestSchema,
  writeFileRequestSchema
} from "../shared/ipc/contracts";

const api = {
  getAppInfo: () => ipcRenderer.invoke(IPCChannels.appGetInfo),
  openWorkspaceDialog: () => ipcRenderer.invoke(IPCChannels.workspaceOpenDialog),
  getWorkspaceState: () => ipcRenderer.invoke(IPCChannels.workspaceGetState),
  readFile: (payload: unknown) => {
    const parsed = readFileRequestSchema.parse(payload);
    return ipcRenderer.invoke(IPCChannels.fsReadFile, parsed);
  },
  writeFile: (payload: unknown) => {
    const parsed = writeFileRequestSchema.parse(payload);
    return ipcRenderer.invoke(IPCChannels.fsWriteFile, parsed);
  },
  createFile: (payload: unknown) => {
    const parsed = createFileRequestSchema.parse(payload);
    return ipcRenderer.invoke(IPCChannels.fsCreateFile, parsed);
  },
  createDirectory: (payload: unknown) => {
    const parsed = createDirectoryRequestSchema.parse(payload);
    return ipcRenderer.invoke(IPCChannels.fsCreateDirectory, parsed);
  },
  renamePath: (payload: unknown) => {
    const parsed = renamePathRequestSchema.parse(payload);
    return ipcRenderer.invoke(IPCChannels.fsRenamePath, parsed);
  },
  deletePath: (payload: unknown) => {
    const parsed = deletePathRequestSchema.parse(payload);
    return ipcRenderer.invoke(IPCChannels.fsDeletePath, parsed);
  },
  getPhpConfig: () => ipcRenderer.invoke(IPCChannels.phpGetConfig),
  openPhpExecutableDialog: () => ipcRenderer.invoke(IPCChannels.phpOpenExecutableDialog),
  setPhpExecutable: (payload: unknown) => {
    const parsed = setPhpExecutableRequestSchema.parse(payload);
    return ipcRenderer.invoke(IPCChannels.phpSetExecutable, parsed);
  },
  runPhpCode: (payload: unknown) => {
    const parsed = runPhpRequestSchema.parse(payload);
    return ipcRenderer.invoke(IPCChannels.phpRunCode, parsed);
  },
  runJsCode: (payload: unknown) => {
    const parsed = runJsRequestSchema.parse(payload);
    return ipcRenderer.invoke(IPCChannels.jsRunCode, parsed);
  },
  runTerminalCommand: (payload: unknown) => {
    const parsed = runTerminalRequestSchema.parse(payload);
    return ipcRenderer.invoke(IPCChannels.terminalRunCommand, parsed);
  },
  onWorkspaceChanged: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on(IPCChannels.workspaceChanged, listener);

    return () => {
      ipcRenderer.removeListener(IPCChannels.workspaceChanged, listener);
    };
  }
};

contextBridge.exposeInMainWorld("ideAPI", api);
