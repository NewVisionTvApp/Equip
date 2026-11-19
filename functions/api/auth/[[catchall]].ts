import { createAuth } from "@/lib/auth";

interface Env {
  DB: D1Database;
  BETTER_AUTH_SECRET?: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const auth = createAuth(context.env.DB, context.env.BETTER_AUTH_SECRET);
  return auth.handler(context.request);
};
