const API_BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: options.body === undefined ? { Accept: 'application/json' } : {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get('content-type') ?? '';
  const payload: unknown = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '');

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'error' in payload
      ? String((payload as { error: unknown }).error)
      : `Request failed (${response.status}).`;
    throw new ApiError(message, response.status, payload);
  }
  return payload as T;
}

export type ApiUser = {
  id: string;
  organizationId: string | null;
  departmentId: string | null;
  vendorId: string | null;
  fullName: string;
  email: string;
  role: 'Platform Admin' | 'Organization Admin' | 'Request Officer' | 'Department Head' | 'Procurement Officer' | 'Finance Officer' | 'Approving Authority' | 'Vendor';
  status: string;
  mustChangePassword: boolean;
};

export type ApiRecord<TData = Record<string, unknown>> = {
  id: string;
  organization_id: string;
  record_type: string;
  reference_number: string | null;
  status: string;
  data: TData;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export const procuraApi = {
  health: () => request<{ status: string; database: string; service?: string }>('/api/health'),
  login: (email: string, password: string) =>
    request<{ user: ApiUser }>('/api/auth/login', { method: 'POST', body: { email, password } }),
  currentUser: () => request<{ user: ApiUser }>('/api/auth/me'),
  currentOrganization: () => request<{ organization: Record<string, unknown> }>('/api/organizations/current'),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean }>('/api/auth/change-password', {
      method: 'POST', body: { currentPassword, newPassword },
    }),
  registerOrganization: (organization: Record<string, unknown>, admin: Record<string, unknown>) =>
    request<{ organization: Record<string, unknown>; user: ApiUser; message: string }>(
      '/api/auth/register-organization', { method: 'POST', body: { organization, admin } },
    ),
  registerVendor: (vendor: {
    businessName: string;
    businessType?: string;
    email: string;
    phone: string;
    description?: string;
    categories?: string[];
    subcategories?: string[];
    password: string;
  }) => request<{ vendor: Record<string, unknown>; user: ApiUser; message: string }>(
    '/api/auth/register-vendor', { method: 'POST', body: vendor },
  ),
  listRecords: <TData = Record<string, unknown>>(recordType: string) =>
    request<{ records: ApiRecord<TData>[] }>(`/api/records/${encodeURIComponent(recordType)}`),
  createRecord: <TData = Record<string, unknown>>(record: {
    recordType: string;
    referenceNumber?: string | null;
    status?: string;
    data?: TData;
  }) => request<{ record: ApiRecord<TData> }>('/api/records', { method: 'POST', body: record }),
  vendorOpportunities: () =>
    request<{ opportunities: ApiRecord[] & { organization_name?: string }[] }>('/api/vendor/opportunities'),
  submitVendorBid: (bid: {
    tenderId: string;
    amount: number;
    proposal: string;
    deliveryTimelineDays: number;
  }) => request<{ bid: ApiRecord; message: string }>('/api/vendor/bids', { method: 'POST', body: bid }),
};
