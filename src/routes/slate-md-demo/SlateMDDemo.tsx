import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'github-markdown-css';
import 'highlight.js/styles/github.css';

// Slate imports
import { createEditor, Editor, Transforms } from 'slate';
import type { Descendant } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { withHistory } from 'slate-history';
import { markdownToSlate, slateToMarkdown } from './markdown';

function ToolbarButton({ onMouseDown, children, title }: { onMouseDown: (e: any) => void; children: any; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onMouseDown(e); }}
      style={{ padding: '0.25rem .5rem', border: '1px solid #bbb', background: '#f7f7f7', color: '#222', borderRadius: 4, fontSize: '.75rem', cursor: 'pointer' }}
    >{children}</button>
  );
}

// Initial starter markdown (GitHub-flavored) demonstrating features
const initialMarkdown = `# Slate Markdown Demo (GitHub Style)\n\nClick the rendered markdown to switch into a rich text (Slate) editor. Click outside the editor to return to preview mode. The state stays synced.\n\n## Features\n\n- **Bold**, *Italic*, ~~Strikethrough~~\n- [Links](https://github.com)\n- Code: \`inline code\`\n\n### Code Block\n\n\`\`\`ts\nfunction greet(name: string) {\n  console.log('Hello ' + name);\n}\n\ngreet('GitHub');\n\`\`\`\n\n> Block quotes work.\n\n| Col 1 | Col 2 |\n| ---- | ---- |\n| A    | B    |\n| C    | D    |\n`;

