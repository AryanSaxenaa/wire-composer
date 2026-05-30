"use client";

import { useState, useCallback, useMemo } from "react";
import { useComposerStore } from "@/lib/store";
import { getActionById } from "@/lib/action-registry";
import { useCredentials } from "@/lib/credentials-context";

export function NodeInspector() {
  const selectedNodeId = useComposerStore((s) => s.selectedNodeId);
  const inspectorOpen = useComposerStore((s) => s.inspectorOpen);
  const setInspectorOpen = useComposerStore((s) => s.setInspectorOpen);
  const pipeline = useComposerStore((s) => s.pipeline);
  const updateNode = useComposerStore((s) => s.updateNode);
  const { setNodeCredentials, getAllCredentials } = useCredentials();

  const node = useMemo(
    () => pipeline?.nodes.find((n) => n.id === selectedNodeId) || null,
    [pipeline?.nodes, selectedNodeId]
  );

  const action = useMemo(() => {
    if (!node) return null;
    return getActionById(node.actionId);
  }, [node]);

  const savedCreds = useMemo(
    () => (node ? getAllCredentials()[node.id] : null),
    [node, getAllCredentials]
  );

  const [credentialUsername, setCredentialUsername] = useState(savedCreds?.username || "");
  const [credentialPassword, setCredentialPassword] = useState(savedCreds?.password || "");
  const [credentialSession, setCredentialSession] = useState(savedCreds?.sessionCookie || "");
  const [showSession, setShowSession] = useState(false);

  const handleConfigChange = useCallback(
    (key: string, value: string) => {
      if (!node) return;
      updateNode(node.id, { config: { ...node.config, [key]: value } });
    },
    [node, updateNode]
  );

  const handleSaveCredentials = useCallback(() => {
    if (!node) return;
    setNodeCredentials(node.id, {
      username: credentialUsername,
      password: credentialPassword,
      ...(showSession && credentialSession ? { sessionCookie: credentialSession } : {}),
    });
  }, [node, setNodeCredentials, credentialUsername, credentialPassword, credentialSession, showSession]);

  if (!inspectorOpen || !node) {
    return null;
  }

  return (
    <div className="cmp-inspector flex flex-col h-full overflow-hidden">
      <div className="cmp-inspector-header">
        <h2>Node inspector</h2>
        <button
          type="button"
          onClick={() => setInspectorOpen(false)}
          className="text-[#94a3b8] hover:text-[#0f172a] text-lg leading-none"
          aria-label="Close inspector"
        >
          ×
        </button>
      </div>

      <div className="cmp-inspector-body">
        <div className="cmp-inspector-section">
          <div className="flex items-center gap-2 mb-2">
            <span className="cmp-tag">{node.platform}</span>
            {action?.category && <span className="cmp-tag">{action.category}</span>}
          </div>
          <h3>{action?.name || node.label}</h3>
          <p className="text-xs text-[#64748b] mt-2 leading-relaxed">{action?.description}</p>
          {action?.requiresAuth && (
            <p className="text-xs text-[#b45309] mt-2">Authentication required for this step.</p>
          )}
        </div>

        <div className="cmp-inspector-section">
          <h4>Inputs</h4>
          <div className="flex flex-col gap-3">
            {action?.inputFields.map((field) => {
              const edge = pipeline?.edges.find(
                (e) =>
                  e.target === node.id && e.dataMapping.some((m) => m.toField === field.key)
              );
              const isMapped = !!edge;
              const sourceNode = isMapped
                ? pipeline?.nodes.find((n) => n.id === edge.source)
                : null;

              return (
                <div key={field.key}>
                  <label className="block text-[11px] font-medium text-[#64748b] mb-1">
                    {field.key}
                    {field.required && <span className="text-[#dc2626]"> *</span>}
                    {isMapped && (
                      <span className="text-[#10b981] ml-2">
                        ← {sourceNode?.label || "upstream"}
                      </span>
                    )}
                  </label>
                  {isMapped ? (
                    <div className="cmp-field-readonly">
                      Mapped from &ldquo;{sourceNode?.label || "upstream"}&rdquo;
                    </div>
                  ) : (
                    <input
                      id={`input-${field.key}`}
                      className="cmp-field-input"
                      placeholder={field.example || field.description}
                      value={String(node.config[field.key] ?? "")}
                      onChange={(e) => handleConfigChange(field.key, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {action?.requiresAuth && (
          <div className="cmp-inspector-section">
            <div className="cmp-alert cmp-alert--warn mb-3">
              Credentials are sent only when you run the pipeline and are kept in this browser
              session.
            </div>
            <h4>Credentials</h4>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#64748b] mb-1">
                  Username / email
                </label>
                <input
                  id="cred-username"
                  className="cmp-field-input"
                  placeholder="user@example.com"
                  value={credentialUsername}
                  onChange={(e) => setCredentialUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[#64748b] mb-1">
                  Password
                </label>
                <input
                  id="cred-password"
                  type="password"
                  className="cmp-field-input"
                  placeholder="••••••••"
                  value={credentialPassword}
                  onChange={(e) => setCredentialPassword(e.target.value)}
                />
              </div>
              <button
                type="button"
                className="text-xs text-[#64748b] hover:text-[#0f172a] text-left"
                onClick={() => setShowSession(!showSession)}
              >
                {showSession ? "▾ Hide session cookie" : "▸ Use session cookie instead"}
              </button>
              {showSession && (
                <div>
                  <label className="block text-[11px] font-medium text-[#64748b] mb-1">
                    Session cookie
                  </label>
                  <input
                    id="cred-session"
                    className="cmp-field-input"
                    placeholder="session=..."
                    value={credentialSession}
                    onChange={(e) => setCredentialSession(e.target.value)}
                  />
                </div>
              )}
              <button type="button" className="cmp-btn" onClick={handleSaveCredentials}>
                Store credentials for run
              </button>
            </div>
          </div>
        )}

        {node.output && (
          <div className="cmp-inspector-section">
            <h4>Output</h4>
            <pre className="cmp-output-json">{JSON.stringify(node.output, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
