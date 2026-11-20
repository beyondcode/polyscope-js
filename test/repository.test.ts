import { afterEach, describe, expect, it, vi } from "vitest";
import { HttpClient } from "../src/http.js";
import { Repository } from "../src/resources/repository.js";
import { Workspace } from "../src/resources/workspace.js";
import {
  mockFetch,
  repositoryData,
  sentRequest,
  workspaceData,
} from "./fixtures.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

function repository(overrides = {}) {
  return new Repository(
    repositoryData(overrides),
    new HttpClient("tok", "https://api.test"),
  );
}

describe("Repository", () => {
  it("maps the current repository fields", () => {
    const repo = repository({
      review_model: "claude-opus",
      review_prompt: "Review carefully",
      github_assign_self_enabled: true,
      non_git: true,
    });

    expect(repo.reviewModel).toBe("claude-opus");
    expect(repo.reviewPrompt).toBe("Review carefully");
    expect(repo.githubAssignSelfEnabled).toBe(true);
    expect(repo.nonGit).toBe(true);
    expect(repo.toJSON()).toMatchObject({
      review_model: "claude-opus",
      review_prompt: "Review carefully",
      github_assign_self_enabled: true,
      non_git: true,
    });
  });

  it("defaults the deprecated github_reaction fields the API no longer sends", () => {
    const repo = repository();

    expect(repo.githubReactionEnabled).toBe(false);
    expect(repo.githubReactionEmoji).toBeNull();
    expect(repo.toJSON()).not.toHaveProperty("github_reaction_enabled");
    expect(repo.toJSON()).not.toHaveProperty("github_reaction_emoji");
  });

  it("falls back to defaults when an older server leaves fields out", () => {
    const data = repositoryData();
    delete data.review_model;
    delete data.review_prompt;
    delete data.github_assign_self_enabled;
    delete data.non_git;

    const repo = new Repository(data, new HttpClient("tok", "https://api.test"));

    expect(repo.reviewModel).toBeNull();
    expect(repo.reviewPrompt).toBeNull();
    expect(repo.githubAssignSelfEnabled).toBe(false);
    expect(repo.nonGit).toBe(false);
  });

  it("creates a workspace with model, base branch and linear issue url", async () => {
    const fetch = mockFetch({ data: workspaceData({ id: "ws-9" }) }, 201);

    const ws = await repository().createWorkspace({
      model: "claude-sonnet",
      baseBranch: "develop",
      linearIssueUrl: "https://linear.app/acme/issue/ABC-1",
    });

    expect(ws).toBeInstanceOf(Workspace);
    expect(ws.id).toBe("ws-9");
    expect(sentRequest(fetch)).toEqual({
      url: "https://api.test/api/v1/workspaces",
      method: "POST",
      body: {
        repository_id: "repo-1",
        model: "claude-sonnet",
        base_branch: "develop",
        linear_issue_url: "https://linear.app/acme/issue/ABC-1",
      },
    });
  });

  it("creates a workspace from a prompt string", async () => {
    const fetch = mockFetch({ data: workspaceData() }, 201);

    await repository().createWorkspace("Add rate limiting");

    expect(sentRequest(fetch).body).toEqual({
      repository_id: "repo-1",
      prompt: "Add rate limiting",
    });
  });
});
