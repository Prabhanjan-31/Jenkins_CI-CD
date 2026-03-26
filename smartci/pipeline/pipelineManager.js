const fs = require("fs");
const path = require("path");

function parseSmartCI(repoPath) {
  const filePath = path.join(repoPath, ".smartci.yml");

  if (!fs.existsSync(filePath)) {
    console.log("No .smartci.yml found");
    return [];
  }

  const content = fs.readFileSync(filePath, "utf-8");

  const commands = [];
  const lines = content.split("\n");

  let insideScript = false;

  lines.forEach(line => {
    line = line.trim();

    if (line.startsWith("script:")) {
      insideScript = true;
      return;
    }

    if (insideScript && line.startsWith("-")) {
      commands.push(line.replace("-", "").trim());
    }

    // stop if next section starts
    if (insideScript && !line.startsWith("-") && line !== "") {
      insideScript = false;
    }
  });

  return commands;
}

const { exec } = require("child_process");

// const stagesTemplate = [
//   "npm install",
//   "cd backend && npm install",
//   "cd backend && npm test"
// ];

function runPipeline(job, repoPath) {

  job.status = "IN_PROGRESS";

  const commands = parseSmartCI(repoPath);

  // fallback if file missing
  if (commands.length === 0) {
    console.log("Using default stages");
    commands.push("npm install");
  }

  job.stages = commands.map((cmd, index) => ({
    name: `Stage ${index + 1}`,
    command: cmd,
    status: "PENDING"
  }));

  runStages(job, repoPath, 0);
}

function runStages(job, repoPath, index) {

  console.log(`Running: ${stage.command}`);
  console.log("Stages:", job.stages);

  if (index >= job.stages.length) {
    job.status = "COMPLETED";
    console.log("Pipeline completed");
    return;
  }

  const stage = job.stages[index];

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