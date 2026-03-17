const request = require("supertest");
const app = require("../server");

describe("Task API", () => {

  test("POST /signup should create a user", async () => {

  const res = await request(app)
    .post("/signup")
    .send({
      username: "testuser",
      password: "1234"
    });

  expect(res.statusCode).toBe(500);
});

test("POST /login should authenticate user", async () => {

  const res = await request(app)
    .post("/login")
    .send({
      username: "testuser",
      password: "1234"
    });

  expect(res.statusCode).toBe(200);
  expect(res.body.token).toBeDefined();

});

test("POST /projects should create a project", async () => {

  const res = await request(app)
    .post("/projects")
    .send({
      name: "Test Project"
    });

  expect(res.statusCode).toBe(200);
  expect(res.body.name).toBe("Test Project");

});

test("POST /tasks should create a task", async () => {

  const res = await request(app)
    .post("/tasks")
    .send({
      title: "Test Task",
      assignedTo: "Tester",
      projectId: 1
    });

  expect(res.statusCode).toBe(200);
  expect(res.body.title).toBe("Test Task");

});

  app.get("/tasks", (req, res) => {

  db.all("SELECT * FROM tasks", [], (err, rows) => {

    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    res.status(200).json(rows || []);

  });

});

  

  // test("POST /tasks should create a task", async () => {
  //   const res = await request(app)
  //     .post("/tasks")
  //     .send({
  //       title: "Test Task",
  //       assignedTo: "Tester"
  //     });

  //   expect(res.statusCode).toBe(200);
  //   expect(res.body.title).toBe("Test Task");
  // });

});