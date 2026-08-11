export function log(level: "debug" | "info" | "warn" | "error", msg: string, data?: Record<string, unknown>): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...data });
  if (level === "error") console.error(line);
  else console.log(line);
}
