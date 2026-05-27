type OutputPanelProps = {
  output: string;
  isDarkMode: boolean;
  panelId: string;
};

const tryParseJson = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
};

const extractJsonCandidate = (value: string) => {
  const direct = tryParseJson(value);
  if (direct) {
    return direct;
  }

  const lines = value
    .split(/\r?\n/)
    .filter((line) => !line.startsWith("$ "))
    .filter((line) => !/^\[exit\s+-?\d+\]/.test(line.trim()));

  const normalized = lines.join("\n").trim();
  if (!normalized) {
    return null;
  }

  return tryParseJson(normalized);
};

const highlightJson = (jsonText: string) => {
  const escaped = jsonText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"\s*:?)|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
    (match) => {
      let className = "output-json-number";

      if (match.startsWith('"')) {
        className = match.endsWith(":") ? "output-json-key" : "output-json-string";
      } else if (match === "true" || match === "false") {
        className = "output-json-boolean";
      } else if (match === "null") {
        className = "output-json-null";
      }

      return `<span class="${className}">${match}</span>`;
    }
  );
};

export const OutputPanel = ({ output, isDarkMode, panelId }: OutputPanelProps) => {
  const parsedJson = extractJsonCandidate(output);
  const highlightedJson = parsedJson ? highlightJson(JSON.stringify(parsedJson, null, 2)) : null;

  return (
    <div
      id={panelId}
      className={`h-full overflow-auto p-3 font-mono text-xs ${isDarkMode ? "bg-[#0f111a] text-[#d6ffe9]" : "bg-[#f7f9ff] text-[#1f2937]"
        }`}
    >
      {highlightedJson ? (
        <pre
          className="output-json whitespace-pre-wrap select-text"
          dangerouslySetInnerHTML={{ __html: highlightedJson }}
        />
      ) : (
        <pre className="whitespace-pre-wrap select-text">{output || "Sem output ainda."}</pre>
      )}
    </div>
  );
};
