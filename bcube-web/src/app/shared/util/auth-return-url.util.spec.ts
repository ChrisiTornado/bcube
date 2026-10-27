import { consumeReturnUrl, rememberReturnUrl } from './auth-return-url.util';

describe('auth return URL', () => {
  afterEach(() => sessionStorage.clear());

  it('remembers a user-area path once and then forgets it', () => {
    rememberReturnUrl('/studio-details/4?tab=calendar');

    expect(consumeReturnUrl()).toBe('/studio-details/4?tab=calendar');
    expect(consumeReturnUrl()).toBeNull();
  });

  it('rejects external, protocol-relative, admin and auth URLs', () => {
    for (const url of ['https://evil.com', '//evil.com', '/admin-dashboard/users', '/login', '/studiosX', 'studios']) {
      rememberReturnUrl(url);
      expect(consumeReturnUrl()).withContext(url).toBeNull();
    }
  });

  it('clears a previously remembered URL when called with null', () => {
    rememberReturnUrl('/calendar');
    rememberReturnUrl(null);

    expect(consumeReturnUrl()).toBeNull();
  });
});
