import { Redis } from "@upstash/redis";

let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const mem = new Map<string, { v: string; exp: number }>();

export async function cacheGet(key: string): Promise<string | null> {
  if (redis) {
    try {
      return await redis.get<string>(key);
    } catch {
      return null;
    }
  }
  const e = mem.get(key);
  if (!e || e.exp < Date.now()) {
    mem.delete(key);
    return null;
  }
  return e.v;
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSec: number,
): Promise<void> {
  if (redis) {
    try {
      await redis.set(key, value, { ex: ttlSec });
      return;
    } catch {
      // fall through to memory
    }
  }
  mem.set(key, { v: value, exp: Date.now() + ttlSec * 1000 });
}

export const cacheKeys = {
  lyrics: (artist: string, title: string) =>
    `lyrics:v1:${artist.toLowerCase().trim()}::${title.toLowerCase().trim()}`,
};
