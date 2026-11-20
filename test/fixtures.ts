import { vi } from "vitest";
import type { RepositoryData, WorkspaceData } from "../src/types.js";

export function workspaceData(overrides: Partial<WorkspaceData> = {}): WorkspaceData {
  return {
    id: "ws-1",
    repo_id: "repo-1",
    server_id: null,
    branch: "main",
    branch_renamed: false,
    path: "/p",
    preview_url: null,
    status: "active",
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

export function repositoryData(overrides: Partial<RepositoryData> = {}): RepositoryData {
  return {
    id: "repo-1",
    name: "app",
    path: "/code/app",
    base_branch: "main",
    default_model: null,
    review_model: null,
    review_prompt: null,
    github_assign_self_enabled: false,
    merge_prompt: null,
    merge_and_push_prompt: null,
    pr_prompt: null,
    draft_pr_prompt: null,
    worktree_base_from_origin: null,
    has_remote: true,
    non_git: false,
    linked_repo_ids: [],
    created_at: "2026-02-26 10:00:00",
    server_id: "srv-1",
    ...overrides,
  };
}

export function mockFetch(body: unknown, status = 200) {
  const fetch = vi.fn().mockImplementation(() =>
    Promise.resolve(new Response(JSON.stringify(body), { status })),
  );
  globalThis.fetch = fetch;
  return fetch;
}

export function sentRequest(fetch: ReturnType<typeof vi.fn>, call = 0) {
  const [url, init] = fetch.mock.calls[call] as [string, RequestInit];
  return {
    url,
    method: init.method,
    body: init.body === undefined ? undefined : JSON.parse(init.body as string),
  };
}
