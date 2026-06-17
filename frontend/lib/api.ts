import type { ApiErrorBody } from '@cookshare/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove Content-Type for FormData so browser sets multipart boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `API error: ${res.status}`;
    try {
      // Backend always returns the uniform envelope { error: { message, code } }.
      const data = (await res.json()) as Partial<ApiErrorBody> & { message?: string };
      message = data?.error?.message ?? data?.message ?? message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  // 204 No Content (예: DELETE) 는 파싱할 본문이 없음
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

// --- Auth ---
export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export function register(data: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function login(data: { email: string; password: string }): Promise<AuthResponse> {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getMe(): Promise<{ user: User }> {
  return apiFetch<{ user: User }>('/auth/me');
}

// --- Recipes ---
export interface Author {
  id: string;
  name: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  imageUrl?: string;
  cookTime?: number;
  servings?: number;
  author: Author;
  createdAt: string;
}

export interface RecipesResponse {
  recipes: Recipe[];
  total: number;
}

export function getRecipes(params?: { q?: string; page?: number }): Promise<RecipesResponse> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.page) qs.set('page', String(params.page));
  const query = qs.toString() ? `?${qs.toString()}` : '';
  return apiFetch<RecipesResponse>(`/recipes${query}`);
}

export function getRecipe(id: string): Promise<{ recipe: Recipe }> {
  return apiFetch<{ recipe: Recipe }>(`/recipes/${id}`);
}

export interface CreateRecipeData {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  imageUrl?: string;
  cookTime?: number;
  servings?: number;
}

export function createRecipe(data: CreateRecipeData): Promise<{ recipe: Recipe }> {
  return apiFetch<{ recipe: Recipe }>('/recipes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateRecipe(
  id: string,
  data: Partial<CreateRecipeData>,
): Promise<{ recipe: Recipe }> {
  return apiFetch<{ recipe: Recipe }>(`/recipes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteRecipe(id: string): Promise<void> {
  return apiFetch<void>(`/recipes/${id}`, { method: 'DELETE' });
}

// --- Uploads ---
export function uploadImage(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('image', file);
  return apiFetch<{ url: string }>('/uploads', {
    method: 'POST',
    body: form,
  });
}
