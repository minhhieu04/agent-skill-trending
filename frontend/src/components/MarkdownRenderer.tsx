import React, { useState, useMemo } from 'react';
import { Copy, Check, Sparkles, HelpCircle, Code as CodeIcon, Terminal, ExternalLink } from 'lucide-react';
import { copyToClipboard } from '../utils/clipboard';

interface MarkdownRendererProps {
  content: string;
  isTyping?: boolean;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(({
  content,
  isTyping = false,
  className = ''
}) => {
  // Parse blocks: code blocks, headings, lists, tables, blockquotes, horizontal rules, paragraphs
  const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

  return (
    <div className={`space-y-3 text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 ${className}`}>
      {blocks.map((block, idx) => (
        <React.Fragment key={idx}>
          {renderBlock(block, idx)}
        </React.Fragment>
      ))}

      {isTyping && (
        <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-0.5 align-middle rounded-sm" />
      )}
    </div>
  );
});

// Item in a list
interface ListItem {
  text: string;
  level: number;
  isOrdered: boolean;
  orderNumber?: number;
}

// Block types
type Block =
  | { type: 'code'; language: string; code: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'hr' }
  | { type: 'blockquote'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list'; items: ListItem[] }
  | { type: 'html'; html: string }
  | { type: 'paragraph'; text: string };

function parseTableRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith('|')) trimmed = trimmed.substring(1);
  if (trimmed.endsWith('|')) trimmed = trimmed.substring(0, trimmed.length - 1);
  return trimmed.split('|').map((cell) => cell.trim());
}

