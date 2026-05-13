const jobQueue = [];

function addJob(job) {

  jobQueue.push(job);

  // 🔥 SORT QUEUE
  jobQueue.sort((a, b) => {

    // Higher priority first
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    // FIFO inside same priority
    return a.createdAt - b.createdAt;
  });

  console.log("Job added to priority queue:", job.id);

  printQueue();
}

function getQueue() {
  return jobQueue;
}

/* Optional debugging helper */
function printQueue() {

  console.log("\n=== CURRENT QUEUE ===");

  jobQueue.forEach(job => {
    console.log(
      `Job ${job.id} | ${job.branch} | ${job.priorityLabel}`
    );
  });

  console.log("=====================\n");
}

module.exports = {
  addJob,
  getQueue
};