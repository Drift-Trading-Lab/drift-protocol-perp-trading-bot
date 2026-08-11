import fs from "node:fs";
import path from "node:path";
import { SettingsSchema, type Settings } from "./schema.js";

export function loadEnvFile(root = process.cwd()): void {
  const p = path.join(root, ".env");
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(k in process.env)) process.env[k] = v;
  }
}

export function loadSettings(root = process.cwd()): Settings {
  return SettingsSchema.parse(JSON.parse(fs.readFileSync(path.join(root, "settings.json"), "utf8")));
}

export function hasLiveCredentials(prefix: string): boolean {
  const keys = [
    `${prefix}_PRIVATE_KEY`,
    `${prefix}_API_KEY`,
    `${prefix}_MNEMONIC`,
    "EVM_PRIVATE_KEY",
    "SOLANA_PRIVATE_KEY",
    "HL_PRIVATE_KEY",
    "HYPERLIQUID_PRIVATE_KEY",
  ];
  return keys.some((k) => Boolean(process.env[k] && String(process.env[k]).length > 8));
}
