const jobs = require("../store/jobStore");
const runPipeline = require("../pipeline/pipelineManager");

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");


let jobId = 1;

function scheduleJob(repo, branch, commit) {

  const id = jobId++;

  const job = {
    id,
    repo,
    branch,
    commit,
    status: "QUEUED",
    stages: []
  };

  jobs.push(job);

  console.log("Job scheduled:", id);

  const repoUrl = `https://github.com/Prabhanjan-31/${repo}.git`;
const workspace = path.join(__dirname, "..", "workspace", `job-${id}`);

if (fs.existsSync(workspace)) {
  fs.rmSync(workspace, { recursive: true, force: true });
}

fs.mkdirSync(workspace, { recursive: true });

console.log("Cloning repository...");

exec(`git clone ${repoUrl} .`, { cwd: workspace }, (err) => {

  if (err) {
    console.log("Clone failed:", err);
    job.status = "FAILED";
    return;
  }

  console.log("Repository cloned");

  runPipeline(job, workspace);

});

  return job;
}

module.exports = scheduleJob;

const WORKSPACE_ROOT = path.join(__dirname, "..", "workspace");

// cleanup old jobs (keep last 5)
const folders = fs.readdirSync(WORKSPACE_ROOT);

if (folders.length > 5) {
  const sorted = folders.sort(); // job-1, job-2...

  const toDelete = sorted.slice(0, folders.length - 5);

  toDelete.forEach(folder => {
    const fullPath = path.join(WORKSPACE_ROOT, folder);
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log("Deleted old job:", folder);
  });
}