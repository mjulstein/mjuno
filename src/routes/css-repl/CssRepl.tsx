import { useState } from 'react';
import { BgColorButton } from '@/routes/css-repl/BgColorButton.tsx';

const defaultHtml = `<div class="demo-box">Hello, world!</div>`;
const defaultCss = `.demo-box { padding: 1rem; background: #f0f0f0; border-radius: 8px; color: #333; }`;

export function CssRepl() {
  const [html, setHtml] = useState(defaultHtml);
  const [css, setCss] = useState(defaultCss);
  const [bg, setBg] = useState('#fff');
  return (
    <main
      style={{
        display: 'flex',
        gap: '2rem',
        alignItems: 'flex-start',
        height: '100%',
        padding: '2rem'
      }}
    >
      <div style={{ flex: 1, minWidth: '300px' }}>
        <details open>
          <summary>HTML</summary>
          <textarea
            value={html}
            onChange={(e) => setHtml(e.target.value)}
            style={{
              width: '100%',
              minHeight: '120px',
              marginTop: '0.5rem',
              fontFamily: 'monospace',
              fontSize: '1rem'
            }}
          />
        </details>
        <details open style={{ marginTop: '1.5rem' }}>
          <summary>CSS</summary>
          <textarea
            value={css}
            onChange={(e) => setCss(e.target.value)}
            style={{
              width: '100%',
              minHeight: '120px',
              marginTop: '0.5rem',
              fontFamily: 'monospace',
              fontSize: '1rem'
            }}
          />
        </details>
      </div>
      <section style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '.5rem', marginBottom: '1rem' }}>
          <BgColorButton color="white" setColor={setBg} />
          <BgColorButton color="black" setColor={setBg} />
          <BgColorButton color="red" setColor={setBg} />
          <BgColorButton color="green" setColor={setBg} />
          <BgColorButton color="blue" setColor={setBg} />
        </div>
        <div
          style={{
            flex: 1,
            minWidth: '300px',
            background: bg,
            border: '1px solid #eee',
            borderRadius: '8px',
            padding: '1rem',
            position: 'relative'
          }}
        >
          <style>{css}</style>
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </section>
    </main>
  );
}
