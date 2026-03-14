const jobs = require("../store/jobStore");
const runPipeline = require("../pipeline/pipelineManager");

let jobId = 1;

function scheduleJob(repo, branch, commit) {

  const job = {
    id: jobId++,
    repo,
    branch,
    commit,
    status: "QUEUED",
    stages: []
  };

  jobs.push(job);

  // simulate queue delay
  setTimeout(() => {
    runPipeline(job);
  }, 1000);

  return job;
}

module.exports = scheduleJob;