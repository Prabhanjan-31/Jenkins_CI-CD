const { getAllWorkers } = require("./workers/workerPool");
const express = require("express");
const cors = require("cors");
const { initWorkers } = require("./workers/workerPool");


const webhookRoute = require("./routes/webhook");
const jobs = require("./store/jobStore");
const startWorkManager = require("./manager/workManager");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use("/webhook", webhookRoute);

/* Dashboard APIs */

app.get("/jobs", (req, res) => {
  res.json(jobs);
});

app.get("/jobs/queued", (req, res) => {
  res.json(jobs.filter(j => j.status === "QUEUED"));
});

app.get("/jobs/in-progress", (req, res) => {
  res.json(jobs.filter(j => j.status === "RUNNING"));
});

app.get("/jobs/completed", (req, res) => {
  res.json(jobs.filter(j => j.status === "COMPLETED"));
});

app.get("/workers", (req, res) => {
  res.json(getAllWorkers());
});

app.get("/jobs/queued", (req, res) => {

  const queuedJobs = jobs.filter(
    job => job.status === "QUEUED"
  );

  res.json(queuedJobs);
});

app.get("/jobs/waiting", (req, res) => {

  const waitingJobs = jobs.filter(
    job => job.status === "WAITING_FOR_WORKER"
  );

  res.json(waitingJobs);
});

app.get("/jobs/running", (req, res) => {

  const runningJobs = jobs.filter(
    job => job.status === "RUNNING"
  );

  res.json(runningJobs);
});

app.get("/jobs/completed", (req, res) => {

  const completedJobs = jobs.filter(
    job => job.status === "COMPLETED"
  );

  res.json(completedJobs);
});

app.get("/jobs/failed", (req, res) => {

  const failedJobs = jobs.filter(
    job => job.status === "FAILED"
  );

  res.json(failedJobs);
});

startWorkManager();
initWorkers();

app.listen(7000, () => {
  console.log("SmartCI running on port 7000");
});