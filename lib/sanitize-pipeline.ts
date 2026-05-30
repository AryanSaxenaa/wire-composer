import { Pipeline } from "@/types";

/** Persist only non-secret credential refs (Anakin credential_id). */
export function sanitizeCredentialsForStorage(
  creds: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  if (creds.credential_id?.trim()) out.credential_id = creds.credential_id.trim();
  if (creds.platform?.trim()) out.platform = creds.platform.trim();
  return out;
}

function mergeNodeCredentials(
  nodeCreds: Record<string, string>,
  sessionCreds: Record<string, string> | undefined,
  platform: string
): Record<string, string> {
  return sanitizeCredentialsForStorage({
    platform,
    ...nodeCreds,
    ...sessionCreds,
  });
}

/** Merge session credential_id into nodes, then strip secrets before KV. */
export function preparePipelineForStorage(
  pipeline: Pipeline,
  sessionCreds: Record<string, Record<string, string>> = {}
): Pipeline {
  return sanitizePipelineForStorage({
    ...pipeline,
    nodes: pipeline.nodes.map((n) => ({
      ...n,
      credentials: mergeNodeCredentials(
        n.credentials ?? {},
        sessionCreds[n.id],
        n.platform
      ),
    })),
  });
}

/** Strip runtime-only fields before persisting to KV */
export function sanitizePipelineForStorage(pipeline: Pipeline): Pipeline {
  return {
    ...pipeline,
    updatedAt: new Date().toISOString(),
    nodes: pipeline.nodes.map((n) => ({
      ...n,
      status: "idle",
      output: undefined,
      error: undefined,
      credentials: sanitizeCredentialsForStorage(n.credentials ?? {}),
    })),
    edges: pipeline.edges.map((e) => ({ ...e, animated: false })),
  };
}
