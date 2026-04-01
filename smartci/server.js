
const express = require("express");
const cors = require("cors");



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
  res.json(jobs.filter(j => j.status === "IN_PROGRESS"));
});

app.get("/jobs/completed", (req, res) => {
  res.json(jobs.filter(j => j.status === "COMPLETED"));
});

startWorkManager();

app.listen(7000, () => {
  console.log("SmartCI running on port 7000");
});