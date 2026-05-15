# Team Task Manager (Full-Stack)

A web application for creating projects, assigning tasks, and tracking progress with **role-based access control** (Admin / Member).

## Live Demo

> Deploy to Railway and add your live URL here: `https://your-app.up.railway.app`

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React 18, Vite, Bootstrap 5         |
| Backend  | Node.js, Express                    |
| Database | MongoDB (Mongoose)                  |
| Auth     | JWT (JSON Web Tokens)               |

## Features

- **Authentication** — Signup & Login with JWT
- **Projects & Teams** — Create projects, add members by email, project-level admin/member roles
- **Tasks** — Create, assign, update status, set priority & due dates
- **Dashboard** — Stats, tasks by status, overdue tasks, my tasks, recent activity
- **RBAC** — Global roles (`admin`, `member`) + project-level roles

## Project Structure

```
team-task-manager/
├── backend/          # Express REST API
│   └── src/
│       ├── models/   # User, Project, Task
│       ├── routes/   # auth, projects, tasks, dashboard
│       └── middleware/
├── frontend/         # React + Vite + Bootstrap
│   └── src/
│       ├── pages/    # Login, Signup, Dashboard, Projects
│       └── components/
├── package.json      # Root scripts for Railway
└── README.md
```

## Local Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone & install

```bash
cd team-task-manager
npm run install-all
```

### 2. Configure backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/team-task-manager
JWT_SECRET=change-this-to-a-long-random-string
NODE_ENV=development
```

### 3. Run (two terminals)

**Terminal 1 — API:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:5173** (Vite proxies `/api` to port 5000).

### 4. Production build (single server)

```bash
npm run build --prefix frontend
npm start --prefix backend
```

Open **http://localhost:5000** — API serves the built React app.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user (auth) |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Project details |
| POST | `/api/projects/:id/members` | Add team member |
| GET | `/api/tasks/project/:projectId` | Tasks for project |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| GET | `/api/dashboard` | Dashboard stats |

All protected routes require header: `Authorization: Bearer <token>`

## Deploy on Railway

1. Push this repo to **GitHub**.
2. Create a project on [Railway](https://railway.app).
3. Add **MongoDB** plugin (or use MongoDB Atlas URI).
4. Deploy from GitHub repo root (`team-task-manager` folder or monorepo root).
5. Set environment variables on the backend service:

   | Variable | Value |
   |----------|-------|
   | `MONGODB_URI` | From Railway MongoDB or Atlas |
   | `JWT_SECRET` | Long random string |
   | `NODE_ENV` | `production` |
   | `PORT` | Railway sets this automatically |

6. Build command (if not using `railway.json`):

   ```bash
   npm install --prefix frontend && npm run build --prefix frontend && npm install --prefix backend
   ```

7. Start command:

   ```bash
   npm start --prefix backend
   ```

8. Copy the generated **public URL** for submission.

## Submission Checklist

- [ ] Live URL (Railway)
- [ ] GitHub repository link
- [ ] README (this file)
- [ ] App fully functional: auth, projects, tasks, dashboard

## Default Usage Tips

1. **Sign up** as Admin to see all projects globally.
2. **Sign up** as Member for standard access.
3. Create a **project** → add teammates by **email** (they must register first).
4. Open project → **create tasks**, assign members, set due dates.
5. Use **Dashboard** to track overdue and in-progress work.

## License

MIT — built for educational assignment purposes.
