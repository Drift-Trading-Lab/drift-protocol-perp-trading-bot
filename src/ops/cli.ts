export type CliArgs = { mode?: "paper" | "live"; loops: number; confirmLive: boolean };

export function parseArgs(argv: string[]): CliArgs {
  let mode: "paper" | "live" | undefined;
  let loops = 12;
  let confirmLive = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--mode") mode = argv[++i] as "paper" | "live";
    else if (a === "--loops") loops = Number(argv[++i]);
    else if (a === "--confirm-live") confirmLive = true;
  }
  return { mode, loops, confirmLive };
}
