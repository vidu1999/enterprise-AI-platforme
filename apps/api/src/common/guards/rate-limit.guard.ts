import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import Redis from 'ioredis';

interface Bucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate, OnModuleDestroy {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly memoryBuckets = new Map<string, Bucket>();
  private redis: Redis | null = null;
  private redisChecked = false;

  private getRedis(): Redis | null {
    if (this.redisChecked) return this.redis;
    this.redisChecked = true;
    const url = process.env.REDIS_URL;
    if (!url || process.env.NODE_ENV === 'test') return null;
    try {
      const client = new Redis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 600,
        enableOfflineQueue: false,
      });
      client.on('error', () => {
        if (this.redis) {
          this.logger.warn('Redis unavailable for rate limiter; falling back to in-memory store');
          this.redis.disconnect();
          this.redis = null;
        }
      });
      client.connect().catch(() => {
        this.redis = null;
      });
      this.redis = client;
    } catch {
      this.redis = null;
    }
    return this.redis;
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit().catch(() => undefined);
      this.redis = null;
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const path: string = req.originalUrl || req.url || '';
    const isAuthRoute = path.includes('/auth/login') || path.includes('/auth/register');
    const windowSec = Number(process.env.RATE_LIMIT_WINDOW_SEC ?? 60);
    const maxRequests = isAuthRoute
      ? Number(process.env.RATE_LIMIT_AUTH_MAX ?? 30)
      : Number(process.env.RATE_LIMIT_MAX ?? 300);

    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';
    const scope = isAuthRoute ? 'auth' : 'api';
    const key = `rl:${scope}:${ip}`;
    const now = Date.now();

    let count = 1;
    let resetAt = now + windowSec * 1000;

    const redis = this.getRedis();
    if (redis && redis.status === 'ready') {
      try {
        count = await redis.incr(key);
        if (count === 1) {
          await redis.expire(key, windowSec);
        }
        const ttl = await redis.ttl(key);
        if (ttl > 0) resetAt = now + ttl * 1000;
      } catch {
        // Fallback to memory below
        const b = this.bumpMemory(key, now, windowSec);
        count = b.count;
        resetAt = b.resetAt;
      }
    } else {
      const b = this.bumpMemory(key, now, windowSec);
      count = b.count;
      resetAt = b.resetAt;
    }

    const remaining = Math.max(0, maxRequests - count);
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));

    if (count > maxRequests) {
      throw new HttpException(
        'Too many requests. Please retry after the rate-limit window resets.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }

  private bumpMemory(key: string, now: number, windowSec: number): Bucket {
    const existing = this.memoryBuckets.get(key);
    if (!existing || existing.resetAt <= now) {
      const fresh: Bucket = { count: 1, resetAt: now + windowSec * 1000 };
      this.memoryBuckets.set(key, fresh);
      return fresh;
    }
    existing.count += 1;
    return existing;
  }
}
