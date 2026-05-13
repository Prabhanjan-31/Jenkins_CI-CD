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

startWorkManager();
initWorkers();

app.listen(7000, () => {
  console.log("SmartCI running on port 7000");
});