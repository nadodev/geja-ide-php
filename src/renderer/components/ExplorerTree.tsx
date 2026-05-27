import { useEffect, useMemo, useRef, useState } from "react";
import type { FileNode } from "../../shared/ipc/contracts";
import { FaChevronDown, FaChevronRight, FaEdit, FaJs, FaRegTrashAlt } from "react-icons/fa";
import { AiFillFileAdd, AiFillFolderAdd } from "react-icons/ai";
import { TbFileTypeCss, TbFileTypeHtml, TbTrashOff } from "react-icons/tb";
import { MdDriveFileRenameOutline, MdOutlinePhp } from "react-icons/md";
import { BsTypescript } from "react-icons/bs";
import { IoLogoMarkdown } from "react-icons/io";

type ExplorerTreeProps = {
  workspaceRoot: string | null;
  nodes: FileNode[];
  collapseAllSignal: number;
  onOpenFile: (filePath: string) => void;
  onCreateFile: (parentPath: string | null) => void;
  onCreateDirectory: (parentPath: string | null) => void;
  onRenamePath: (targetPath: string, currentName: string) => void;
  onDeletePath: (targetPath: string, currentName: string, type: "file" | "directory") => void;
};

const getFileExtension = (fileName: string) => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === fileName.length - 1) {
    return "";
  }

  return fileName.slice(dotIndex + 1).toLowerCase();
};

const FileIcon = ({ fileName }: { fileName: string }) => {
  const extension = getFileExtension(fileName);

  if (extension === "php") {
    return <span className="shrink-0 text-[24px]" title="PHP">
      <MdOutlinePhp />

    </span>;
  }

  if (extension === "js" || extension === "mjs" || extension === "cjs") {
    return <span className="shrink-0 text-[16px]" title="JavaScript"><FaJs /></span>;
  }

  if (extension === "ts" || extension === "tsx") {
    return <span className="shrink-0 text-[16px]" title="TypeScript"><BsTypescript /></span>;
  }

  if (extension === "json") {
    return <span className="shrink-0 text-[13px]" title="JSON">🧩</span>;
  }

  if (extension === "html" || extension === "htm") {
    return <span className="shrink-0 text-[17px]" title="HTML"><TbFileTypeHtml /></span>;
  }

  if (extension === "css") {
    return <span className="shrink-0 text-[13px]" title="CSS"><TbFileTypeCss /></span>;
  }

  if (extension === "md" || extension === "mdx") {
    return <span className="shrink-0 text-[18px]" title="Markdown"><IoLogoMarkdown /></span>;
  }

  return <span className="shrink-0 text-[13px]" title="Arquivo">📄</span>;
};

const TreeNode = ({
  node,
  depth,
  onOpenFile,
  onCreateFile,
  onCreateDirectory,
  onRenamePath,
  onDeletePath,
  collapseAllSignal
}: {
  node: FileNode;
  depth: number;
  collapseAllSignal: number;
  onOpenFile: (filePath: string) => void;
  onCreateFile: (parentPath: string | null) => void;
  onCreateDirectory: (parentPath: string | null) => void;
  onRenamePath: (targetPath: string, currentName: string) => void;
  onDeletePath: (targetPath: string, currentName: string, type: "file" | "directory") => void;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const previousCollapseSignal = useRef(collapseAllSignal);

  useEffect(() => {
    if (previousCollapseSignal.current !== collapseAllSignal) {
      setIsExpanded(false);
      previousCollapseSignal.current = collapseAllSignal;
    }
  }, [collapseAllSignal]);

  const paddingLeft = depth * 12;

  if (node.type === "file") {
    return (
      <div className="group flex items-center gap-1 rounded px-1 py-0.5 hover:bg-panelAlt" style={{ paddingLeft: `${paddingLeft}px` }}>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1 truncate text-left text-xs text-text"
          onClick={() => onOpenFile(node.path)}
        >
          <FileIcon fileName={node.name} />
          <span className="truncate">{node.name}</span>
        </button>
        <button type="button" className="explorer-action" onClick={() => onRenamePath(node.path, node.name)} title="Renomear">
          <MdDriveFileRenameOutline />
        </button>
        <button type="button" className="explorer-action" onClick={() => onDeletePath(node.path, node.name, "file")} title="Excluir">
          <TbTrashOff />
        </button>
      </div>
    );
  }

  const childCount = node.children?.length ?? 0;

  return (
    <div className="mb-1">
      <div className="group flex items-center gap-1 rounded px-1 py-0.5 hover:bg-panelAlt" style={{ paddingLeft: `${paddingLeft}px` }}>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1 text-left"
          onClick={() => setIsExpanded((prev) => !prev)}
          title={isExpanded ? "Recolher pasta" : "Expandir pasta"}
        >
          <span className="shrink-0 text-[10px] text-muted">{isExpanded ? <FaChevronDown />
            : <FaChevronRight />}</span>
          <span className="shrink-0 text-[13px]" title="Pasta">
            {
              isExpanded ? "📂" : "📁"
            }
          </span>
          <span className="truncate text-xs font-medium text-muted">{node.name}</span>
          <span className="shrink-0 text-[10px] text-muted/80">{childCount}</span>
        </button>

        <button type="button" className="explorer-action" onClick={() => onCreateFile(node.path)} title="Novo arquivo">
          <AiFillFileAdd />
        </button>
        <button type="button" className="explorer-action" onClick={() => onCreateDirectory(node.path)} title="Nova pasta">
          <AiFillFolderAdd />
        </button>
        <button type="button" className="explorer-action" onClick={() => onRenamePath(node.path, node.name)} title="Renomear">
          <FaEdit />
        </button>
        <button type="button" className="explorer-action" onClick={() => onDeletePath(node.path, node.name, "directory")} title="Excluir">
          <FaRegTrashAlt />
        </button>
      </div>

      {isExpanded ? (
        <div className="ml-3 mt-1 space-y-0.5 border-l border-border/70 pl-2">
          {node.children?.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              onOpenFile={onOpenFile}
              onCreateFile={onCreateFile}
              onCreateDirectory={onCreateDirectory}
              onRenamePath={onRenamePath}
              onDeletePath={onDeletePath}
              collapseAllSignal={collapseAllSignal}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export const ExplorerTree = ({
  workspaceRoot,
  nodes,
  collapseAllSignal,
  onOpenFile,
  onCreateFile,
  onCreateDirectory,
  onRenamePath,
  onDeletePath
}: ExplorerTreeProps) => {
  const hasItems = useMemo(() => nodes.length > 0, [nodes.length]);

  if (!workspaceRoot) {
    return <p className="px-2 py-3 text-xs text-muted">Selecione um workspace para começar.</p>;
  }

  return (
    <div className="space-y-1 px-2 py-2">
      <div className="mb-2 flex items-center gap-1">
        <button type="button" className="explorer-action" onClick={() => onCreateFile(null)} title="Novo arquivo na raiz">
          +F raiz
        </button>
        <button type="button" className="explorer-action" onClick={() => onCreateDirectory(null)} title="Nova pasta na raiz">
          +D raiz
        </button>
      </div>
      {!hasItems ? <p className="px-2 py-1 text-xs text-muted">Workspace vazio.</p> : null}
      {nodes.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          depth={1}
          collapseAllSignal={collapseAllSignal}
          onOpenFile={onOpenFile}
          onCreateFile={onCreateFile}
          onCreateDirectory={onCreateDirectory}
          onRenamePath={onRenamePath}
          onDeletePath={onDeletePath}
        />
      ))}
    </div>
  );
};
