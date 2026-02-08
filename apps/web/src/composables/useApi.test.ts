import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useApi, ApiError } from './useApi';

describe('useApi', () => {
  const originalFetch = globalThis.fetch;
  const originalLocation = window.location;

  beforeEach(() => {
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

  it('get() sends GET request with credentials', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: '1' }), { status: 200 }),
    );

    const api = useApi();
    const result = await api.get<{ id: string }>('/api/me');

    expect(result).toEqual({ id: '1' });
    expect(fetch).toHaveBeenCalledWith('/api/me', expect.objectContaining({
      credentials: 'include',
    }));
  });

  it('post() sends POST request with JSON body', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 201 }),
    );

    const api = useApi();
    await api.post('/api/cards', { name: 'Test' });

    expect(fetch).toHaveBeenCalledWith('/api/cards', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ name: 'Test' }),
    }));
  });

  it('put() sends PUT request with JSON body', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const api = useApi();
    await api.put('/api/cards/1', { name: 'Updated' });

    expect(fetch).toHaveBeenCalledWith('/api/cards/1', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ name: 'Updated' }),
    }));
  });

  it('del() sends DELETE request', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    const api = useApi();
    await api.del('/api/cards/1');

    expect(fetch).toHaveBeenCalledWith('/api/cards/1', expect.objectContaining({
      method: 'DELETE',
    }));
  });

  it('redirects to login on 401', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('Unauthorized', { status: 401 }),
    );

    const api = useApi();
    await expect(api.get('/api/me')).rejects.toThrow(ApiError);
    expect(window.location.href).toBe('/api/auth/login');
  });

  it('throws ApiError on non-OK responses', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('Not Found', { status: 404 }),
    );

    const api = useApi();
    await expect(api.get('/api/cards/999')).rejects.toThrow(ApiError);
    await expect(api.get('/api/cards/999')).rejects.toThrow(
      expect.objectContaining({ status: 404 }),
    );
  });
});
