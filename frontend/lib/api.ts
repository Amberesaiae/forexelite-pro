import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiError {
  detail: string;
  missing?: string[];
}

class ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

async function refreshSession() {
  const { error } = await supabase.auth.refreshSession();
  if (error) {
    throw error;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const { data: session } = await supabase.auth.getSession();
  const token = session?.session?.access_token;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    // Handle 401 - try to refresh token and retry once
    if (response.status === 401) {
      try {
        await refreshSession();
        
        // Retry with new token
        const { data: newSession } = await supabase.auth.getSession();
        const newToken = newSession?.session?.access_token;
        
        if (newToken) {
          (headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
          
          const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
            ...options,
            headers,
          });
          
          if (retryResponse.status === 401) {
            // Redirect to login if refresh didn't work
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return { error: { detail: 'Session expired' } };
          }
          
          const retryData = await retryResponse.json();
          
          if (!retryResponse.ok) {
            return { error: retryData };
          }
          
          return { data: retryData as T };
        }
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return { error: { detail: 'Session expired' } };
      }
    }

    // Handle 428 - onboarding required
    if (response.status === 428) {
      const errorData = await response.json();
      
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/onboarding')) {
        window.location.href = '/onboarding';
      }
      
      return { error: errorData };
    }

    const data = await response.json();

    if (!response.ok) {
      return { error: data };
    }

    return { data: data as T };
  } catch (err) {
    return { error: { detail: 'Network error' } };
  }
}

export async function apiGet<T>(path: string, options?: RequestInit) {
  return apiFetch<T>(path, { ...options, method: 'GET' });
}

export async function apiPost<T>(path: string, body?: unknown, options?: RequestInit) {
  return apiFetch<T>(path, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPatch<T>(path: string, body?: unknown, options?: RequestInit) {
  return apiFetch<T>(path, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut<T>(path: string, body?: unknown, options?: RequestInit) {
  return apiFetch<T>(path, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T>(path: string, options?: RequestInit) {
  return apiFetch<T>(path, { ...options, method: 'DELETE' });
}
