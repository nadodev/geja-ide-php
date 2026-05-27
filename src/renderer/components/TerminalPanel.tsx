import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

type TerminalPanelProps = {
  output: string;
  onExecute: (command: string) => Promise<void>;
  isDarkMode: boolean;
};

export const TerminalPanel = ({ output, onExecute, isDarkMode }: TerminalPanelProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const printedLengthRef = useRef(0);
  const [command, setCommand] = useState("");

  const handleCopySelection = async () => {
    const selected = terminalRef.current?.getSelection() ?? "";
    if (!selected.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(selected);
    } catch {
      // Clipboard API may fail in some contexts; ignore gracefully.
    }
  };

  useEffect(() => {
    const terminal = new Terminal({
      fontFamily: "Consolas, monospace",
      fontSize: 12,
      convertEol: true,
      cursorBlink: true,
      theme: {
        background: isDarkMode ? "#0f111a" : "#ffffff",
        foreground: isDarkMode ? "#d9e1f0" : "#1f2937"
      }
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    if (containerRef.current) {
      terminal.open(containerRef.current);
      fitAddon.fit();
      terminal.writeln("Terminal pronto. Execute comandos via campo abaixo.");
    }

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    const onResize = () => fitAddon.fit();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      terminal.dispose();
    };
  }, [isDarkMode]);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) {
      return;
    }

    terminal.options.theme = {
      background: isDarkMode ? "#0f111a" : "#ffffff",
      foreground: isDarkMode ? "#d9e1f0" : "#1f2937"
    };
  }, [isDarkMode]);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) {
      return;
    }

    if (output.length === 0) {
      terminal.clear();
      printedLengthRef.current = 0;
      terminal.writeln("Terminal pronto. Execute comandos via campo abaixo.");
      return;
    }

    if (output.length <= printedLengthRef.current) {
      return;
    }

    const chunk = output.slice(printedLengthRef.current);
    printedLengthRef.current = output.length;

    chunk.split("\n").forEach((line) => {
      terminal.writeln(line);
    });
  }, [output]);

  return (
    <div className="flex h-full flex-col">
      <div ref={containerRef} className="h-[calc(100%-42px)] w-full" />
      <form
        className="flex h-[42px] items-center gap-2 border-t border-border bg-panel px-2"
        onSubmit={async (event) => {
          event.preventDefault();
          const value = command.trim();
          if (!value) {
            return;
          }
          setCommand("");
          await onExecute(value);
        }}
      >
        <span className="font-mono text-xs text-muted">PS&gt;</span>
        <input
          className="h-7 flex-1 rounded border border-border bg-panelAlt px-2 text-xs text-text outline-none focus:border-accent"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          placeholder="Digite um comando PowerShell"
        />
        <button
          type="submit"
          className="h-7 rounded bg-accent px-3 text-xs font-semibold text-[#042620] transition hover:brightness-110"
        >
          Run
        </button>
        <button
          type="button"
          className="h-7 rounded border border-border bg-panelAlt px-3 text-xs text-text transition hover:bg-panel"
          onClick={() => void handleCopySelection()}
        >
          Copiar selecao
        </button>
      </form>
    </div>
  );
};
