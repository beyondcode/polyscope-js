export { Polyscope } from "./client.js";
export { previewUrlMatches, toPreviewLookupUrl } from "./url-matching.js";

export {
  PolyscopeError,
  MissingApiTokenError,
  ApiError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerOfflineError,
  ServerTimeoutError,
} from "./errors.js";

export { Server } from "./resources/server.js";
export { Repository } from "./resources/repository.js";
export { ServerModels, AvailableAgent } from "./resources/models.js";
export { TeamInvite } from "./resources/team-invite.js";
export {
  Workspace,
  WorkspaceDiff,
  WorkspaceMessages,
  Message,
  DiffFile,
  DiffStats,
  DiffSnapshot,
  GenericResource,
} from "./resources/workspace.js";

export type {
  ServerData,
  RepositoryData,
  WorkspaceData,
  WorkspaceStatus,
  InterfaceMode,
  MessageData,
  MessageRole,
  DiffFileData,
  DiffStatsData,
  DiffSnapshotData,
  WorkspaceDiffData,
  GenericResourceData,
  ServerModelsData,
  AvailableAgentData,
  ModelCapabilitiesData,
  TeamInviteData,
  CreateWorkspaceParams,
  SendMessageParams,
  CommitParams,
  CreatePullRequestParams,
  ListWorkspacesParams,
  ListRepositoriesParams,
  ListModelsParams,
  PolyscopeConfig,
} from "./types.js";
