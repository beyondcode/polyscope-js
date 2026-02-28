import type { HttpClient } from "../http.js";
import type {
  CreatePullRequestParams,
  DiffFileData,
  DiffSnapshotData,
  DiffStatsData,
  GenericResourceData,
  MessageData,
  SendMessageParams,
  WorkspaceData,
  WorkspaceDiffData,
  WorkspaceMessagesResponse,
} from "../types.js";

export class Message {
  readonly id: number;
  readonly sessionId: string;
  readonly role: "user" | "assistant" | "system";
  readonly content: string;
  readonly metadata: string | null;
  readonly createdAt: string;

  constructor(data: MessageData) {
    this.id = data.id;
    this.sessionId = data.session_id;
    this.role = data.role;
    this.content = data.content;
    this.metadata = data.metadata;
    this.createdAt = data.created_at;
  }
}

export class DiffFile {
  readonly path: string;
  readonly additions: number;
  readonly deletions: number;

  constructor(data: DiffFileData) {
    this.path = data.path;
    this.additions = data.additions;
    this.deletions = data.deletions;
  }
}

export class DiffStats {
  readonly filesChanged: number;
  readonly additions: number;
  readonly deletions: number;

  constructor(data: DiffStatsData) {
    this.filesChanged = data.filesChanged;
    this.additions = data.additions;
    this.deletions = data.deletions;
  }
}

export class DiffSnapshot {
  readonly diff: string;
  readonly files: DiffFile[];
  readonly stats: DiffStats;

  constructor(data: DiffSnapshotData) {
    this.diff = data.diff;
    this.files = data.files.map((f) => new DiffFile(f));
    this.stats = new DiffStats(data.stats);
  }
}

export class WorkspaceDiff {
  readonly diff: string;
  readonly files: DiffFile[];
  readonly stats: DiffStats;
  readonly local: DiffSnapshot;
  readonly base: DiffSnapshot;
  readonly commitsAhead: number;

  constructor(data: WorkspaceDiffData) {
    this.diff = data.diff;
    this.files = data.files.map((f) => new DiffFile(f));
    this.stats = new DiffStats(data.stats);
    this.local = new DiffSnapshot(data.local);
    this.base = new DiffSnapshot(data.base);
    this.commitsAhead = data.commits_ahead;
  }
}

export class WorkspaceMessages {
  readonly messages: Message[];
  readonly cursor: number | string | null;
  readonly hasMore: boolean;

  constructor(messages: Message[], cursor: number | string | null, hasMore: boolean) {
    this.messages = messages;
    this.cursor = cursor;
    this.hasMore = hasMore;
  }
}

export class GenericResource {
  readonly workspaceId: string | null;
  readonly agent: { status: string } | null;
  readonly [key: string]: unknown;

  constructor(data: GenericResourceData) {
    this.workspaceId = data.workspace_id ?? null;
    this.agent = data.agent ?? null;

    for (const [key, value] of Object.entries(data)) {
      if (!(key in this)) {
        (this as Record<string, unknown>)[key] = value;
      }
    }
  }
}

export class Workspace {
  readonly id: string;
  readonly repoId: string;
  readonly serverId: string | null;
  readonly branch: string;
  readonly branchRenamed: boolean;
  readonly path: string;
  readonly previewUrl: string | null;
  readonly status: string;
  readonly prNumber: number | null;
  readonly prUrl: string | null;
  readonly prTitle: string | null;
  readonly prBody: string | null;
  readonly prIsDraft: boolean;
  readonly issueNumber: number | null;
  readonly issueTitle: string | null;
  readonly issueUrl: string | null;
  readonly baseBranch: string;
  readonly baseCommit: string;
  readonly linkedWorktreeIds: string[];
  readonly createdAt: string;
  readonly repository: {
    id: string;
    name: string;
    fullName: string;
    path: string;
  } | null;
  readonly agent: { status: string } | null;
  readonly stats: DiffStats | null;

  /** @internal */
  private readonly http: HttpClient;

