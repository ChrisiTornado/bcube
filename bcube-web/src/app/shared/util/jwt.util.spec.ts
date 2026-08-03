import { isJwtExpired } from './jwt.util';

describe('isJwtExpired', () => {
  function fakeJwt(expiresInSeconds: number): string {
    const base64url = (obj: unknown) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${base64url({ alg: 'HS256' })}.${base64url({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds })}.fake-signature`;
  }

  it('returns false for a token that expires in the future', () => {
    expect(isJwtExpired(fakeJwt(3600))).toBeFalse();
  });

  it('returns true for a token whose exp is in the past', () => {
    expect(isJwtExpired(fakeJwt(-10))).toBeTrue();
  });

  it('returns true for a malformed token', () => {
    expect(isJwtExpired('not-a-jwt')).toBeTrue();
  });

  it('returns true for an empty string', () => {
    expect(isJwtExpired('')).toBeTrue();
  });

  it('returns false when the payload has no exp claim', () => {
    const base64url = (obj: unknown) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const token = `${base64url({ alg: 'HS256' })}.${base64url({ sub: 'user@example.com' })}.fake-signature`;

    expect(isJwtExpired(token)).toBeFalse();
  });
});