export function parseMarkdownBlocks(markdown: string): Block[] {
  if (!markdown) return [];
  const normalized = markdown.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const blocks: Block[] = [];

  let i = 0;
  while (i < lines.length) {
    const startI = i;
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Code block fence (```)
    if (trimmed.startsWith('```')) {
      const language = trimmed.replace(/^```/, '').trim() || 'text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      // If ended with ```, skip it
      if (i < lines.length && lines[i].trim().startsWith('```')) {
        i++;
      }
      blocks.push({
        type: 'code',
        language,
        code: codeLines.join('\n')
      });
      continue;
    }

    // 2. Table (starts with | and followed by separator |---|)
    if (
      trimmed.includes('|') &&
      i + 1 < lines.length &&
      /^\s*\|?(\s*:?-{2,}:?\s*\|)+\s*:?-{2,}:?\s*\|?\s*$/.test(lines[i + 1].trim())
    ) {
      const headers = parseTableRow(trimmed);
      i += 2; // skip header line and separator line
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
        rows.push(parseTableRow(lines[i]));
        i++;
      }
      blocks.push({
        type: 'table',
        headers,
        rows
      });
      continue;
    }

    // 3. Horizontal Rule (---, ***, ___ on a line by itself, or <hr>, <hr/>, <hr />)
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed) || /^<hr\s*\/?>$/i.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // 3b. HTML Table block (<table> ... </table>)
    if (/^<table[\s>]/i.test(trimmed)) {
      const tableLines: string[] = [line];
      i++;
      let foundClosing = /<\/table>/i.test(trimmed);
      while (i < lines.length && !foundClosing) {
        tableLines.push(lines[i]);
        if (/<\/table>/i.test(lines[i])) {
          foundClosing = true;
        }
        i++;
      }
      blocks.push({
        type: 'html',
        html: tableLines.join('\n')
      });
      continue;
    }

    // 3c. HTML Details block (<details> ... </details>)
    if (/^<details[\s>]/i.test(trimmed)) {
      const detailsLines: string[] = [line];
      i++;
      let foundClosing = /<\/details>/i.test(trimmed);
      while (i < lines.length && !foundClosing) {
        detailsLines.push(lines[i]);
        if (/<\/details>/i.test(lines[i])) {
          foundClosing = true;
        }
        i++;
      }
      blocks.push({
        type: 'html',
        html: detailsLines.join('\n')
      });
      continue;
    }

    // 4. Headings (#, ##, ###, ####, #####, ######)
    // Support partial tokens during typewriter streaming (e.g. "### ", "###")
    const headingMatch = trimmed.match(/^(#{1,6})(?:\s+(.*))?$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2] ? headingMatch[2].trim() : ''
      });
      i++;
      continue;
    }

    // 5. Blockquotes (> ...)
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s*/, ''));
        i++;
      }
      blocks.push({
        type: 'blockquote',
        text: quoteLines.join(' ')
      });
      continue;
    }

    // 6. Lists (unordered: -, *, + or ordered: 1., 2.)
    // Handle partial tokens like "- " or "1. " during streaming
    const isUnordered = /^\s*[-*+](\s+|$)/.test(line);
    const isOrdered = /^\s*\d+\.(\s+|$)/.test(line);

    if (isUnordered || isOrdered) {
      const items: ListItem[] = [];
      const counters = [0, 0, 0, 0];

      while (i < lines.length) {
        const currentLine = lines[i];
        const unMatch = currentLine.match(/^(\s*)([-*+])(?:\s+(.*))?$/);
        const ordMatch = currentLine.match(/^(\s*)(\d+)\.(?:\s+(.*))?$/);

        if (unMatch) {
          const indent = unMatch[1].length;
          const level = Math.min(Math.floor(indent / 2), 3);
          counters[level] = 0;
          items.push({ text: unMatch[3] ? unMatch[3].trim() : '', level, isOrdered: false });
          i++;
        } else if (ordMatch) {
          const indent = ordMatch[1].length;
          const level = Math.min(Math.floor(indent / 2), 3);
          counters[level] = (counters[level] || 0) + 1;
          const num = parseInt(ordMatch[2], 10) || counters[level];
          items.push({ text: ordMatch[3] ? ordMatch[3].trim() : '', level, isOrdered: true, orderNumber: num });
          i++;
        } else if (currentLine.trim() === '') {
          // Allow single blank line in list if next line is a list item
          if (
            i + 1 < lines.length &&
            (/^\s*[-*+](\s+|$)/.test(lines[i + 1]) || /^\s*\d+\.(\s+|$)/.test(lines[i + 1]))
          ) {
            i++;
          } else {
            break;
          }
        } else if (items.length > 0 && /^\s{2,}/.test(currentLine)) {
          // Continuation of previous item
          items[items.length - 1].text += ' ' + currentLine.trim();
          i++;
        } else {
          break;
        }
      }

      if (items.length > 0) {
        blocks.push({
          type: 'list',
          items
        });
      }

      // If loop didn't advance (e.g. edge case in inner loop), advance safely
      if (i === startI) {
        blocks.push({ type: 'paragraph', text: line });
        i++;
      }
      continue;
    }

    // 7. Empty line
    if (!trimmed) {
      i++;
      continue;
    }

    // 8. Regular paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('```') &&
      !/^(#{1,6})(\s+|$)/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith('>') &&
      !/^(\*{3,}|-{3,}|_{3,})$/.test(lines[i].trim()) &&
      !/^\s*[-*+](\s+|$)/.test(lines[i]) &&
      !/^\s*\d+\.(\s+|$)/.test(lines[i]) &&
      !(
        lines[i].includes('|') &&
        i + 1 < lines.length &&
        /^\s*\|?(\s*:?-{2,}:?\s*\|)+\s*:?-{2,}:?\s*\|?\s*$/.test(lines[i + 1].trim())
      )
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        text: paraLines.join('\n')
      });
    }

    // Safety invariant: mathematically guarantee forward progress
    if (i === startI) {
      blocks.push({
        type: 'paragraph',
        text: line
      });
      i++;
    }
  }

  return blocks;
}

