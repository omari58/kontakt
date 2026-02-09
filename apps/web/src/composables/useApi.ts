export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
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
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    const text = await response.text().catch(() => 'Request failed');
    let message = text;
    try {
      const json = JSON.parse(text);
      if (json.message) message = Array.isArray(json.message) ? json.message.join(', ') : json.message;
    } catch { /* use raw text */ }
    throw new ApiError(response.status, message);
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

  return { get, post, put, del };
}
