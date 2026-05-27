import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import type * as MonacoEditor from "monaco-editor";
import { api } from "./services/api";
import { useAppStore } from "./store/app-store";
import { ExplorerTree } from "./components/ExplorerTree";
import { EditorTabs } from "./components/EditorTabs";
import { MonacoPane } from "./components/MonacoPane";
import { GitPanel } from "./components/GitPanel";
import { OutputPanel } from "./components/OutputPanel";
import { StatusBar } from "./components/StatusBar";
import { TerminalPanel } from "./components/TerminalPanel";
import { FaPlay, FaRegMinusSquare, FaRegWindowMinimize, FaRegWindowRestore, FaWindowMinimize } from "react-icons/fa";
import { AiFillFileAdd } from "react-icons/ai";
import { IoMdSave } from "react-icons/io";
import { BsPersonWorkspace } from "react-icons/bs";
import { LuMaximize2 } from "react-icons/lu";
import { MdOutlineFormatClear } from "react-icons/md";
import { TbWindowMinimize } from "react-icons/tb";
import { GrCopy } from "react-icons/gr";
import { VscClearAll } from "react-icons/vsc";

export default function App() {
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const [tabSize, setTabSize] = useState<2 | 4 | 8>(2);
  const [isMinimapVisible, setIsMinimapVisible] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [explorerWidth, setExplorerWidth] = useState(280);
  const [explorerCollapseSignal, setExplorerCollapseSignal] = useState(0);
  const [isGitOpen, setIsGitOpen] = useState(false);
  const [isOutputOpen, setIsOutputOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [outputHeight, setOutputHeight] = useState(220);
  const [terminalHeight, setTerminalHeight] = useState(240);
  const [resizingPanel, setResizingPanel] = useState<{
    target: "output" | "terminal";
    startY: number;
    startHeight: number;
  } | null>(null);
  const [resizingExplorer, setResizingExplorer] = useState<{
    startX: number;
    startWidth: number;
  } | null>(null);
  const [createDialog, setCreateDialog] = useState<{ type: "file" | "directory"; parentPath: string | null } | null>(null);
  const [renameDialog, setRenameDialog] = useState<{ targetPath: string; currentName: string } | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ targetPath: string; currentName: string; type: "file" | "directory" } | null>(null);
  const [dialogInput, setDialogInput] = useState("");
  const [gitBranchLabel, setGitBranchLabel] = useState("");
  const [gitStaged, setGitStaged] = useState<string[]>([]);
  const [gitUnstaged, setGitUnstaged] = useState<string[]>([]);
  const [gitUntracked, setGitUntracked] = useState<string[]>([]);
  const [gitLoading, setGitLoading] = useState(false);
  const [gitError, setGitError] = useState<string | null>(null);
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(null);

  const {
    appVersion,
    workspaceRoot,
    tree,
    tabs,
    activeTabPath,
    phpExecutablePath,
    output,
    terminalOutput,
    autoRunOnSave,
    isRunningPhp,
    setAppVersion,
    setWorkspace,
    openTab,
    setActiveTab,
    updateActiveTabContent,
    markActiveTabSaved,
    closeTab,
    setPhpExecutablePath,
    setOutput,
    setTerminalOutput,
    appendOutput,
    appendTerminalOutput,
    setAutoRunOnSave,
    setIsRunningPhp
  } = useAppStore();

  const activeTab = useMemo(() => tabs.find((tab) => tab.path === activeTabPath) ?? null, [tabs, activeTabPath]);
  const getPrettierOptionsForPath = async (filePath: string) => {
    const lowerPath = filePath.toLowerCase();

    if (lowerPath.endsWith(".php")) {
      const [{ default: phpPlugin }] = await Promise.all([import("@prettier/plugin-php")]);
      return {
        parser: "php",
        plugins: [phpPlugin]
      };
    }

    if (lowerPath.endsWith(".js") || lowerPath.endsWith(".mjs") || lowerPath.endsWith(".cjs")) {
      return { parser: "babel" };
    }

    if (lowerPath.endsWith(".ts") || lowerPath.endsWith(".mts") || lowerPath.endsWith(".cts")) {
      return { parser: "typescript" };
    }

    if (lowerPath.endsWith(".json")) {
      return { parser: "json" };
    }

    if (lowerPath.endsWith(".css")) {
      return { parser: "css" };
    }

    if (lowerPath.endsWith(".html") || lowerPath.endsWith(".htm")) {
      return { parser: "html" };
    }

    if (lowerPath.endsWith(".md") || lowerPath.endsWith(".mdx")) {
      return { parser: "markdown" };
    }

    return null;
  };

  const formatContentForPath = async (filePath: string, content: string) => {
    try {
      const prettierModule = await import("prettier");
      const options = await getPrettierOptionsForPath(filePath);

      if (!options) {
        return content;
      }

      return await prettierModule.format(content, options);
    } catch {
      return content;
    }
  };

  const clampExplorerWidth = (value: number) => {
    const minWidth = 220;
    const maxWidth = Math.max(320, Math.floor(window.innerWidth * 0.45));
    return Math.min(maxWidth, Math.max(minWidth, value));
  };

  const clampPanelHeight = (value: number) => {
    const minHeight = 120;
    const maxHeight = Math.max(180, Math.floor(window.innerHeight * 0.6));
    return Math.min(maxHeight, Math.max(minHeight, value));
  };

  const activeFileBreadcrumb = useMemo(() => {
    if (!activeTab?.path) {
      return "Nenhum arquivo ativo";
    }

    if (!workspaceRoot) {
      return activeTab.path;
    }

    const normalizedRoot = workspaceRoot.replace(/\\/g, "/");
    const normalizedPath = activeTab.path.replace(/\\/g, "/");

    if (!normalizedPath.startsWith(normalizedRoot)) {
      return activeTab.path;
    }

    const relativePath = normalizedPath.slice(normalizedRoot.length).replace(/^\/+/, "");
    if (!relativePath) {
      return "Raiz";
    }

    const parts = relativePath.split("/");
    if (parts.length === 1) {
      return `Raiz > ${parts[0]}`;
    }

    return parts.join(" > ");
  }, [activeTab?.path, workspaceRoot]);

  useEffect(() => {
    if (!isConfigOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsConfigOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isConfigOpen]);

  const parseGitStatus = (statusOutput: string) => {
    const lines = statusOutput.split(/\r?\n/).map((line) => line.trimEnd()).filter(Boolean);
    const branchLine = lines.length > 0 && lines[0].startsWith("##") ? lines.shift()!.slice(2).trim() : "";
    const staged: string[] = [];
    const unstaged: string[] = [];
    const untracked: string[] = [];

    for (const line of lines) {
      if (line.startsWith("?? ")) {
        untracked.push(line.slice(3));
        continue;
      }

      if (line.length < 4) {
        continue;
      }

      const indexStatus = line[0];
      const worktreeStatus = line[1];
      const rawPath = line.slice(3);
      const displayPath = rawPath.includes(" -> ") ? rawPath.split(" -> ").at(-1) ?? rawPath : rawPath;

      if (indexStatus !== " ") {
        staged.push(displayPath);
      }

      if (worktreeStatus !== " ") {
        unstaged.push(displayPath);
      }
    }

    setGitBranchLabel(branchLine);
    setGitStaged(staged);
    setGitUnstaged(unstaged);
    setGitUntracked(untracked);
    setGitError(null);
  };

  const refreshGitStatus = async () => {
    if (!workspaceRoot) {
      setGitBranchLabel("");
      setGitStaged([]);
      setGitUnstaged([]);
      setGitUntracked([]);
      setGitError("Abra um workspace Git para ver o status.");
      return;
    }

    setGitLoading(true);

    try {
      const result = await api.runTerminalCommand({
        command: "git status --porcelain=v1 -uall --branch",
        cwd: workspaceRoot
      });

      const combinedOutput = `${result.stdout}\n${result.stderr}`.trim();
      if (result.exitCode !== 0 && !result.stdout.trim()) {
        setGitBranchLabel("");
        setGitStaged([]);
        setGitUnstaged([]);
        setGitUntracked([]);
        setGitError(combinedOutput || "Não foi possível ler o status do Git.");
        return;
      }

      parseGitStatus(result.stdout);
      if (result.exitCode !== 0 && combinedOutput) {
        setGitError(combinedOutput);
      }
    } catch (error) {
      setGitBranchLabel("");
      setGitStaged([]);
      setGitUnstaged([]);
      setGitUntracked([]);
      setGitError(`Erro ao consultar Git: ${String(error)}`);
    } finally {
      setGitLoading(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("ide-theme-mode");
    if (stored === "light" || stored === "dark") {
      setThemeMode(stored);
    }

    const storedTabSize = localStorage.getItem("ide-tab-size");
    if (storedTabSize === "2" || storedTabSize === "4" || storedTabSize === "8") {
      setTabSize(Number(storedTabSize) as 2 | 4 | 8);
    }

    const storedMinimapVisible = localStorage.getItem("ide-minimap-visible");
    if (storedMinimapVisible === "true" || storedMinimapVisible === "false") {
      setIsMinimapVisible(storedMinimapVisible === "true");
    }

    const storedExplorerOpen = localStorage.getItem("ide-explorer-open");
    if (storedExplorerOpen === "true" || storedExplorerOpen === "false") {
      setIsExplorerOpen(storedExplorerOpen === "true");
    }

    const storedExplorerWidth = localStorage.getItem("ide-explorer-width");
    if (storedExplorerWidth) {
      const parsedExplorerWidth = Number(storedExplorerWidth);
      if (!Number.isNaN(parsedExplorerWidth)) {
        setExplorerWidth(clampExplorerWidth(parsedExplorerWidth));
      }
    }

    const storedGitOpen = localStorage.getItem("ide-git-open");
    if (storedGitOpen === "true" || storedGitOpen === "false") {
      setIsGitOpen(storedGitOpen === "true");
    }

    const storedOutputOpen = localStorage.getItem("ide-output-open");
    if (storedOutputOpen === "true" || storedOutputOpen === "false") {
      setIsOutputOpen(storedOutputOpen === "true");
    }

    const storedTerminalOpen = localStorage.getItem("ide-terminal-open");
    if (storedTerminalOpen === "true" || storedTerminalOpen === "false") {
      setIsTerminalOpen(storedTerminalOpen === "true");
    }

    const storedOutputHeight = localStorage.getItem("ide-output-height");
    if (storedOutputHeight) {
      const parsedOutputHeight = Number(storedOutputHeight);
      if (!Number.isNaN(parsedOutputHeight)) {
        setOutputHeight(clampPanelHeight(parsedOutputHeight));
      }
    }

    const storedTerminalHeight = localStorage.getItem("ide-terminal-height");
    if (storedTerminalHeight) {
      const parsedTerminalHeight = Number(storedTerminalHeight);
      if (!Number.isNaN(parsedTerminalHeight)) {
        setTerminalHeight(clampPanelHeight(parsedTerminalHeight));
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("ide-theme-mode", themeMode);
    document.body.classList.toggle("theme-light", themeMode === "light");
    document.body.classList.toggle("theme-dark", themeMode === "dark");
  }, [themeMode]);

  useEffect(() => {
    localStorage.setItem("ide-tab-size", String(tabSize));
  }, [tabSize]);

  useEffect(() => {
    localStorage.setItem("ide-minimap-visible", String(isMinimapVisible));
  }, [isMinimapVisible]);

  useEffect(() => {
    localStorage.setItem("ide-explorer-open", String(isExplorerOpen));
  }, [isExplorerOpen]);

  useEffect(() => {
    localStorage.setItem("ide-explorer-width", String(explorerWidth));
  }, [explorerWidth]);

  useEffect(() => {
    localStorage.setItem("ide-git-open", String(isGitOpen));
  }, [isGitOpen]);

  useEffect(() => {
    localStorage.setItem("ide-output-open", String(isOutputOpen));
  }, [isOutputOpen]);

  useEffect(() => {
    localStorage.setItem("ide-terminal-open", String(isTerminalOpen));
  }, [isTerminalOpen]);

  useEffect(() => {
    localStorage.setItem("ide-output-height", String(outputHeight));
  }, [outputHeight]);

  useEffect(() => {
    localStorage.setItem("ide-terminal-height", String(terminalHeight));
  }, [terminalHeight]);

  useEffect(() => {
    const loadInitialState = async () => {
      const [appInfo, workspaceState, phpConfig] = await Promise.all([
        api.getAppInfo(),
        api.getWorkspaceState(),
        api.getPhpConfig()
      ]);

      setAppVersion(appInfo.version);
      setWorkspace(workspaceState.rootPath, workspaceState.tree);
      setPhpExecutablePath(phpConfig.executablePath);
    };

    void loadInitialState();
  }, [setAppVersion, setWorkspace, setPhpExecutablePath]);

  useEffect(() => {
    const onKeyDown = async (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        await handleSave();
        return;
      }

      if (event.ctrlKey && event.key === "Enter") {
        event.preventDefault();
        await handleRunPhp();
        return;
      }

      const shortcutKey = event.key.toLowerCase();
      if (event.ctrlKey && shortcutKey === "j") {
        event.preventDefault();
        setIsTerminalOpen((prev) => !prev);
        return;
      }

      if (event.ctrlKey && shortcutKey === "b") {
        event.preventDefault();
        setIsExplorerOpen((prev) => !prev);
        return;
      }

      if (event.ctrlKey && shortcutKey === "t") {
        event.preventDefault();
        setIsOutputOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = api.onWorkspaceChanged(() => {
      if (timer) {
        clearTimeout(timer);
      }

      timer = setTimeout(() => {
        void refreshWorkspace();
        void refreshGitStatus();
      }, 120);
    });

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      unsubscribe();
    };
  }, [workspaceRoot]);

  useEffect(() => {
    if (isGitOpen) {
      void refreshGitStatus();
    }
  }, [isGitOpen, workspaceRoot]);

  useEffect(() => {
    if (!resizingPanel) {
      return;
    }

    const onMouseMove = (event: MouseEvent) => {
      const nextHeight = clampPanelHeight(
        resizingPanel.startHeight + (resizingPanel.startY - event.clientY)
      );

      if (resizingPanel.target === "output") {
        setOutputHeight(nextHeight);
      } else {
        setTerminalHeight(nextHeight);
      }
    };

    const onMouseUp = () => {
      setResizingPanel(null);
    };

    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [resizingPanel]);

  useEffect(() => {
    if (!resizingExplorer) {
      return;
    }

    const onMouseMove = (event: MouseEvent) => {
      setExplorerWidth(clampExplorerWidth(resizingExplorer.startWidth + (event.clientX - resizingExplorer.startX)));
    };

    const onMouseUp = () => {
      setResizingExplorer(null);
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [resizingExplorer]);

  const startResize = (target: "output" | "terminal", event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    setResizingPanel({
      target,
      startY: event.clientY,
      startHeight: target === "output" ? outputHeight : terminalHeight
    });
  };

  const startExplorerResize = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();

    setResizingExplorer({
      startX: event.clientX,
      startWidth: explorerWidth
    });
  };

  const handleOpenWorkspace = async () => {
    const state = await api.openWorkspaceDialog();
    setWorkspace(state.rootPath, state.tree);
  };

  const refreshWorkspace = async () => {
    const state = await api.getWorkspaceState();
    setWorkspace(state.rootPath, state.tree);
  };

  const handleOpenFile = async (filePath: string) => {
    const content = await api.readFile({ filePath });
    openTab({
      path: filePath,
      name: filePath.split(/[/\\]/).at(-1) ?? filePath,
      content,
      dirty: false
    });
  };

  const handleSave = async () => {
    if (!activeTab) {
      return;
    }

    const editor = editorRef.current;
    const currentContent = editor?.getValue() ?? activeTab.content;
    const contentToSave = await formatContentForPath(activeTab.path, currentContent);

    if (editor && contentToSave !== currentContent) {
      editor.setValue(contentToSave);
    }

    await api.writeFile({ filePath: activeTab.path, content: contentToSave });
    updateActiveTabContent(contentToSave);
    markActiveTabSaved();

    if (autoRunOnSave) {
      await handleRunCode(contentToSave, activeTab.path, activeTab.name);
    }
  };

  const getRuntimeFromFilePath = (filePath: string): "php" | "js" | "ts" | null => {
    const normalized = filePath.toLowerCase();

    if (normalized.endsWith(".php")) {
      return "php";
    }

    if (normalized.endsWith(".js") || normalized.endsWith(".mjs") || normalized.endsWith(".cjs")) {
      return "js";
    }

    if (normalized.endsWith(".ts") || normalized.endsWith(".mts") || normalized.endsWith(".cts")) {
      return "ts";
    }

    return null;
  };

  const stripAnsiCodes = (value: string) =>
    value.replace(/[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-ntqry=><~]))/g, "");

  const handleRunCode = async (contentOverride?: string, pathOverride?: string, nameOverride?: string) => {
    const currentPath = pathOverride ?? activeTab?.path;
    const currentName = nameOverride ?? activeTab?.name;
    const currentContent = contentOverride ?? activeTab?.content;

    if (!currentPath || !currentName || currentContent === undefined) {
      return;
    }

    const runtime = getRuntimeFromFilePath(currentPath);
    if (!runtime) {
      appendOutput("Erro: extensão não suportada para execução automática. Use .php, .js ou .ts\n");
      return;
    }

    setOutput("");
    setIsRunningPhp(true);
    const startedAt = Date.now();

    try {
      if (runtime === "php") {
        const result = await api.runPhpCode({
          code: currentContent,
          cwd: workspaceRoot,
          timeoutMs: 15000
        });

        appendOutput(`$ php ${currentName}\n`);
        if (result.stdout) {
          appendOutput(stripAnsiCodes(result.stdout));
        }
        if (result.stderr) {
          appendOutput(stripAnsiCodes(result.stderr));
        }
        appendOutput(`\n[exit ${result.exitCode}] ${result.durationMs}ms\n`);
        if (result.timedOut) {
          appendOutput("[timeout] Processo encerrado por limite de tempo.\n");
        }
      } else {
        await api.writeFile({ filePath: currentPath, content: currentContent });
        markActiveTabSaved();

        const escapedPath = currentPath.replace(/"/g, '\\"');
        const command = runtime === "ts" ? `npx tsx \"${escapedPath}\"` : `node \"${escapedPath}\"`;
        const result = await api.runTerminalCommand({ command, cwd: workspaceRoot });

        appendOutput(`$ ${command}\n`);
        if (result.stdout) {
          const cleanStdout = stripAnsiCodes(result.stdout);
          appendOutput(cleanStdout.endsWith("\n") ? cleanStdout : `${cleanStdout}\n`);
        }
        if (result.stderr) {
          const cleanStderr = stripAnsiCodes(result.stderr);
          appendOutput(cleanStderr.endsWith("\n") ? cleanStderr : `${cleanStderr}\n`);
        }
        appendOutput(`\n[exit ${result.exitCode}] ${Date.now() - startedAt}ms\n`);
      }
    } catch (error) {
      appendOutput(`Erro: ${String(error)}\n`);
    } finally {
      setIsRunningPhp(false);
    }
  };

  const handleRunPhp = async () => {
    await handleRunCode();
  };

  const handleConfigurePhp = async () => {
    try {
      const config = await api.openPhpExecutableDialog();
      setPhpExecutablePath(config.executablePath);
      appendOutput(`[config] PHP configurado: ${config.executablePath ?? "não definido"}\n`);
    } catch (error) {
      appendOutput(`Erro ao configurar PHP: ${String(error)}\n`);
    }
  };

  const handleRunTerminalCommand = async (command: string) => {
    appendTerminalOutput(`PS> ${command}\n`);

    try {
      const result = await api.runTerminalCommand({ command, cwd: workspaceRoot });
      if (result.stdout) {
        appendTerminalOutput(result.stdout.endsWith("\n") ? result.stdout : `${result.stdout}\n`);
      }
      if (result.stderr) {
        appendTerminalOutput(result.stderr.endsWith("\n") ? result.stderr : `${result.stderr}\n`);
      }
      appendTerminalOutput(`[exit ${result.exitCode}]\n`);
    } catch (error) {
      appendTerminalOutput(`Erro: ${String(error)}\n`);
    }
  };

  const handleCreateFile = async () => {
    setDialogInput("novo-arquivo.php");
    setCreateDialog({ type: "file", parentPath: null });
  };

  const handleCreateFileAt = async (parentPath: string | null) => {
    setDialogInput("novo-arquivo.php");
    setCreateDialog({ type: "file", parentPath });
  };

  const handleCreateDirectoryAt = async (parentPath: string | null) => {
    setDialogInput("nova-pasta");
    setCreateDialog({ type: "directory", parentPath });
  };

  const handleRenamePath = async (targetPath: string, currentName: string) => {
    setDialogInput(currentName);
    setRenameDialog({ targetPath, currentName });
  };

  const handleDeletePath = async (targetPath: string, currentName: string, type: "file" | "directory") => {
    setDeleteDialog({ targetPath, currentName, type });
  };

  const handleConfirmCreate = async () => {
    if (!createDialog || !dialogInput.trim()) {
      return;
    }

    try {
      if (createDialog.type === "file") {
        const created = await api.createFile({ parentPath: createDialog.parentPath, name: dialogInput.trim() });
        await refreshWorkspace();
        await handleOpenFile(created.filePath);
        appendOutput(`[explorer] arquivo criado: ${created.filePath}\n`);
      } else {
        const created = await api.createDirectory({ parentPath: createDialog.parentPath, name: dialogInput.trim() });
        await refreshWorkspace();
        appendOutput(`[explorer] pasta criada: ${created.directoryPath}\n`);
      }
    } catch (error) {
      appendOutput(`Erro ao criar item: ${String(error)}\n`);
    } finally {
      setCreateDialog(null);
      setDialogInput("");
    }
  };

  const handleConfirmRename = async () => {
    if (!renameDialog || !dialogInput.trim()) {
      return;
    }

    try {
      const renamed = await api.renamePath({ targetPath: renameDialog.targetPath, newName: dialogInput.trim() });
      await refreshWorkspace();
      appendOutput(`[explorer] renomeado para: ${renamed.newPath}\n`);
    } catch (error) {
      appendOutput(`Erro ao renomear: ${String(error)}\n`);
    } finally {
      setRenameDialog(null);
      setDialogInput("");
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog) {
      return;
    }

    try {
      await api.deletePath({ targetPath: deleteDialog.targetPath });
      await refreshWorkspace();
      appendOutput(`[explorer] removido: ${deleteDialog.targetPath}\n`);
    } catch (error) {
      appendOutput(`Erro ao excluir: ${String(error)}\n`);
    } finally {
      setDeleteDialog(null);
    }
  };

  const handleCopyOutputSelection = async () => {
    const container = document.getElementById("output-panel-content");
    if (!container) {
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    const selectedText = selection.toString();
    if (!selectedText.trim()) {
      return;
    }

    const range = selection.getRangeAt(0);
    const ancestor = range.commonAncestorContainer;
    const selectedInsideOutput = container.contains(
      ancestor.nodeType === Node.ELEMENT_NODE ? ancestor : ancestor.parentElement
    );

    if (!selectedInsideOutput) {
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedText);
    } catch {
      // Ignore clipboard errors gracefully.
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-panel text-text">
      <header className="flex h-11 items-center justify-between border-b border-border bg-panelAlt px-3">
        <h1 className="text-sm font-semibold">GEJA PHP IDE</h1>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={() => void handleOpenWorkspace()}>
            <BsPersonWorkspace />
          </button>
          <button className="btn" onClick={() => void handleConfigurePhp()}>
            Configurar PHP
          </button>
          <button className="btn btn-accent" onClick={() => void handleRunPhp()} disabled={!activeTab || isRunningPhp}>
            <FaPlay />
          </button>
          <button className="btn" onClick={() => void handleSave()} disabled={!activeTab} title="Salvar (ctrl+s)">
            <IoMdSave />
          </button>
          <button className="btn px-3 text-sm" onClick={() => setIsConfigOpen(true)} title="Configurações">
            ⚙
          </button>
        </div>
      </header>

      <main
        className="grid min-h-0 flex-1 overflow-hidden"
        style={{
          gridTemplateColumns: isExplorerOpen ? `${explorerWidth}px 4px minmax(0, 1fr)` : "24px minmax(0, 1fr)"
        }}
      >
        {isExplorerOpen ? (
          <aside className="flex min-h-0 flex-col overflow-hidden border-r border-border bg-panel">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-xs uppercase tracking-wide text-muted">Explorer</span>
              <div className="flex items-center gap-1">
                <button
                  className="btn h-6 px-2 py-0 text-[11px]"
                  onClick={() => setExplorerCollapseSignal((value) => value + 1)}
                  title="Recolher todas as pastas"
                  aria-label="Recolher todas as pastas"
                >
                  <FaRegMinusSquare />
                </button>
                <button
                  className="btn h-6 px-2 py-0 text-[11px]"
                  onClick={() => void handleCreateFile()}
                  title="Novo arquivo"
                  aria-label="Novo arquivo"
                >
                  <AiFillFileAdd />
                </button>
                <button className="btn h-6 px-2 py-0 text-[11px]" onClick={() => setIsExplorerOpen(false)}>
                  <FaRegWindowRestore />

                </button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <ExplorerTree
                workspaceRoot={workspaceRoot}
                nodes={tree}
                collapseAllSignal={explorerCollapseSignal}
                onOpenFile={(path) => void handleOpenFile(path)}
                onCreateFile={(parentPath) => void handleCreateFileAt(parentPath)}
                onCreateDirectory={(parentPath) => void handleCreateDirectoryAt(parentPath)}
                onRenamePath={(targetPath, currentName) => void handleRenamePath(targetPath, currentName)}
                onDeletePath={(targetPath, currentName, type) => void handleDeletePath(targetPath, currentName, type)}
              />
            </div>
          </aside>
        ) : (
          <div className="flex min-h-0 flex-col border-r border-border bg-panel">
            <button
              className="flex h-full items-center justify-center px-1 uppercase tracking-[0.25em] text-muted hover:bg-panelAlt hover:text-text"
              onClick={() => setIsExplorerOpen(true)}
              title="Mostrar Explorer"
            >
              <LuMaximize2 />
            </button>
          </div>
        )}

        {isExplorerOpen ? (
          <div
            className="cursor-col-resize bg-transparent hover:bg-accent/30"
            onMouseDown={startExplorerResize}
            title="Arraste para redimensionar o Explorer"
          />
        ) : null}

        <section className="flex min-h-0 flex-col overflow-hidden">
          <EditorTabs
            tabs={tabs}
            activeTabPath={activeTabPath}
            onSelect={setActiveTab}
            onClose={closeTab}
          />
          <div className="h-7 border-b border-border bg-panel px-3 py-1 text-[11px] text-muted">
            {activeFileBreadcrumb}
          </div>
          <div className="min-h-0 flex-1">
            <MonacoPane
              activeTab={activeTab}
              onChange={updateActiveTabContent}
              onMount={(editor) => {
                editorRef.current = editor;
              }}
              isDarkMode={themeMode === "dark"}
              tabSize={tabSize}
              isMinimapVisible={isMinimapVisible}
            />
          </div>

          {isOutputOpen ? (
            <>
              <div
                className="h-1 cursor-row-resize bg-transparent hover:bg-accent/30"
                onMouseDown={(event) => startResize("output", event)}
                title="Arraste para redimensionar o Output"
              />
              <div className="border-t border-border" style={{ height: `${outputHeight}px` }}>
                <div className="flex h-8 items-center justify-between border-b border-border bg-panel px-3 py-2 text-xs uppercase tracking-wide text-muted">
                  <span>Output</span>
                  <div className="flex items-center gap-1">
                    <button className="btn h-6 px-2 py-0 text-[11px]" onClick={() => void handleCopyOutputSelection()} title="Copiar seleção">
                      <GrCopy />
                    </button>
                    <button className="btn h-6 px-2 py-0 text-[11px]" onClick={() => setOutput("")} title="Limpar Output">
                      <VscClearAll />
                    </button>
                    <button className="btn h-6 px-2 py-0 text-[11px]" onClick={() => setIsOutputOpen(false)} title="Minimizar">
                      <FaWindowMinimize />
                    </button>
                  </div>
                </div>
                <div className="h-[calc(100%-32px)]">
                  <OutputPanel output={output} isDarkMode={themeMode === "dark"} panelId="output-panel-content" />
                </div>
              </div>
            </>
          ) : null}

          {isTerminalOpen ? (
            <>
              <div
                className="h-1 cursor-row-resize bg-transparent hover:bg-accent/30"
                onMouseDown={(event) => startResize("terminal", event)}
                title="Arraste para redimensionar o Terminal"
              />
              <div className="border-t border-border bg-panel" style={{ height: `${terminalHeight}px` }}>
                <div className="flex h-8 items-center justify-between border-b border-border bg-panel px-3 py-2 text-xs uppercase tracking-wide text-muted">
                  <span>Terminal</span>
                  <div className="flex items-center gap-1">
                    <button className="btn h-6 px-2 py-0 text-[11px]" onClick={() => setTerminalOutput("")}>
                      <VscClearAll />
                    </button>
                    <button className="btn h-6 px-2 py-0 text-[11px]" onClick={() => setIsTerminalOpen(false)}>
                      <FaWindowMinimize />
                    </button>
                  </div>
                </div>
                <div className="h-[calc(100%-32px)]">
                  <TerminalPanel
                    output={terminalOutput}
                    onExecute={handleRunTerminalCommand}
                    isDarkMode={themeMode === "dark"}
                  />
                </div>
              </div>
            </>
          ) : null}

          {isGitOpen ? (
            <div className="border-t border-border" style={{ height: "240px" }}>
              <GitPanel
                isDarkMode={themeMode === "dark"}
                branchLabel={gitBranchLabel}
                staged={gitStaged}
                unstaged={gitUnstaged}
                untracked={gitUntracked}
                isLoading={gitLoading}
                error={gitError}
                onRefresh={() => void refreshGitStatus()}
              />
            </div>
          ) : null}
        </section>
      </main>

      {isConfigOpen ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px]">
          <div className="w-[720px] max-w-[calc(100vw-2rem)] rounded border border-border bg-panel shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-text">Configurações</h2>
                <p className="text-xs text-muted">Ajustes visuais e de layout do editor.</p>
              </div>
              <button className="btn h-7 px-3 py-0" onClick={() => setIsConfigOpen(false)}>
                Fechar
              </button>
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-2">
              <section className="rounded border border-border bg-panelAlt/40 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Aparência</h3>
                <div className="space-y-3">
                  <button
                    className="btn w-full justify-between px-3"
                    onClick={() => setThemeMode((prev) => (prev === "dark" ? "light" : "dark"))}
                  >
                    <span>Tema</span>
                    <span>{themeMode === "dark" ? "Escuro" : "Claro"}</span>
                  </button>

                  <label className="flex items-center justify-between gap-3 rounded border border-border bg-panel px-3 py-2 text-xs text-muted">
                    <span>Tab size</span>
                    <select
                      className="h-7 rounded border border-border bg-panel px-2 text-xs text-text outline-none"
                      value={tabSize}
                      onChange={(event) => setTabSize(Number(event.target.value) as 2 | 4 | 8)}
                    >
                      <option value={2}>2</option>
                      <option value={4}>4</option>
                      <option value={8}>8</option>
                    </select>
                  </label>

                  <label className="flex items-center gap-2 rounded border border-border bg-panel px-3 py-2 text-xs text-text">
                    <input
                      type="checkbox"
                      checked={autoRunOnSave}
                      onChange={(event) => setAutoRunOnSave(event.target.checked)}
                    />
                    Auto-run ao salvar
                  </label>

                  <label className="flex items-center gap-2 rounded border border-border bg-panel px-3 py-2 text-xs text-text">
                    <input
                      type="checkbox"
                      checked={isMinimapVisible}
                      onChange={(event) => setIsMinimapVisible(event.target.checked)}
                    />
                    Mostrar minimapa do código
                  </label>

                  <div className="rounded border border-border bg-panel px-3 py-2 text-xs text-muted">
                    Formatação ao salvar: sempre ativada
                  </div>
                </div>
              </section>

              <section className="rounded border border-border bg-panelAlt/40 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Painéis</h3>
                <div className="space-y-2">
                  <button className="btn w-full justify-between px-3" onClick={() => setIsExplorerOpen((prev) => !prev)}>
                    <span>Explorer</span>
                    <span>{isExplorerOpen ? "Aberto" : "Fechado"}</span>
                  </button>
                  <button className="btn w-full justify-between px-3" onClick={() => setIsOutputOpen((prev) => !prev)}>
                    <span>Output</span>
                    <span>{isOutputOpen ? "Aberto" : "Fechado"}</span>
                  </button>
                  <button className="btn w-full justify-between px-3" onClick={() => setIsTerminalOpen((prev) => !prev)}>
                    <span>Terminal</span>
                    <span>{isTerminalOpen ? "Aberto" : "Fechado"}</span>
                  </button>
                  <button className="btn w-full justify-between px-3" onClick={() => setIsGitOpen((prev) => !prev)}>
                    <span>Git</span>
                    <span>{isGitOpen ? "Aberto" : "Fechado"}</span>
                  </button>
                </div>
              </section>

              <section className="rounded border border-border bg-panelAlt/40 p-4 md:col-span-2">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Tamanhos</h3>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="flex items-center justify-between gap-3 rounded border border-border bg-panel px-3 py-2 text-xs text-muted">
                    <span>Explorer</span>
                    <span className="font-mono text-text">{explorerWidth}px</span>
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded border border-border bg-panel px-3 py-2 text-xs text-muted">
                    <span>Output</span>
                    <span className="font-mono text-text">{outputHeight}px</span>
                  </label>
                  <label className="flex items-center justify-between gap-3 rounded border border-border bg-panel px-3 py-2 text-xs text-muted">
                    <span>Terminal</span>
                    <span className="font-mono text-text">{terminalHeight}px</span>
                  </label>
                </div>
              </section>
            </div>
          </div>
        </div>
      ) : null}

      <StatusBar
        workspaceRoot={workspaceRoot}
        phpExecutablePath={phpExecutablePath}
        appVersion={appVersion}
        running={isRunningPhp}
      />

      {createDialog ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="w-[420px] rounded border border-border bg-panel p-4">
            <h2 className="mb-3 text-sm font-semibold">{createDialog.type === "file" ? "Novo arquivo" : "Nova pasta"}</h2>
            <input
              autoFocus
              className="mb-3 h-8 w-full rounded border border-border bg-panelAlt px-2 text-sm text-text outline-none focus:border-accent"
              value={dialogInput}
              onChange={(event) => setDialogInput(event.target.value)}
              placeholder={createDialog.type === "file" ? "arquivo.php" : "nome-da-pasta"}
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => setCreateDialog(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-accent" onClick={() => void handleConfirmCreate()}>
                Criar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {renameDialog ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="w-[420px] rounded border border-border bg-panel p-4">
            <h2 className="mb-3 text-sm font-semibold">Renomear</h2>
            <input
              autoFocus
              className="mb-3 h-8 w-full rounded border border-border bg-panelAlt px-2 text-sm text-text outline-none focus:border-accent"
              value={dialogInput}
              onChange={(event) => setDialogInput(event.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => setRenameDialog(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-accent" onClick={() => void handleConfirmRename()}>
                Renomear
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteDialog ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50">
          <div className="w-[420px] rounded border border-border bg-panel p-4">
            <h2 className="mb-3 text-sm font-semibold">Confirmar exclusão</h2>
            <p className="mb-4 text-sm text-muted">
              Deseja excluir {deleteDialog.type === "directory" ? "a pasta" : "o arquivo"} <strong>{deleteDialog.currentName}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn" onClick={() => setDeleteDialog(null)}>
                Cancelar
              </button>
              <button type="button" className="btn btn-accent" onClick={() => void handleConfirmDelete()}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
