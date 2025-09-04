import type { Descendant } from 'slate';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkSlate from 'remark-slate';
import { serialize } from 'remark-slate';
import { visit } from 'unist-util-visit';

// Use a single private-use Unicode char to represent a hard break internally (avoids visible tokens)
const BREAK_CHAR = '\uE000'; // unlikely to appear in normal text

// remark plugin: convert mdast hard break nodes to a text node containing BREAK_CHAR
function remarkBreakTokens() {
  return (tree: any) => {
    visit(tree, 'break', (_: any, index: number | undefined, parent: any) => {
      if (!parent || typeof index !== 'number') return;
      parent.children[index] = { type: 'text', value: BREAK_CHAR };
    });
  };
}

function normalizeMarkdown(md: string): string {
  const lines = md.split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line.trim())) inFence = !inFence;
    if (!inFence) {
      lines[i] = line.replace(/<br\s*\/?>(?=\n|$)/gi, '  ');
    }
  }
  return lines.join('\n');
}

// Split BREAK_CHAR occurrences into dedicated slateHardBreak leaves
function injectHardBreakLeaves(nodes: Descendant[]): Descendant[] {
  const out: Descendant[] = [];
  for (const n of nodes as any[]) {
    if (n.text !== undefined) {
      if (typeof n.text === 'string' && n.text.includes(BREAK_CHAR)) {
        const parts = n.text.split(BREAK_CHAR);
        const newLeaves: any[] = [];
        parts.forEach((p: string, i: number) => {
          if (p) newLeaves.push({ ...n, text: p });
          if (i < parts.length - 1) newLeaves.push({ text: '', slateHardBreak: true });
        });
        out.push(...newLeaves);
      } else {
        out.push(n);
      }
    } else if (Array.isArray((n as any).children)) {
      (n as any).children = injectHardBreakLeaves((n as any).children);
      out.push(n);
    } else {
      out.push(n);
    }
  }
  return out;
}

export function markdownToSlate(md: string): Descendant[] {
  try {
    const file = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkBreakTokens)
      .use(remarkSlate)
      .processSync(md || '');
    return injectHardBreakLeaves((file.result || []) as Descendant[]);
  } catch (e) {
    return [
      { type: 'paragraph', children: [{ text: 'Markdown parse error: ' + (e as Error).message }] } as any
    ];
  }
}

// Convert Slate value -> Markdown, mapping slateHardBreak leaves to two-space hard breaks
export function slateToMarkdown(value: Descendant[]): string {
  if (!Array.isArray(value)) return '';

  // Clone nodes so we can replace hard break leaves with BREAK_CHAR temporarily
  function clone(node: any): any {
    if (Array.isArray(node)) return node.map(clone);
    if (node.text !== undefined) {
      if (node.slateHardBreak) return { text: BREAK_CHAR };
      return { ...node };
    }
    if (node.children) return { ...node, children: node.children.map(clone) };
    return { ...node };
  }

  const cloned = value.map(clone);
  const raw = cloned
    .map((n) => { try { return serialize(n as any) || ''; } catch { return ''; } })
    .filter(Boolean)
    .join('\n');

  // Replace BREAK_CHAR with GitHub hard break syntax (two spaces + newline handling)
  // Case 1: BREAK_CHAR immediately before existing newline -> emit two spaces only (renderer already adds newline)
  // Case 2: BREAK_CHAR not followed by newline -> emit two spaces + newline
  const replaced = raw
    .replace(new RegExp(`${BREAK_CHAR}(?=\n)`, 'g'), '  ') // before newline
    .replace(new RegExp(BREAK_CHAR, 'g'), '  \n'); // standalone

  return normalizeMarkdown(replaced);
}

export const HARD_BREAK_INTERNAL = BREAK_CHAR;
