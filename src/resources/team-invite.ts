import type { TeamInviteData } from "../types.js";

export class TeamInvite {
  readonly email: string;
  readonly invited: boolean;

  constructor(data: TeamInviteData) {
    this.email = data.email;
    this.invited = data.invited;
  }
}
