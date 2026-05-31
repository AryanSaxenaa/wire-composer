"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useComposerStore } from "@/lib/store";
import { getActionById } from "@/lib/action-registry";
import { useCredentials } from "@/lib/credentials-context";
import { usePipelineRunner } from "@/hooks/usePipelineRunner";

export function NodeInspector() {
  const selectedNodeId = useComposerStore((s) => s.selectedNodeId);
  const inspectorOpen = useComposerStore((s) => s.inspectorOpen);
  const setInspectorOpen = useComposerStore((s) => s.setInspectorOpen);
  const pipeline = useComposerStore((s) => s.pipeline);
  const updateNode = useComposerStore((s) => s.updateNode);
  const ambiguousMapping = useComposerStore((s) => s.ambiguousMapping);
  const resolveAmbiguousMapping = useComposerStore((s) => s.resolveAmbiguousMapping);
  const { setNodeCredentials, getAllCredentials } = useCredentials();
  const { retryNode, resume } = usePipelineRunner();

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

  const [credentialId, setCredentialId] = useState(savedCreds?.credential_id || "");
  const [credentialUsername, setCredentialUsername] = useState(savedCreds?.username || "");
  const [credentialPassword, setCredentialPassword] = useState(savedCreds?.password || "");
  const [credentialSession, setCredentialSession] = useState(savedCreds?.sessionCookie || "");
  const [showSession, setShowSession] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!node) return;
    const creds = getAllCredentials()[node.id];
    setCredentialId(creds?.credential_id ?? node.credentials?.credential_id ?? "");
    setCredentialUsername(creds?.username ?? "");
    setCredentialPassword(creds?.password ?? "");
    setCredentialSession(creds?.sessionCookie ?? "");
    setShowSession(!!creds?.sessionCookie);
  }, [node?.id, getAllCredentials]);

  const handleConfigChange = useCallback(
    (key: string, value: string) => {
      if (!node) return;
      updateNode(node.id, { config: { ...node.config, [key]: value } });
    },
    [node, updateNode]
  );

  const syncCredentialsToSession = useCallback(() => {
    if (!node) return;
    const sessionCreds: Record<string, string> = {
      platform: node.platform,
      ...(credentialId.trim() ? { credential_id: credentialId.trim() } : {}),
      ...(credentialUsername.trim() ? { username: credentialUsername.trim() } : {}),
      ...(credentialPassword.trim() ? { password: credentialPassword.trim() } : {}),
      ...(showSession && credentialSession.trim()
        ? { sessionCookie: credentialSession.trim() }
        : {}),
    };
    setNodeCredentials(node.id, sessionCreds);
    updateNode(node.id, {
      credentials: {
        platform: node.platform,
        ...(credentialId.trim() ? { credential_id: credentialId.trim() } : {}),
      },
    });
  }, [
    node,
    setNodeCredentials,
    updateNode,
    credentialId,
    credentialUsername,
    credentialPassword,
    credentialSession,
    showSession,
  ]);

  useEffect(() => {
    if (!node || action?.authMode === "none") return;
    const timer = window.setTimeout(() => syncCredentialsToSession(), 400);
    return () => window.clearTimeout(timer);
  }, [
    node,
    action?.authMode,
    syncCredentialsToSession,
    credentialId,
    credentialUsername,
    credentialPassword,
    credentialSession,
    showSession,
  ]);

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
          className="text-[#475569] hover:text-[#0f172a] text-lg leading-none"
          aria-label="Close inspector"
        >
          ×
        </button>
      </div>

      <div className="cmp-inspector-body">
        {node.status === "error" && node.error?.includes("Unauthorized") && (
          <div className="cmp-alert cmp-alert--error mx-4 mt-3">
            Credentials invalid or expired. Update credentials below and retry.
          </div>
        )}

        {node.status === "error" && node.error?.includes("timed out") && (
          <div className="cmp-inspector-section">
            <button type="button" className="cmp-btn cmp-btn--primary w-full" onClick={() => retryNode(node.id)}>
              Retry this step
            </button>
          </div>
        )}

        {ambiguousMapping && ambiguousMapping.nodeId === node.id && (
          <div className="cmp-inspector-section">
            <h4>Which field?</h4>
            <p className="text-xs text-[#475569] mb-2">
              Multiple upstream fields match &ldquo;{ambiguousMapping.targetField}&rdquo;. Pick one:
            </p>
            <div className="flex flex-col gap-2">
              {ambiguousMapping.options.map((opt) => (
                <button
                  key={`${opt.sourceNodeId}-${opt.fromField}`}
                  type="button"
                  className="cmp-btn text-left"
                  onClick={() => {
                    resolveAmbiguousMapping(opt.fromField);
                    resume();
                  }}
                >
                  <span className="font-mono text-xs">{opt.fromField}</span>
                  <span className="text-[#475569] text-xs ml-2">from {opt.sourceLabel}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="cmp-inspector-section">
          <div className="flex items-center gap-2 mb-2">
            <span className="cmp-tag">{node.platform}</span>
            {action?.category && <span className="cmp-tag">{action.category}</span>}
          </div>
          <h3>{action?.name || node.label}</h3>
          <p className="text-xs text-[#64748b] mt-2 leading-relaxed">{action?.description}</p>
          {action?.authMode === "required" && (
            <p className="text-xs text-[#b45309] mt-2">Anakin identity required for this step.</p>
          )}
          {action?.authMode === "optional" && (
            <p className="text-xs text-[#64748b] mt-2">
              Optional: connect an Anakin identity to run authenticated.
            </p>
          )}
        </div>

        <div className="cmp-inspector-section">
          <h4>Inputs</h4>
          <div className="flex flex-col gap-3">
            {(action?.inputFields?.length
              ? action.inputFields
              : Object.keys(node.config).map((key) => ({
                  key,
                  label: key,
                  type: "string" as const,
                  required: false,
                  description: "",
                }))
            ).map((field) => {
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
                    <div className="flex flex-col gap-1">
                      <div className="cmp-field-readonly">
                        Mapped from &ldquo;{sourceNode?.label || "upstream"}&rdquo;
                      </div>
                      <input
                        id={`input-${field.key}-fallback`}
                        className="cmp-field-input"
                        placeholder={`Override ${field.key} for this run (optional)`}
                        value={String(node.config[field.key] ?? "")}
                        onChange={(e) => handleConfigChange(field.key, e.target.value)}
                      />
                      <p className="text-[10px] text-[#94a3b8]">
                        Your value here overrides the upstream mapping for this run.
                      </p>
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

        {action && action.authMode !== "none" && (
          <div className="cmp-inspector-section">
            <div className="cmp-alert cmp-alert--warn mb-3">
              Wire uses Anakin credential IDs from your Identities dashboard. Values here are
              used only for this run and never stored on our servers.
            </div>
            <h4>Credentials</h4>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#64748b] mb-1">
                  Credential ID (recommended)
                </label>
                <input
                  id="cred-id"
                  className="cmp-field-input font-mono text-xs"
                  placeholder="11111111-2222-3333-4444-555555555555"
                  value={credentialId}
                  onChange={(e) => setCredentialId(e.target.value)}
                />
                <p className="text-[10px] text-[#94a3b8] mt-1">
                  From Anakin Wire → Identities, or env{" "}
                  <span className="font-mono">ANAKIN_CREDENTIAL_ID</span>
                </p>
              </div>
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
                <div className="flex gap-2">
                  <input
                    id="cred-password"
                    type={showPassword ? "text" : "password"}
                    className="cmp-field-input flex-1"
                    placeholder="••••••••"
                    value={credentialPassword}
                    onChange={(e) => setCredentialPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="cmp-btn"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
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
              <p className="text-[10px] text-[#94a3b8]">
                Credentials sync automatically for the next run.
              </p>
            </div>
          </div>
        )}

        {node.status === "error" && !node.error?.includes("timed out") && (
          <div className="cmp-inspector-section">
            <button type="button" className="cmp-btn w-full" onClick={() => retryNode(node.id)}>
              Retry this step
            </button>
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
