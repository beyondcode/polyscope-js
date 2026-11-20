import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/utils/settings.js", () => ({
  resolveApiToken: vi.fn(),
}));

import { Polyscope } from "../src/client.js";
import { MissingApiTokenError, ValidationError } from "../src/errors.js";
import { AvailableAgent, ServerModels } from "../src/resources/models.js";
import { TeamInvite } from "../src/resources/team-invite.js";
import { resolveApiToken } from "../src/utils/settings.js";
import type { ServerData } from "../src/types.js";
import { mockFetch, sentRequest, workspaceData } from "./fixtures.js";

const originalFetch = globalThis.fetch;

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
      workspaceData({
        id: "a",
        preview_url: "https://app.test/?workspace=one",
      }),
      workspaceData({
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

  it("sends model, base_branch and linear_issue_url when creating a workspace", async () => {
    const fetch = mockFetch({ data: workspaceData({ id: "ws-9" }) }, 201);

    const client = new Polyscope({ apiToken: "tok", baseUrl: "https://api.test" });
    const ws = await client.createWorkspace({
      repositoryId: "repo-1",
      serverId: "srv-1",
      prompt: "Fix the login flow",
      baseBranch: "develop",
      model: "claude-opus",
    });

    expect(ws.id).toBe("ws-9");
    expect(sentRequest(fetch)).toEqual({
      url: "https://api.test/api/v1/workspaces",
      method: "POST",
      body: {
        repository_id: "repo-1",
        server_id: "srv-1",
        prompt: "Fix the login flow",
        base_branch: "develop",
        model: "claude-opus",
      },
    });
  });

  it("sends linear_issue_url when creating a workspace from a Linear issue", async () => {
    const fetch = mockFetch({ data: workspaceData() }, 201);

    const client = new Polyscope({ apiToken: "tok", baseUrl: "https://api.test" });
    await client.createWorkspace({
      repositoryId: "repo-1",
      linearIssueUrl: "https://linear.app/acme/issue/ABC-1",
    });

    expect(sentRequest(fetch).body).toEqual({
      repository_id: "repo-1",
      linear_issue_url: "https://linear.app/acme/issue/ABC-1",
    });
  });

  it("maps url from the workspace response", async () => {
    mockFetch({
      data: workspaceData({
        server_id: "srv-1",
        url: "https://getpolyscope.com/servers/srv-1/session?workspace=ws-1",
      }),
    });

    const client = new Polyscope({ apiToken: "tok", baseUrl: "https://api.test" });
    const ws = await client.workspace("ws-1");

    expect(ws.url).toBe(
      "https://getpolyscope.com/servers/srv-1/session?workspace=ws-1",
    );
  });

  it("lists models per server", async () => {
    const fetch = mockFetch({
      data: [
        {
          server_id: "srv-1",
          agents: [
            {
              id: "claude",
              name: "Claude",
              models: ["claude-opus-5", "claude-sonnet-5"],
            },
            { id: "codex", name: "Codex", models: ["gpt-5.3-codex"] },
          ],
          models: ["claude-opus-5", "claude-sonnet-5", "gpt-5.3-codex"],
          model_capabilities: [
            {
              value: "claude-opus-5",
              displayName: "Opus 5",
              supportsFastMode: true,
              supportedEffortLevels: ["max", "high"],
            },
          ],
        },
      ],
    });

    const client = new Polyscope({ apiToken: "tok", baseUrl: "https://api.test" });
    const result = await client.models();

    expect(sentRequest(fetch).url).toBe("https://api.test/api/v1/models");
    expect(result).toHaveLength(1);
    expect(result[0]).toBeInstanceOf(ServerModels);
    expect(result[0].serverId).toBe("srv-1");
    expect(result[0].agents).toHaveLength(2);
    expect(result[0].agents[0]).toBeInstanceOf(AvailableAgent);
    expect(result[0].agents[0].id).toBe("claude");
    expect(result[0].agents[0].name).toBe("Claude");
    expect(result[0].agents[0].models).toEqual(["claude-opus-5", "claude-sonnet-5"]);
    expect(result[0].models).toEqual(["claude-opus-5", "claude-sonnet-5", "gpt-5.3-codex"]);
    expect(result[0].modelCapabilities[0].displayName).toBe("Opus 5");
    expect(result[0].modelCapabilities[0].supportsFastMode).toBe(true);
    expect(result[0].toJSON().model_capabilities[0].value).toBe("claude-opus-5");
  });

  it("passes server_id when listing models", async () => {
    const fetch = mockFetch({
      data: [{ server_id: "srv-1", agents: [], models: [], model_capabilities: [] }],
    });

    const client = new Polyscope({ apiToken: "tok", baseUrl: "https://api.test" });
    const result = await client.models({ serverId: "srv-1" });

    expect(sentRequest(fetch).url).toBe(
      "https://api.test/api/v1/models?server_id=srv-1",
    );
    expect(result[0].agents).toEqual([]);
    expect(result[0].modelCapabilities).toEqual([]);
  });

  it("invites a team member", async () => {
    const fetch = mockFetch(
      { data: { email: "teammate@example.com", invited: true } },
      201,
    );

    const client = new Polyscope({ apiToken: "tok", baseUrl: "https://api.test" });
    const invite = await client.inviteTeamMember("teammate@example.com");

    expect(sentRequest(fetch)).toEqual({
      url: "https://api.test/api/v1/team/invites",
      method: "POST",
      body: { email: "teammate@example.com" },
    });
    expect(invite).toBeInstanceOf(TeamInvite);
    expect(invite.email).toBe("teammate@example.com");
    expect(invite.invited).toBe(true);
  });

  it("throws ValidationError with the error code for a duplicate invite", async () => {
    mockFetch(
      {
        error: {
          code: "duplicate_invite",
          message: "An invitation has already been sent to this email address.",
        },
      },
      422,
    );

    const client = new Polyscope({ apiToken: "tok", baseUrl: "https://api.test" });
    const error = await client
      .inviteTeamMember("teammate@example.com")
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toMatchObject({
      errorCode: "duplicate_invite",
      message: "An invitation has already been sent to this email address.",
    });
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
