import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Better Auth: /api/auth/sign-up, /api/auth/sign-in, /api/auth/sign-out, /api/auth/get-session
export const { GET, POST } = toNextJsHandler(auth);
