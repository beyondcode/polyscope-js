import { HttpClient } from "./http.js";
import { MissingApiTokenError } from "./errors.js";
import { Repository } from "./resources/repository.js";
import { Server } from "./resources/server.js";
import {
  GenericResource,
  Workspace,
} from "./resources/workspace.js";
import { resolveApiToken } from "./utils/settings.js";
import type {
  CreateWorkspaceParams,
  GenericResourceData,
  ListRepositoriesParams,
  ListWorkspacesParams,
  PolyscopeConfig,
  RepositoryData,
  ServerData,
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
    const body = {
      repository_id: params.repositoryId,
      prompt: params.prompt ?? undefined,
      server_id: params.serverId ?? undefined,
      issue_url: params.issueUrl ?? undefined,
      pull_request_url: params.pullRequestUrl ?? undefined,
    };

    const response = await http.post<{ data: WorkspaceData }>(
      "workspaces",
      body,
    );
    return new Workspace(response.data, http);
  }

  async workspaces(params?: ListWorkspacesParams): Promise<Workspace[]> {
    const http = await this.getHttp();
    const query: Record<string, string> = {};
    if (params?.serverId) query.server_id = params.serverId;
    if (params?.repositoryId) query.repository_id = params.repositoryId;
    if (params?.status) query.status = params.status;

    const response = await http.get<{ data: WorkspaceData[] }>(
      "workspaces",
      query,
    );
    return response.data.map((w) => new Workspace(w, http));
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
