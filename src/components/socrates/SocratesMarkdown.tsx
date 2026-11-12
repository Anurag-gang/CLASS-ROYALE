"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";

// =============================================================================
// 1. Streaming Auto-Recovery Heuristics
// =============================================================================

export function recoverStreamingMarkdown(raw: string): string {
  if (!raw) return "";
  let processed = raw;

  // 1. Recover unclosed code fences (```)
  const codeFenceMatches = processed.match(/```/g);
  if (codeFenceMatches && codeFenceMatches.length % 2 === 1) {
    processed += "\n```";
  }

  // 2. Recover unclosed block math ($$)
  const blockMathMatches = processed.match(/(?<!\\)\$\$/g);
  if (blockMathMatches && blockMathMatches.length % 2 === 1) {
    processed += "\n$$";
  }

  return processed;
}

// =============================================================================
// 1b. URL Protocol Sanitization Whitelist
// =============================================================================

/**
 * Sanitizes markdown link URLs against a strict protocol whitelist.
 * Permits http, https, absolute paths (/), and mailto. Replaces unsafe schemes (javascript:, data:, vbscript:) with '#'.
 */
export function sanitizeMarkdownUrl(url: string): string {
  if (!url) return "#";
  const trimmed = url.trim();
  return /^(?:https?:\/\/|\/|mailto:)/i.test(trimmed) ? trimmed : "#";
}

// =============================================================================
// 2. AST Block Lexer
// =============================================================================

export type MarkdownBlock =
  | { type: "code"; code: string; lang: string }
  | { type: "math_block"; latex: string }
  | { type: "table"; headers: string[]; rows: string[][]; alignments: ("left" | "center" | "right")[] }
  | { type: "heading"; level: number; text: string }
  | { type: "blockquote"; text: string }
  | { type: "unordered_list"; items: string[] }
  | { type: "ordered_list"; items: string[] }
  | { type: "hr" }
  | { type: "paragraph"; text: string };

export function parseMarkdownBlocks(text: string): MarkdownBlock[] {
  const recovered = recoverStreamingMarkdown(text);
  const lines = recovered.replace(/\r\n/g, "\n").split("\n");
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // A. Code Block (```)
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++; // consume closing ```
      blocks.push({
        type: "code",
        code: codeLines.join("\n"),
        lang,
      });
      continue;
    }

    // B. Block Math ($$)
    if (trimmed.startsWith("$$")) {
      if (trimmed.endsWith("$$") && trimmed.length > 2) {
        // Single-line block math
        blocks.push({
          type: "math_block",
          latex: trimmed.slice(2, -2).trim(),
        });
        i++;
        continue;
      }
      const mathLines: string[] = [];
      const firstLineMath = trimmed.slice(2).trim();
      if (firstLineMath) {
        mathLines.push(firstLineMath);
      }
      i++;
      while (i < lines.length && !lines[i].trim().endsWith("$$")) {
        mathLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        const lastLine = lines[i].trim();
        if (lastLine !== "$$") {
          const closingMath = lastLine.endsWith("$$") ? lastLine.slice(0, -2).trim() : lastLine;
          if (closingMath) {
            mathLines.push(closingMath);
          }
        }
        i++;
      }
      blocks.push({
        type: "math_block",
        latex: mathLines.join("\n").trim(),
      });
      continue;
    }

    // C. Markdown Table (| ... |)
    if (trimmed.startsWith("|") && trimmed.endsWith("|") && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (nextLine.startsWith("|") && nextLine.includes("-") && nextLine.endsWith("|")) {
        // Table detected
        const headerCells = trimmed
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());
        const separatorCells = nextLine
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());

        const alignments: ("left" | "center" | "right")[] = separatorCells.map((sep) => {
          if (sep.startsWith(":") && sep.endsWith(":")) return "center";
          if (sep.endsWith(":")) return "right";
          return "left";
        });

        i += 2;
        const rows: string[][] = [];
        while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
          const rowCells = lines[i]
            .trim()
            .slice(1, -1)
            .split("|")
            .map((c) => c.trim());
          rows.push(rowCells);
          i++;
        }

        blocks.push({
          type: "table",
          headers: headerCells,
          rows,
          alignments,
        });
        continue;
      }
    }

    // D. Headings (#)
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      i++;
      continue;
    }

    // E. Blockquotes (>)
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "blockquote",
        text: quoteLines.join("\n"),
      });
      continue;
    }

    // F. Unordered Lists (- or *)
    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*+]\s+/, ""));
        i++;
      }
      blocks.push({
        type: "unordered_list",
        items,
      });
      continue;
    }

    // G. Ordered Lists (1.)
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({
        type: "ordered_list",
        items,
      });
      continue;
    }

    // H. Horizontal Rule (---, ***, ___)
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // I. Standard Paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("$$") &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !/^[-*+]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !(lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|"))
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({
      type: "paragraph",
      text: paraLines.join(" "),
    });
  }

  return blocks;
}

