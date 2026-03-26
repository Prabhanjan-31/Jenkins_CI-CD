const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

/* =========================
   PARSE YAML WITH STAGE NAMES
========================= */
function parseSmartCI(repoPath) {
  const filePath = path.join(repoPath, ".smartci.yml");

  if (!fs.existsSync(filePath)) {
    console.log("No .smartci.yml found");
    return [];
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  const stages = [];
  let currentStageName = "";
  let insideScript = false;

  lines.forEach(line => {
    const trimmed = line.trim();

    // Detect stage name (e.g., build_backend:)
    if (
      !line.startsWith(" ") &&
      trimmed.endsWith(":") &&
      !trimmed.startsWith("stages")
    ) {
      currentStageName = trimmed.replace(":", "");
    }

    // Enter script block
    if (trimmed.startsWith("script:")) {
      insideScript = true;
      return;
    }

    // Extract commands under script
    if (insideScript && trimmed.startsWith("-")) {
      const command = trimmed.replace("-", "").trim();

      stages.push({
        name: currentStageName, // 🔥 real stage name
        command
      });
    }

    // Exit script block
    if (insideScript && trimmed === "") {
      insideScript = false;
    }
  });

  return stages;
}

/* =========================
   PIPELINE EXECUTION
========================= */
function runPipeline(job, repoPath) {

  job.status = "IN_PROGRESS";

  const parsedStages = parseSmartCI(repoPath);

  // fallback if no YAML
  if (parsedStages.length === 0) {
    console.log("Using default stages");

    parsedStages.push({
      name: "default",
      command: "npm install"
    });
  }

  job.stages = parsedStages.map(stage => ({
    name: stage.name,
    command: stage.command,
    status: "PENDING"
  }));

  runStages(job, repoPath, 0);
}

/* =========================
   RUN STAGES SEQUENTIALLY
========================= */
function runStages(job, repoPath, index) {

  if (index >= job.stages.length) {
    job.status = "COMPLETED";
    console.log("Pipeline completed");
    return;
  }

  const stage = job.stages[index];

  console.log(`Running: ${stage.name} → ${stage.command}`);
  console.log("Stages:", job.stages);

  stage.status = "RUNNING";

  exec(stage.command, { cwd: repoPath }, (err, stdout, stderr) => {

    if (err) {
      stage.status = "FAILED";
      job.status = "FAILED";
      console.log("Stage failed:", stage.name);
      return;
    }

    stage.status = "COMPLETED";

    runStages(job, repoPath, index + 1);
  });
}

module.exports = runPipeline;