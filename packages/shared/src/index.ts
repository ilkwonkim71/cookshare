// @cookshare/shared
// Single source of truth for the HTTP API contract shared by the
// Express backend and the Next.js frontend. Import types with
// `import type { ... } from '@cookshare/shared'` and constants normally.

// ---------- Domain entities (API DTOs, camelCase) ----------

export interface UserDTO {
  id: number;
  email: string;
  name: string;
}

export interface AuthorDTO {
  id: number;
  name: string;
}

export interface RecipeDTO {
  id: number;
  title: string;
  description: string | null;
  ingredients: string[];
  steps: string[];
  imageUrl: string | null;
  cookTime: number | null;
  servings: number | null;
  author: AuthorDTO;
  createdAt: string;
  updatedAt: string;
}

// ---------- Auth ----------

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserDTO;
}

export interface MeResponse {
  user: UserDTO;
}

// ---------- Recipes ----------

export interface CreateRecipeRequest {
  title: string;
  description?: string;
  ingredients: string[];
  steps: string[];
  imageUrl?: string;
  cookTime?: number;
  servings?: number;
}

export type UpdateRecipeRequest = Partial<CreateRecipeRequest>;

export interface RecipeListResponse {
  recipes: RecipeDTO[];
  total: number;
}

export interface RecipeResponse {
  recipe: RecipeDTO;
}

// ---------- Uploads ----------

export interface UploadResponse {
  url: string;
}

// ---------- Uniform error envelope ----------

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'INVALID_TOKEN'
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_CONFLICT'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INVALID_ID'
  | 'NO_FILE'
  | 'INVALID_FILE_TYPE';

export interface ApiErrorBody {
  error: {
    message: string;
    code?: ErrorCode | string;
  };
}

// ---------- Shared constants ----------

/** Base path all API routes are mounted under. */
export const API_PREFIX = '/api';

/** Maximum accepted upload size in bytes (5 MB). */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Image MIME types accepted by the upload endpoint. */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export type AllowedImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

/** Default page size for the recipe list endpoint. */
export const DEFAULT_PAGE_SIZE = 20;
