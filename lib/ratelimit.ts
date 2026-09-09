import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let limiter: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  limiter = new Ratelimit({
    redis: new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(100, "1 h"),
    analytics: true,
    prefix: "easy-lyrics",
  });
}

const memHits = new Map<string, number[]>();

export async function checkRateLimit(
  ip: string,
): Promise<{ success: boolean; remaining?: number }> {
  if (limiter) {
    try {
      const r = await limiter.limit(ip);
      return { success: r.success, remaining: r.remaining };
    } catch {
      return { success: true };
    }
  }
  // in-memory fallback for local dev
  const now = Date.now();
  const arr = (memHits.get(ip) ?? []).filter((t) => now - t < 3600_000);
  arr.push(now);
  memHits.set(ip, arr);
  return { success: arr.length <= 100, remaining: Math.max(0, 100 - arr.length) };
}
