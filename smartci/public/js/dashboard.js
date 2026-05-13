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
setInterval(loadJobs, 1000);