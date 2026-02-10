import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import type { Card } from '@/types';
import { useSettingsStore } from '@/stores/settings';

const { mockUpdate, mockAppend, mockDownload, MockQRCodeStyling, mockShowToast } = vi.hoisted(() => {
  const mockUpdate = vi.fn();
  const mockAppend = vi.fn();
  const mockDownload = vi.fn();
  const MockQRCodeStyling = vi.fn().mockImplementation(function (this: Record<string, unknown>) {
    this.update = mockUpdate;
    this.append = mockAppend;
    this.download = mockDownload;
  });
  const mockShowToast = vi.fn();
  return { mockUpdate, mockAppend, mockDownload, MockQRCodeStyling, mockShowToast };
});

vi.mock('qr-code-styling', () => ({
  default: MockQRCodeStyling,
}));

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    toasts: { value: [] },
    show: mockShowToast,
    dismiss: vi.fn(),
  }),
}));

vi.mock('lucide-vue-next', () => ({
  Download: { template: '<span />' },
  X: { template: '<span />' },
}));

import QrModal from './QrModal.vue';

const messages = {
  en: {
    common: { cancel: 'Cancel' },
    qrModal: {
      title: 'QR Code',
      contentLabel: 'QR Content',
      cardUrl: 'Card page link',
      vcardUrl: 'vCard download link',
      vcardInline: 'Basic contact card',
      vcardInlineHint: 'Includes name, phone, email, title, and company only.',
      showLogo: 'Show logo',
      download: 'Download PNG',
    },
  },
};

