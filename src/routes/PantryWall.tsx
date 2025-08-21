import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

// Session storage key for Pantry config (cleared on tab close)
const SS_PANTRY = 'pantry.session.config.v1';
// Cookie name for per-user UUID across subdomains
const COOKIE_UID = 'pantry_uid';

// Types
type PantryConfig = { pid: string; key: string };

type NameTuple = [string, number];
interface NameDb {
  names?: Record<string, number>;
  users?: Record<string, NameTuple>;
}

// UI helpers
const Cog: React.FC<{ onClick?: () => void; title?: string }> = ({ onClick, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title ?? 'Settings'}
    style={{ background: 'none', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', padding: '4px 8px', marginLeft: 8 }}
    aria-label="Open settings"
  >
    ⚙️ Settings
  </button>
);

const Modal: React.FC<{ open: boolean; onClose: () => void; children: React.ReactNode; title: string }> = ({ open, onClose, children, title }) => {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 1000 }}
    >
      <div style={{ background: 'white', borderRadius: 8, padding: 16, minWidth: 320, maxWidth: 720, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✖</button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>> = ({ label, children, ...rest }) => (
  <div style={{ marginBottom: 12 }} {...rest}>
    <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, ...props }) => (
  <button
    {...props}
    style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#f7f7f7', cursor: 'pointer' }}
  >
    {children}
  </button>
);

const InlineNote: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => (
  <div style={{ fontSize: 12, color: '#555', ...(style || {}) }}>{children}</div>
);

const ErrorText: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => (
  <div style={{ color: '#c00', fontSize: 12, ...(style || {}) }}>{children}</div>
);

// Helpers
function parseHash(): Partial<PantryConfig> {
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw) return {};
  const params = new URLSearchParams(raw);
  const pid = params.get('pid') || undefined;
  const key = params.get('key') || params.get('basket') || undefined;
  const out: Partial<PantryConfig> = {};
  if (pid) out.pid = pid;
  if (key) out.key = key;
  return out;
}

function clearHashFromUrl() {
  if (window.location.hash) {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }
}

function loadSessionConfig(): PantryConfig | null {
  try {
    const raw = sessionStorage.getItem(SS_PANTRY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PantryConfig;
    if (parsed?.pid && parsed?.key) return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveSessionConfig(cfg: PantryConfig) {
  sessionStorage.setItem(SS_PANTRY, JSON.stringify(cfg));
}

function getCookie(name: string): string | null {
  const prefix = name + '=';
  const parts = (document.cookie || '').split('; ').filter(Boolean);
  for (const p of parts) {
    if (p.startsWith(prefix)) {
      return decodeURIComponent(p.slice(prefix.length));
    }
  }
  return null;
}

function rootDomain(hostname: string): string | null {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) return null; // IPv4
  if (hostname === 'localhost') return null;
  const parts = hostname.split('.');
  if (parts.length < 2) return null;
  return '.' + parts.slice(-2).join('.');
}

function setCookie(name: string, value: string, maxAgeDays = 3650) {
  const domain = rootDomain(location.hostname);
  const attrs = [`path=/`, `SameSite=Lax`, `Max-Age=${maxAgeDays * 24 * 60 * 60}`];
  if (domain) attrs.push(`domain=${domain}`);
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${attrs.join('; ')}`;
}

function ensureUserUUID(): string {
  let id = getCookie(COOKIE_UID);
  if (!id) {
    id = (crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
    setCookie(COOKIE_UID, id);
  }
  return id;
}

// Pantry API (map storage: { [uuid]: string })
async function pantryGet(pid: string, key: string): Promise<Record<string, string>> {
  const url = `https://getpantry.cloud/apiv1/pantry/${encodeURIComponent(pid)}/basket/${encodeURIComponent(key)}`;
  const res = await fetch(url, { method: 'GET' });
  if (res.status === 404) return {};
  if (!res.ok) throw new Error(`Pantry GET failed: ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    const data = await res.json();
    return (data && typeof data === 'object') ? data as Record<string, string> : {};
  }
  const text = await res.text();
  try { const obj = JSON.parse(text); return (obj && typeof obj === 'object') ? obj : {}; } catch { return {}; }
}

async function pantryPut(pid: string, key: string, data: Record<string, string>): Promise<void> {
  const url = `https://getpantry.cloud/apiv1/pantry/${encodeURIComponent(pid)}/basket/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data ?? {}),
  });
  if (!res.ok) throw new Error(`Pantry PUT failed: ${res.status}`);
}

// Pantry API helpers
async function pantryGetJson<T extends object>(pid: string, key: string): Promise<T> {
  const url = `https://getpantry.cloud/apiv1/pantry/${encodeURIComponent(pid)}/basket/${encodeURIComponent(key)}`;
  const res = await fetch(url, { method: 'GET' });
  if (res.status === 404) return {} as T;
  if (!res.ok) throw new Error(`Pantry GET failed: ${res.status}`);
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  const text = await res.text();
  try { return JSON.parse(text) as T; } catch { return {} as T; }
}

async function pantryPutJson<T extends object>(pid: string, key: string, data: T): Promise<void> {
  const url = `https://getpantry.cloud/apiv1/pantry/${encodeURIComponent(pid)}/basket/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data ?? {}),
  });
  if (!res.ok) throw new Error(`Pantry PUT failed: ${res.status}`);
}

async function pantryPostJson<T extends object>(pid: string, key: string, data: T): Promise<void> {
  const url = `https://getpantry.cloud/apiv1/pantry/${encodeURIComponent(pid)}/basket/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data ?? {}),
  });
  if (!res.ok) throw new Error(`Pantry POST failed: ${res.status}`);
}

