/**
 * Shared Rate Limiting Utility
 * Prevents API abuse and protects against unexpected charges
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Rate limit configurations per endpoint type
export const RATE_LIMITS = {
  // Expensive operations (AI/external APIs) - very strict
  expensive: { windowMs: 60 * 60 * 1000, maxRequests: 10 },  // 10/hour
  
  // Standard operations - moderate
  standard: { windowMs: 60 * 1000, maxRequests: 30 },  // 30/minute
  
  // Auth operations - strict to prevent brute force
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 10 },  // 10/15min
  
  // Read-only operations - lenient
  readonly: { windowMs: 60 * 1000, maxRequests: 60 },  // 60/minute
};

// In-memory store (resets on cold start - acceptable for serverless)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries periodically to prevent memory leaks
function cleanupOldEntries() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Run cleanup every 100 requests
let requestCount = 0;

export function getRateLimitKey(req: VercelRequest, prefix: string): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' 
    ? forwarded.split(',')[0].trim() 
    : (req.headers['x-real-ip'] as string) || 
      req.socket?.remoteAddress || 
      'unknown';
  return `${prefix}:${ip}`;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  limit: number;
}

export function checkRateLimit(
  req: VercelRequest, 
  prefix: string,
  config: { windowMs: number; maxRequests: number }
): RateLimitResult {
  // Periodic cleanup
  requestCount++;
  if (requestCount % 100 === 0) {
    cleanupOldEntries();
  }

  const key = getRateLimitKey(req, prefix);
  const now = Date.now();
  
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return { 
      allowed: true, 
      remaining: config.maxRequests - 1, 
      resetIn: config.windowMs,
      limit: config.maxRequests 
    };
  }
  
  if (record.count >= config.maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: record.resetTime - now,
      limit: config.maxRequests 
    };
  }
  
  record.count++;
  return { 
    allowed: true, 
    remaining: config.maxRequests - record.count, 
    resetIn: record.resetTime - now,
    limit: config.maxRequests 
  };
}

export function setRateLimitHeaders(res: VercelResponse, result: RateLimitResult) {
  res.setHeader('X-RateLimit-Limit', result.limit.toString());
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetIn / 1000).toString());
}

export function sendRateLimitError(res: VercelResponse, result: RateLimitResult) {
  return res.status(429).json({
    success: false,
    error: 'Too many requests. Please try again later.',
    retryAfter: Math.ceil(result.resetIn / 1000)
  });
}

export function setSecurityHeaders(res: VercelResponse) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

/**
 * Quick middleware-style rate limit check
 * Returns true if request should be blocked
 */
export function applyRateLimit(
  req: VercelRequest, 
  res: VercelResponse, 
  prefix: string,
  type: keyof typeof RATE_LIMITS = 'standard'
): boolean {
  const config = RATE_LIMITS[type];
  const result = checkRateLimit(req, prefix, config);
  
  setSecurityHeaders(res);
  setRateLimitHeaders(res, result);
  
  if (!result.allowed) {
    sendRateLimitError(res, result);
    return true; // blocked
  }
  
  return false; // allowed
}

