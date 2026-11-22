import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { twoFactor } from "better-auth/plugins";
import * as schema from "../db/schema.ts";
import { sendResetEmail, type ResetEmailConfig } from "./reset-email.ts";

export function createAuth(d1Database: D1Database, secret: string, baseURL?: string, resetEmail?: ResetEmailConfig) {
  const db = drizzle(d1Database, { schema });

  return betterAuth({
    baseURL,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
        twoFactor: schema.twoFactor,
      },
    }),
    secret,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Can be toggled when Resend API key is configured
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: resetEmail ? async ({ user, url }) => {
        const delivery = sendResetEmail(resetEmail, user.email, url).catch(() => {
          console.error(JSON.stringify({ event: "password_reset_email_failed" }));
        });
        if (resetEmail.waitUntil) resetEmail.waitUntil(delivery);
        else await delivery;
      } : undefined,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "attendee",
          input: false,
        },
      },
    },
    plugins: [twoFactor({ issuer: "Equip" })],
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
