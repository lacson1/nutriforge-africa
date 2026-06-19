import { describe, it, expect } from 'vitest';
import {
  PROTOCOL_COOKIE_NAME,
  signProtocolCookie,
  verifyProtocolCookie,
  parseCookie,
} from '../lib/protocol-token.js';

describe('protocol-token', () => {
  const secret = 'test-secret-key';

  it('signs and verifies a cookie', () => {
    const token = signProtocolCookie(secret);
    expect(verifyProtocolCookie(token, secret)).toBe(true);
  });

  it('rejects tampered signature', () => {
    const token = signProtocolCookie(secret);
    const tampered = token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a');
    expect(verifyProtocolCookie(tampered, secret)).toBe(false);
  });

  it('rejects wrong secret', () => {
    const token = signProtocolCookie(secret);
    expect(verifyProtocolCookie(token, 'other-secret')).toBe(false);
  });

  it('parses cookie header', () => {
    const token = signProtocolCookie(secret);
    const header = `other=1; ${PROTOCOL_COOKIE_NAME}=${encodeURIComponent(token)}; foo=bar`;
    expect(parseCookie(header, PROTOCOL_COOKIE_NAME)).toBe(token);
  });
});
