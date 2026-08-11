import { loadEnvFile, loadSettings } from "./config/load.js";
import { createPaperBroker } from "./broker/paper.js";
import { assertLiveAllowed, createLiveBroker } from "./broker/live.js";
import { runLoops } from "./app/runtime.js";
import { log } from "./ops/logger.js";
import { parseArgs } from "./ops/cli.js";

async function main() {
  loadEnvFile();
  const settings = loadSettings();
  const args = parseArgs(process.argv.slice(2));
  const mode = args.mode ?? settings.mode;
  log("info", "boot", {
    project: "drift-protocol-perp-trading-bot",
    venue: "drift",
    chain: "Solana",
    model: "hybrid CLOB / vAMM",
    mode,
  });

  if (mode === "live") {
    assertLiveAllowed(settings, args.confirmLive, "DRIFT");
    const broker = createLiveBroker(settings, "DRIFT");
    await runLoops(settings, broker, args.loops);
  } else {
    await runLoops(settings, createPaperBroker(settings), args.loops);
  }
}

main().catch((err) => {
  log("error", "fatal", { err: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
