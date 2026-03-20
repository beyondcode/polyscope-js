import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpClient } from "../src/http.js";
import { AuthenticationError } from "../src/errors.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("HttpClient", () => {
  it("strips trailing slashes from base URL and builds /api/v1 path", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const client = new HttpClient("token", "https://example.com///");
    await client.get("servers");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://example.com/api/v1/servers",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer token",
          Accept: "application/json",
        }),
      }),
    );
  });

  it("appends query string for GET", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    const client = new HttpClient("t", "https://x.test");
    await client.get("workspaces", { preview_url: "https://app/", status: "running" });

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain("preview_url=https%3A%2F%2Fapp%2F");
    expect(url).toContain("status=running");
  });

  it("omits empty query values", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({}), { status: 200 }),
    );

    const client = new HttpClient("t", "https://x.test");
    await client.get("x", { a: "", b: "1" });

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).not.toContain("a=");
    expect(url).toContain("b=1");
  });

  it("throws AuthenticationError on 401 JSON body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "nope" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const client = new HttpClient("bad", "https://x.test");
    await expect(client.get("me")).rejects.toBeInstanceOf(AuthenticationError);
  });

  it("wraps AbortError in ApiError with status 0", async () => {
    const abortErr = new Error("Aborted");
    abortErr.name = "AbortError";
    globalThis.fetch = vi.fn().mockRejectedValue(abortErr);

    const client = new HttpClient("t", "https://x.test", 100);
    await expect(client.get("slow")).rejects.toMatchObject({
      name: "ApiError",
      statusCode: 0,
      message: "Request timed out",
    });
  });

  it("setBaseUrl and setTimeout update client state", () => {
    const client = new HttpClient("t");
    client.setBaseUrl("https://custom.example/");
    client.setTimeout(5000);
    expect(client.getBaseUrl()).toBe("https://custom.example");
    expect(client.getTimeout()).toBe(5000);
  });
});
