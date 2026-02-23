const API_BASE = '/api';
const REQUEST_TIMEOUT = 30_000; // 30 seconds

export function getToken(): string | null {
    return localStorage.getItem('insurelead_token');
}

export async function request<T>(
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
