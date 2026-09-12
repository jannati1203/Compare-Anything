/**
 * Application configuration for Compare Anything
 * Configurable backend base URL without any hardcoded production secrets.
 */

// Default local development port for ASP.NET Core 10 backend
const DEFAULT_API_BASE_URL = 'http://127.0.0.1:5123';

export const config = {
  apiBaseUrl: ((import.meta as any).env?.VITE_API_BASE_URL as string) || DEFAULT_API_BASE_URL,
  requestTimeoutMs: 60000
};
