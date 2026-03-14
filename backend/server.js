const db = require("./database");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// let users = [];
// let projects = [];
// let tasks = [];




/* Get all tasks */
app.get("/tasks", (req, res) => {

  db.all("SELECT * FROM tasks", [], (err, rows) => {

    if (err) {
      return res.status(500).json(err);
    }

    res.json(rows);

  });

});

/* Get all projects */
app.get("/projects", (req, res) => {

  db.all("SELECT * FROM projects", [], (err, rows) => {

    if (err) {
      return res.status(500).json(err);
    }

    res.json(rows);

  });

});



const bcrypt = require("bcryptjs");

/* User signup */
app.post("/signup", async (req, res) => {

  const { username, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, hashedPassword],
    function(err) {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({ message: "User created" });

    }
  );

});

const jwt = require("jsonwebtoken");

const SECRET = "smartci-secret";

/* User login */
app.post("/login", (req, res) => {

  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, user) => {

      if (err) {
        return res.status(500).json(err);
      }

      if (!user) {
        return res.status(401).json({ message: "Invalid user" });
      }

      const validPassword = await bcrypt.compare(password, user.password);

      if (!validPassword) {
        return res.status(401).json({ message: "Invalid password" });
      }

      const token = jwt.sign({ id: user.id }, "smartci-secret");

      res.json({ token });

    }
  );

});


/* Create project */
app.post("/projects", (req, res) => {

  const { name } = req.body;

  db.run(
    "INSERT INTO projects (name) VALUES (?)",
    [name],
    function(err) {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        id: this.lastID,
        name
      });

    }
  );

});

/* Create task */
app.post("/tasks", (req, res) => {

  const { title, assignedTo, projectId } = req.body;

  db.run(
    "INSERT INTO tasks (title, assignedTo, status, projectId) VALUES (?, ?, ?, ?)",
    [title, assignedTo, "To Do", projectId],
    function(err) {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({
        id: this.lastID,
        title,
        assignedTo,
        status: "To Do",
        projectId
      });

    }
  );

});

/* Update task status */
app.put("/tasks/:id", (req, res) => {

  const id = req.params.id;
  const { status } = req.body;

  db.run(
    "UPDATE tasks SET status = ? WHERE id = ?",
    [status, id],
    function(err) {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({ message: "Task updated" });

    }
  );

});

app.delete("/projects/:id", (req, res) => {

  const projectId = req.params.id;

  /* delete tasks belonging to the project */

  db.run(
    "DELETE FROM tasks WHERE projectId = ?",
    [projectId],
    function(err) {

      if (err) {
        return res.status(500).json(err);
      }

      /* delete the project */

      db.run(
        "DELETE FROM projects WHERE id = ?",
        [projectId],
        function(err) {

          if (err) {
            return res.status(500).json(err);
          }

          res.json({ message: "Project and tasks deleted" });

        }
      );

    }
  );

});

app.delete("/tasks/:id", (req, res) => {

  const id = req.params.id;

  db.run(
    "DELETE FROM tasks WHERE id = ?",
    [id],
    function(err) {

      if (err) {
        return res.status(500).json(err);
      }

      res.json({ message: "Task deleted" });

    }
  );

});

/* Start server only when running normally */
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

/* Export app for testing */
module.exports = app;