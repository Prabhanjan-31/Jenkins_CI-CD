const { PRIORITY_MAP, DEFAULT_PRIORITY } = require("../utils/priorityConfig");
const jobs = require("../store/jobStore");
const { addJob } = require("../queue/jobQueue");

let jobId = 1;

function scheduleJob(repo, branch, commit, languages_url, clone_url) {

  const id = jobId++;

  const priorityData =
  PRIORITY_MAP[branch] || DEFAULT_PRIORITY;

  const job = {
  id,
  repo,
  branch,
  commit,

  priority: priorityData.value,
  priorityLabel: priorityData.label,

  createdAt: Date.now(),

  queuedAt: Date.now(),
  startedAt: null,
  completedAt: null,

  status: "QUEUED",

  language: null,
  workerId: null,


  languages_url,
  clone_url,

  stages: []
};

  // Store for dashboard
  jobs.push(job);

  // Add to queue
  addJob(job);

  console.log("Job scheduled:", id);

  return job;
}

module.exports = scheduleJob;