// =============================================================================
// 3. LaTeX Math Semantic Typography Engine
// =============================================================================

export function renderLatex(latex: string, isBlock: boolean = false): React.ReactNode {
  // Check for global KaTeX progressive enhancement
  if (typeof window !== "undefined" && (window as any).katex) {
    try {
      const html = (window as any).katex.renderToString(latex, {
        throwOnError: false,
        displayMode: isBlock,
      });
      return (
        <span
          dangerouslySetInnerHTML={{ __html: html }}
          className={isBlock ? "block my-3 text-center" : "inline-block"}
        />
      );
    } catch {
      // Fallback to built-in typography
    }
  }

  // Built-in Semantic Math Typography
  let parsed = latex.trim();

  // Mathematical Calligraphic & Greek
  parsed = parsed.replace(/\\mathcal\{O\}|\\mathcal\{o\}/g, "𝒪");
  parsed = parsed.replace(/\\Omega/g, "Ω");
  parsed = parsed.replace(/\\Theta/g, "Θ");
  parsed = parsed.replace(/\\Sigma/g, "Σ");
  parsed = parsed.replace(/\\Delta/g, "Δ");
  parsed = parsed.replace(/\\alpha/g, "α");
  parsed = parsed.replace(/\\beta/g, "β");
  parsed = parsed.replace(/\\gamma/g, "γ");
  parsed = parsed.replace(/\\delta/g, "δ");
  parsed = parsed.replace(/\\epsilon/g, "ε");
  parsed = parsed.replace(/\\lambda/g, "λ");
  parsed = parsed.replace(/\\mu/g, "μ");
  parsed = parsed.replace(/\\pi/g, "π");
  parsed = parsed.replace(/\\sigma/g, "σ");
  parsed = parsed.replace(/\\infty/g, "∞");
  parsed = parsed.replace(/\\le|\\leq/g, "≤");
  parsed = parsed.replace(/\\ge|\\geq/g, "≥");
  parsed = parsed.replace(/\\ne|\\neq/g, "≠");
  parsed = parsed.replace(/\\approx/g, "≈");
  parsed = parsed.replace(/\\times/g, "×");
  parsed = parsed.replace(/\\cdot/g, "·");
  parsed = parsed.replace(/\\pm/g, "±");
  parsed = parsed.replace(/\\in/g, "∈");
  parsed = parsed.replace(/\\notin/g, "∉");
  parsed = parsed.replace(/\\forall/g, "∀");
  parsed = parsed.replace(/\\exists/g, "∃");
  parsed = parsed.replace(/\\to|\\rightarrow/g, "→");
  parsed = parsed.replace(/\\log/g, "log");
  parsed = parsed.replace(/\\ln/g, "ln");

  // Stacked Fractions: \frac{a}{b} -> (a / b)
  parsed = parsed.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, "($1 / $2)");

  // Handle Summations: \sum_{i=1}^n or \sum_{i=1}^{n}
  parsed = parsed.replace(
    /\\sum_\{([^{}]+)\}\^(?:\{([^{}]+)\}|([a-zA-Z0-9\\]+))/g,
    (_, from, to1, to2) => `∑ [${from} to ${to1 || to2}]`
  );
  parsed = parsed.replace(/\\sum_\{([^{}]+)\}/g, "∑ [$1]");
  parsed = parsed.replace(/\\sum/g, "∑");

  // Handle Integrals & Products
  parsed = parsed.replace(/\\prod/g, "∏");
  parsed = parsed.replace(/\\int/g, "∫");

  // Strip remaining backslashes from simple commands
  parsed = parsed.replace(/\\text\{([^{}]+)\}/g, "$1");
  parsed = parsed.replace(/\\([a-zA-Z]+)/g, "$1");

  if (isBlock) {
    return (
      <div className="my-4 py-3 px-4 rounded-xl bg-[#060c1c]/90 border border-cyan-500/30 shadow-lg flex items-center justify-center overflow-x-auto text-cyan-200 font-mono text-sm sm:text-base tracking-wider select-all">
        {parsed}
      </div>
    );
  }

  return (
    <span className="inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded bg-cyan-950/40 border border-cyan-800/40 text-cyan-200 font-mono text-xs sm:text-[13px] tracking-wide select-all">
      {parsed}
    </span>
  );
}

// =============================================================================
// 4. Inline Tokenizer (Bold, Italic, Code, Math, Links, Strikethrough)
// =============================================================================

