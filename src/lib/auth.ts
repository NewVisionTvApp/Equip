import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema.ts";

export function createAuth(d1Database: D1Database, secret?: string) {
  const db = drizzle(d1Database, { schema });

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    secret: secret || "local_dev_equip_auth_secret_32_characters_long",
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Can be toggled when Resend API key is configured
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "attendee",
        },
      },
    },
  });
}

export type AuthInstance = ReturnType<typeof createAuth>;
