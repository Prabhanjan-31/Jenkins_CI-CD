const { getQueue } = require("../queue/jobQueue");

function startWorkManager() {
  console.log("Work Manager started...");

  setInterval(() => {
    const queue = getQueue();

    if (queue.length === 0) return;

    console.log("Checking queue...");

    queue.forEach(job => {
      if (job.status === "QUEUED") {
        console.log(`Job ${job.id} moved to WAITING_FOR_WORKER`);
        job.status = "WAITING_FOR_WORKER";
      }
    });

  }, 3000); // every 3 seconds
}

module.exports = startWorkManager;