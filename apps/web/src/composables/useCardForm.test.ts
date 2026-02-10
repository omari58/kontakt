import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApp, nextTick } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import { useCardForm } from './useCardForm';

function setupRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div />' } },
      { path: '/cards/new', name: 'card-new', component: { template: '<div />' } },
      { path: '/cards/:id/edit', name: 'card-edit', component: { template: '<div />' } },
    ],
  });
}

function withSetup<T>(composable: () => T): { result: T; app: ReturnType<typeof createApp>; el: HTMLDivElement } {
  const router = setupRouter();
  const pinia = createPinia();
  setActivePinia(pinia);

  let result!: T;
  const app = createApp({
    setup() {
      result = composable();
      return {};
    },
    template: '<div />',
  });
  app.use(pinia);
  app.use(router);

  const el = document.createElement('div');
  document.body.appendChild(el);
  app.mount(el);

  return { result, app, el };
}

describe('useCardForm', () => {
  const originalFetch = globalThis.fetch;
  const mountedElements: HTMLDivElement[] = [];
  const mountedApps: ReturnType<typeof createApp>[] = [];

  function track<T>({ result, app, el }: { result: T; app: ReturnType<typeof createApp>; el: HTMLDivElement }) {
    mountedApps.push(app);
    mountedElements.push(el);
    return result;
  }

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    for (const app of mountedApps) app.unmount();
    for (const el of mountedElements) el.remove();
    mountedApps.length = 0;
    mountedElements.length = 0;
  });

  it('starts with empty form in create mode', () => {
    const result = track(withSetup(() => useCardForm()));
    expect(result.isEditMode.value).toBe(false);
    expect(result.form.name).toBe('');
    expect(result.form.phones).toEqual([]);
    expect(result.form.emails).toEqual([]);
    expect(result.loading.value).toBe(false);
    expect(result.saving.value).toBe(false);
  });

  it('is in edit mode when cardId is provided', () => {
    const result = track(withSetup(() => useCardForm('card-1')));
    expect(result.isEditMode.value).toBe(true);
  });

  it('addPhone/removePhone manages phone list', () => {
    const result = track(withSetup(() => useCardForm()));
    expect(result.form.phones).toHaveLength(0);

    result.addPhone();
    expect(result.form.phones).toHaveLength(1);
    expect(result.form.phones[0]).toEqual({ number: '', label: '' });

    result.addPhone();
    expect(result.form.phones).toHaveLength(2);

    result.removePhone(0);
    expect(result.form.phones).toHaveLength(1);
  });

  it('addEmail/removeEmail manages email list', () => {
    const result = track(withSetup(() => useCardForm()));
    result.addEmail();
    expect(result.form.emails).toHaveLength(1);
    expect(result.form.emails[0]).toEqual({ email: '', label: '' });

    result.removeEmail(0);
    expect(result.form.emails).toHaveLength(0);
  });

  it('addWebsite/removeWebsite manages websites list', () => {
    const result = track(withSetup(() => useCardForm()));
    result.addWebsite();
    expect(result.form.websites).toHaveLength(1);
    expect(result.form.websites[0]).toEqual({ url: '', label: '' });

    result.removeWebsite(0);
    expect(result.form.websites).toHaveLength(0);
  });

  it('addSocialLink/removeSocialLink manages social links', () => {
    const result = track(withSetup(() => useCardForm()));
    result.addSocialLink();
    expect(result.form.socialLinks).toHaveLength(1);
    expect(result.form.socialLinks[0]).toEqual({ platform: 'linkedin', url: '' });

    result.removeSocialLink(0);
    expect(result.form.socialLinks).toHaveLength(0);
  });

  it('loadCard fetches and populates form data', async () => {
    const mockCard = {
      id: 'card-1',
      slug: 'john-doe',
      userId: 'u1',
      name: 'John Doe',
      jobTitle: 'Engineer',
      company: 'Acme',
      bio: 'Hello',
      phones: [{ number: '123', label: 'Work' }],
      emails: [{ email: 'john@example.com', label: 'Work' }],
      address: { street: '123 Main', city: 'NY', country: 'US', zip: '10001' },
      websites: ['https://example.com'],
      socialLinks: [{ platform: 'github', url: 'https://github.com/john' }],
      avatarPath: '/uploads/avatar.jpg',
      bannerPath: '/uploads/banner.jpg',
      bgImagePath: null,
      bgColor: '#f0f0f0',
      primaryColor: '#ff0000',
      textColor: '#222222',
      avatarShape: 'ROUNDED_SQUARE',
      theme: 'DARK',
      visibility: 'UNLISTED',
      noIndex: true,
      obfuscate: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02',
    };

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(mockCard), { status: 200 }),
    );

    const result = track(withSetup(() => useCardForm('card-1')));
    await result.loadCard();

    expect(result.form.name).toBe('John Doe');
    expect(result.form.jobTitle).toBe('Engineer');
    expect(result.form.company).toBe('Acme');
    expect(result.form.bio).toBe('Hello');
    expect(result.form.phones).toEqual([{ number: '123', label: 'Work' }]);
    expect(result.form.emails).toEqual([{ email: 'john@example.com', label: 'Work' }]);
    expect(result.form.bgColor).toBe('#f0f0f0');
    expect(result.form.primaryColor).toBe('#ff0000');
    expect(result.form.avatarShape).toBe('ROUNDED_SQUARE');
    expect(result.form.theme).toBe('DARK');
    expect(result.form.visibility).toBe('UNLISTED');
    expect(result.form.noIndex).toBe(true);
    expect(result.form.slug).toBe('john-doe');
    expect(result.avatarUrl.value).toBe('/uploads/avatar.jpg');
    expect(result.bannerUrl.value).toBe('/uploads/banner.jpg');
    expect(result.backgroundUrl.value).toBeNull();
  });

  it('saveCard creates a new card with POST', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 'new-card-id', slug: 'test' }), { status: 201 }),
    );

    const result = track(withSetup(() => useCardForm()));
    result.form.name = 'Test Card';
    const id = await result.saveCard();

    expect(id).toBe('new-card-id');
    expect(fetch).toHaveBeenCalledWith('/api/cards', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
    }));
  });

  it('saveCard updates existing card with PUT', async () => {
    const mockCard = {
      id: 'card-1', slug: 'test', userId: 'u1', name: 'Existing',
      jobTitle: null, company: null, bio: null, phones: null, emails: null,
      address: null, websites: null, socialLinks: null, avatarPath: null,
      bannerPath: null, bgImagePath: null, bgColor: null, primaryColor: null,
      textColor: null, avatarShape: null, theme: null, visibility: 'PUBLIC',
      noIndex: false, obfuscate: false, createdAt: '2024-01-01', updatedAt: '2024-01-01',
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify(mockCard), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...mockCard, name: 'Updated' }), { status: 200 }));

    const result = track(withSetup(() => useCardForm('card-1')));
    await result.loadCard();

    result.form.name = 'Updated';
    const id = await result.saveCard();

    expect(id).toBe('card-1');
    expect(fetch).toHaveBeenLastCalledWith('/api/cards/card-1', expect.objectContaining({
      method: 'PUT',
    }));
  });

  it('isDirty tracks changes after load', async () => {
    const mockCard = {
      id: 'card-1', slug: 'test', userId: 'u1', name: 'Existing',
      jobTitle: null, company: null, bio: null, phones: null, emails: null,
      address: null, websites: null, socialLinks: null, avatarPath: null,
      bannerPath: null, bgImagePath: null, bgColor: null, primaryColor: null,
      textColor: null, avatarShape: null, theme: null, visibility: 'PUBLIC',
      noIndex: false, obfuscate: false, createdAt: '2024-01-01', updatedAt: '2024-01-01',
    };

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(mockCard), { status: 200 }),
    );

    const result = track(withSetup(() => useCardForm('card-1')));
    await result.loadCard();

    expect(result.isDirty.value).toBe(false);

    result.form.name = 'Changed Name';
    await nextTick();

    expect(result.isDirty.value).toBe(true);
  });

  it('handles load error gracefully', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('Not Found', { status: 404 }),
    );

    const result = track(withSetup(() => useCardForm('bad-id')));
    await result.loadCard();

    expect(result.error.value).toBeTruthy();
    expect(result.loading.value).toBe(false);
  });

  it('handles save error gracefully', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('Validation Error', { status: 400 }),
    );

    const result = track(withSetup(() => useCardForm()));
    result.form.name = 'Test';
    const id = await result.saveCard();

    expect(id).toBeNull();
    expect(result.error.value).toBeTruthy();
    expect(result.saving.value).toBe(false);
  });
});
