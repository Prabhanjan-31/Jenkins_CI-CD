const stagesTemplate = [
  "checkout",
  "build",
  "test",
  "deploy"
];

function runPipeline(job) {

  job.status = "IN_PROGRESS";

  job.stages = stagesTemplate.map(stage => ({
    name: stage,
    status: "PENDING"
  }));

  runStages(job, 0);
}

function runStages(job, index) {

  if (index >= job.stages.length) {
    job.status = "COMPLETED";
    return;
  }

  const stage = job.stages[index];
  stage.status = "RUNNING";

  setTimeout(() => {

    stage.status = "COMPLETED";

    runStages(job, index + 1);

  }, 2000);
}

module.exports = runPipeline;