function createCard(overrides: Partial<Card> = {}): Card {
  return {
    id: 'card-1',
    slug: 'john-doe',
    userId: 'user-1',
    name: 'John Doe',
    jobTitle: null,
    company: null,
    phones: null,
    emails: null,
    address: null,
    websites: null,
    socialLinks: null,
    bio: null,
    pronouns: null,
    calendarUrl: null,
    avatarPath: null,
    bannerPath: null,
    bgImagePath: null,
    bgColor: null,
    primaryColor: null,
    textColor: null,
    fontFamily: null,
    avatarShape: null,
    theme: null,
    visibility: 'PUBLIC',
    noIndex: false,
    obfuscate: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function mountModal(props: { card?: Card; visible?: boolean } = {}, settingsOverride: Record<string, string | null> = {}) {
  const i18n = createI18n({
    legacy: false,
    locale: 'en',
    messages,
  });

  // Pre-configure settings store before mounting
  const settingsStore = useSettingsStore();
  settingsStore.settings = settingsOverride;

  const wrapper = mount(QrModal, {
    props: {
      card: props.card ?? createCard(),
      visible: props.visible ?? true,
    },
    global: {
      plugins: [i18n],
    },
  });

  return wrapper;
}

describe('QrModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setActivePinia(createPinia());
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['fake'], { type: 'image/png' })),
    });
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-favicon');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders QR with card page URL by default', async () => {
    mountModal({ visible: true });
    await flushPromises();

    expect(MockQRCodeStyling).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.stringContaining('/c/john-doe'),
      }),
    );
  });

  it('does not render when visible is false', () => {
    const wrapper = mountModal({ visible: false });
    expect(wrapper.find('.qr-modal__overlay').exists()).toBe(false);
  });

  it('toggling content mode to vcard-url updates QR data', async () => {
    const wrapper = mountModal({ visible: true });
    await flushPromises();

    const radios = wrapper.findAll('input[type="radio"]');
    const vcardUrlRadio = radios.find(r => r.attributes('value') === 'vcard-url');
    await vcardUrlRadio!.setValue(true);
    await flushPromises();

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.stringContaining('/api/cards/john-doe/vcf'),
      }),
    );
  });

  it('logo toggle is hidden when no org_favicon in settings', async () => {
    const wrapper = mountModal({ visible: true }, {});
    await flushPromises();

    expect(wrapper.find('.qr-modal__checkbox').exists()).toBe(false);
  });

  it('logo toggle is visible when org_favicon exists', async () => {
    const wrapper = mountModal({ visible: true }, { org_favicon: '/uploads/favicon.png' });
    await flushPromises();

    expect(wrapper.find('.qr-modal__checkbox').exists()).toBe(true);
  });

  it('fetches favicon and passes blob URL to QR image', async () => {
    mountModal({ visible: true }, { org_favicon: '/uploads/favicon.png' });
    await flushPromises();

    expect(global.fetch).toHaveBeenCalledWith('/uploads/favicon.png', { credentials: 'include' });
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        image: 'blob:mock-favicon',
      }),
    );
  });

  it('toggling logo off removes image from QR', async () => {
    const wrapper = mountModal({ visible: true }, { org_favicon: '/uploads/favicon.png' });
    await flushPromises();
    mockUpdate.mockClear();

    const checkbox = wrapper.find('.qr-modal__checkbox input[type="checkbox"]');
    await checkbox.setValue(false);
    await flushPromises();

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ image: undefined }),
    );
  });

  it('download PNG button calls qrCode.download with png', async () => {
    const wrapper = mountModal({ visible: true });
    await flushPromises();

    const buttons = wrapper.findAll('.qr-modal__download-btn');
    await buttons[0].trigger('click');
    expect(mockDownload).toHaveBeenCalledWith({
      name: 'john-doe-qr',
      extension: 'png',
    });
  });

  it('download SVG button calls qrCode.download with svg', async () => {
    const wrapper = mountModal({ visible: true });
    await flushPromises();

    const buttons = wrapper.findAll('.qr-modal__download-btn');
    await buttons[1].trigger('click');
    expect(mockDownload).toHaveBeenCalledWith({
      name: 'john-doe-qr',
      extension: 'svg',
    });
  });

  it('emits close on overlay click', async () => {
    const wrapper = mountModal({ visible: true });
    await flushPromises();

    await wrapper.find('.qr-modal__overlay').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('emits close on Escape key', async () => {
    const wrapper = mountModal({ visible: true });
    await flushPromises();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('emits close when close button is clicked', async () => {
    const wrapper = mountModal({ visible: true });
    await flushPromises();

    await wrapper.find('.qr-modal__close-btn').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('has correct aria attributes', async () => {
    const wrapper = mountModal({ visible: true });
    await flushPromises();

    const dialog = wrapper.find('[role="dialog"]');
    expect(dialog.exists()).toBe(true);
    expect(dialog.attributes('aria-modal')).toBe('true');
  });

  it('builds minimal vCard from card data when vcard-inline is selected', async () => {
    const card = createCard({
      name: 'Jane Smith',
      jobTitle: 'Engineer',
      company: 'Acme',
      phones: [{ number: '+1234567890' }],
      emails: [{ email: 'jane@example.com' }],
    });
    const wrapper = mountModal({ card, visible: true });
    await flushPromises();

    const radios = wrapper.findAll('input[type="radio"]');
    const vcardInlineRadio = radios.find(r => r.attributes('value') === 'vcard-inline');
    await vcardInlineRadio!.setValue(true);
    await flushPromises();

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.stringContaining('BEGIN:VCARD'),
      }),
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.stringContaining('FN:Jane Smith'),
      }),
    );
  });

  it('shows hint text when vcard-inline mode is selected', async () => {
    const wrapper = mountModal({ visible: true });
    await flushPromises();

    expect(wrapper.find('.qr-modal__hint').exists()).toBe(false);

    const radios = wrapper.findAll('input[type="radio"]');
    const vcardInlineRadio = radios.find(r => r.attributes('value') === 'vcard-inline');
    await vcardInlineRadio!.setValue(true);
    await flushPromises();

    expect(wrapper.find('.qr-modal__hint').exists()).toBe(true);
  });
});
