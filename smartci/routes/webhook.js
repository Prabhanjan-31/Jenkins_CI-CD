const express = require("express");
const router = express.Router();

const scheduleJob = require("../scheduler/jobScheduler");

router.post("/", (req, res) => {

  const { repository, branch, commit_id } = req.body;

  const job = scheduleJob(repository, branch, commit_id);

  res.json({
    message: "Job scheduled",
    job
  });

});

module.exports = router;