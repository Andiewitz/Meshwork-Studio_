#!/usr/bin/env node

const { extractSkills, listBundledFiles } = require("../index.js");

function printHelp() {
  process.stdout.write(
    [
      "skills-bundle",
      "",
      "Usage:",
      "  skills-bundle --out <dir>",
      "",
      "Options:",
      "  --out <path>     Output directory (default: ./skills)",
      "  --overwrite      Overwrite existing files (default: skip existing)",
      "  --list           Print bundled file list and exit",
      "  -h, --help       Show help"
    ].join("\n") + "\n"
  );
}

function parseArgs(argv) {
  const args = { out: undefined, overwrite: false, list: false, help: false };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") {
      args.out = argv[i + 1];
      i++;
      continue;
    }
    if (a.startsWith("--out=")) {
      args.out = a.slice("--out=".length);
      continue;
    }
    if (a === "--overwrite") {
      args.overwrite = true;
      continue;
    }
    if (a === "--list") {
      args.list = true;
      continue;
    }
    if (a === "-h" || a === "--help") {
      args.help = true;
      continue;
    }
    throw new Error(`Unknown argument: ${a}`);
  }

  return args;
}

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    printHelp();
    process.exitCode = 1;
    return;
  }

  if (args.help) {
    printHelp();
    return;
  }

  if (args.list) {
    const files = await listBundledFiles();
    for (const f of files) process.stdout.write(`${f}\n`);
    return;
  }

  const result = await extractSkills({ outDir: args.out, overwrite: args.overwrite });
  process.stdout.write(`Wrote ${result.written.length} file(s) to ${result.outDir}\n`);
  if (result.skipped.length) {
    process.stdout.write(`Skipped ${result.skipped.length} existing file(s)\n`);
  }
}

main().catch((e) => {
  process.stderr.write(`${e && e.message ? e.message : String(e)}\n`);
  process.exitCode = 1;
});
