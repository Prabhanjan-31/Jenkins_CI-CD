const runPipeline = require("../pipeline/pipelineManager");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");


const { getAvailableWorker, assignWorker, releaseWorker } = require("../workers/workerPool");
const { getQueue } = require("../queue/jobQueue");
const axios = require("axios");

function executeJob(job, worker) {
  console.log(`Worker ${worker.id} started executing Job ${job.id}`);

  const repoUrl = job.clone_url;
  const workspace = path.join(__dirname, "..", "workspace", `job-${job.id}`);

  // Clean old workspace
  if (fs.existsSync(workspace)) {
    fs.rmSync(workspace, { recursive: true, force: true });
  }

  fs.mkdirSync(workspace, { recursive: true });

  console.log(`Cloning repo for Job ${job.id}...`);

  exec(`git clone ${repoUrl} .`, { cwd: workspace }, (err) => {

    if (err) {
      console.log(`Clone failed for Job ${job.id}`);
      job.status = "FAILED";
      releaseWorker(worker);
      return;
    }

    console.log(`Repo cloned for Job ${job.id}`);

    // Run actual pipeline
    runPipeline(job, workspace);

    // 🔴 IMPORTANT: Release worker when pipeline finishes
    monitorJobCompletion(job, worker);
  });
}

function monitorJobCompletion(job, worker) {
  const interval = setInterval(() => {

    if (job.status === "COMPLETED" || job.status === "FAILED") {
      console.log(`Releasing worker ${worker.id} for Job ${job.id}`);
      releaseWorker(worker);
      clearInterval(interval);
      cleanupWorkspaces();
    }

  }, 1000);
}

function cleanupWorkspaces() {
  const WORKSPACE_ROOT = path.join(__dirname, "..", "workspace");

  if (!fs.existsSync(WORKSPACE_ROOT)) return;

  const folders = fs.readdirSync(WORKSPACE_ROOT);

  if (folders.length <= 5) return;

  const sorted = folders.sort((a, b) => {
    return fs.statSync(path.join(WORKSPACE_ROOT, a)).mtime -
           fs.statSync(path.join(WORKSPACE_ROOT, b)).mtime;
  });

  const toDelete = sorted.slice(0, folders.length - 5);

  toDelete.forEach(folder => {
    const fullPath = path.join(WORKSPACE_ROOT, folder);
    fs.rmSync(fullPath, { recursive: true, force: true });
    console.log("Deleted old workspace:", folder);
  });
}

function startWorkManager() {
  console.log("Work Manager started...");

  setInterval(async () => {
    const queue = getQueue();

    for (let i = 0; i < queue.length; i++) {
      const job = queue[i];

      // 🔹 STEP 1: Language Detection
      if (job.status === "QUEUED") {
        try {
          console.log(`Fetching language for job ${job.id}...`);

          const res = await axios.get(job.languages_url);
          const languages = res.data;

          let dominant = null;
          let max = 0;

          for (const lang in languages) {
            if (languages[lang] > max) {
              max = languages[lang];
              dominant = lang;
            }
          }

          // Map language
          if (dominant === "JavaScript") job.language = "node";
          else if (dominant === "Python") job.language = "python";
          else if (dominant === "C++") job.language = "cpp";
          else job.language = "node";

          console.log(`Job ${job.id} language: ${job.language}`);
        } catch (err) {
          console.log(`Language detection failed for job ${job.id}, defaulting to node`);
          job.language = "node";
        }

        job.status = "WAITING_FOR_WORKER";
        console.log(`Job ${job.id} moved to WAITING_FOR_WORKER`);
      }

      // 🔹 STEP 2: Worker Assignment
      if (job.status === "WAITING_FOR_WORKER") {
        const worker = getAvailableWorker(job.language);

        if (!worker) {
          console.log(`No worker available for job ${job.id} (${job.language})`);
          continue;
        }

        // Assign worker
        assignWorker(worker, job.id);

        job.workerId = worker.id;
        job.status = "RUNNING";

        console.log(`Job ${job.id} assigned to Worker ${worker.id} (${worker.type})`);
        executeJob(job, worker);
        // Remove job from queue
        queue.splice(i, 1);
        i--; // IMPORTANT: adjust index after removal
      }
    }

  }, 3000);
}

module.exports = startWorkManager;