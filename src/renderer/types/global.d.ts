import type {
  AppInfo,
  CreateDirectoryRequest,
  CreateFileRequest,
  DeletePathRequest,
  PhpConfig,
  RenamePathRequest,
  RunJsRequest,
  RunJsResult,
  RunPhpRequest,
  RunPhpResult,
  RunTerminalRequest,
  RunTerminalResult,
  WorkspaceState,
  ReadFileRequest,
  SetPhpExecutableRequest,
  WriteFileRequest
} from "../../shared/ipc/contracts";

declare global {
  interface Window {
    ideAPI: {
      getAppInfo: () => Promise<AppInfo>;
      openWorkspaceDialog: () => Promise<WorkspaceState>;
      getWorkspaceState: () => Promise<WorkspaceState>;
      readFile: (payload: ReadFileRequest) => Promise<string>;
      writeFile: (payload: WriteFileRequest) => Promise<{ ok: boolean }>;
      createFile: (payload: CreateFileRequest) => Promise<{ ok: boolean; filePath: string }>;
      createDirectory: (payload: CreateDirectoryRequest) => Promise<{ ok: boolean; directoryPath: string }>;
      renamePath: (payload: RenamePathRequest) => Promise<{ ok: boolean; newPath: string }>;
      deletePath: (payload: DeletePathRequest) => Promise<{ ok: boolean }>;
      getPhpConfig: () => Promise<PhpConfig>;
      openPhpExecutableDialog: () => Promise<PhpConfig>;
      setPhpExecutable: (payload: SetPhpExecutableRequest) => Promise<PhpConfig>;
      runPhpCode: (payload: RunPhpRequest) => Promise<RunPhpResult>;
      runJsCode: (payload: RunJsRequest) => Promise<RunJsResult>;
      runTerminalCommand: (payload: RunTerminalRequest) => Promise<RunTerminalResult>;
      onWorkspaceChanged: (callback: () => void) => () => void;
    };
  }
}

export {};
