import fs from "node:fs";
import path from "node:path";

const ENV_FILES = [".env.local", ".env"];

export function loadLocalEnv(projectRoot) {
  for (const fileName of ENV_FILES) {
    const fullPath = path.join(projectRoot, fileName);

    if (!fs.existsSync(fullPath)) {
      continue;
    }

    const fileContents = fs.readFileSync(fullPath, "utf8");

    for (const line of fileContents.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separatorIndex = trimmed.indexOf("=");

      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, "");

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}
