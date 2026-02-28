import type { ServerData } from "../types.js";

export class Server {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly platform: string;
  readonly online: boolean;
  readonly connectedAt: string | null;

  constructor(data: ServerData) {
    this.id = data.id;
    this.name = data.name;
    this.version = data.version;
    this.platform = data.platform;
    this.online = data.online;
    this.connectedAt = data.connected_at;
  }

  toJSON(): ServerData {
    return {
      id: this.id,
      name: this.name,
      version: this.version,
      platform: this.platform,
      online: this.online,
      connected_at: this.connectedAt,
    };
  }
}
