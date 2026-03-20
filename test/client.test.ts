import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/utils/settings.js", () => ({
  resolveApiToken: vi.fn(),
}));

import { Polyscope } from "../src/client.js";
import { MissingApiTokenError } from "../src/errors.js";
import { resolveApiToken } from "../src/utils/settings.js";
import type { ServerData, WorkspaceData } from "../src/types.js";

const originalFetch = globalThis.fetch;

function minimalWorkspace(overrides: Partial<WorkspaceData> = {}): WorkspaceData {
  return {
    id: "ws-1",
    repo_id: "repo-1",
    server_id: null,
    branch: "main",
    branch_renamed: false,
    path: "/p",
    preview_url: null,
    status: "idle",
    pr_number: null,
    pr_url: null,
    pr_title: null,
    pr_body: null,
    pr_is_draft: false,
    issue_number: null,
    issue_title: null,
    issue_url: null,
    base_branch: "main",
    base_commit: "abc",
    linked_worktree_ids: [],
    created_at: "2020-01-01T00:00:00Z",
    repository: null,
    agent: null,
    stats: null,
    ...overrides,
  };
}

describe("Polyscope", () => {
  beforeEach(() => {
    vi.mocked(resolveApiToken).mockResolvedValue(null);
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.clearAllMocks();
  });

  it("throws MissingApiTokenError when no token and settings empty", async () => {
    const client = new Polyscope({});
    await expect(client.servers()).rejects.toBeInstanceOf(MissingApiTokenError);
  });

  it("lists servers from API response", async () => {
    const servers: ServerData[] = [
      {
        id: "s1",
        name: "Local",
        version: "1",
        platform: "darwin",
        online: true,
        connected_at: null,
      },
    ];

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: servers }), { status: 200 }),
    );

    const client = new Polyscope({ apiToken: "tok" });
    const result = await client.servers();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("s1");
    expect(result[0].name).toBe("Local");
  });

  it("passes preview_url when listing workspaces", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), { status: 200 }),
    );

    const client = new Polyscope({
      apiToken: "tok",
      baseUrl: "https://api.test",
    });
    await client.workspaces({ previewUrl: "https://app.test/" });

    const url = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(url).toContain("preview_url=https%3A%2F%2Fapp.test%2F");
  });

  it("findWorkspacesByPreviewUrl filters client-side when server ignores preview_url", async () => {
    const lookup = "https://app.test/";
    const workspaces = [
      minimalWorkspace({
        id: "a",
        preview_url: "https://app.test/?workspace=one",
      }),
      minimalWorkspace({
        id: "b",
        preview_url: "https://other.test/",
      }),
    ];

    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: workspaces }), { status: 200 }),
    );

    const client = new Polyscope({ apiToken: "tok", baseUrl: "https://api.test" });
    const tabUrl = "https://app.test/dashboard?workspace=one";
    const found = await client.findWorkspacesByPreviewUrl(tabUrl);

    expect(found.map((w) => w.id)).toEqual(["a"]);
  });

  it("clears cached HttpClient when setApiToken is called", async () => {
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ data: [] }), { status: 200 }),
      ),
    );

    const client = new Polyscope({ apiToken: "first" });
    await client.servers();
    client.setApiToken("second");
    await client.servers();

    const auths = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.map(
      (call) => (call[1] as RequestInit).headers as Record<string, string>,
    );
    expect(auths[0].Authorization).toBe("Bearer first");
    expect(auths[1].Authorization).toBe("Bearer second");
  });
});
