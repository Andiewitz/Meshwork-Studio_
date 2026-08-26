const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

function getBundledSkillsDir() {
  return path.join(__dirname, "skills");
}

async function listBundledFiles() {
  const dir = getBundledSkillsDir();
  const entries = await fsp.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .filter((n) => n.toLowerCase().endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));
}

async function extractSkills({ outDir, overwrite = false } = {}) {
  const bundledDir = getBundledSkillsDir();
  const files = await listBundledFiles();
  const targetDir = outDir ? path.resolve(outDir) : path.resolve("skills");

  await fsp.mkdir(targetDir, { recursive: true });

  const results = { written: [], skipped: [], outDir: targetDir };

  for (const fileName of files) {
    const src = path.join(bundledDir, fileName);
    const dest = path.join(targetDir, fileName);

    try {
      if (!overwrite && fs.existsSync(dest)) {
        results.skipped.push(fileName);
        continue;
      }
      await fsp.copyFile(src, dest);
      results.written.push(fileName);
    } catch (e) {
      const err = new Error(`Failed to write ${fileName}: ${e && e.message ? e.message : String(e)}`);
      err.cause = e;
      throw err;
    }
  }

  return results;
}

module.exports = {
  extractSkills,
  listBundledFiles
};
