# Polyscope JS SDK

A TypeScript/JavaScript SDK for the Polyscope API.

## Installation

```bash
npm install @polyscope/sdk
```

## Quick Start

```typescript
import { Polyscope } from "@polyscope/sdk";

const polyscope = new Polyscope({ apiToken: "your-api-token" });

const servers = await polyscope.servers();
const repositories = await polyscope.repositories();
const workspaces = await polyscope.workspaces();

// Create a workspace directly from a repository resource.
const workspace = await repositories[0].createWorkspace({
  prompt: "Fix the login flow",
  serverId: "srv-1", // optional
});

// Or use a prompt string shorthand.
const workspace = await repositories[0].createWorkspace("Fix the login flow");
```

If no token is passed, the SDK automatically falls back to Polyscope's local settings file and reads `authToken`.
By default it checks:

- `~/.polyscope/settings.json`
- `~/Library/Application Support/com.getpolyscope.app/settings.json`
- `~/.config/com.getpolyscope.app/settings.json`
- `%APPDATA%/com.getpolyscope.app/settings.json`

You can override this with:

```bash
POLYSCOPE_SETTINGS_PATH=/custom/path/settings.json
```

If you need a custom base URL:

```typescript
const polyscope = new Polyscope();
polyscope.setBaseUrl("https://your-polyscope-instance.com");
polyscope.setApiToken("your-api-token");
```

## Supported API Areas (v1 only)

- Servers: `servers()`
- Repositories: `repositories()`
- Workspaces: `workspaces()`, `createWorkspace()`, `workspace()`, `deleteWorkspace()`
- Workspace messages: `workspace.messages()`, `workspace.prompt()`
- Workspace actions: `workspace.diff()`, `workspace.commit()`, `workspace.pullRequest()`, `workspace.stop()`

## Error Handling

The SDK maps common HTTP/API failures to typed errors:

- `ValidationError`
- `AuthenticationError`
- `ForbiddenError`
- `NotFoundError`
- `RateLimitError`
- `ServerOfflineError`
- `ServerTimeoutError`
- `ApiError`

Example:

```typescript
import { Polyscope, ValidationError } from "@polyscope/sdk";

try {
  await polyscope.createWorkspace({ repositoryId: "" });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.errors);
  }
}
```

## Development

```bash
npm run build
npm run typecheck
```
