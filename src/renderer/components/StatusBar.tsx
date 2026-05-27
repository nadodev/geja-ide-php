type StatusBarProps = {
  workspaceRoot: string | null;
  phpExecutablePath: string | null;
  appVersion: string;
  running: boolean;
};

export const StatusBar = ({ workspaceRoot, phpExecutablePath, appVersion, running }: StatusBarProps) => {
  return (
    <footer className="flex h-8 items-center justify-between border-t border-border bg-panel px-3 text-[11px] text-muted">
      <span className="truncate">Workspace: {workspaceRoot ?? "não selecionado"}</span>
      <span className="truncate">PHP: {phpExecutablePath ?? "não configurado"}</span>
      <span>{running ? "Executando PHP..." : "Idle"}</span>
      <span>v{appVersion || "dev"}</span>
    </footer>
  );
};
