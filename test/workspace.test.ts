import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpClient } from "../src/http.js";
import { Workspace } from "../src/resources/workspace.js";
import { mockFetch, sentRequest, workspaceData } from "./fixtures.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

function workspace(overrides = {}) {
  return new Workspace(
    workspaceData(overrides),
    new HttpClient("tok", "https://api.test"),
  );
}

describe("Workspace", () => {
  it("maps url and the newer workspace fields", () => {
    const ws = workspace({
      server_id: "srv-1",
      url: "https://getpolyscope.com/servers/srv-1/session?workspace=ws-1",
      interface_mode: "claude_terminal",
      model: "claude-opus",
      label_id: "label-1",
      is_repo_workspace: true,
      has_activity: true,
      linked_from_worktree_id: "ws-0",
    });

    expect(ws.url).toBe(
      "https://getpolyscope.com/servers/srv-1/session?workspace=ws-1",
    );
    expect(ws.interfaceMode).toBe("claude_terminal");
    expect(ws.model).toBe("claude-opus");
    expect(ws.labelId).toBe("label-1");
    expect(ws.isRepoWorkspace).toBe(true);
    expect(ws.hasActivity).toBe(true);
    expect(ws.linkedFromWorktreeId).toBe("ws-0");
    expect(ws.toJSON()).toMatchObject({
      url: "https://getpolyscope.com/servers/srv-1/session?workspace=ws-1",
      interface_mode: "claude_terminal",
      model: "claude-opus",
      label_id: "label-1",
      is_repo_workspace: true,
      has_activity: true,
      linked_from_worktree_id: "ws-0",
    });
  });

  it("falls back to defaults when a response leaves fields out", () => {
    const data = workspaceData();
    delete data.preview_url;
    delete data.repository;
    delete data.agent;
    delete data.stats;

    const ws = new Workspace(data, new HttpClient("tok", "https://api.test"));

    expect(ws.url).toBeNull();
    expect(ws.previewUrl).toBeNull();
    expect(ws.repository).toBeNull();
    expect(ws.agent).toBeNull();
    expect(ws.stats).toBeNull();
    expect(ws.interfaceMode).toBe("chat");
    expect(ws.model).toBeNull();
    expect(ws.labelId).toBeNull();
    expect(ws.isRepoWorkspace).toBe(false);
    expect(ws.hasActivity).toBe(false);
    expect(ws.linkedFromWorktreeId).toBeNull();
    expect(JSON.parse(JSON.stringify(ws))).not.toHaveProperty("url");
  });

  it("keeps null base_branch and base_commit", () => {
    const ws = workspace({ base_branch: null, base_commit: null });

    expect(ws.baseBranch).toBeNull();
    expect(ws.baseCommit).toBeNull();
  });

  it("reads commitsAhead and camelCase stats from the diff", async () => {
    const snapshot = {
      diff: "diff --git a/a.ts b/a.ts",
      files: [{ path: "a.ts", additions: 3, deletions: 1 }],
      stats: { filesChanged: 1, additions: 3, deletions: 1 },
    };
    const fetch = mockFetch({
      data: { ...snapshot, local: snapshot, base: snapshot, commitsAhead: 2 },
    });

    const diff = await workspace().diff();

    expect(sentRequest(fetch).url).toBe(
      "https://api.test/api/v1/workspaces/ws-1/diff",
    );
    expect(diff.commitsAhead).toBe(2);
    expect(diff.stats.filesChanged).toBe(1);
    expect(diff.local.stats.filesChanged).toBe(1);
    expect(diff.base.files[0].additions).toBe(3);
  });

  it("maps tool and thinking message roles", async () => {
    const message = (id: number, role: string) => ({
      id,
      session_id: "sess-1",
      role,
      content: "x",
      metadata: null,
      created_at: "2026-11-19 10:00:00",
    });
    mockFetch({
      data: [
        message(1, "user"),
        message(2, "thinking"),
        message(3, "tool_use"),
        message(4, "tool_result"),
        message(5, "assistant"),
      ],
      meta: { cursor: 5, has_more: false },
    });

    const result = await workspace().messages();

    expect(result.messages.map((m) => m.role)).toEqual([
      "user",
      "thinking",
      "tool_use",
      "tool_result",
      "assistant",
    ]);
    expect(result.cursor).toBe(5);
  });

  it("sends model with commit", async () => {
    const fetch = mockFetch({
      data: { workspace_id: "ws-1", agent: { status: "working" } },
    });

    const result = await workspace().commit({ model: "claude-sonnet" });

    expect(sentRequest(fetch)).toEqual({
      url: "https://api.test/api/v1/workspaces/ws-1/commit",
      method: "POST",
      body: { model: "claude-sonnet" },
    });
    expect(result.agent).toEqual({ status: "working" });
  });

  it("sends no model with commit when none is given", async () => {
    const fetch = mockFetch({
      data: { workspace_id: "ws-1", agent: { status: "working" } },
    });

    await workspace().commit();

    expect(sentRequest(fetch).body).toEqual({});
  });

  it("sends model with pullRequest", async () => {
    const fetch = mockFetch({
      data: { workspace_id: "ws-1", agent: { status: "working" } },
    });

    await workspace().pullRequest({
      title: "Fix login",
      draft: true,
      model: "gpt-5.3-codex",
    });

    expect(sentRequest(fetch)).toEqual({
      url: "https://api.test/api/v1/workspaces/ws-1/pull-request",
      method: "POST",
      body: { title: "Fix login", draft: true, model: "gpt-5.3-codex" },
    });
  });
});
