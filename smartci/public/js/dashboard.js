const jobMap = new Map();

function getPriorityClass(label) {

  if (label === "HIGH") {
    return "priority-high";
  }

  if (label === "MEDIUM") {
    return "priority-medium";
  }

  return "priority-low";
}

function getStageClass(status) {

  if (status === "RUNNING") {
    return "stage-running";
  }

  if (status === "COMPLETED") {
    return "stage-completed";
  }

  if (status === "FAILED") {
    return "stage-failed";
  }

  return "stage-pending";
}

function formatDuration(ms) {

  if (!ms) {
    return "00:00";
  }

  const totalSeconds = Math.floor(ms / 1000);

  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");

  const seconds = (totalSeconds % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}`;
}

function createJobCard(job) {

  const card = document.createElement("div");

  card.className = "job-card";
  card.id = `job-${job.id}`;

  updateJobCard(card, job);

  return card;
}

function updateJobCard(card, job) {

  let stagesHTML = "";

  if (job.stages) {

    job.stages.forEach(stage => {

      stagesHTML += `
        <div class="stage ${getStageClass(stage.status)}">
          ${stage.name}: ${stage.status}
        </div>
      `;
    });
  }

  let runtime = "00:00";

if (job.startedAt) {

  const endTime =
    job.completedAt || Date.now();

  runtime = formatDuration(
    endTime - job.startedAt
  );
}

  card.innerHTML = `

    <div class="job-top">
      <div class="job-id">Job #${job.id}</div>

      <div class="priority ${getPriorityClass(job.priorityLabel)}">
        ${job.priorityLabel}
      </div>
    </div>

    <div class="job-meta">
      <div>📦 ${job.repo}</div>
      <div>🌿 ${job.branch}</div>
      <div>🌐 ${job.language || "Detecting..."}</div>
      <div>👷 Worker: ${job.workerId || "Waiting"}</div>
      <div>📊 ${job.status}</div>
      <div>⏱ Runtime: ${runtime}</div>
    </div>

    <div class="stage-list">
      ${stagesHTML}
    </div>

  `;
}

function getColumn(status) {

  if (status === "QUEUED") {
    return document.getElementById("queuedColumn");
  }

  if (status === "WAITING_FOR_WORKER") {
    return document.getElementById("waitingColumn");
  }

  if (status === "RUNNING") {
    return document.getElementById("runningColumn");
  }

  if (status === "COMPLETED") {
    return document.getElementById("completedColumn");
  }

  return document.getElementById("failedColumn");
}

async function loadWorkers() {

  const res = await fetch("http://localhost:7000/workers");

  const workers = await res.json();

  const grid = document.getElementById("workersGrid");

  grid.innerHTML = "";

  workers.forEach(worker => {

    const card = document.createElement("div");

    card.className = "worker-card";

    card.innerHTML = `

      <div class="worker-top">

        <div>
          👷 Worker ${worker.id}
        </div>

        <div class="worker-status ${
          worker.busy ? "worker-busy" : "worker-free"
        }">

          ${worker.busy ? "BUSY" : "FREE"}

        </div>

      </div>

      <div class="worker-meta">

        <div>Type: ${worker.type}</div>

        <div>
          Current Job:
          ${worker.currentJobId || "None"}
        </div>

      </div>

    `;

    grid.appendChild(card);
  });
}

async function loadJobs() {

  const res = await fetch("http://localhost:7000/jobs");

  const jobs = await res.json();

  document.getElementById("totalJobs").textContent = jobs.length;

  document.getElementById("runningJobs").textContent =
    jobs.filter(j => j.status === "RUNNING").length;

  document.getElementById("queuedJobs").textContent =
    jobs.filter(j => j.status === "QUEUED").length;

  document.getElementById("failedJobs").textContent =
    jobs.filter(j => j.status === "FAILED").length;

  jobs.forEach(job => {

    let card = jobMap.get(job.id);

    if (!card) {

      card = createJobCard(job);

      jobMap.set(job.id, card);
    }

    updateJobCard(card, job);

    const column = getColumn(job.status);

    if (card.parentNode !== column) {
      column.appendChild(card);
    }
  });
}

loadJobs();
loadWorkers();

setInterval(() => {

  loadJobs();
  loadWorkers();

}, 1000);