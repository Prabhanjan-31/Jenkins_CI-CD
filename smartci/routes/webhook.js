const express = require("express");
const router = express.Router();

const scheduleJob = require("../scheduler/jobScheduler");

router.post("/", (req, res) => {

  console.log("Webhook received");

  const repo = req.body.repository?.name;
  const branch = req.body.ref;

  // ✅ Send response immediately
  res.status(200).json({ message: "Webhook received" });

  // ✅ Process AFTER response
  setImmediate(() => {
    try {
      scheduleJob(repo, branch, "commit");
    } catch (err) {
      console.error("Job scheduling failed:", err);
    }
  });

});

module.exports = router;