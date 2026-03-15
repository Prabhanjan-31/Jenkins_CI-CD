import React, { useEffect, useState } from "react";

function App() {

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  
  
  const loadTasks = () => {
    fetch("http://localhost:5000/tasks")
      .then(res => res.json())
      .then(data => setTasks(data));
  };

  const loadProjects = () => {
  fetch("http://localhost:5000/projects")
    .then(res => res.json())
    .then(data => setProjects(data));
};

  useEffect(() => {
    loadProjects();
    loadTasks();
  }, []);

  const signup = () => {

  fetch("http://localhost:5000/signup", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username,
      password
    })
  })
  .then(res => res.json())
  .then(data => {
    alert("User created. Please login.");
  });

};

const login = () => {

  fetch("http://localhost:5000/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      username,
      password
    })
  })
  .then(res => res.json())
  .then(data => {
    setToken(data.token);
  });

};

  const createTask = () => {
    fetch("http://localhost:5000/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        assignedTo,
        projectId: selectedProject
      })
    })
    .then(res => res.json())
    .then(() => {
      loadTasks();
      setTitle("");
      setAssignedTo("");
    });
  };

  const updateStatus = (id, status) => {

    fetch(`http://localhost:5000/tasks/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    }).then(() => loadTasks());

  };

  const createProject = () => {

  fetch("http://localhost:5000/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name: projectName })
  })
  .then(res => res.json())
  .then(() => {
    loadProjects();
    setProjectName("");
  });

};

const deleteProject = () => {

  if (!selectedProject) return;

  fetch(`http://localhost:5000/projects/${selectedProject}`, {
    method: "DELETE"
  })
  .then(() => {
    loadProjects();
    loadTasks();
    setSelectedProject("");
  });

};

const deleteTask = (id) => {

  fetch(`http://localhost:5000/tasks/${id}`, {
    method: "DELETE"
  })
  .then(() => {
    loadTasks();
  });

};

  const renderTasks = (status) => {
    return tasks.filter(task =>
  task.status === status &&
  (!selectedProject || task.projectId === selectedProject)
)
      .map(task => (
        <div key={task.id} style={{
          background: "white",
          padding: "10px",
          margin: "10px",
          borderRadius: "5px",
          boxShadow: "0px 0px 5px gray"
        }}>
          <h4>{task.title}</h4>
          <p>Assigned: {task.assignedTo}</p>
          <button onClick={() => deleteTask(task.id)}>
  Delete
</button>

          {status !== "To Do" && (
            <button onClick={() => updateStatus(task.id, "To Do")}>To Do</button>
          )}

          {status !== "In Progress" && (
            <button onClick={() => updateStatus(task.id, "In Progress")}>In Progress</button>
          )}

          {status !== "Done" && (
            <button onClick={() => updateStatus(task.id, "Done")}>Done</button>
          )}

        </div>
      ));
  };

if (!token) {
  return (

    <div style={{ padding: "20px" }}>

      <h1>Task Management Login</h1>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <br/><br/>

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br/><br/>

      <button onClick={signup}>Signup</button>
      <button onClick={login}>Login</button>

    </div>

  );
}

  return (
    <div style={{ padding: "20px" }}>

      <h1>Task Management App</h1>

      <h2>Create Project</h2>

<input
  placeholder="Project name"
  value={projectName}
  onChange={(e) => setProjectName(e.target.value)}
/>

<button onClick={createProject}>Create Project</button>

<h2>Select Project</h2>

<select onChange={(e) => setSelectedProject(Number(e.target.value))}>

  <option value="">Select Project</option>

  {projects.map(project => (
    <option key={project.id} value={project.id}>
      {project.name}
    </option>
  ))}

</select>

<button onClick={deleteProject}>
  Delete Project
</button>

      <h2>Create Task</h2>

      <input
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        placeholder="Assign to"
        value={assignedTo}
        onChange={(e) => setAssignedTo(e.target.value)}
      />

      <button onClick={createTask}>Create</button>

      <h2>Task Board</h2>

      <div style={{
        display: "flex",
        gap: "20px"
      }}>

        <div style={{ flex: 1, background: "#f2f2f2", padding: "10px" }}>
          <h3>To Do</h3>
          {renderTasks("To Do")}
        </div>

        <div style={{ flex: 1, background: "#f2f2f2", padding: "10px" }}>
          <h3>In Progress</h3>
          {renderTasks("In Progress")}
        </div>

        <div style={{ flex: 1, background: "#f2f2f2", padding: "10px" }}>
          <h3>Done</h3>
          {renderTasks("Done")}
        </div>

      </div>

    </div>
  );
}

export default App;