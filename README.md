# ⚡ SmartCI

A **self-built CI/CD server** written from scratch in Node.js - a lightweight alternative to GitHub Actions or Jenkins. SmartCI listens to GitHub webhook events, automatically clones your repository, reads your pipeline config, and executes build/test stages on every `git push`.

---

## 📌 Table of Contents

- [What is SmartCI?](#-what-is-smartci)
- [Architecture](#-architecture)
- [How It Works](#-how-it-works)
- [Pipeline Config (.smartci.yml)](#-pipeline-config-smartciyml)
- [Job Lifecycle](#-job-lifecycle)
- [Worker Pool](#-worker-pool)
- [Priority Queue](#-priority-queue)
- [Dashboard](#-dashboard)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Hosting SmartCI](#-hosting-smartci)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Key Design Decisions](#-key-design-decisions)

---

## 🧠 What is SmartCI?

SmartCI is a **custom CI/CD orchestration engine** built without any external CI platforms. It demonstrates real DevOps concepts from the ground up:

- **Webhooks** - GitHub notifies SmartCI on every push
- **Pipeline-as-Code** - pipeline stages are defined in `.smartci.yml` inside the repo
- **Worker Pool** - typed workers handle jobs concurrently by language
- **Priority Scheduling** - production branch jobs jump ahead of feature branch jobs

> Think of it as a mini Jenkins you built yourself — every `git push` triggers a full automated pipeline run.

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│                  GitHub Repository                │
└───────────────────┬──────────────────────────────┘
                    │ git push (webhook event)
                    ▼
┌──────────────────────────────────────────────────┐
│                   SmartCI Server                  │
│               (Port 7000)                         │
│                                                   │
│  Webhook → Scheduler → Priority Queue             │
│         → Work Manager → Worker Pool              │
│         → Pipeline Manager → OS child process     │
│         → Job Store → REST Dashboard API          │
└──────────────────────────────────────────────────┘
                    │
                    ▼
         http://localhost:7000/dashboard.html
         (Real-time Kanban Dashboard)
```

---

## 🔄 How It Works

```
Developer → git push
              │
              ▼
       GitHub fires POST to:
       http://<server>:7000/webhook
              │
              ▼
       webhook.js receives event
       Responds 200 OK immediately (non-blocking)
              │
              ▼
       jobScheduler.js creates a Job
       (assigns priority based on branch name)
              │
              ▼
       jobQueue.js inserts into Priority Queue
              │
              ▼
       workManager.js (polls every 3s)
       → Calls GitHub API to detect repo language
       → Finds available Worker matching that language
              │
              ▼
       executeJob():
         git clone <repo> → workspace/job-{id}/
              │
              ▼
       pipelineManager.js
       → Parses .smartci.yml from the cloned repo
       → Runs each stage as an OS child process
              │
              ▼
       Job status: COMPLETED ✅ or FAILED ❌
       Worker released back to pool
```

---

## 📄 Pipeline Config (`.smartci.yml`)

Developers define their pipeline **inside the repository** as a YAML file - the same philosophy as GitHub Actions:

```yaml
build:
  script:
    - echo "Installing dependencies..."
    - npm install

run_tests:
  script:
    - echo "Running tests..."
    - npm test

# security_scan:
#   script:
#     - npm audit --audit-level=high
```

- Each top-level key is a **stage name** (e.g., `build`, `run_tests`)
- Each item under `script` is an **OS command** executed sequentially
- Stages run **one after the other** — if one stage fails, the pipeline stops immediately
- Comment out stages with `#` to disable them without deleting

---

## 🔁 Job Lifecycle

Every pipeline run is tracked as a **Job** that transitions through these states:

```
QUEUED → WAITING_FOR_WORKER → RUNNING → COMPLETED
                                      ↘ FAILED
```

| Status | Meaning |
|---|---|
| `QUEUED` | Job received, language detection pending |
| `WAITING_FOR_WORKER` | Language detected, waiting for a free worker |
| `RUNNING` | Assigned to a worker, pipeline actively executing |
| `COMPLETED` | All stages passed successfully |
| `FAILED` | A stage exited with a non-zero code — pipeline stopped |

---

## 👷 Worker Pool

SmartCI maintains a **typed worker pool** — workers are matched to jobs based on the repository's dominant programming language, auto-detected via the GitHub API.

| Worker Type | Count | Handles |
|---|---|---|
| `node` | 2 | JavaScript repositories |
| `python` | 2 | Python repositories |
| `cpp` | 1 | C++ repositories |

Worker lifecycle:
- **Free** → job arrives → **Busy** (assigned to job)
- Job completes or fails → **Released** back to pool
- If no matching worker is free, the job stays in `WAITING_FOR_WORKER` until one is available

---

## 🔢 Priority Queue

Jobs are **not** processed FIFO. The branch name determines priority, so production pushes are never blocked by low-priority feature branches:

| Branch | Priority | Label |
|---|---|---|
| `main` | 1 (highest) | 🔴 HIGH |
| `staging` | 2 | 🟡 MEDIUM |
| `dev` | 3 (lowest) | 🟢 LOW |
| any other branch | 3 | 🟢 LOW |

Within the same priority level, jobs are processed in **FIFO order** (first arrived, first served).

---

## 📊 Dashboard

SmartCI serves a **real-time web dashboard** at `http://localhost:7000/dashboard.html`:

- **Kanban board** — columns for Queued, Waiting, Running, Completed, Failed
- **Worker panel** — shows each worker's type, status (busy/free), and current job
- **Metrics bar** — total jobs, currently running, queued, and failed counts
- **Auto-refresh** — polls the REST API every few seconds, no manual reload needed

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Server** | Node.js, Express.js |
| **Pipeline execution** | Node.js `child_process.exec` (OS-level) |
| **Job storage** | In-memory array (no database) |
| **Pipeline config** | YAML (`.smartci.yml`) |
| **Language detection** | GitHub REST API |
| **Dashboard UI** | Vanilla HTML, CSS, JavaScript |
| **Process manager** | PM2 (for hosting) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18+
- Git
- npm

### Run Locally

```bash
# Clone the repository
git clone https://github.com/your-username/your-repo.git
cd your-repo/smartci

# Install dependencies
npm install

# Start SmartCI
node server.js
# Server:    http://localhost:7000
# Dashboard: http://localhost:7000/dashboard.html
```

SmartCI is now listening. Point your GitHub webhook to `http://localhost:7000/webhook` (use ngrok for local testing — see [Hosting SmartCI](#-hosting-smartci)).

### Simulate a Push (Local Testing)

Use the included script to simulate multiple rapid git pushes and watch SmartCI queue and process them:

```powershell
# From the repo root (Windows)
.\multi-push.ps1
```

---

## 🌐 Hosting SmartCI

To receive real GitHub webhooks, SmartCI must run on a **publicly accessible server**.

### Requirements

| Requirement | Why |
|---|---|
| Public server (VPS or cloud VM) | GitHub needs a public URL to POST webhooks to |
| Node.js v18+ | SmartCI runtime |
| `git` installed on the server OS | SmartCI clones repos using `git clone` |
| Port `7000` open in firewall | SmartCI listens on this port |

### Recommended Platforms

| Platform | Notes |
|---|---|
| **DigitalOcean Droplet** | ~$6/month Linux VPS, full OS control |
| **AWS EC2** | Free tier available, production-grade |
| **Railway.app / Render.com** | Easiest — deploy directly from GitHub |
| **ngrok** | Local testing only — tunnels `localhost:7000` to a public URL |

### Deploy on a Linux VPS

```bash
# SSH into your server, then:
git clone https://github.com/your-username/your-repo.git
cd your-repo/smartci
npm install

# Install PM2 — keeps SmartCI alive after terminal closes
npm install -g pm2

pm2 start server.js --name smartci
pm2 save
pm2 startup    # auto-restart SmartCI on OS reboot
```

### Configure GitHub Webhook

1. Go to your GitHub repo → **Settings → Webhooks → Add webhook**
2. **Payload URL:** `http://<your-server-ip>:7000/webhook`
3. **Content type:** `application/json`
4. **Which events:** Just the `push` event
5. Click **Add webhook**

From now on, every `git push` to the repo will automatically trigger a SmartCI pipeline run.

> **⚠️ Linux Note:** The default `.smartci.yml` uses `powershell -Command "Start-Sleep -Seconds 3"` which is Windows-only. On a Linux server, replace it with `sleep 3`.

---

## 📡 API Reference

All endpoints are on port `7000`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/webhook` | Receives GitHub push webhook events |
| `GET` | `/jobs` | Returns all jobs (all statuses) |
| `GET` | `/jobs/queued` | Jobs in `QUEUED` state |
| `GET` | `/jobs/waiting` | Jobs in `WAITING_FOR_WORKER` state |
| `GET` | `/jobs/running` | Jobs currently executing |
| `GET` | `/jobs/completed` | Successfully completed jobs |
| `GET` | `/jobs/failed` | Failed jobs |
| `GET` | `/workers` | Current worker pool state |

---

## 📁 Project Structure

```
smartci/
│
├── server.js                 # Entry point — Express server + dashboard APIs
│
├── routes/
│   └── webhook.js            # POST /webhook — receives GitHub push events
│
├── scheduler/
│   └── jobScheduler.js       # Creates Job objects and adds them to the queue
│
├── queue/
│   └── jobQueue.js           # In-memory priority queue with FIFO tiebreaking
│
├── utils/
│   └── priorityConfig.js     # Maps branch names to priority values
│
├── manager/
│   └── workManager.js        # Polls queue, detects language, assigns workers
│
├── workers/
│   └── workerPool.js         # Typed worker pool (node × 2, python × 2, cpp × 1)
│
├── pipeline/
│   └── pipelineManager.js    # Parses .smartci.yml and runs stages via exec()
│
├── store/
│   └── jobStore.js           # Shared in-memory job array (acts as the DB)
│
├── workspace/                # Auto-created — isolated clone directories per job
│   └── job-{id}/             # Each job gets its own sandbox folder
│
└── public/
    ├── dashboard.html        # Real-time CI dashboard UI
    ├── js/dashboard.js       # Dashboard polling logic and rendering
    └── css/dashboard.css     # Dashboard styles
```

The `.smartci.yml` file lives in the **root of the target repository** (not inside `smartci/`) — SmartCI reads it after cloning.

---

## 💡 Key Design Decisions

**Non-blocking webhook response**
SmartCI immediately replies `200 OK` to GitHub, then processes the job asynchronously using `setImmediate()`. This prevents GitHub from timing out and retrying the webhook.

**In-memory state (no database)**
Jobs and workers are stored in plain JavaScript arrays. The system is fast and zero-config, but resets on process restart — a deliberate tradeoff for simplicity.

**Pipeline-as-Code**
`.smartci.yml` lives inside the target repository, not on the CI server. Developers fully own and version-control their pipeline without touching the SmartCI server config.

**Workspace isolation**
Each job clones the repo into its own `workspace/job-{id}/` directory — jobs never share files. Old workspaces are automatically cleaned up, keeping only the last 5 (prevents disk exhaustion).

**Language-aware worker matching**
Workers aren't generic — a Python job won't be sent to a Node.js worker. SmartCI calls the GitHub API to detect the dominant language and matches accordingly.

---
