export interface ResetEmailConfig {
  apiKey: string;
  from: string;
  waitUntil?: (promise: Promise<unknown>) => void;
}

export async function sendResetEmail(config: ResetEmailConfig, to: string, url: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: config.from,
      to: [to],
      subject: "Reset your Equip password",
      text: `Use this link to reset your Equip password: ${url}\n\nIf you did not request this, you can ignore this email.`,
    }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Resend delivery failed (${response.status})`);
}
