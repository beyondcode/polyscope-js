import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const SETTINGS_PATHS = [
  () => process.env.POLYSCOPE_SETTINGS_PATH,
  () => join(homedir(), ".polyscope", "settings.json"),
  () =>
    join(
      homedir(),
      "Library",
      "Application Support",
      "com.getpolyscope.app",
      "settings.json",
    ),
  () => join(homedir(), ".config", "com.getpolyscope.app", "settings.json"),
  () =>
    process.env.APPDATA
      ? join(process.env.APPDATA, "com.getpolyscope.app", "settings.json")
      : null,
];

export async function resolveApiToken(): Promise<string | null> {
  for (const getPath of SETTINGS_PATHS) {
    const path = getPath();
    if (!path) continue;

    try {
      const content = await readFile(path, "utf-8");
      const settings = JSON.parse(content);
      if (settings.authToken) {
        return settings.authToken;
      }
    } catch {
      // File doesn't exist or isn't valid JSON, try next
    }
  }

  return null;
}
