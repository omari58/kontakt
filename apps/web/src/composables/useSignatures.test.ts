import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSignatures } from './useSignatures';
import type { Signature } from '@/types';

const mockSignature: Signature = {
  id: 'sig-1',
  name: 'Work Formal',
  cardId: 'card-1',
  card: { id: 'card-1', name: 'John Doe', slug: 'john-doe', avatarPath: null },
  userId: 'user-1',
  layout: 'CLASSIC',
  config: {
    fields: {
      avatar: true,
      phone: true,
      email: true,
      website: true,
      socials: true,
      pronouns: true,
      calendar: true,
      disclaimer: true,
      cardLink: true,
    },
    disclaimer: 'Confidential',
    accentColor: '#2563eb',
    contactColumns: 1,
    cardLinkText: '',
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('useSignatures', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    setActivePinia(createPinia());
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('starts with empty signatures and loading false', () => {
    const { signatures, loading, error } = useSignatures();
    expect(signatures.value).toEqual([]);
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it('fetchMySignatures populates signatures ref', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([mockSignature]), { status: 200 }),
    );

    const { signatures, fetchMySignatures } = useSignatures();
    await fetchMySignatures();

    expect(signatures.value).toEqual([mockSignature]);
    expect(fetch).toHaveBeenCalledWith('/api/me/signatures', expect.objectContaining({
      credentials: 'include',
    }));
  });

  it('fetchMySignatures sets error on failure', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: 'Server error' }), { status: 500 }),
    );

    const { error, fetchMySignatures } = useSignatures();
    await fetchMySignatures();

    expect(error.value).toBeTruthy();
  });

  it('fetchMySignatures sets loading during fetch', async () => {
    let resolvePromise: (value: Response) => void;
    vi.mocked(fetch).mockReturnValue(
      new Promise((resolve) => { resolvePromise = resolve; }),
    );

    const { loading, fetchMySignatures } = useSignatures();
    const promise = fetchMySignatures();
    expect(loading.value).toBe(true);

    resolvePromise!(new Response(JSON.stringify([]), { status: 200 }));
    await promise;
    expect(loading.value).toBe(false);
  });

  it('deleteSignature removes item from local array', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    const { signatures, deleteSignature } = useSignatures();
    // Populate signatures directly via the store
    signatures.value = [mockSignature, { ...mockSignature, id: 'sig-2', name: 'Casual' }];

    await deleteSignature('sig-1');

    expect(signatures.value).toHaveLength(1);
    expect(signatures.value[0]!.id).toBe('sig-2');
  });

  it('fetchMySignatures handles empty array', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    const { signatures, fetchMySignatures } = useSignatures();
    await fetchMySignatures();

    expect(signatures.value).toEqual([]);
  });
});
