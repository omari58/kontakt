import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSettingsStore } from './settings';

describe('useSettingsStore', () => {
  const originalFetch = globalThis.fetch;

  const mockSettings: Record<string, string> = {
    org_name: 'Test Org',
    org_logo: '/uploads/settings/logo.webp',
    org_favicon: '/uploads/settings/favicon-32.png',
    default_primary_color: '#111111',
    default_secondary_color: '#222222',
    default_bg_color: '#FFFFFF',
    default_theme: 'dark',
    default_avatar_shape: 'rounded_square',
    allow_user_color_override: 'true',
    allow_user_background_image: 'false',
    default_visibility: 'unlisted',
    footer_text: 'Powered by Kontakt',
    footer_link: 'https://example.com',
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('starts with empty settings and loading false', () => {
    const store = useSettingsStore();
    expect(store.settings).toEqual({});
    expect(store.loading).toBe(false);
    expect(store.saving).toBe(false);
    expect(store.error).toBeNull();
  });

  it('fetchSettings() loads settings from /api/settings', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(mockSettings), { status: 200 }),
    );

    const store = useSettingsStore();
    await store.fetchSettings();

    expect(fetch).toHaveBeenCalledWith('/api/settings', expect.objectContaining({
      credentials: 'include',
    }));
    expect(store.settings).toEqual(mockSettings);
    expect(store.loading).toBe(false);
  });

  it('fetchSettings() sets error on failure', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('Forbidden', { status: 403 }),
    );

    const store = useSettingsStore();
    await store.fetchSettings();

    expect(store.error).toBeTruthy();
    expect(store.loading).toBe(false);
  });

  it('saveSettings() sends PUT /api/settings with changed values', async () => {
    // First call: fetch settings (the useApi get call)
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSettings), { status: 200 }))
      // Second call: put settings
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const store = useSettingsStore();
    await store.fetchSettings();

    const changes = [{ key: 'org_name', value: 'New Org' }];
    await store.saveSettings(changes);

    expect(fetch).toHaveBeenLastCalledWith('/api/settings', expect.objectContaining({
      method: 'PUT',
      credentials: 'include',
      body: JSON.stringify({ settings: changes }),
    }));
    expect(store.settings.org_name).toBe('New Org');
    expect(store.successMessage).toBe('Settings saved successfully');
    expect(store.saving).toBe(false);
  });

  it('saveSettings() sets error on failure', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify(mockSettings), { status: 200 }))
      .mockResolvedValueOnce(new Response('Bad Request', { status: 400 }));

    const store = useSettingsStore();
    await store.fetchSettings();

    await store.saveSettings([{ key: 'org_name', value: '' }]);

    expect(store.error).toBeTruthy();
    expect(store.saving).toBe(false);
  });

  it('saveSettings() does nothing with empty array', async () => {
    const store = useSettingsStore();
    await store.saveSettings([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uploadFile() posts FormData and updates setting', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ path: '/uploads/settings/logo.webp' }), { status: 200 }),
    );

    const store = useSettingsStore();
    const file = new File(['test'], 'logo.png', { type: 'image/png' });
    const path = await store.uploadFile('logo', file);

    expect(path).toBe('/uploads/settings/logo.webp');
    expect(store.settings.org_logo).toBe('/uploads/settings/logo.webp');

    const callArgs = vi.mocked(fetch).mock.calls[0];
    expect(callArgs[0]).toBe('/api/settings/logo');
    expect(callArgs[1]?.method).toBe('POST');
    expect(callArgs[1]?.body).toBeInstanceOf(FormData);
  });

  it('uploadFile() returns null and sets error on failure', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('Upload failed', { status: 400 }),
    );

    const store = useSettingsStore();
    const file = new File(['test'], 'logo.png', { type: 'image/png' });
    const path = await store.uploadFile('logo', file);

    expect(path).toBeNull();
    expect(store.error).toBeTruthy();
  });

  it('clearMessages() clears error and success', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(mockSettings), { status: 200 }),
    );

    const store = useSettingsStore();
    // Trigger success message
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
    await store.saveSettings([{ key: 'org_name', value: 'x' }]);
    expect(store.successMessage).toBeTruthy();

    store.clearMessages();
    expect(store.error).toBeNull();
    expect(store.successMessage).toBeNull();
  });
});
