import type {
  AvailableAgentData,
  ModelCapabilitiesData,
  ServerModelsData,
} from "../types.js";

export class AvailableAgent {
  readonly id: string;
  readonly name: string;
  readonly models: string[];

  constructor(data: AvailableAgentData) {
    this.id = data.id;
    this.name = data.name;
    this.models = data.models;
  }
}

export class ServerModels {
  readonly serverId: string;
  readonly agents: AvailableAgent[];
  readonly models: string[];
  readonly modelCapabilities: ModelCapabilitiesData[];

  constructor(data: ServerModelsData) {
    this.serverId = data.server_id;
    this.agents = data.agents.map((a) => new AvailableAgent(a));
    this.models = data.models;
    this.modelCapabilities = data.model_capabilities;
  }

  toJSON(): ServerModelsData {
    return {
      server_id: this.serverId,
      agents: this.agents.map((a) => ({
        id: a.id,
        name: a.name,
        models: a.models,
      })),
      models: this.models,
      model_capabilities: this.modelCapabilities,
    };
  }
}
