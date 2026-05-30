/** Server-side credential fallbacks for cron/webhook runs (env vars only — never persisted). */
export function getServerCredentialsForNode(
  nodeId: string,
  platform: string,
  pipelineCredentials?: Record<string, string>
): Record<string, string> {
  if (pipelineCredentials && Object.keys(pipelineCredentials).length > 0) {
    return pipelineCredentials;
  }

  const prefix = `WIRE_CRED_${platform.toUpperCase().replace(/-/g, "_")}`;
  const username = process.env[`${prefix}_USER`] ?? process.env[`${prefix}_USERNAME`];
  const password = process.env[`${prefix}_PASSWORD`] ?? process.env[`${prefix}_TOKEN`];
  const sessionCookie = process.env[`${prefix}_SESSION`];

  const creds: Record<string, string> = {};
  if (username) creds.username = username;
  if (password) creds.password = password;
  if (sessionCookie) creds.sessionCookie = sessionCookie;

  if (platform === "slack" && process.env.SLACK_BOT_TOKEN) {
    creds.password = process.env.SLACK_BOT_TOKEN;
  }

  void nodeId;
  return creds;
}
