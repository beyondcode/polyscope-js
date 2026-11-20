import type { HttpClient } from "../http.js";
import type { CreateWorkspaceParams, RepositoryData, WorkspaceData } from "../types.js";
import { Workspace, toCreateWorkspaceBody } from "./workspace.js";

export class Repository {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly baseBranch: string;
  readonly defaultModel: string | null;
  readonly reviewModel: string | null;
  readonly reviewPrompt: string | null;
  readonly githubAssignSelfEnabled: boolean;
  /** @deprecated No longer sent by the API, always `false`. Replaced by `githubAssignSelfEnabled`. */
  readonly githubReactionEnabled: boolean;
  /** @deprecated No longer sent by the API, always `null`. */
  readonly githubReactionEmoji: string | null;
  readonly mergePrompt: string | null;
  readonly mergeAndPushPrompt: string | null;
  readonly prPrompt: string | null;
  readonly draftPrPrompt: string | null;
  readonly worktreeBaseFromOrigin: boolean | null;
  readonly hasRemote: boolean;
  readonly nonGit: boolean;
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
    this.reviewModel = data.review_model ?? null;
    this.reviewPrompt = data.review_prompt ?? null;
    this.githubAssignSelfEnabled = data.github_assign_self_enabled ?? false;
    this.githubReactionEnabled = data.github_reaction_enabled ?? false;
    this.githubReactionEmoji = data.github_reaction_emoji ?? null;
    this.mergePrompt = data.merge_prompt;
    this.mergeAndPushPrompt = data.merge_and_push_prompt;
    this.prPrompt = data.pr_prompt;
    this.draftPrPrompt = data.draft_pr_prompt;
    this.worktreeBaseFromOrigin = data.worktree_base_from_origin;
    this.hasRemote = data.has_remote;
    this.nonGit = data.non_git ?? false;
    this.linkedRepoIds = data.linked_repo_ids;
    this.createdAt = data.created_at;
    this.serverId = data.server_id;
    this.http = http;
  }

  async createWorkspace(
    params: Omit<CreateWorkspaceParams, "repositoryId"> | string,
  ): Promise<Workspace> {
    const body = toCreateWorkspaceBody(
      typeof params === "string"
        ? { repositoryId: this.id, prompt: params }
        : { ...params, repositoryId: this.id },
    );

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
      review_model: this.reviewModel,
      review_prompt: this.reviewPrompt,
      github_assign_self_enabled: this.githubAssignSelfEnabled,
      merge_prompt: this.mergePrompt,
      merge_and_push_prompt: this.mergeAndPushPrompt,
      pr_prompt: this.prPrompt,
      draft_pr_prompt: this.draftPrPrompt,
      worktree_base_from_origin: this.worktreeBaseFromOrigin,
      has_remote: this.hasRemote,
      non_git: this.nonGit,
      linked_repo_ids: this.linkedRepoIds,
      created_at: this.createdAt,
      server_id: this.serverId,
    };
  }
}