const PantryWall: React.FC = () => {
  // Ingest hash into session storage, then clean URL
  const [config, setConfig] = useState<PantryConfig | null>(() => {
    const fromHash = parseHash();
    if (fromHash.pid && fromHash.key) {
      const cfg = { pid: fromHash.pid, key: fromHash.key } as PantryConfig;
      saveSessionConfig(cfg);
      clearHashFromUrl();
      return cfg;
    }
    return loadSessionConfig();
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [myValue, setMyValue] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const myId = useMemo(() => ensureUserUUID(), []);
  const entriesRef = useRef<Record<string, string>>({});
  const [nameDb, setNameDb] = useState<NameDb>({});
  const [nameInput, setNameInput] = useState<string>('');
  const [nameBusy, setNameBusy] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => { entriesRef.current = entries; }, [entries]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const canQuery = !!config?.pid && !!config?.key;

  const refresh = useCallback(async () => {
    if (!canQuery) return;
    setLoading(true);
    setError(null);
    try {
      const [data, namesDb] = await Promise.all([
        pantryGet(config!.pid, config!.key),
        (async () => {
          try { return await pantryGetJson<NameDb>(config!.pid, '_nameDb'); } catch { return {}; }
        })(),
      ]);
      if (!mounted.current) return;
      setEntries(data || {});
      setNameDb(namesDb || {});
      setMyValue((data && typeof data === 'object' && myId in data) ? String(data[myId]) : '');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to fetch';
      if (mounted.current) setError(msg);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [canQuery, config, myId]);

  useEffect(() => { refresh(); }, [refresh]);

  const [saveBusy, setSaveBusy] = useState(false);
  const onSaveClick = useCallback(async () => {
    if (!canQuery) return;
    setError(null);
    setSaveBusy(true);
    try {
      const next = { ...(entriesRef.current || {}) } as Record<string, string>;
      next[myId] = myValue ?? '';
      await pantryPut(config!.pid, config!.key, next);
      if (mounted.current) setEntries(next);
      // After successful message update, refetch _nameDb
      try {
        const latestNames = await pantryGetJson<NameDb>(config!.pid, '_nameDb');
        if (mounted.current) setNameDb(latestNames || {});
      } catch {
        // ignore; keep previous nameDb
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save';
      if (mounted.current) setError(msg);
    } finally {
      if (mounted.current) setSaveBusy(false);
    }
  }, [canQuery, config, myId, myValue]);

  // Settings draft mirrors session config or hash
  const initialHash = useMemo(() => parseHash(), []);
  const initialSess = useMemo(() => loadSessionConfig(), []);
  const [draftPid, setDraftPid] = useState<string>(initialSess?.pid || initialHash.pid || '');
  const [draftKey, setDraftKey] = useState<string>(initialSess?.key || initialHash.key || '');
  const draftValid = !!draftPid && !!draftKey;

  const saveSettingsAndClose = () => {
    const next: PantryConfig = { pid: draftPid.trim(), key: draftKey.trim() };
    saveSessionConfig(next);
    setConfig(next);
    clearHashFromUrl();
    setIsSettingsOpen(false);
    // Auto refresh with new config
    setTimeout(() => { refresh(); }, 0);
  };

  const onSaveName = useCallback(async () => {
    if (!canQuery) return;
    setNameError(null);
    const raw = nameInput.trim();
    if (!raw) { setNameError('Name required'); return; }
    if (raw.includes('(') || raw.includes(')')) { setNameError('Parentheses are not allowed'); return; }
    if (raw.length > 10) { setNameError('Max 10 characters'); return; }
    setNameBusy(true);
    try {
      // Try to download _nameDb; if it fails, fall back to empty object
      let current: NameDb;
      try {
        current = await pantryGetJson<NameDb>(config!.pid, '_nameDb');
      } catch {
        current = {};
      }
      const namesMap: Record<string, number> = { ...(current.names || {}) };
      const usersMap: Record<string, NameTuple> = { ...(current.users || {}) };

      const myTuple = usersMap[myId];
      let nextCount = (namesMap[raw] ?? 0) + 1;
      if (myTuple && myTuple[0] === raw) {
        // Keep existing assigned number if user re-saves same base name
        nextCount = Number(myTuple[1]) || 1;
      }
      namesMap[raw] = Math.max(nextCount, namesMap[raw] ?? 0);
      usersMap[myId] = [raw, nextCount];

      const nextDb: NameDb = { names: namesMap, users: usersMap };

      // POST first if basket may not exist; fallback to PUT if already exists
      try {
        await pantryPostJson<NameDb>(config!.pid, '_nameDb', nextDb);
      } catch {
        await pantryPutJson<NameDb>(config!.pid, '_nameDb', nextDb);
      }

      if (mounted.current) setNameDb(nextDb);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to save name';
      setNameError(msg);
    } finally {
      setNameBusy(false);
    }
  }, [canQuery, config, myId, nameInput]);

  const formatNameTuple = useCallback((t?: NameTuple): string | null => {
    if (!t) return null;
    const [n, c] = t;
    return c && c > 1 ? `${n}(${c})` : n || null;
  }, []);

  const displayNameFor = useCallback((id: string): string => {
    if (id === myId) return 'you';
    const t = nameDb.users?.[id];
    const formatted = formatNameTuple(t);
    return formatted || 'anonymous';
  }, [myId, nameDb.users, formatNameTuple]);

  const resolvedMyDisplay = useMemo(() => {
    const t = nameDb.users?.[myId];
    const formatted = formatNameTuple(t);
    return formatted || 'you';
  }, [nameDb, myId, formatNameTuple]);

  // Render
  const entriesList = useMemo(() => Object.entries(entries || {}), [entries]);

  const shareUrl = useMemo(() => {
    if (!config?.pid || !config?.key) return '';
    const p = new URLSearchParams();
    p.set('pid', config.pid);
    p.set('key', config.key);
    return `${window.location.origin}${window.location.pathname}${window.location.search}#${p.toString()}`;
  }, [config]);

  const copyShare = useCallback(async () => {
    if (!shareUrl) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.style.position = 'fixed';
        ta.style.left = '-1000px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    } catch {
      // no-op
    }
  }, [shareUrl]);

  return (
    <div style={{ padding: 16 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Pantry wall</h2>
        <Cog onClick={() => setIsSettingsOpen(true)} />
        <Button onClick={copyShare} disabled={!shareUrl}>Share</Button>
        {shareCopied && <InlineNote>Copied!</InlineNote>}
      </header>

      {shareUrl && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            <InlineNote>Scan to join this wall:</InlineNote>
            <QRCodeSVG value={shareUrl} size={160} includeMargin aria-label="Wall join QR" />
          </div>
          <div style={{ minWidth: 260, flex: 1 }}>
            <Field label="Sharable link">
              <input type="text" readOnly value={shareUrl} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }} onFocus={(e) => e.currentTarget.select()} />
            </Field>
            <InlineNote>Opens with #pid and #key; the app ingests and hides them after load.</InlineNote>
          </div>
        </div>
      )}

      {/* Name setup */}
      {canQuery && (
        <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 600 }}>Your name</label>
            <input
              type="text"
              maxLength={10}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="max 10 chars, no ()"
              style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc' }}
            />
            <Button onClick={onSaveName} disabled={nameBusy || !nameInput.trim()}>{nameBusy ? 'Saving…' : 'Save name'}</Button>
            <InlineNote>Display: {resolvedMyDisplay}</InlineNote>
          </div>
          {nameError && <ErrorText style={{ marginTop: 8 }}>{nameError}</ErrorText>}
          <InlineNote style={{ marginTop: 6 }}>
            Names are reserved per base value. If a base name already exists, you get a number, shown in parentheses in chat (e.g., martin(2)). Parentheses are not allowed in input.
          </InlineNote>
        </div>
      )}

      {!canQuery && (
        <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fafafa' }}>
          <h3 style={{ marginTop: 0 }}>Get started with Pantry</h3>
          <ol style={{ paddingLeft: 18 }}>
            <li>
              Open Pantry in a new tab and click "Create Pantry":{' '}
              <a href="https://getpantry.cloud/" target="_blank" rel="noopener noreferrer">getpantry.cloud</a>
            </li>
            <li>Copy your Pantry ID (a long UUID).</li>
            <li>Choose a Basket name (e.g., <code>wall</code>).</li>
            <li>Click the Settings button above and paste the Pantry ID and Basket name.</li>
            <li>Save Settings. We store them for this session and remove them from the URL.</li>
            <li>To share, create a link with <code>#pid</code> and <code>#key</code>; your friend’s page will ingest it and hide it from the URL.</li>
          </ol>
          <InlineNote>
            Tip: Manually append <code>#pid=&lt;PANTRY_ID&gt;&amp;key=&lt;BASKET&gt;</code> to the URL for a one-time setup; the page will hide it after loading.
          </InlineNote>
        </div>
      )}

      <div style={{ maxWidth: 720 }}>
        <Field label="Your note">
          <input
            type="text"
            value={myValue}
            onChange={(e) => setMyValue(e.target.value)}
            disabled={!canQuery}
            placeholder={canQuery ? 'Type your value…' : 'Configure Pantry in Settings'}
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
          />
        </Field>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button onClick={refresh} disabled={!canQuery || loading}>{loading ? 'Refreshing…' : 'Refresh'}</Button>
          <Button onClick={onSaveClick} disabled={!canQuery || saveBusy}>{saveBusy ? 'Saving…' : 'Save to Pantry'}</Button>
        </div>
        {error && <ErrorText style={{ marginTop: 8 }}>{error}</ErrorText>}

        {canQuery && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ marginTop: 0 }}>Wall</h3>
            {entriesList.length === 0 && <InlineNote>No entries yet.</InlineNote>}
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              {entriesList.map(([id, val]) => (
                <li key={id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ fontSize: 12, color: '#666' }}>{displayNameFor(id)}</span>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{String(val ?? '')}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <Modal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Settings">
        <Field label="Pantry ID (pid)">
          <input
            type="text"
            value={draftPid}
            onChange={(e) => setDraftPid(e.target.value)}
            placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
          />
        </Field>
        <Field label="Basket name (key)">
          <input
            type="text"
            value={draftKey}
            onChange={(e) => setDraftKey(e.target.value)}
            placeholder="e.g., wall"
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc' }}
          />
        </Field>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
          <Button onClick={saveSettingsAndClose} disabled={!draftValid}>Save</Button>
        </div>
      </Modal>
    </div>
  );
};

export default PantryWall;

