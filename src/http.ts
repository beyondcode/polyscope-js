import { ApiError } from "./errors.js";
import type { ApiErrorResponse } from "./types.js";

const DEFAULT_BASE_URL = "https://getpolyscope.com";
const DEFAULT_TIMEOUT = 30_000;
const USER_AGENT = "Polyscope JS SDK/0.2";

export class HttpClient {
  private apiToken: string;
  private baseUrl: string;
  private timeout: number;

  constructor(apiToken: string, baseUrl?: string, timeout?: number) {
    this.apiToken = apiToken;
    this.baseUrl = (baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.timeout = timeout ?? DEFAULT_TIMEOUT;
  }

  setApiToken(token: string): void {
    this.apiToken = token;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, "");
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setTimeout(ms: number): void {
    this.timeout = ms;
  }

  getTimeout(): number {
    return this.timeout;
  }

  async get<T>(path: string, query?: Record<string, string>): Promise<T> {
    return this.request<T>("GET", path, undefined, query);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>("DELETE", path);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string>,
  ): Promise<T> {
    const url = new URL(`/api/v1/${path.replace(/^\/+/, "")}`, this.baseUrl);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value != null && value !== "") {
          url.searchParams.set(key, value);
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
    };

    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(
      () => controller.abort(),
      this.timeout,
    );

    try {
      const response = await globalThis.fetch(url.toString(), {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        let errorBody: ApiErrorResponse | null = null;
        try {
          errorBody = (await response.json()) as ApiErrorResponse;
        } catch {
          // Response body isn't JSON
        }
        throw ApiError.fromResponse(response.status, errorBody);
      }

      return (await response.json()) as T;
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        throw new ApiError("Request timed out", 0);
      }
      throw error;
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  }
}
