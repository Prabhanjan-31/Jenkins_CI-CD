const express = require("express");
const router = express.Router();

const scheduleJob = require("../scheduler/jobScheduler");

router.post("/", (req, res) => {

  console.log("Webhook received");

const repo = req.body.repository?.name;
const rawBranch = req.body.ref;
const branch = rawBranch.replace("refs/heads/", "");
const languages_url = req.body.repository?.languages_url;
const clone_url = req.body.repository?.clone_url;

  // ✅ Send response immediately
  res.status(200).json({ message: "Webhook received" });

  // ✅ Process AFTER response
  setImmediate(() => {
    try {
      scheduleJob(repo, branch, "commit", languages_url, clone_url);
    } catch (err) {
      console.error("Job scheduling failed:", err);
    }
  });

});

module.exports = router;