import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useToast } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Clear any existing toasts
    const { toasts } = useToast();
    toasts.value = [];
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('show() adds a toast', () => {
    const { toasts, show } = useToast();
    show('Test message', 'success');

    expect(toasts.value).toHaveLength(1);
    expect(toasts.value[0]!.message).toBe('Test message');
    expect(toasts.value[0]!.type).toBe('success');
  });

  it('show() defaults to info type', () => {
    const { toasts, show } = useToast();
    show('Info message');

    expect(toasts.value[0]!.type).toBe('info');
  });

  it('toast auto-dismisses after 3 seconds', () => {
    const { toasts, show } = useToast();
    show('Temporary', 'success');

    expect(toasts.value).toHaveLength(1);
    vi.advanceTimersByTime(3000);
    expect(toasts.value).toHaveLength(0);
  });

  it('dismiss() removes a specific toast', () => {
    const { toasts, show, dismiss } = useToast();
    show('First', 'success');
    show('Second', 'error');

    expect(toasts.value).toHaveLength(2);
    dismiss(toasts.value[0]!.id);
    expect(toasts.value).toHaveLength(1);
    expect(toasts.value[0]!.message).toBe('Second');
  });

  it('multiple toasts stack up', () => {
    const { toasts, show } = useToast();
    show('One', 'success');
    show('Two', 'error');
    show('Three', 'info');

    expect(toasts.value).toHaveLength(3);
  });
});
