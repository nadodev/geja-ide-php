import Editor from "@monaco-editor/react";
import type { Monaco } from "@monaco-editor/react";
import type * as MonacoEditor from "monaco-editor";
import type { EditorTab } from "../store/app-store";

let phpCompletionRegistered = false;

const configureMonaco = (monaco: Monaco) => {
  monaco.editor.defineTheme("dracula-plus", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6272a4" },
      { token: "keyword", foreground: "ff79c6" },
      { token: "number", foreground: "bd93f9" },
      { token: "string", foreground: "f1fa8c" },
      { token: "type.identifier", foreground: "8be9fd" },
      { token: "delimiter", foreground: "f8f8f2" }
    ],
    colors: {
      "editor.background": "#25292e",
      "editor.foreground": "#f8f8f2",
      "editorLineNumber.foreground": "#6272a4",
      "editorLineNumber.activeForeground": "#bd93f9",
      "editorCursor.foreground": "#ff79c6",
      "editor.selectionBackground": "#44475a",
      "editor.inactiveSelectionBackground": "#3b3e4f",
      "editorIndentGuide.background1": "#343746",
      "editorIndentGuide.activeBackground1": "#6272a4",
      "editorSuggestWidget.background": "#282a36",
      "editorSuggestWidget.border": "#44475a",
      "editorSuggestWidget.selectedBackground": "#3a3d4d"
    }
  });

  monaco.editor.defineTheme("light-plus-soft", {
    base: "vs",
    inherit: true,
    rules: [
      { token: "comment", foreground: "6a737d" },
      { token: "keyword", foreground: "d73a49" },
      { token: "number", foreground: "005cc5" },
      { token: "string", foreground: "032f62" },
      { token: "type.identifier", foreground: "6f42c1" },
      { token: "delimiter", foreground: "24292e" }
    ],
    colors: {
      "editor.background": "#f8f9fc",
      "editor.foreground": "#24292e",
      "editorLineNumber.foreground": "#8b949e",
      "editorLineNumber.activeForeground": "#57606a",
      "editorCursor.foreground": "#d73a49",
      "editor.selectionBackground": "#dbe9ff",
      "editor.inactiveSelectionBackground": "#eaf2ff",
      "editorSuggestWidget.background": "#ffffff",
      "editorSuggestWidget.border": "#d0d7de",
      "editorSuggestWidget.selectedBackground": "#f1f8ff"
    }
  });

  if (phpCompletionRegistered) {
    return;
  }

  phpCompletionRegistered = true;

  monaco.languages.registerCompletionItemProvider("php", {
    triggerCharacters: ["$", ">", "_"],
    provideCompletionItems: (model: MonacoEditor.editor.ITextModel, position: MonacoEditor.Position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      const suggestions = [
        {
          label: "foreach",
          kind: monaco.languages.CompletionItemKind.Snippet,
          documentation: "Foreach com chave e valor",
          insertText:
            "foreach (${1:$array} as ${2:$key} => ${3:$value}) {\n\t$0\n}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },
        {
          label: "declare",
          kind: monaco.languages.CompletionItemKind.Snippet,
          documentation: "Declare strict types",
          insertText:
            "\ndeclare(strict_types=1);\n\n$0",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "for",
          kind: monaco.languages.CompletionItemKind.Snippet,
          documentation: "Loop for",
          insertText:
            "for ($${1:i} = 0; $${1:i} < ${2:count}; $${1:i}++) {\n\t$0\n}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "while",
          kind: monaco.languages.CompletionItemKind.Snippet,
          documentation: "Loop while",
          insertText:
            "while (${1:condition}) {\n\t$0\n}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "if",
          kind: monaco.languages.CompletionItemKind.Snippet,
          documentation: "Bloco if",
          insertText:
            "if (${1:condition}) {\n\t$0\n}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "ifelse",
          kind: monaco.languages.CompletionItemKind.Snippet,
          documentation: "If else",
          insertText:
            "if (${1:condition}) {\n\t${2:// code}\n} else {\n\t$0\n}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "switch",
          kind: monaco.languages.CompletionItemKind.Snippet,
          documentation: "Switch case",
          insertText:
            "switch (${1:$value}) {\n\tcase ${2:'value'}:\n\t\t$0\n\t\tbreak;\n\n\tdefault:\n\t\tbreak;\n}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "class",
          kind: monaco.languages.CompletionItemKind.Class,
          documentation: "Classe PHP",
          insertText:
            "class ${1:ClassName}\n{\n\tpublic function __construct()\n\t{\n\t\t$0\n\t}\n}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "interface",
          kind: monaco.languages.CompletionItemKind.Interface,
          documentation: "Interface PHP",
          insertText:
            "interface ${1:InterfaceName}\n{\n\tpublic function ${2:method}(): ${3:void};\n}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "trait",
          kind: monaco.languages.CompletionItemKind.Class,
          documentation: "Trait PHP",
          insertText:
            "trait ${1:TraitName}\n{\n\t$0\n}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "function",
          kind: monaco.languages.CompletionItemKind.Function,
          documentation: "Função PHP",
          insertText:
            "function ${1:name}(${2:$param}): ${3:void}\n{\n\t$0\n}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "trycatch",
          kind: monaco.languages.CompletionItemKind.Snippet,
          documentation: "Try catch",
          insertText:
            "try {\n\t$0\n} catch (\\Throwable $${1:e}) {\n\tvar_dump($${1:e}->getMessage());\n}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "json_encode",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText:
            "json_encode(${1:$data}, JSON_PRETTY_PRINT)",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "var_dump",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText:
            "var_dump(${1:$value});",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "$this->",
          kind: monaco.languages.CompletionItemKind.Field,
          insertText:
            "$this->${1:property}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        // =========================
        // JAVASCRIPT / TYPESCRIPT
        // =========================

        {
          label: "const",
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText:
            "const ${1:name} = ${2:value};",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "arrow",
          kind: monaco.languages.CompletionItemKind.Function,
          documentation: "Arrow function",
          insertText:
            "const ${1:name} = (${2:params}) => {\n\t$0\n};",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "async",
          kind: monaco.languages.CompletionItemKind.Function,
          documentation: "Async function",
          insertText:
            "async function ${1:name}(${2:params}) {\n\t$0\n}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "promise",
          kind: monaco.languages.CompletionItemKind.Class,
          documentation: "Promise",
          insertText:
            "return new Promise((resolve, reject) => {\n\t$0\n});",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "trycatchjs",
          kind: monaco.languages.CompletionItemKind.Snippet,
          documentation: "Try catch JS",
          insertText:
            "try {\n\t$0\n} catch (${1:error}) {\n\tconsole.error(${1:error});\n}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "fetch",
          kind: monaco.languages.CompletionItemKind.Function,
          documentation: "Fetch API",
          insertText:
            "const response = await fetch('${1:url}');\nconst data = await response.json();",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "map",
          kind: monaco.languages.CompletionItemKind.Method,
          documentation: "Array map",
          insertText:
            "${1:array}.map((${2:item}) => {\n\t$0\n});",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "interface-ts",
          kind: monaco.languages.CompletionItemKind.Interface,
          documentation: "Interface TypeScript",
          insertText:
            "interface ${1:Name} {\n\t${2:property}: ${3:string};\n}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "type-ts",
          kind: monaco.languages.CompletionItemKind.Interface,
          documentation: "Type TypeScript",
          insertText:
            "type ${1:Name} = {\n\t${2:property}: ${3:string};\n}",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        },

        {
          label: "console.log",
          kind: monaco.languages.CompletionItemKind.Function,
          insertText:
            "console.log(${1:value});",
          insertTextRules:
            monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        }
      ];

      return { suggestions };
    }
  });
};

type MonacoPaneProps = {
  activeTab: EditorTab | null;
  onChange: (value: string) => void;
  onMount: (editor: MonacoEditor.editor.IStandaloneCodeEditor) => void;
  isDarkMode: boolean;
  tabSize: 2 | 4 | 8;
  isMinimapVisible: boolean;
};

export const MonacoPane = ({ activeTab, onChange, onMount, isDarkMode, tabSize, isMinimapVisible }: MonacoPaneProps) => {
  if (!activeTab) {
    return (
      <div className="flex h-full items-center justify-center bg-panelAlt text-sm text-muted">
        Abra um arquivo no Explorer para começar.
      </div>
    );
  }

  const normalizedPath = activeTab.path.toLowerCase();
  const language =
    normalizedPath.endsWith(".ts") || normalizedPath.endsWith(".mts") || normalizedPath.endsWith(".cts")
      ? "typescript"
      : normalizedPath.endsWith(".js") || normalizedPath.endsWith(".mjs") || normalizedPath.endsWith(".cjs")
        ? "javascript"
        : "php";

  return (
    <Editor
      beforeMount={configureMonaco}
      onMount={(editor) => onMount(editor)}
      height="100%"
      language={language}
      theme={isDarkMode ? "dracula-plus" : "light-plus-soft"}
      path={activeTab.path}
      value={activeTab.content}
      onChange={(value) => onChange(value ?? "")}
      options={{
        minimap: { enabled: isMinimapVisible },
        fontSize: 14,
        automaticLayout: true,
        wordWrap: "on",
        tabSize,
        insertSpaces: true,
        quickSuggestions: {
          other: true,
          comments: false,
          strings: true
        },
        suggestOnTriggerCharacters: true,
        snippetSuggestions: "top",
        acceptSuggestionOnCommitCharacter: true,
        wordBasedSuggestions: "currentDocument",
        scrollBeyondLastLine: false
      }}
    />
  );
};