export function SlateMDDemo() {
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [slateValue, setSlateValue] = useState<Descendant[]>(() => markdownToSlate(initialMarkdown));
  const [isEditing, setIsEditing] = useState(false);
  const markdownRef = useRef<HTMLTextAreaElement | null>(null);
  const slateContainerRef = useRef<HTMLDivElement | null>(null);

  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  // Sync slate -> markdown on change
  const handleSlateChange = useCallback((val: Descendant[]) => {
    setSlateValue(val);
    const md = slateToMarkdown(val);
    setMarkdown(prev => prev === md ? prev : md);
  }, []);

  const enterEditing = useCallback(() => {
    try { setSlateValue(markdownToSlate(markdown)); } catch {}
    setIsEditing(true);
    setTimeout(() => {
      try { Transforms.select(editor, { anchor: Editor.start(editor, []), focus: Editor.end(editor, []) }); } catch {}
    }, 0);
  }, [markdown, editor]);

  // click outside to exit editing
  useEffect(() => {
    if (!isEditing) return;
    const handler = (e: MouseEvent) => {
      if (slateContainerRef.current && !slateContainerRef.current.contains(e.target as Node)) {
        setIsEditing(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isEditing]);

  // Toggle heading for current line
  const toggleHeadingLine = useCallback(() => {
    const ta = markdownRef.current; if (!ta) return;
    const { value, selectionStart } = ta;
    const before = value.lastIndexOf('\n', selectionStart - 1);
    const lineStart = before === -1 ? 0 : before + 1;
    const after = value.indexOf('\n', selectionStart);
    const lineEnd = after === -1 ? value.length : after;
    const line = value.slice(lineStart, lineEnd);
    const isHeading = /^#\s+/.test(line);
    const newLine = isHeading ? line.replace(/^#\s+/, '') : '# ' + line;
    const newText = value.slice(0, lineStart) + newLine + value.slice(lineEnd);
    setMarkdown(newText);
  }, []);

  // Wrap or unwrap selected text with markdown markers
  const applyMarkdownInlineWrap = useCallback((wrapper: string) => {
    const ta = markdownRef.current; if (!ta) return;
    const { selectionStart: s, selectionEnd: e, value } = ta;
    const selected = value.slice(s, e);
    let newText: string; let newSelStart = s; let newSelEnd: number;
    if (s === e) {
      const insert = `${wrapper}text${wrapper}`;
      newText = value.slice(0, s) + insert + value.slice(e);
      newSelStart = s + wrapper.length; newSelEnd = newSelStart + 4;
    } else if (selected.startsWith(wrapper) && selected.endsWith(wrapper)) {
      const inner = selected.slice(wrapper.length, selected.length - wrapper.length);
      newText = value.slice(0, s) + inner + value.slice(e);
      newSelEnd = s + inner.length; newSelStart = s;
    } else {
      const wrapped = wrapper + selected + wrapper;
      newText = value.slice(0, s) + wrapped + value.slice(e);
      newSelEnd = s + wrapped.length; newSelStart = s;
    }
    setMarkdown(newText);
    requestAnimationFrame(() => { ta.focus(); ta.selectionStart = newSelStart; ta.selectionEnd = newSelEnd; });
  }, []);

  // Slate element renderer (basic)
  const renderElement = useCallback((props: any) => {
    const { element, attributes, children } = props;
    switch (element.type) {
      case 'heading_one': return <h1 {...attributes}>{children}</h1>;
      case 'heading_two': return <h2 {...attributes}>{children}</h2>;
      case 'heading_three': return <h3 {...attributes}>{children}</h3>;
      case 'code_block': return <pre {...attributes}><code>{children}</code></pre>;
      case 'block_quote': return <blockquote {...attributes}>{children}</blockquote>;
      case 'ul_list': return <ul {...attributes}>{children}</ul>;
      case 'ol_list': return <ol {...attributes}>{children}</ol>;
      case 'listItem': return <li {...attributes}>{children}</li>;
      case 'link': return <a {...attributes} href={(element as any).link} rel="noreferrer" target="_blank">{children}</a>;
      default: return <p {...attributes}>{children}</p>;
    }
  }, []);

  const renderLeaf = useCallback((props: any) => {
    if (props.leaf.slateHardBreak) {
      return <span {...props.attributes} data-slate-hard-break><br /></span>;
    }
    let { children } = props;
    if (props.leaf.inline_code || props.leaf.code) {
      children = <code style={{ background: '#eee', padding: '0 .2rem', borderRadius: 3 }}>{children}</code>;
    }
    if (props.leaf.bold || props.leaf.strong) children = <strong>{children}</strong>;
    if (props.leaf.italic || props.leaf.emphasis) children = <em>{children}</em>;
    if (props.leaf.delete) children = <del>{children}</del>;
    return <span {...props.attributes}>{children}</span>;
  }, []);

  return (
    <main style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', height: '100%', padding: '2rem' }}>
      <section style={{ flex: 1, minWidth: '300px' }}>
        <details open>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>GitHub Markdown Preview / Rich Text</summary>
          <div style={{ marginTop: '.75rem', position: 'relative' }}>
            {!isEditing && (
              <div
                className="markdown-body"
                style={{ border: '1px solid #d0d7de', borderRadius: 6, padding: '1rem', cursor: 'text', minHeight: 120 }}
                onClick={enterEditing}
                title="Click to edit"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {markdown}
                </ReactMarkdown>
              </div>
            )}
            {isEditing && (
              <div ref={slateContainerRef} style={{ border: '1px solid #0969da', borderRadius: 6, padding: '0.75rem', minHeight: 120 }}>
                <Slate editor={editor} initialValue={slateValue} onChange={handleSlateChange}>
                  <Editable
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    spellCheck
                    autoFocus
                    style={{ outline: 'none' }}
                    placeholder="Type here... (click outside to preview)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.shiftKey) {
                        e.preventDefault();
                        const br: any = { text: '', slateHardBreak: true };
                        const after: any = { text: '' };
                        Transforms.insertNodes(editor, br);
                        Transforms.insertNodes(editor, after);
                        return;
                      }
                    }}
                  />
                </Slate>
              </div>
            )}
          </div>
        </details>
      </section>
      <section style={{ flex: 1, minWidth: '300px' }}>
        <details open>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Markdown Source</summary>
          <div style={{ marginTop: '.5rem', display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <ToolbarButton title="Toggle H1" onMouseDown={toggleHeadingLine}>H1</ToolbarButton>
            <ToolbarButton title="Bold" onMouseDown={() => applyMarkdownInlineWrap('**')}>B</ToolbarButton>
            <ToolbarButton title="Italic" onMouseDown={() => applyMarkdownInlineWrap('*')}>I</ToolbarButton>
            <ToolbarButton title="Inline Code" onMouseDown={() => applyMarkdownInlineWrap('`')}>{'</>'}</ToolbarButton>
          </div>
          <textarea
            ref={markdownRef}
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            style={{ marginTop: '.75rem', width: '100%', minHeight: 220, fontFamily: 'monospace', fontSize: '0.95rem', lineHeight: 1.4, border: '1px solid #ccc', borderRadius: 6, padding: '0.75rem', background: '#fafafa' }}
          />
        </details>
      </section>
    </main>
  );
}
