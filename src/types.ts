export interface ServerData {
  id: string;
  name: string;
  version: string;
  platform: string;
  online: boolean;
  connected_at: string | null;
}

export interface RepositoryData {
  id: string;
  name: string;
  path: string;
  base_branch: string;
  default_model: string | null;
  review_model?: string | null;
  review_prompt?: string | null;
  github_assign_self_enabled?: boolean;
  /** @deprecated No longer sent by the API. Replaced by `github_assign_self_enabled`. */
  github_reaction_enabled?: boolean;
  /** @deprecated No longer sent by the API. */
  github_reaction_emoji?: string | null;
  merge_prompt: string | null;
  merge_and_push_prompt: string | null;
  pr_prompt: string | null;
  draft_pr_prompt: string | null;
  worktree_base_from_origin: boolean | null;
  has_remote: boolean;
  non_git?: boolean;
  linked_repo_ids: string[];
  created_at: string;
  server_id: string | null;
}

export type WorkspaceStatus = "active" | "merged" | "archived";

export type InterfaceMode = "chat" | "claude_terminal";

export interface WorkspaceData {
  id: string;
  repo_id: string;
  server_id: string | null;
  url?: string;
  branch: string;
  branch_renamed: boolean;
  path: string;
  interface_mode?: InterfaceMode;
  model?: string | null;
  preview_url?: string | null;
  status: WorkspaceStatus;
  pr_number: number | null;
  pr_url: string | null;
  pr_title: string | null;
  pr_body: string | null;
  pr_is_draft: boolean;
  issue_number: number | null;
  issue_title: string | null;
  issue_url: string | null;
  base_branch: string | null;
  base_commit: string | null;
  label_id?: string | null;
  is_repo_workspace?: boolean;
  has_activity?: boolean;
  linked_from_worktree_id?: string | null;
  linked_worktree_ids: string[];
  created_at: string;
  repository?: { id: string; name: string; full_name: string; path: string } | null;
  agent?: { status: string } | null;
  stats?: DiffStatsData | null;
}

export type MessageRole =
  | "user"
  | "assistant"
  | "tool_use"
  | "tool_result"
  | "thinking";

export interface MessageData {
  id: number;
  session_id: string;
  role: MessageRole;
  content: string;
  metadata: string | null;
  created_at: string;
}

export interface WorkspaceMessagesResponse {
  data: MessageData[];
  meta: {
    cursor: number | string | null;
    has_more: boolean;
  };
}

export interface DiffFileData {
  path: string;
  additions: number;
  deletions: number;
}

export interface DiffStatsData {
  filesChanged: number;
  additions: number;
  deletions: number;
}

export interface DiffSnapshotData {
  diff: string;
  files: DiffFileData[];
  stats: DiffStatsData;
}

export interface WorkspaceDiffData {
  diff: string;
  files: DiffFileData[];
  stats: DiffStatsData;
  local: DiffSnapshotData;
  base: DiffSnapshotData;
  commitsAhead: number;
}

export interface GenericResourceData {
  workspace_id?: string | null;
  agent?: { status: string } | null;
  deleted?: boolean;
  [key: string]: unknown;
}

export interface AvailableAgentData {
  id: string;
  name: string;
  models: string[];
}

export interface ModelCapabilitiesData {
  value: string;
  resolvedModel?: string;
  aliases?: string[];
  displayName: string;
  description?: string;
  supportsEffort?: boolean;
  supportedEffortLevels?: string[];
  supportsFastMode?: boolean;
}

export interface ServerModelsData {
  server_id: string;
  agents: AvailableAgentData[];
  models: string[];
  model_capabilities: ModelCapabilitiesData[];
}

export interface TeamInviteData {
  email: string;
  invited: boolean;
}

export interface CreateWorkspaceParams {
  repositoryId: string;
  /** Ignored by the API when `issueUrl`, `pullRequestUrl` or `linearIssueUrl` is set. */
  prompt?: string | null;
  serverId?: string | null;
  /** Ignored by the API when `issueUrl`, `pullRequestUrl` or `linearIssueUrl` is set. */
  baseBranch?: string | null;
  model?: string | null;
  issueUrl?: string | null;
  pullRequestUrl?: string | null;
  linearIssueUrl?: string | null;
}

export interface SendMessageParams {
  content: string;
  model?: string | null;
}

export interface CommitParams {
  model?: string | null;
}

export interface CreatePullRequestParams {
  title?: string | null;
  body?: string | null;
  draft?: boolean;
  model?: string | null;
}

export interface ListWorkspacesParams {
  serverId?: string | null;
  repositoryId?: string | null;
  status?: WorkspaceStatus | null;
  previewUrl?: string | null;
}

export interface ListRepositoriesParams {
  serverId?: string | null;
}

export interface ListModelsParams {
  serverId?: string | null;
}

export interface PolyscopeConfig {
  apiToken?: string;
  baseUrl?: string;
  timeout?: number;
}

export interface ApiErrorResponse {
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  errors?: Record<string, string[]>;
}
