type GitPanelProps = {
  isDarkMode: boolean;
  branchLabel: string;
  staged: string[];
  unstaged: string[];
  untracked: string[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
};

const StatusSection = ({ title, items, emptyText }: { title: string; items: string[]; emptyText: string }) => (
  <section className="rounded border border-border bg-panelAlt/40 p-3">
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text">{title}</h3>
      <span className="rounded bg-panel px-2 py-0.5 text-[10px] text-muted">{items.length}</span>
    </div>
    {items.length > 0 ? (
      <ul className="space-y-1 text-xs text-text">
        {items.map((item) => (
          <li key={`${title}-${item}`} className="break-all rounded bg-panel px-2 py-1 font-mono text-[11px] text-text">
            {item}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-xs text-muted">{emptyText}</p>
    )}
  </section>
);

export const GitPanel = ({
  isDarkMode,
  branchLabel,
  staged,
  unstaged,
  untracked,
  isLoading,
  error,
  onRefresh
}: GitPanelProps) => {
  const hasChanges = staged.length > 0 || unstaged.length > 0 || untracked.length > 0;

  return (
    <div className={`flex h-full flex-col ${isDarkMode ? "bg-[#0f111a] text-[#d9e1f0]" : "bg-[#ffffff] text-[#1f2937]"}`}>
      <div className="flex h-8 items-center justify-between border-b border-border bg-panel px-3 py-2 text-xs uppercase tracking-wide text-muted">
        <span>Git</span>
        <div className="flex items-center gap-1 normal-case tracking-normal">
          <button className="btn h-6 px-2 py-0 text-[11px]" onClick={onRefresh} disabled={isLoading}>
            {isLoading ? "Atualizando" : "Atualizar"}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-3">
        <div className="mb-3 rounded border border-border bg-panelAlt/40 p-3">
          <div className="text-xs text-muted">Branch</div>
          <div className="mt-1 font-mono text-sm text-text">{branchLabel || "Sem branch detectada"}</div>
        </div>

        {error ? (
          <div className="mb-3 rounded border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300">
            {error}
          </div>
        ) : null}

        {isLoading ? <div className="mb-3 text-xs text-muted">Lendo estado do Git...</div> : null}

        {!isLoading && !error && !hasChanges ? (
          <div className="rounded border border-border bg-panelAlt/40 p-3 text-xs text-muted">
            Nenhuma mudança detectada. Working tree limpa.
          </div>
        ) : null}

        <div className="space-y-3">
          <StatusSection title="Staged" items={staged} emptyText="Nada staged." />
          <StatusSection title="Unstaged" items={unstaged} emptyText="Nada pendente no working tree." />
          <StatusSection title="Untracked" items={untracked} emptyText="Sem arquivos novos." />
        </div>
      </div>
    </div>
  );
};
