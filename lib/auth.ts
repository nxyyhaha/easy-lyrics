import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";

// Extra origins the browser may sign in from (comma-separated in the env),
// e.g. a preview or production domain. Same-origin requests are always ok.
const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins,
});

export type Session = typeof auth.$Infer.Session;