export function parseInline(text: string): React.ReactNode {
  if (!text) return null;

  // Split tokens: ***bold italic***, **bold**, *italic*, `code`, $math$, [link](url), ~~strike~~
  const tokenRegex = /(\*\*\*.*?\*\*\*|\*\*.*?\*\*|\*.*?\*|`[^`]+`|(?<!\\)\$[^\s\$](?:[^\$]*?[^\s\$])?\$|\[.*?\]\(.*?\)|\~\~.*?\~\~)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold + Italic
    if (part.startsWith("***") && part.endsWith("***") && part.length >= 6) {
      return (
        <strong key={index} className="font-semibold italic text-white">
          {parseInline(part.slice(3, -3))}
        </strong>
      );
    }

    // Bold
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={index} className="font-semibold text-white">
          {parseInline(part.slice(2, -2))}
        </strong>
      );
    }

    // Italic
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return (
        <em key={index} className="italic text-zinc-200">
          {parseInline(part.slice(1, -1))}
        </em>
      );
    }

    // Inline Code
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded-md bg-white/[0.08] text-cyan-300 font-mono text-xs border border-white/[0.08]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Inline Math: $...$
    if (part.startsWith("$") && part.endsWith("$") && part.length >= 2) {
      return <React.Fragment key={index}>{renderLatex(part.slice(1, -1), false)}</React.Fragment>;
    }

    // Strikethrough: ~~...~~
    if (part.startsWith("~~") && part.endsWith("~~") && part.length >= 4) {
      return (
        <del key={index} className="line-through text-zinc-400">
          {parseInline(part.slice(2, -2))}
        </del>
      );
    }

    // Links: [label](url)
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      // Sanitize URL schemes with strict protocol whitelist (https, http, absolute /, mailto)
      const safeUrl = sanitizeMarkdownUrl(url);
      return (
        <a
          key={index}
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
        >
          {label}
        </a>
      );
    }

    // Unescaped currency dollar or literal text
    const cleanText = part.replace(/\\\$/g, "$");
    return <span key={index}>{cleanText}</span>;
  });
}

// =============================================================================
// 5. Monospace Code Block Component with Copy Button & Syntax Highlighting
// =============================================================================

function highlightCodeLine(line: string, _lang: string): React.ReactNode {
  if (!line) return "\n";

  // Match Strings & Comments first
  const commentRegex = /^(#|\/\/|--).*$/;
  if (commentRegex.test(line.trim())) {
    return <span className="text-zinc-500 italic">{line}</span>;
  }

  // Tokenize keywords, numbers, strings
  const tokens = line.split(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`|\b(?:def|class|return|if|else|elif|for|while|try|except|import|from|with|as|in|is|lambda|async|await|const|let|var|function|interface|type|public|private|static|void|int|bool|float|double|auto|template|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|JOIN|echo)\b|\b\d+(?:\.\d+)?\b)/g);

  return tokens.map((token, i) => {
    if (!token) return null;
    if (/^["'`].*["'`]$/.test(token)) {
      return (
        <span key={i} className="text-emerald-300">
          {token}
        </span>
      );
    }
    if (
      /^\b(?:def|class|return|if|else|elif|for|while|try|except|import|from|with|as|in|is|lambda|async|await|const|let|var|function|interface|type|public|private|static|void|int|bool|float|double|auto|template|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|JOIN|echo)\b$/.test(
        token
      )
    ) {
      return (
        <span key={i} className="text-cyan-400 font-semibold">
          {token}
        </span>
      );
    }
    if (/^\b\d+(?:\.\d+)?\b$/.test(token)) {
      return (
        <span key={i} className="text-amber-300">
          {token}
        </span>
      );
    }
    return <span key={i}>{token}</span>;
  });
}

