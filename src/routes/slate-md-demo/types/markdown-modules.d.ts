// Minimal ambient declarations for markdown-related libraries without bundled types
// Keeps maintenance low by avoiding custom typing complexity.

declare module 'remark-gfm' {
  const plugin: any;
  export default plugin;
}

declare module 'remark-slate' {
  const plugin: any;
  export default plugin;
  export const serialize: (node: any) => string;
}

declare module 'github-markdown-css';

declare module 'rehype-highlight' {
  const plugin: any;
  export default plugin;
}

