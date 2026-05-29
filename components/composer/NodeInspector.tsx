"use client";

import { useState, useCallback, useMemo } from "react";
import { useComposerStore } from "@/lib/store";
import { getActionById } from "@/lib/action-registry";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { CodeBlock } from "@/components/ui/CodeBlock";
import { Button } from "@/components/ui/Button";
import { useCredentials } from "@/lib/credentials-context";
import clsx from "clsx";

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
    return (
      <div
        className={clsx(
          "w-[360px] bg-bg-surface border-l border-border-default overflow-auto transition-transform",
          !inspectorOpen && "hidden"
        )}
      />
    );
  }

  return (
    <div className="w-[360px] bg-bg-surface border-l border-border-default overflow-auto flex flex-col flex-shrink-0">
      <div className="flex items-center justify-between p-4 border-b border-border-default">
        <h2 className="text-sm font-semibold text-text-primary font-mono tracking-wide uppercase">
          Node Inspector
        </h2>
        <button
          onClick={() => setInspectorOpen(false)}
          className="text-text-muted hover:text-text-primary text-sm"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {/* Section 1: Action Info */}
        <div className="p-4 border-b border-border-default">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-text-secondary bg-bg-subtle px-1.5 py-0.5 rounded font-mono uppercase">
              {node.platform}
            </span>
            <Badge variant={action?.category === "read" ? "default" : action?.category === "write" ? "warning" : action?.category === "search" ? "pending" : "success"}>
              {action?.category}
            </Badge>
          </div>
          <h3 className="text-base font-semibold text-text-primary">{action?.name || node.label}</h3>
          <p className="text-xs text-text-secondary mt-1">{action?.description}</p>
          {action?.requiresAuth && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-warning font-mono">
              ⚠ Auth required
            </div>
          )}
        </div>

        {/* Section 2: Inputs */}
        <div className="p-4 border-b border-border-default">
          <h4 className="text-xs font-semibold text-text-secondary font-mono uppercase tracking-wider mb-3">
            Inputs
          </h4>
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-text-muted font-mono">
                      {field.key}
                      {field.required && <span className="text-error ml-0.5">*</span>}
                    </label>
                    {isMapped && (
                      <span className="text-[9px] text-success font-mono">
                        ← {sourceNode?.label || "upstream"}
                      </span>
                    )}
                  </div>
                  {isMapped ? (
                    <div className="h-9 px-3 rounded-md bg-bg-base border border-success/20 flex items-center text-xs text-success font-mono">
                      Data mapped from &ldquo;{sourceNode?.label || "upstream"}&rdquo;
                    </div>
                  ) : (
                    <Input
                      id={`input-${field.key}`}
                      placeholder={field.example || field.description}
                      value={node.config[field.key] || ""}
                      onChange={(e) => handleConfigChange(field.key, e.target.value)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Credentials */}
        {action?.requiresAuth && (
          <div className="p-4 border-b border-border-default">
            <div className="p-2 mb-3 rounded bg-warning/10 border border-warning/20">
              <p className="text-[10px] text-warning font-mono">
                Credentials are used only for this run and never stored on our servers.
              </p>
            </div>
            <h4 className="text-xs font-semibold text-text-secondary font-mono uppercase tracking-wider mb-3">
              Credentials
            </h4>
            <div className="flex flex-col gap-3">
              <Input
                id="cred-username"
                label="Username / Email"
                placeholder="user@example.com"
                value={credentialUsername}
                onChange={(e) => setCredentialUsername(e.target.value)}
              />
              <Input
                id="cred-password"
                label="Password"
                type="password"
                placeholder="••••••••"
                value={credentialPassword}
                onChange={(e) => setCredentialPassword(e.target.value)}
              />
              <div>
                <button
                  onClick={() => setShowSession(!showSession)}
                  className="text-[10px] text-text-muted hover:text-text-secondary font-mono"
                >
                  {showSession ? "▾ Use saved session" : "▸ Use saved session"}
                </button>
                {showSession && (
                  <div className="mt-2">
                    <Input
                      id="cred-session"
                      label="Session Cookie"
                      placeholder="session=..."
                      value={credentialSession}
                      onChange={(e) => setCredentialSession(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <Button size="sm" variant="secondary" onClick={handleSaveCredentials}>
                Save Credentials
              </Button>
            </div>
          </div>
        )}

        {/* Section 4: Output Preview */}
        {node.output && (
          <div className="p-4">
            <h4 className="text-xs font-semibold text-text-secondary font-mono uppercase tracking-wider mb-3">
              Output
            </h4>
            <CodeBlock>
              {JSON.stringify(node.output, null, 2)}
            </CodeBlock>
          </div>
        )}
      </div>
    </div>
  );
}
