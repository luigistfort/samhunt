// src/lib/cache/index.ts
// Two-tier caching: Redis (production) with in-memory fallback

import crypto from 'crypto';
import type { SearchParams } from '@/types';

// ─── In-Memory Fallback ───────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  hits: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxEntries = 200;

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    entry.hits++;
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    if (this.store.size >= this.maxEntries) {
      // Evict oldest entry
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
      hits: 1,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

const memCache = new MemoryCache();

// ─── Redis Client (optional) ──────────────────────────────────────────────────

let redis: import('ioredis').Redis | null = null;

async function getRedis(): Promise<import('ioredis').Redis | null> {
  if (!process.env.REDIS_URL) return null;
  if (redis) return redis;

  try {
    const { default: Redis } = await import('ioredis');
    redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    redis.on('error', (err: Error) => {
      console.warn('[cache] Redis error, falling back to memory:', err.message);
      redis = null;
    });
    await redis.ping();
    return redis;
  } catch (err) {
    console.warn('[cache] Redis unavailable, using memory cache');
    redis = null;
    return null;
  }
}

// ─── Unified Cache API ────────────────────────────────────────────────────────

export async function cacheGet<T>(key: string): Promise<T | null> {
  // Check memory first
  const memResult = memCache.get<T>(key);
  if (memResult !== null) return memResult;

  // Try Redis
  const r = await getRedis();
  if (r) {
    try {
      const raw = await r.get(key);
      if (raw) {
        const data = JSON.parse(raw) as T;
        // Warm the memory cache
        memCache.set(key, data, 60);
        return data;
      }
    } catch (err) {
      console.warn('[cache] Redis get error:', err);
    }
  }

  return null;
}

export async function cacheSet<T>(
  key: string,
  data: T,
  ttlSeconds = 300
): Promise<void> {
  memCache.set(key, data, Math.min(ttlSeconds, 300));

  const r = await getRedis();
  if (r) {
    try {
      await r.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (err) {
      console.warn('[cache] Redis set error:', err);
    }
  }
}

export async function cacheDelete(key: string): Promise<void> {
  memCache.delete(key);
  const r = await getRedis();
  if (r) {
    try {
      await r.del(key);
    } catch (err) {
      console.warn('[cache] Redis delete error:', err);
    }
  }
}

// ─── Cache Key Helpers ────────────────────────────────────────────────────────

export function buildSearchCacheKey(params: SearchParams): string {
  const normalized = JSON.stringify(params, Object.keys(params).sort());
  const hash = crypto.createHash('sha256').update(normalized).digest('hex').slice(0, 16);
  return `sam:search:${hash}`;
}

export function buildOpportunityCacheKey(noticeId: string): string {
  return `sam:opp:${noticeId}`;
}

export function buildAiCacheKey(noticeId: string, action: string, profileHash?: string): string {
  return `sam:ai:${action}:${noticeId}:${profileHash ?? 'noprofile'}`;
}

// Cache TTL constants (seconds)
export const CACHE_TTL = {
  SEARCH_RESULTS: 5 * 60,          // 5 minutes
  OPPORTUNITY_DETAIL: 30 * 60,     // 30 minutes
  AI_SUMMARY: 24 * 60 * 60,        // 24 hours (AI calls are expensive)
  POPULAR_SEARCHES: 60 * 60,       // 1 hour
  USER_PROFILE: 5 * 60,            // 5 minutes
} as const;
