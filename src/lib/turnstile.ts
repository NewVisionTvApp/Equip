export async function verifyTurnstile(token: string, secret: string, hostname: string, action: string, remoteip?: string) {
  if (!token || token.length > 2048) return false;
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret, response: token, remoteip }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Turnstile verification failed (${response.status})`);
  const result = await response.json() as { success?: boolean; hostname?: string; action?: string };
  return result.success === true && result.hostname === hostname && result.action === action;
}
