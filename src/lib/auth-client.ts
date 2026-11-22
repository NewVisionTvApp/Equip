import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, twoFactorClient } from "better-auth/client/plugins";
import type { AuthInstance } from "./auth";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<AuthInstance>(), twoFactorClient({ twoFactorPage: "/verify-2fa" })],
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;
