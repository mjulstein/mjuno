import React, { useMemo, useState } from 'react';

type HttpMethod = 'POST' | 'PUT';

/**
 * Confluence
 * A small, drop-in React TS component that lets you:
 *  - Enter a Basic Auth "API key" as email:token (we Base64 this client-side).
 *  - Choose a method (POST/PUT) and target endpoint URL.
 *  - Paste JSON for the request body, or optionally "wrap" your content as a
 *    Confluence v2 Page payload with atlas_doc_format or storage representation.
 *
 * NOTE:
 * - For Confluence Cloud, direct browser calls may be blocked by CORS.
 *   Use a backend proxy (server/serverless) for production.
 * - Keep secrets out of client builds; this is for quick testing/demos.
 */
export const Confluence: React.FC = () => {
  // ---- Auth & endpoint ----
  const [basicKey, setBasicKey] = useState<string>('you@example.com:API_TOKEN');
  const [method, setMethod] = useState<HttpMethod>('POST');
  const [endpointUrl, setEndpointUrl] = useState<string>(
    'https://your-site.atlassian.net/wiki/api/v2/pages'
  );

  // ---- Optional helpers for building a v2 page payload ----
  const [wrapAsV2Page, setWrapAsV2Page] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('My API Page');
  const [status, setStatus] = useState<'current' | 'draft'>('current');
  const [representation, setRepresentation] = useState<
    'atlas_doc_format' | 'storage'
  >('atlas_doc_format');
  const [spaceId, setSpaceId] = useState<string>(''); // required for v2 create
  const [parentId, setParentId] = useState<string>(''); // optional

  // ---- Raw body textarea ----
  const [rawBody, setRawBody] = useState<string>(
    '{\n  "type": "doc",\n  "version": 1,\n  "content": [\n    {"type":"paragraph","content":[{"type":"text","text":"Hello from the API"}]}\n  ]\n}'
  );

  // ---- Response area ----
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseText, setResponseText] = useState<string>('');
  const [responseStatus, setResponseStatus] = useState<string>('');

  // Base64 helper (UTF-8 safe)
  const toBase64 = (input: string) => {
    // Browser-safe base64 for Unicode
    return btoa(unescape(encodeURIComponent(input)));
  };

  const authHeader = useMemo(() => {
    try {
      // Expecting "email@example.com:API_TOKEN"
      const base64 = toBase64(basicKey.trim());
      return `Basic ${base64}`;
    } catch {
      return '';
    }
  }, [basicKey]);

  // Build request body
  const buildRequestBody = (): string => {
    if (!wrapAsV2Page) {
      // Send as-is (ensure it's valid JSON)
      try {
        const parsed = JSON.parse(rawBody);
        return JSON.stringify(parsed);
      } catch (e) {
        // If it's not JSON, still send as string (for endpoints that accept plain text)
        return rawBody;
      }
    }

    // Wrap as v2 Page payload
    // For v2 with atlas_doc_format:
    // - body.value must be a JSON-encoded *string* of the ADF object.
    // For storage:
    // - body.value is XML/HTML storage string (send raw).
    let bodyRepresentation: any;
    if (representation === 'atlas_doc_format') {
      // Ensure we stringify the ADF object to a JSON string
      let adfObject: any;
      try {
        adfObject = JSON.parse(rawBody);
      } catch (e) {
        throw new Error(
          'ADF body must be valid JSON when using atlas_doc_format. Please paste a valid ADF object.'
        );
      }
      const adfJSONString = JSON.stringify(adfObject); // stringify to JSON text
      bodyRepresentation = {
        representation: 'atlas_doc_format',
        value: adfJSONString // NOTE: value is a JSON string, not an object
      };
    } else {
      // storage: accept raw storage XML/HTML (string)
      bodyRepresentation = {
        representation: 'storage',
        value: rawBody
      };
    }

    const payload: any = {
      status,
      title,
      body: bodyRepresentation
    };

    // v2 requires spaceId for creating pages. For PUT (update), Confluence
    // also expects version increments, but we keep this minimal here.
    if (spaceId) {
      payload.spaceId = Number.isNaN(Number(spaceId))
        ? spaceId
        : Number(spaceId);
    }
    if (parentId) {
      payload.parentId = Number.isNaN(Number(parentId))
        ? parentId
        : Number(parentId);
    }

    return JSON.stringify(payload);
  };

  const handleSend = async () => {
    setIsLoading(true);
    setResponseText('');
    setResponseStatus('');

    try {
      const body = buildRequestBody();

      const res = await fetch(endpointUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader
        },
        body
      });

      setResponseStatus(`${res.status} ${res.statusText}`);

      const text = await res.text();
      // Try pretty-print JSON, fallback to raw text
      try {
        const json = JSON.parse(text);
        setResponseText(JSON.stringify(json, null, 2));
      } catch {
        setResponseText(text);
      }
    } catch (err: any) {
      setResponseStatus('Request failed');
      setResponseText(
        (err?.message || String(err)) +
          '\n\nIf this is a browser request to atlassian.net, it may be blocked by CORS. Consider using a server-side proxy.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        style={{
          maxWidth: 920,
          margin: '2rem auto',
          fontFamily: 'system-ui, Segoe UI, Roboto, Arial, sans-serif'
        }}
      >
        <h2 style={{ marginBottom: '0.5rem' }}>
          Confluence API Poster (Basic Auth)
        </h2>
        <p style={{ marginTop: 0, color: '#444' }}>
          Paste <code>email@example.com:API_TOKEN</code> below. For Confluence
          Cloud, use an{' '}
          <a href="https://id.atlassian.com/manage-profile/security/api-tokens">
            {' '}
            API token
          </a>
          .
        </p>

        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <label>
            <div>Basic auth key (email:token)</div>
            <input
              type="password"
              value={basicKey}
              onChange={(e) => setBasicKey(e.target.value)}
              placeholder="you@example.com:API_TOKEN"
              style={{ width: '100%', padding: '8px' }}
            />
          </label>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <label style={{ minWidth: 120 }}>
              <div>Method</div>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                style={{ width: '100%', padding: 8 }}
              >
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
              </select>
            </label>

            <label style={{ flex: 1 }}>
              <div>API endpoint URL</div>
              <input
                type="url"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                placeholder="https://your-site.atlassian.net/wiki/api/v2/pages"
                style={{ width: '100%', padding: '8px' }}
              />
            </label>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={wrapAsV2Page}
              onChange={(e) => setWrapAsV2Page(e.target.checked)}
            />
            <span>
              Wrap textarea content as a <b>v2 Page</b> payload
            </span>
          </label>

          {wrapAsV2Page && (
            <div
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: 12,
                background: '#fafafa',
                display: 'grid',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ minWidth: 220, flex: 1 }}>
                  <div>Title (document name)</div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="My API Page"
                    style={{ width: '100%', padding: 8 }}
                  />
                </label>

                <label style={{ minWidth: 160 }}>
                  <div>Status</div>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as 'current' | 'draft')
                    }
                    style={{ width: '100%', padding: 8 }}
                  >
                    <option value="current">current</option>
                    <option value="draft">draft</option>
                  </select>
                </label>

                <label style={{ minWidth: 220 }}>
                  <div>Body representation</div>
                  <select
                    value={representation}
                    onChange={(e) => setRepresentation(e.target.value as any)}
                    style={{ width: '100%', padding: 8 }}
                  >
                    <option value="atlas_doc_format">
                      atlas_doc_format (ADF)
                    </option>
                    <option value="storage">storage (XML/HTML)</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <label style={{ minWidth: 220 }}>
                  <div>spaceId (required for create)</div>
                  <input
                    value={spaceId}
                    onChange={(e) => setSpaceId(e.target.value)}
                    placeholder="e.g., 1234567"
                    style={{ width: '100%', padding: 8 }}
                  />
                </label>

                <label style={{ minWidth: 220 }}>
                  <div>parentId (optional)</div>
                  <input
                    value={parentId}
                    onChange={(e) => setParentId(e.target.value)}
                    placeholder="e.g., 9876543"
                    style={{ width: '100%', padding: 8 }}
                  />
                </label>
              </div>

              <div style={{ fontSize: 12, color: '#555' }}>
                <strong>Notes:</strong> For ADF, paste a valid ADF object in the
                textarea below; it will be JSON‑stringified for{' '}
                <code>body.value</code>. For storage, paste storage XML/HTML as
                plain text. For updates (PUT), Confluence v2 also expects
                version increments—you can extend this sample to GET the page
                and bump
                <code>version.number</code> before sending the PUT.
              </div>
            </div>
          )}

          <label>
            <div>
              Request body{' '}
              <span style={{ color: '#666' }}>
                (
                {wrapAsV2Page
                  ? representation === 'atlas_doc_format'
                    ? 'ADF object'
                    : 'storage XML/HTML'
                  : 'raw JSON or text'}
                )
              </span>
            </div>
            <textarea
              value={rawBody}
              onChange={(e) => setRawBody(e.target.value)}
              rows={16}
              style={{
                width: '100%',
                padding: '8px',
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
              }}
            />
          </label>

          <button
            onClick={handleSend}
            disabled={!authHeader || !endpointUrl || isLoading}
            style={{
              padding: '10px 14px',
              background: '#0052CC',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              width: 160
            }}
            title={!authHeader ? 'Enter a valid email:token first' : ''}
          >
            {isLoading ? 'Sending...' : 'Send request'}
          </button>

          <div style={{ borderTop: '1px solid #eee', paddingTop: 12 }}>
            <div style={{ marginBottom: 6, color: '#333' }}>
              <strong>Response:</strong>{' '}
              <span style={{ color: '#666' }}>
                {responseStatus || '(waiting…)'}
              </span>
            </div>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                background: '#0b0c0d',
                color: '#d6deeb',
                padding: 12,
                borderRadius: 8,
                maxHeight: 480,
                overflow: 'auto',
                fontSize: 13
              }}
            >
              {responseText || ''}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
};
