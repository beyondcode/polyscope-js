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
  github_reaction_enabled: boolean;
  github_reaction_emoji: string | null;
  merge_prompt: string | null;
  merge_and_push_prompt: string | null;
  pr_prompt: string | null;
  draft_pr_prompt: string | null;
  worktree_base_from_origin: boolean | null;
  has_remote: boolean;
  linked_repo_ids: string[];
  created_at: string;
  server_id: string | null;
}

export interface WorkspaceData {
  id: string;
  repo_id: string;
  server_id: string | null;
  branch: string;
  branch_renamed: boolean;
  path: string;
  preview_url: string | null;
  status: string;
  pr_number: number | null;
  pr_url: string | null;
  pr_title: string | null;
  pr_body: string | null;
  pr_is_draft: boolean;
  issue_number: number | null;
  issue_title: string | null;
  issue_url: string | null;
  base_branch: string;
  base_commit: string;
  linked_worktree_ids: string[];
  created_at: string;
  repository: { id: string; name: string; full_name: string; path: string } | null;
  agent: { status: string } | null;
  stats: DiffStatsData | null;
}

export interface MessageData {
  id: number;
  session_id: string;
  role: "user" | "assistant" | "system";
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
  commits_ahead: number;
}

export interface GenericResourceData {
  workspace_id?: string | null;
  agent?: { status: string } | null;
  deleted?: boolean;
  [key: string]: unknown;
}

export interface CreateWorkspaceParams {
  repositoryId: string;
  prompt?: string | null;
  serverId?: string | null;
  issueUrl?: string | null;
  pullRequestUrl?: string | null;
}

export interface SendMessageParams {
  content: string;
  model?: string | null;
}

export interface CreatePullRequestParams {
  title?: string | null;
  body?: string | null;
  draft?: boolean;
}

export interface ListWorkspacesParams {
  serverId?: string | null;
  repositoryId?: string | null;
  status?: string | null;
}

export interface ListRepositoriesParams {
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
