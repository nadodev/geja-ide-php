import { FaRegWindowClose } from "react-icons/fa";
import type { EditorTab } from "../store/app-store";

type EditorTabsProps = {
  tabs: EditorTab[];
  activeTabPath: string | null;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
};

export const EditorTabs = ({ tabs, activeTabPath, onSelect, onClose }: EditorTabsProps) => {
  return (
    <div className="flex h-10 items-center gap-1 overflow-x-auto border-b border-border bg-panel px-2">
      {tabs.length === 0 ? <span className="px-2 text-xs text-muted">Nenhum arquivo aberto</span> : null}
      {tabs.map((tab) => {
        const isActive = activeTabPath === tab.path;

        return (
          <div
            key={tab.path}
            className={`group flex shrink-0 items-center gap-2 rounded-t border border-b-0 px-3 py-1 text-xs ${isActive ? "border-border bg-panelAlt text-text" : "border-transparent text-muted hover:text-text"
              }`}
          >
            <button type="button" className="max-w-[180px] truncate" onClick={() => onSelect(tab.path)}>
              {tab.name}
              {tab.dirty ? " *" : ""}
            </button>
            <button
              type="button"
              className="text-muted transition hover:text-text"
              onClick={() => onClose(tab.path)}
              aria-label={`Close ${tab.name}`}
            >
              <FaRegWindowClose />
            </button>
          </div>
        );
      })}
    </div>
  );
};