function renderBlock(block: Block, idx: number): React.ReactNode {
  switch (block.type) {
    case 'code':
      return <CodeBlock key={idx} language={block.language} code={block.code} />;

    case 'table':
      return (
        <div key={idx} className="my-3 overflow-x-auto rounded-2xl neu-inset p-1">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="text-[var(--text-main)] font-bold">
              <tr>
                {block.headers.map((h, hIdx) => (
                  <th key={hIdx} className="p-2.5 sm:p-3 whitespace-nowrap">
                    {renderInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--shadow-dark)]/20 text-[var(--text-main)]">
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-[var(--shadow-light)]/30 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2.5 sm:p-3">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'heading': {
      const isQuestion = block.text.includes('?') || block.text.includes('❓');
      if (block.level === 1) {
        return (
          <h1 key={idx} className="text-base sm:text-lg font-black text-[var(--text-main)] pt-2 pb-1 flex items-center gap-2">
            <span>{renderInline(block.text)}</span>
          </h1>
        );
      }
      if (block.level === 2) {
        return (
          <h2 key={idx} className="text-sm sm:text-base font-extrabold text-[var(--text-main)] pt-3 pb-0.5 flex items-center gap-2">
            <span>{renderInline(block.text)}</span>
          </h2>
        );
      }
      if (block.level === 3) {
        return (
          <h3 key={idx} className="text-xs sm:text-sm font-bold text-[var(--text-main)] pt-2 flex items-center gap-1.5">
            {isQuestion ? (
              <HelpCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            ) : (
              <Sparkles className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
            )}
            <span>{renderInline(block.text)}</span>
          </h3>
        );
      }
      if (block.level === 4) {
        return (
          <h4 key={idx} className="text-xs font-bold text-[var(--text-main)] pt-1">
            {renderInline(block.text)}
          </h4>
        );
      }
      return (
        <h5 key={idx} className="text-xs font-semibold text-[var(--text-muted)] pt-1">
          {renderInline(block.text)}
        </h5>
      );
    }

    case 'hr':
      return <div key={idx} className="neu-divider my-3" />;

    case 'blockquote':
      return (
        <blockquote key={idx} className="border-l-4 border-[var(--primary)] neu-inset px-3.5 py-2 rounded-2xl text-[var(--text-main)] text-xs italic">
          {renderInline(block.text)}
        </blockquote>
      );

    case 'list': {
      return (
        <div key={idx} className="space-y-1.5 my-1">
          {block.items.map((item, itemIdx) => {
            const indentClass = item.level === 1 ? 'ml-4' : item.level >= 2 ? 'ml-8' : 'ml-0.5';
            return (
              <div key={itemIdx} className={`flex items-start gap-2 ${indentClass}`}>
                {item.isOrdered ? (
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px] mt-0.5 shrink-0">
                    {item.orderNumber || itemIdx + 1}.
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                )}
                <div className="flex-1 leading-relaxed">
                  {renderInline(item.text)}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    case 'html':
      return (
        <div key={idx} className="my-1.5 leading-relaxed">
          {renderInline(block.html)}
        </div>
      );

    case 'paragraph':
      return (
        <div key={idx} className="leading-relaxed my-1.5">
          {renderInline(block.text)}
        </div>
      );
  }
}

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="my-2.5 rounded-2xl overflow-hidden neu-inset p-1">
      <div className="px-3.5 py-1.5 flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
        <div className="flex items-center gap-1.5 font-mono uppercase tracking-wider font-semibold">
          {language === 'bash' || language === 'sh' ? (
            <Terminal className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <CodeIcon className="w-3.5 h-3.5 text-[var(--primary)]" />
          )}
          <span className="text-[var(--text-main)]">{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl neu-btn text-[var(--text-main)] transition-all active:scale-95"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-500" />
              <span className="text-[10px] text-emerald-500 font-semibold">Đã chép</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[10px]">Chép</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[11px] sm:text-xs font-mono text-[var(--text-main)] leading-relaxed scrollbar-thin bg-[var(--bg)] rounded-xl neu-inset-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
};

function markdownInlineToHtml(text: string): string {
  if (!text) return '';

  // 1. Protect inline code: `code`
  const codeSnippets: string[] = [];
  let processed = text.replace(/`([^`]+)`/g, (_, codeContent) => {
    const idx = codeSnippets.length;
    const escaped = codeContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    codeSnippets.push(`<code>${escaped}</code>`);
    return `___CODE_TOKEN_${idx}___`;
  });

  // 2. Markdown Images: ![alt](url) -> <img src="url" alt="alt" />
  processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    const cleanUrl = url.trim();
    return `<img src="${cleanUrl}" alt="${alt}" />`;
  });

  // 3. Markdown Links: [text](url) -> <a href="url">text</a>
  processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, linkText, url) => {
    const cleanUrl = url.trim();
    return `<a href="${cleanUrl}">${linkText}</a>`;
  });

  // 4. Bold: **text** or __text__ -> <strong>text</strong>
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/__([^_]+)__/g, '<strong>$1</strong>');

  // 5. Italic: *text* -> <em>text</em>
  processed = processed.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // 6. Strikethrough: ~~text~~ -> <del>text</del>
  processed = processed.replace(/~~([^~]+)~~/g, '<del>$1</del>');

  // 7. Restore inline code
  codeSnippets.forEach((codeHtml, idx) => {
    processed = processed.replace(`___CODE_TOKEN_${idx}___`, codeHtml);
  });

  return processed;
}

function domNodeToReact(node: Node, key: string | number): React.ReactNode {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();

    // Disallowed dangerous tags
    if (['script', 'style', 'iframe', 'object', 'embed', 'meta', 'link'].includes(tagName)) {
      return null;
    }

    const children = Array.from(el.childNodes).map((child, idx) =>
      domNodeToReact(child, `${key}-${idx}`)
    );

    switch (tagName) {
      case 'img': {
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || '';
        const rawWidth = el.getAttribute('width') || undefined;
        const rawHeight = el.getAttribute('height') || undefined;
        const safeSrc = /^(https?:\/\/|\/|data:image\/)/i.test(src.trim()) ? src.trim() : '';
        if (!safeSrc) return null;

        const isBadge = safeSrc.includes('shields.io') || 
                        safeSrc.includes('badgen.net') || 
                        safeSrc.includes('github.com/badges') ||
                        (rawHeight && parseInt(rawHeight, 10) <= 32);

        return (
          <img
            key={key}
            src={safeSrc}
            alt={alt}
            loading="lazy"
            className={
              isBadge
                ? "inline-block h-auto max-h-6 my-0.5 mx-0.5 align-middle rounded-sm shadow-xs"
                : "max-w-full h-auto rounded-xl my-2 inline-block shadow-xs align-middle"
            }
            style={{
              width: rawWidth && rawWidth.endsWith('%') ? rawWidth : rawWidth ? `${rawWidth}px` : undefined,
              height: rawHeight && !rawHeight.endsWith('%') ? `${rawHeight}px` : undefined,
              maxHeight: isBadge ? '24px' : '560px',
              objectFit: 'contain',
            }}
          />
        );
      }

      case 'a': {
        const href = el.getAttribute('href') || '#';
        const safeHref = /^(https?:\/\/|mailto:|\/|#)/i.test(href.trim()) ? href.trim() : '#';
        const hasText = Array.from(el.childNodes).some(
          (c) => c.nodeType === Node.TEXT_NODE && c.textContent && c.textContent.trim().length > 0
        );

        return (
          <a
            key={key}
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--primary)] hover:underline inline-flex items-center gap-0.5 font-medium transition-colors"
          >
            {children}
            {hasText && <ExternalLink className="w-3 h-3 inline shrink-0 ml-0.5 opacity-70" />}
          </a>
        );
      }

      case 'p':
      case 'div': {
        const align = el.getAttribute('align')?.toLowerCase();
        const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : '';
        return (
          <div key={key} className={`my-2 leading-relaxed ${alignClass}`}>
            {children}
          </div>
        );
      }

      case 'table':
        return (
          <div key={key} className="my-3 overflow-x-auto rounded-2xl neu-inset p-1">
            <table className="w-full text-left text-xs border-collapse">
              {children}
            </table>
          </div>
        );

      case 'thead':
        return <thead key={key} className="text-[var(--text-main)] font-bold">{children}</thead>;
      case 'tbody':
        return <tbody key={key} className="divide-y divide-[var(--shadow-dark)]/20 text-[var(--text-main)]">{children}</tbody>;
      case 'tr':
        return <tr key={key} className="hover:bg-[var(--shadow-light)]/30 transition-colors">{children}</tr>;
      case 'th':
      case 'td': {
        const width = el.getAttribute('width') || undefined;
        const align = el.getAttribute('align')?.toLowerCase();
        const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : '';
        return (
          <td
            key={key}
            className={`p-2.5 sm:p-3 align-middle ${alignClass}`}
            style={{ width: width && width.endsWith('%') ? width : width ? `${width}px` : undefined }}
          >
            {children}
          </td>
        );
      }

      case 'hr':
        return <div key={key} className="neu-divider my-3" />;

      case 'sub':
        return <sub key={key} className="text-[10px] text-[var(--text-muted)] align-sub">{children}</sub>;
      case 'sup':
        return <sup key={key} className="text-[10px] text-[var(--text-muted)] align-super">{children}</sup>;

      case 'b':
      case 'strong':
        return <strong key={key} className="font-bold text-[var(--text-main)]">{children}</strong>;

      case 'i':
      case 'em':
        return <em key={key} className="italic text-slate-700 dark:text-slate-300">{children}</em>;

      case 'del':
      case 's':
      case 'strike':
        return <del key={key} className="line-through text-slate-400 dark:text-slate-500">{children}</del>;

      case 'code':
        return (
          <code key={key} className="px-1.5 py-0.5 rounded-md neu-inset-sm font-mono text-[11px] text-[var(--primary)] font-semibold">
            {children}
          </code>
        );

      case 'br':
        return <br key={key} />;

      case 'details':
        return <details key={key} className="my-2 rounded-xl neu-inset-sm p-3 text-xs">{children}</details>;
      case 'summary':
        return <summary key={key} className="font-bold cursor-pointer text-[var(--text-main)] select-none mb-1">{children}</summary>;

      case 'h1':
        return <h1 key={key} className="text-base sm:text-lg font-black text-[var(--text-main)] pt-2 pb-1">{children}</h1>;
      case 'h2':
        return <h2 key={key} className="text-sm sm:text-base font-extrabold text-[var(--text-main)] pt-3 pb-0.5">{children}</h2>;
      case 'h3':
        return <h3 key={key} className="text-xs sm:text-sm font-bold text-[var(--text-main)] pt-2">{children}</h3>;
      case 'h4':
        return <h4 key={key} className="text-xs font-bold text-[var(--text-main)] pt-1">{children}</h4>;
      case 'h5':
      case 'h6':
        return <h5 key={key} className="text-xs font-semibold text-[var(--text-muted)] pt-1">{children}</h5>;

      case 'ul':
        return <ul key={key} className="space-y-1 my-1 list-disc list-inside">{children}</ul>;
      case 'ol':
        return <ol key={key} className="space-y-1 my-1 list-decimal list-inside">{children}</ol>;
      case 'li':
        return <li key={key} className="leading-relaxed">{children}</li>;

      case 'blockquote':
        return (
          <blockquote key={key} className="border-l-4 border-[var(--primary)] neu-inset px-3.5 py-2 rounded-2xl text-[var(--text-main)] text-xs italic my-2">
            {children}
          </blockquote>
        );

      default:
        return <span key={key}>{children}</span>;
    }
  }

  return null;
}

// Inline parser for bold, italic, code, links, images, strikethrough, and raw HTML tags
export function renderInline(text: string): React.ReactNode[] {
  if (!text) return [];

  // If in browser environment with DOMParser available
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    try {
      const html = markdownInlineToHtml(text);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const nodes = Array.from(doc.body.childNodes)
        .map((child, idx) => domNodeToReact(child, `inline-${idx}`))
        .filter((n): n is NonNullable<React.ReactNode> => n !== null && n !== undefined);
      if (nodes.length > 0) return nodes;
    } catch (e) {
      console.warn('DOMParser failed in renderInline:', e);
    }
  }

  // Fallback if DOMParser unavailable or failed
  return [text];
}
