const API_BASE = '/api';
const REQUEST_TIMEOUT = 30_000; // 30 seconds

function getToken(): string | null {
  return localStorage.getItem('insurelead_token');
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    if (res.status === 401) {
      localStorage.removeItem('insurelead_token');
      localStorage.removeItem('insurelead_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed: ${res.status}`);
    }

    return res.json();
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------- Auth ----------
export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string;
    role: 'admin' | 'sdr';
  };
}

export const api = {
  auth: {
    signup: (name: string, email: string, password: string) =>
      request<LoginResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      }),
    login: (email: string, password: string) =>
      request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<LoginResponse['user']>('/auth/me'),
  },

  leads: {
    list: (params?: { status?: string; search?: string; agent?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);
      if (params?.agent) q.set('agent', params.agent);
      const qs = q.toString();
      return request<any[]>(`/leads${qs ? `?${qs}` : ''}`);
    },
    kpis: () => request<any>('/leads/kpis'),
    get: (id: string) => request<any>(`/leads/${id}`),
    create: (data: any) =>
      request<any>('/leads', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<any>(`/leads/${id}`, { method: 'DELETE' }),
    importCSV: async (file: File) => {
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/leads/import`, {
        method: 'POST',
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Import failed');
      }
      return res.json();
    },
    completeFollowUp: (id: string) =>
      request<any>(`/leads/${id}/complete-followup`, { method: 'POST' }),
    scheduleFollowUp: (id: string, date: string) =>
      request<any>(`/leads/${id}/schedule-followup`, { method: 'POST', body: JSON.stringify({ date }) }),
  },

  calls: {
    list: (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.search) q.set('search', params.search);
      const qs = q.toString();
      return request<any[]>(`/calls${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => request<any>(`/calls/${id}`),
    create: (data: any) =>
      request<any>('/calls', { method: 'POST', body: JSON.stringify(data) }),
  },

  agents: {
    list: () => request<any[]>('/agents'),
    get: (id: string) => request<any>(`/agents/${id}`),
    create: (data: { name: string; email: string; password: string; role: 'admin' | 'sdr' }) =>
      request<any>('/agents', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/agents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<any>(`/agents/${id}`, { method: 'DELETE' }),
  },

  notifications: {
    list: () => request<any[]>('/notifications'),
    markRead: (id: string) =>
      request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
    markAllRead: () =>
      request<any>('/notifications/read-all', { method: 'PUT' }),
  },

  health: () => request<{ status: string; db: string }>('/health'),

  tasks: {
    list: (params?: { assignedTo?: string; status?: string; from?: string; to?: string; priority?: string }) => {
      const q = new URLSearchParams();
      if (params?.assignedTo) q.set('assignedTo', params.assignedTo);
      if (params?.status) q.set('status', params.status);
      if (params?.from) q.set('from', params.from);
      if (params?.to) q.set('to', params.to);
      if (params?.priority) q.set('priority', params.priority);
      const qs = q.toString();
      return request<any[]>(`/tasks${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => request<any>(`/tasks/${id}`),
    create: (data: any) =>
      request<any>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      request<any>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<any>(`/tasks/${id}`, { method: 'DELETE' }),
  },

};