export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const displayLang = (lang || "CODE").toUpperCase();

  const handleCopy = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      } else if (typeof document !== "undefined") {
        const ta = document.createElement("textarea");
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Graceful fallback
    }
  };

  const lines = code.split("\n");

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-white/10 bg-[#050811]/95 shadow-xl transition-all duration-200 hover:border-cyan-500/30">
      {/* Code Header Bar */}
      <div className="px-4 py-2 bg-white/[0.04] border-b border-white/[0.06] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase bg-cyan-950/70 text-cyan-400 border border-cyan-800/40">
            {displayLang}
          </span>
          <span className="text-[11px] text-zinc-500 hidden sm:inline">UTF-8</span>
        </div>

        {/* 1-Click Copy Button */}
        <button
          onClick={handleCopy}
          type="button"
          aria-label="Copy code to clipboard"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-cyan-500/40 text-zinc-300 hover:text-cyan-300 transition-all text-xs cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="p-4 overflow-x-auto text-xs sm:text-[13px] font-mono leading-relaxed text-zinc-200">
        <code>
          {lines.map((line, idx) => (
            <div key={idx} className="table-row">
              <span className="table-cell pr-4 select-none text-[11px] font-mono text-zinc-600 text-right min-w-[2rem]">
                {idx + 1}
              </span>
              <span className="table-cell">{highlightCodeLine(line, lang || "")}</span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

// =============================================================================
// 6. Markdown Table Component
// =============================================================================

function MarkdownTable({
  headers,
  rows,
  alignments,
}: {
  headers: string[];
  rows: string[][];
  alignments: ("left" | "center" | "right")[];
}) {
  return (
    <div className="my-4 overflow-x-auto rounded-xl border border-white/10 bg-[#070b14]/90 shadow-xl">
      <table className="w-full text-left text-xs sm:text-sm font-sans">
        <thead className="bg-white/[0.05] border-b border-white/10 text-cyan-300 font-mono text-xs uppercase tracking-wider">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className={`px-4 py-3 font-semibold ${
                  alignments[i] === "center"
                    ? "text-center"
                    : alignments[i] === "right"
                    ? "text-right"
                    : "text-left"
                }`}
              >
                {parseInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.06]">
          {rows.map((row, rIdx) => (
            <tr key={rIdx} className="hover:bg-white/[0.02] transition-colors">
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className={`px-4 py-3 text-zinc-200 ${
                    alignments[cIdx] === "center"
                      ? "text-center"
                      : alignments[cIdx] === "right"
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// 7. Main SocratesMarkdown Component
// =============================================================================

export interface SocratesMarkdownProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

export function SocratesMarkdown({ content, className = "" }: SocratesMarkdownProps) {
  const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

  if (!content) return null;

  return (
    <div className={`space-y-3 leading-relaxed font-sans text-sm text-zinc-200/90 ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "code":
            return <CodeBlock key={idx} code={block.code} lang={block.lang} />;

          case "math_block":
            return <React.Fragment key={idx}>{renderLatex(block.latex, true)}</React.Fragment>;

          case "table":
            return (
              <MarkdownTable
                key={idx}
                headers={block.headers}
                rows={block.rows}
                alignments={block.alignments}
              />
            );

          case "heading": {
            if (block.level === 1) {
              return (
                <h1
                  key={idx}
                  className="text-xl sm:text-2xl font-bold text-white mt-6 mb-3 pb-2 border-b border-white/10 flex items-center gap-2"
                >
                  {parseInline(block.text)}
                </h1>
              );
            }
            if (block.level === 2) {
              return (
                <h2
                  key={idx}
                  className="text-lg sm:text-xl font-bold text-cyan-300 mt-5 mb-2.5 flex items-center gap-2"
                >
                  {parseInline(block.text)}
                </h2>
              );
            }
            if (block.level === 3) {
              return (
                <h3
                  key={idx}
                  className="text-base sm:text-lg font-semibold text-cyan-200 mt-4 mb-2 flex items-center gap-2"
                >
                  {parseInline(block.text)}
                </h3>
              );
            }
            return (
              <h4 key={idx} className="text-sm sm:text-base font-semibold text-zinc-200 mt-3 mb-1.5">
                {parseInline(block.text)}
              </h4>
            );
          }

          case "blockquote":
            return (
              <blockquote
                key={idx}
                className="my-3 pl-4 py-2 border-l-2 border-cyan-400/60 bg-cyan-950/20 rounded-r-lg text-sm italic text-zinc-300"
              >
                {parseInline(block.text)}
              </blockquote>
            );

          case "unordered_list":
            return (
              <ul key={idx} className="my-2.5 space-y-1.5 pl-2">
                {block.items.map((item, itemIdx) => (
                  <li
                    key={itemIdx}
                    className="flex items-start gap-2.5 text-sm text-zinc-200 leading-relaxed"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0 shadow-[0_0_6px_rgba(34,211,238,0.6)]" />
                    <span>{parseInline(item)}</span>
                  </li>
                ))}
              </ul>
            );

          case "ordered_list":
            return (
              <ol key={idx} className="my-2.5 space-y-1.5 pl-2">
                {block.items.map((item, itemIdx) => (
                  <li
                    key={itemIdx}
                    className="flex items-start gap-2 text-sm text-zinc-200 leading-relaxed"
                  >
                    <span className="font-mono text-cyan-400 text-xs mt-0.5 shrink-0 min-w-[1.2rem]">
                      {itemIdx + 1}.
                    </span>
                    <span>{parseInline(item)}</span>
                  </li>
                ))}
              </ol>
            );

          case "hr":
            return <hr key={idx} className="my-6 border-white/10" />;

          case "paragraph":
          default:
            return <p key={idx}>{parseInline(block.text)}</p>;
        }
      })}
    </div>
  );
}

export default SocratesMarkdown;
