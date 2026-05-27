import type {
  CreateDirectoryRequest,
  CreateFileRequest,
  DeletePathRequest,
  ReadFileRequest,
  RenamePathRequest,
  RunJsRequest,
  RunPhpRequest,
  RunTerminalRequest,
  SetPhpExecutableRequest,
  WriteFileRequest
} from "../../shared/ipc/contracts";

export const api = {
  getAppInfo: () => window.ideAPI.getAppInfo(),
  openWorkspaceDialog: () => window.ideAPI.openWorkspaceDialog(),
  getWorkspaceState: () => window.ideAPI.getWorkspaceState(),
  readFile: (payload: ReadFileRequest) => window.ideAPI.readFile(payload),
  writeFile: (payload: WriteFileRequest) => window.ideAPI.writeFile(payload),
  createFile: (payload: CreateFileRequest) => window.ideAPI.createFile(payload),
  createDirectory: (payload: CreateDirectoryRequest) => window.ideAPI.createDirectory(payload),
  renamePath: (payload: RenamePathRequest) => window.ideAPI.renamePath(payload),
  deletePath: (payload: DeletePathRequest) => window.ideAPI.deletePath(payload),
  getPhpConfig: () => window.ideAPI.getPhpConfig(),
  openPhpExecutableDialog: () => window.ideAPI.openPhpExecutableDialog(),
  setPhpExecutable: (payload: SetPhpExecutableRequest) => window.ideAPI.setPhpExecutable(payload),
  runPhpCode: (payload: RunPhpRequest) => window.ideAPI.runPhpCode(payload),
  runJsCode: (payload: RunJsRequest) => window.ideAPI.runJsCode(payload),
  runTerminalCommand: (payload: RunTerminalRequest) => window.ideAPI.runTerminalCommand(payload),
  onWorkspaceChanged: (callback: () => void) => window.ideAPI.onWorkspaceChanged(callback)
};
