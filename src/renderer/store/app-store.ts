import { create } from "zustand";
import type { FileNode } from "../../shared/ipc/contracts";

export type EditorTab = {
  path: string;
  name: string;
  content: string;
  dirty: boolean;
};

type AppStore = {
  appVersion: string;
  workspaceRoot: string | null;
  tree: FileNode[];
  tabs: EditorTab[];
  activeTabPath: string | null;
  phpExecutablePath: string | null;
  output: string;
  terminalOutput: string;
  autoRunOnSave: boolean;
  isRunningPhp: boolean;
  setAppVersion: (value: string) => void;
  setWorkspace: (rootPath: string | null, tree: FileNode[]) => void;
  openTab: (tab: EditorTab) => void;
  setActiveTab: (path: string) => void;
  updateActiveTabContent: (content: string) => void;
  markActiveTabSaved: () => void;
  closeTab: (path: string) => void;
  setPhpExecutablePath: (value: string | null) => void;
  setOutput: (value: string) => void;
  appendOutput: (value: string) => void;
  setTerminalOutput: (value: string) => void;
  appendTerminalOutput: (value: string) => void;
  setAutoRunOnSave: (value: boolean) => void;
  setIsRunningPhp: (value: boolean) => void;
};

export const useAppStore = create<AppStore>((set, get) => ({
  appVersion: "",
  workspaceRoot: null,
  tree: [],
  tabs: [],
  activeTabPath: null,
  phpExecutablePath: null,
  output: "",
  terminalOutput: "",
  autoRunOnSave: false,
  isRunningPhp: false,
  setAppVersion: (value) => set({ appVersion: value }),
  setWorkspace: (rootPath, tree) => set({ workspaceRoot: rootPath, tree }),
  openTab: (tab) => {
    const existing = get().tabs.find((item) => item.path === tab.path);
    if (existing) {
      set({ activeTabPath: tab.path });
      return;
    }

    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabPath: tab.path
    }));
  },
  setActiveTab: (path) => set({ activeTabPath: path }),
  updateActiveTabContent: (content) => {
    const activePath = get().activeTabPath;
    if (!activePath) {
      return;
    }

    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.path === activePath
          ? {
              ...tab,
              content,
              dirty: true
            }
          : tab
      )
    }));
  },
  markActiveTabSaved: () => {
    const activePath = get().activeTabPath;
    if (!activePath) {
      return;
    }

    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.path === activePath
          ? {
              ...tab,
              dirty: false
            }
          : tab
      )
    }));
  },
  closeTab: (path) => {
    set((state) => {
      const filtered = state.tabs.filter((tab) => tab.path !== path);
      const activeTabPath =
        state.activeTabPath === path ? (filtered[filtered.length - 1]?.path ?? null) : state.activeTabPath;

      return {
        tabs: filtered,
        activeTabPath
      };
    });
  },
  setPhpExecutablePath: (value) => set({ phpExecutablePath: value }),
  setOutput: (value) => set({ output: value }),
  appendOutput: (value) => set((state) => ({ output: `${state.output}${value}` })),
  setTerminalOutput: (value) => set({ terminalOutput: value }),
  appendTerminalOutput: (value) => set((state) => ({ terminalOutput: `${state.terminalOutput}${value}` })),
  setAutoRunOnSave: (value) => set({ autoRunOnSave: value }),
  setIsRunningPhp: (value) => set({ isRunningPhp: value })
}));
