import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from './auth';

describe('useAuthStore', () => {
  const originalFetch = globalThis.fetch;
  const originalLocation = window.location;

  const mockUser = {
    id: '1',
    oidcSub: 'sub-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER' as const,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    globalThis.fetch = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
    });
  });

  it('starts unauthenticated', () => {
    const store = useAuthStore();
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.isAdmin).toBe(false);
    expect(store.loaded).toBe(false);
  });

  it('fetchUser() loads user from /api/me', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(mockUser), { status: 200 }),
    );

    const store = useAuthStore();
    const user = await store.fetchUser();

    expect(user).toEqual(mockUser);
    expect(store.user).toEqual(mockUser);
    expect(store.isAuthenticated).toBe(true);
    expect(store.loaded).toBe(true);
  });

  it('fetchUser() returns null on 401', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('Unauthorized', { status: 401 }),
    );

    const store = useAuthStore();
    const user = await store.fetchUser();

    expect(user).toBeNull();
    expect(store.user).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.loaded).toBe(true);
  });

  it('isAdmin is true for ADMIN role', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ...mockUser, role: 'ADMIN' }), { status: 200 }),
    );

    const store = useAuthStore();
    await store.fetchUser();

    expect(store.isAdmin).toBe(true);
  });

  it('login() redirects to /api/auth/login', () => {
    const store = useAuthStore();
    store.login();
    expect(window.location.href).toBe('/api/auth/login');
  });

  it('logout() clears user and redirects to /api/auth/logout', () => {
    const store = useAuthStore();
    store.user = { ...mockUser };
    store.logout();

    expect(store.user).toBeNull();
    expect(window.location.href).toBe('/api/auth/logout');
  });
});
