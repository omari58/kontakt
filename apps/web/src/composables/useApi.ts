import i18n from '@/i18n';

export class ApiError extends Error {
  public fieldErrors: Record<string, string[]>;

  constructor(
    public status: number,
    message: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
    this.fieldErrors = fieldErrors ?? {};
  }

  get hasFieldErrors(): boolean {
    return Object.keys(this.fieldErrors).length > 0;
  }
}

function extractFieldPath(message: string): string {
  // Handle "property X should not exist" pattern
  const shouldNotExist = message.match(/^property\s+(\S+)\s+should not exist/);
  if (shouldNotExist?.[1]) return shouldNotExist[1];

  // NestJS validation: first word is the property path (e.g., "emails.0.email must be an email")
  const firstWord = message.split(' ')[0];
  if (firstWord && /^[a-zA-Z_][a-zA-Z0-9_.]*$/.test(firstWord)) {
    return firstWord;
  }
  return '_general';
}

function parseValidationErrors(messages: string[]): Record<string, string[]> {
  const errors: Record<string, string[]> = {};
  for (const msg of messages) {
    const field = extractFieldPath(msg);
    if (!errors[field]) errors[field] = [];
    errors[field].push(msg);
  }
  return errors;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { ...options?.headers as Record<string, string> };
  if (!options?.body || !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (response.status === 401) {
    window.location.href = '/api/auth/login';
    throw new ApiError(401, i18n.global.t('errors.unauthorized'));
  }

  if (!response.ok) {
    const text = await response.text().catch(() => i18n.global.t('errors.requestFailed'));
    let message = text;
    let fieldErrors: Record<string, string[]> | undefined;

    try {
      const json = JSON.parse(text);
      if (Array.isArray(json.message)) {
        fieldErrors = parseValidationErrors(json.message);
        message = i18n.global.t('errors.fixValidation');
      } else if (json.message) {
        message = json.message;
      }
    } catch { /* use raw text */ }

    throw new ApiError(response.status, message, fieldErrors);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function useApi() {
  function get<T>(url: string): Promise<T> {
    return request<T>(url);
  }

  function post<T>(url: string, body?: unknown): Promise<T> {
    return request<T>(url, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  function put<T>(url: string, body?: unknown): Promise<T> {
    return request<T>(url, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  function del<T>(url: string): Promise<T> {
    return request<T>(url, { method: 'DELETE' });
  }

  function upload<T>(url: string, formData: FormData): Promise<T> {
    return request<T>(url, { method: 'POST', body: formData });
  }

  return { get, post, put, del, upload };
}
