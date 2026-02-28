import type { HttpClient } from "../http.js";
import type { CreateWorkspaceParams, RepositoryData, WorkspaceData } from "../types.js";
import { Workspace } from "./workspace.js";

export class Repository {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly baseBranch: string;
  readonly defaultModel: string | null;
  readonly githubReactionEnabled: boolean;
  readonly githubReactionEmoji: string | null;
  readonly mergePrompt: string | null;
  readonly mergeAndPushPrompt: string | null;
  readonly prPrompt: string | null;
  readonly draftPrPrompt: string | null;
  readonly worktreeBaseFromOrigin: boolean | null;
  readonly hasRemote: boolean;
  readonly linkedRepoIds: string[];
  readonly createdAt: string;
  readonly serverId: string | null;

  /** @internal */
  private readonly http: HttpClient;

  constructor(data: RepositoryData, http: HttpClient) {
    this.id = data.id;
    this.name = data.name;
    this.path = data.path;
    this.baseBranch = data.base_branch;
    this.defaultModel = data.default_model;
    this.githubReactionEnabled = data.github_reaction_enabled;
    this.githubReactionEmoji = data.github_reaction_emoji;
    this.mergePrompt = data.merge_prompt;
    this.mergeAndPushPrompt = data.merge_and_push_prompt;
    this.prPrompt = data.pr_prompt;
    this.draftPrPrompt = data.draft_pr_prompt;
    this.worktreeBaseFromOrigin = data.worktree_base_from_origin;
    this.hasRemote = data.has_remote;
    this.linkedRepoIds = data.linked_repo_ids;
    this.createdAt = data.created_at;
    this.serverId = data.server_id;
    this.http = http;
  }

  async createWorkspace(
    params: Omit<CreateWorkspaceParams, "repositoryId"> | string,
  ): Promise<Workspace> {
    const body =
      typeof params === "string"
        ? { repository_id: this.id, prompt: params }
        : {
            repository_id: this.id,
            prompt: params.prompt ?? undefined,
            server_id: params.serverId ?? undefined,
            issue_url: params.issueUrl ?? undefined,
            pull_request_url: params.pullRequestUrl ?? undefined,
          };

    const response = await this.http.post<{ data: WorkspaceData }>(
      "workspaces",
      body,
    );
    return new Workspace(response.data, this.http);
  }

  toJSON(): RepositoryData {
    return {
      id: this.id,
      name: this.name,
      path: this.path,
      base_branch: this.baseBranch,
      default_model: this.defaultModel,
      github_reaction_enabled: this.githubReactionEnabled,
      github_reaction_emoji: this.githubReactionEmoji,
      merge_prompt: this.mergePrompt,
      merge_and_push_prompt: this.mergeAndPushPrompt,
      pr_prompt: this.prPrompt,
      draft_pr_prompt: this.draftPrPrompt,
      worktree_base_from_origin: this.worktreeBaseFromOrigin,
      has_remote: this.hasRemote,
      linked_repo_ids: this.linkedRepoIds,
      created_at: this.createdAt,
      server_id: this.serverId,
    };
  }
}
