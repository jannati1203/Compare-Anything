/**
 * Application configuration for Compare Anything
 * Configurable backend base URL without any hardcoded production secrets.
 */

// Default Render production URL for backend
const DEFAULT_API_BASE_URL = 'https://compare-anything.onrender.com';

export const config = {
  apiBaseUrl: ((import.meta as any).env?.VITE_API_BASE_URL as string) || DEFAULT_API_BASE_URL,
  requestTimeoutMs: 60000
};