  constructor(data: WorkspaceData, http: HttpClient) {
    this.id = data.id;
    this.repoId = data.repo_id;
    this.serverId = data.server_id;
    this.branch = data.branch;
    this.branchRenamed = data.branch_renamed;
    this.path = data.path;
    this.previewUrl = data.preview_url;
    this.status = data.status;
    this.prNumber = data.pr_number;
    this.prUrl = data.pr_url;
    this.prTitle = data.pr_title;
    this.prBody = data.pr_body;
    this.prIsDraft = data.pr_is_draft;
    this.issueNumber = data.issue_number;
    this.issueTitle = data.issue_title;
    this.issueUrl = data.issue_url;
    this.baseBranch = data.base_branch;
    this.baseCommit = data.base_commit;
    this.linkedWorktreeIds = data.linked_worktree_ids;
    this.createdAt = data.created_at;
    this.repository = data.repository
      ? {
          id: data.repository.id,
          name: data.repository.name,
          fullName: data.repository.full_name,
          path: data.repository.path,
        }
      : null;
    this.agent = data.agent;
    this.stats = data.stats ? new DiffStats(data.stats) : null;
    this.http = http;
  }

  async refresh(): Promise<Workspace> {
    const response = await this.http.get<{ data: WorkspaceData }>(
      `workspaces/${this.id}`,
    );
    return new Workspace(response.data, this.http);
  }

  async delete(): Promise<boolean> {
    const response = await this.http.delete<{
      data: { deleted: boolean };
    }>(`workspaces/${this.id}`);
    return response.data.deleted;
  }

  async messages(after?: number): Promise<WorkspaceMessages> {
    const query: Record<string, string> = {};
    if (after != null) {
      query.after = String(after);
    }

    const response = await this.http.get<WorkspaceMessagesResponse>(
      `workspaces/${this.id}/messages`,
      query,
    );

    const messages = response.data.map((m) => new Message(m));
    return new WorkspaceMessages(
      messages,
      response.meta.cursor,
      response.meta.has_more,
    );
  }

  async prompt(content: string, model?: string): Promise<GenericResource> {
    const body: SendMessageParams = { content };
    if (model != null) {
      body.model = model;
    }

    const response = await this.http.post<{ data: GenericResourceData }>(
      `workspaces/${this.id}/messages`,
      body,
    );
    return new GenericResource(response.data);
  }

  async diff(): Promise<WorkspaceDiff> {
    const response = await this.http.get<{ data: WorkspaceDiffData }>(
      `workspaces/${this.id}/diff`,
    );
    return new WorkspaceDiff(response.data);
  }

  async commit(): Promise<GenericResource> {
    const response = await this.http.post<{ data: GenericResourceData }>(
      `workspaces/${this.id}/commit`,
    );
    return new GenericResource(response.data);
  }

  async pullRequest(params?: CreatePullRequestParams): Promise<GenericResource> {
    const body = params
      ? {
          title: params.title ?? undefined,
          body: params.body ?? undefined,
          draft: params.draft ?? undefined,
        }
      : {};

    const response = await this.http.post<{ data: GenericResourceData }>(
      `workspaces/${this.id}/pull-request`,
      body,
    );
    return new GenericResource(response.data);
  }

  async stop(): Promise<GenericResource> {
    const response = await this.http.post<{ data: GenericResourceData }>(
      `workspaces/${this.id}/stop`,
    );
    return new GenericResource(response.data);
  }

  toJSON(): WorkspaceData {
    return {
      id: this.id,
      repo_id: this.repoId,
      server_id: this.serverId,
      branch: this.branch,
      branch_renamed: this.branchRenamed,
      path: this.path,
      preview_url: this.previewUrl,
      status: this.status,
      pr_number: this.prNumber,
      pr_url: this.prUrl,
      pr_title: this.prTitle,
      pr_body: this.prBody,
      pr_is_draft: this.prIsDraft,
      issue_number: this.issueNumber,
      issue_title: this.issueTitle,
      issue_url: this.issueUrl,
      base_branch: this.baseBranch,
      base_commit: this.baseCommit,
      linked_worktree_ids: this.linkedWorktreeIds,
      created_at: this.createdAt,
      repository: this.repository
        ? {
            id: this.repository.id,
            name: this.repository.name,
            full_name: this.repository.fullName,
            path: this.repository.path,
          }
        : null,
      agent: this.agent,
      stats: this.stats
        ? {
            filesChanged: this.stats.filesChanged,
            additions: this.stats.additions,
            deletions: this.stats.deletions,
          }
        : null,
    };
  }
}
