import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCardsStore } from './cards';
import type { Card } from '@/types';

const mockCard: Card = {
  id: '1',
  slug: 'john-doe',
  userId: 'u1',
  name: 'John Doe',
  jobTitle: 'Engineer',
  company: 'Acme',
  phones: null,
  emails: null,
  address: null,
  websites: null,
  socialLinks: null,
  bio: null,
  avatarPath: null,
  bannerPath: null,
  bgImagePath: null,
  bgColor: null,
  primaryColor: null,
  textColor: null,
  avatarShape: null,
  theme: null,
  visibility: 'PUBLIC',
  noIndex: false,
  obfuscate: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('useCardsStore', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    setActivePinia(createPinia());
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('starts with empty cards and loading false', () => {
    const store = useCardsStore();
    expect(store.cards).toEqual([]);
    expect(store.loading).toBe(false);
  });

  it('fetchMyCards() loads cards from API', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([mockCard]), { status: 200 }),
    );

    const store = useCardsStore();
    await store.fetchMyCards();

    expect(store.cards).toEqual([mockCard]);
    expect(store.loading).toBe(false);
    expect(fetch).toHaveBeenCalledWith('/api/me/cards', expect.objectContaining({
      credentials: 'include',
    }));
  });

  it('fetchMyCards() sets loading during fetch', async () => {
    let resolvePromise: (value: Response) => void;
    vi.mocked(fetch).mockReturnValue(
      new Promise((resolve) => { resolvePromise = resolve; }),
    );

    const store = useCardsStore();
    const promise = store.fetchMyCards();
    expect(store.loading).toBe(true);

    resolvePromise!(new Response(JSON.stringify([]), { status: 200 }));
    await promise;
    expect(store.loading).toBe(false);
  });

  it('deleteCard() removes card from list', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    const store = useCardsStore();
    store.cards = [mockCard, { ...mockCard, id: '2', slug: 'jane' }];

    await store.deleteCard('1');

    expect(store.cards).toHaveLength(1);
    expect(store.cards[0]!.id).toBe('2');
  });

  it('fetchMyCards() handles empty array', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    const store = useCardsStore();
    await store.fetchMyCards();

    expect(store.cards).toEqual([]);
  });
});
