import { HttpClient } from "./http.js";
import { MissingApiTokenError } from "./errors.js";
import { previewUrlMatches, toPreviewLookupUrl } from "./url-matching.js";
import { ServerModels } from "./resources/models.js";
import { Repository } from "./resources/repository.js";
import { Server } from "./resources/server.js";
import { TeamInvite } from "./resources/team-invite.js";
import {
  GenericResource,
  Workspace,
  toCreateWorkspaceBody,
} from "./resources/workspace.js";
import { resolveApiToken } from "./utils/settings.js";
import type {
  CreateWorkspaceParams,
  GenericResourceData,
  ListModelsParams,
  ListRepositoriesParams,
  ListWorkspacesParams,
  PolyscopeConfig,
  RepositoryData,
  ServerData,
  ServerModelsData,
  TeamInviteData,
  WorkspaceData,
} from "./types.js";

export class Polyscope {
  private http: HttpClient | null = null;
  private apiToken: string | null;
  private baseUrl: string | undefined;
  private timeout: number | undefined;

  constructor(config: PolyscopeConfig = {}) {
    this.apiToken = config.apiToken ?? null;
    this.baseUrl = config.baseUrl;
    this.timeout = config.timeout;
  }

  private async getHttp(): Promise<HttpClient> {
    if (this.http) {
      return this.http;
    }

    let token = this.apiToken;
    if (!token) {
      token = await resolveApiToken();
    }
    if (!token) {
      throw new MissingApiTokenError();
    }

    this.apiToken = token;
    this.http = new HttpClient(token, this.baseUrl, this.timeout);
    return this.http;
  }

  setApiToken(token: string): void {
    this.apiToken = token;
    this.http = null;
  }

  getApiToken(): string | null {
    return this.apiToken;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
    if (this.http) {
      this.http.setBaseUrl(url);
    }
  }

  getBaseUrl(): string | undefined {
    return this.baseUrl;
  }

  setTimeout(ms: number): void {
    this.timeout = ms;
    if (this.http) {
      this.http.setTimeout(ms);
    }
  }

  getTimeout(): number | undefined {
    return this.timeout;
  }

  // --- Servers ---

  async servers(): Promise<Server[]> {
    const http = await this.getHttp();
    const response = await http.get<{ data: ServerData[] }>("servers");
    return response.data.map((s) => new Server(s));
  }

  async models(params?: ListModelsParams): Promise<ServerModels[]> {
    const http = await this.getHttp();
    const query: Record<string, string> = {};
    if (params?.serverId) {
      query.server_id = params.serverId;
    }

    const response = await http.get<{ data: ServerModelsData[] }>(
      "models",
      query,
    );
    return response.data.map((m) => new ServerModels(m));
  }

  async inviteTeamMember(email: string): Promise<TeamInvite> {
    const http = await this.getHttp();
    const response = await http.post<{ data: TeamInviteData }>(
      "team/invites",
      { email },
    );
    return new TeamInvite(response.data);
  }

  // --- Repositories ---

  async repositories(params?: ListRepositoriesParams): Promise<Repository[]> {
    const http = await this.getHttp();
    const query: Record<string, string> = {};
    if (params?.serverId) {
      query.server_id = params.serverId;
    }

    const response = await http.get<{ data: RepositoryData[] }>(
      "repositories",
      query,
    );
    return response.data.map((r) => new Repository(r, http));
  }

  // --- Workspaces ---

  async createWorkspace(params: CreateWorkspaceParams): Promise<Workspace> {
    const http = await this.getHttp();
    const response = await http.post<{ data: WorkspaceData }>(
      "workspaces",
      toCreateWorkspaceBody(params),
    );
    return new Workspace(response.data, http);
  }

  async workspaces(params?: ListWorkspacesParams): Promise<Workspace[]> {
    const http = await this.getHttp();
    const query: Record<string, string> = {};
    if (params?.serverId) query.server_id = params.serverId;
    if (params?.repositoryId) query.repository_id = params.repositoryId;
    if (params?.status) query.status = params.status;
    if (params?.previewUrl) query.preview_url = params.previewUrl;

    const response = await http.get<{ data: WorkspaceData[] }>(
      "workspaces",
      query,
    );
    return response.data.map((w) => new Workspace(w, http));
  }

  /**
   * Find workspaces whose preview URL matches the given URL.
   *
   * Normalizes `url` to the site base (origin + `/`, query string preserved)
   * before calling the API and matching, so e.g. `https://app.test/dashboard`
   * matches a workspace preview `https://app.test`.
   *
   * Sends the normalized URL to the server for efficient server-side filtering.
   * Falls back to client-side matching if the server returns unfiltered results
   * (for backward compatibility with servers that don't support the
   * preview_url filter yet).
   */
  async findWorkspacesByPreviewUrl(url: string): Promise<Workspace[]> {
    const lookup = toPreviewLookupUrl(url) ?? url;
    const allWorkspaces = await this.workspaces({ previewUrl: lookup });

    // If the server supports preview_url filtering, the results are already
    // filtered. But for backward compatibility with older servers that ignore
    // the preview_url param, apply client-side filtering as well.
    return allWorkspaces.filter(
      (ws) => ws.previewUrl != null && previewUrlMatches(ws.previewUrl, lookup),
    );
  }

  async workspace(id: string): Promise<Workspace> {
    const http = await this.getHttp();
    const response = await http.get<{ data: WorkspaceData }>(
      `workspaces/${id}`,
    );
    return new Workspace(response.data, http);
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    const http = await this.getHttp();
    const response = await http.delete<{ data: { deleted: boolean } }>(
      `workspaces/${id}`,
    );
    return response.data.deleted;
  }

  async stopWorkspace(id: string): Promise<GenericResource> {
    const http = await this.getHttp();
    const response = await http.post<{ data: GenericResourceData }>(
      `workspaces/${id}/stop`,
    );
    return new GenericResource(response.data);
  }
}
