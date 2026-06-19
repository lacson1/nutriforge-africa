import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkRateLimit, clientIp } from '../lib/rate-limit.js';
import { safeEqualString } from '../lib/passphrase.js';

describe('rate-limit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows requests under the limit', () => {
    const key = 'test:' + Math.random();
    expect(checkRateLimit(key, { limit: 3, windowMs: 60_000 }).ok).toBe(true);
    expect(checkRateLimit(key, { limit: 3, windowMs: 60_000 }).ok).toBe(true);
    expect(checkRateLimit(key, { limit: 3, windowMs: 60_000 }).ok).toBe(true);
    expect(checkRateLimit(key, { limit: 3, windowMs: 60_000 }).ok).toBe(false);
  });

  it('resets after the window', () => {
    const key = 'reset:' + Math.random();
    expect(checkRateLimit(key, { limit: 1, windowMs: 1000 }).ok).toBe(true);
    expect(checkRateLimit(key, { limit: 1, windowMs: 1000 }).ok).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(checkRateLimit(key, { limit: 1, windowMs: 1000 }).ok).toBe(true);
  });

  it('reads x-forwarded-for', () => {
    const req = { headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' }, socket: {} };
    expect(clientIp(req)).toBe('203.0.113.1');
  });
});

describe('safeEqualString', () => {
  it('matches equal strings', () => {
    expect(safeEqualString('diet', 'diet')).toBe(true);
  });

  it('rejects different strings', () => {
    expect(safeEqualString('diet', 'food')).toBe(false);
    expect(safeEqualString('diet', 'diets')).toBe(false);
  });
});
