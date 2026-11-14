# Student Freelance Job Board - Backend API

REST API for a job board where **clients** post small freelance jobs and **students** apply for them.
Built for the ITS2020 Rapid Application Development coursework (MERN + TypeScript).

- **Live API (backend):** https://student-freelance-job-board.vercel.app  (try `https://student-freelance-job-board.vercel.app/api/jobs`)
- **Live website (frontend):** https://student-freelance-job-board-web.vercel.app
- **Frontend repository:** https://github.com/yasadidias/student-freelance-job-board-web
- **Backend repository:** https://github.com/yasadidias/student-freelance-job-board

## Features

- JWT authentication with **access token (15 min) + refresh token (7 days)**
- Passwords hashed with **bcryptjs**
- **Role-based authorization**: `ADMIN`, `MANAGER` (client), `USER` (student)
- CRUD for two related entities: **Job** and **Application** (plus User)
- Search, filter and pagination on jobs
- Input validation with **zod**, consistent JSON responses, correct HTTP status codes
- **Advanced feature 1 - AI cover letter** (Google Gemini; falls back to a template if no key is set)
- **Advanced feature 2 - Status emails** (Nodemailer; the student gets an email when accepted / rejected)
- **Weekly free-time timetable**: students save the hours they are free; clients see it on each application
- Security: helmet, CORS allow-list, rate limiting, `select: false` on passwords, secrets only in `.env`

## Tech stack

Node.js, Express 5, TypeScript, MongoDB Atlas, Mongoose, JWT, bcryptjs, zod, helmet, express-rate-limit, Nodemailer, @google/genai

## Folder structure

```
src/
  config/        database connection
  models/        User, Job, Application (Mongoose schemas)
  controllers/   request handling logic
  routes/        URL -> controller mapping
  middleware/    authenticate, authorize, validate, error handler
  validators/    zod schemas
  services/      AI and email helpers
  utils/         JWT helpers, HttpError, shared helpers
  scripts/       seedAdmin.ts
  index.ts       app entry point
```

## Run locally

```bash
npm install
copy .env.example .env    # macOS/Linux: cp .env.example .env  (then fill in the values)
npm run seed:admin        # creates the first admin account
npm run dev               # http://localhost:5000
```

Build for production: `npm run build` then `npm start`.

## Environment variables

See [.env.example](.env.example). Never commit the real `.env` file.

## API overview

All responses look like `{ "success": true|false, "message": "...", "data": ... }`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | /api/auth/register | Public | Register as USER or MANAGER |
| POST | /api/auth/login | Public | Login, returns access + refresh token |
| POST | /api/auth/refresh | Public | Get a new access token |
| GET | /api/auth/me | Logged in | Current user |
| GET | /api/jobs | Public | List open jobs (`search`, `category`, `page`, `limit`) |
| GET | /api/jobs/:id | Public | Job details |
| GET | /api/jobs/mine | MANAGER, ADMIN | My posted jobs with applicant counts |
| POST | /api/jobs | MANAGER, ADMIN | Create a job |
| PUT | /api/jobs/:id | Owner, ADMIN | Update a job |
| DELETE | /api/jobs/:id | Owner, ADMIN | Delete a job and its applications |
| POST | /api/applications | USER | Apply to a job (once per job) |
| GET | /api/applications/mine | USER | My applications |
| DELETE | /api/applications/:id | USER | Withdraw a pending application |
| GET | /api/applications/job/:jobId | Owner, ADMIN | Applicants for a job (with free times) |
| PATCH | /api/applications/:id/status | Owner, ADMIN | Accept / reject (sends email) |
| PUT | /api/users/me | Logged in | Change my name |
| PUT | /api/users/me/availability | USER | Save weekly free times |
| POST | /api/ai/cover-letter | USER | Generate a cover letter |
| GET | /api/admin/stats | ADMIN | Totals |
| GET | /api/admin/users | ADMIN | List / search users |
| PATCH | /api/admin/users/:id | ADMIN | Block / unblock |
| DELETE | /api/admin/users/:id | ADMIN | Delete user and their data |

## Deployment (Vercel)

The API is deployed to Vercel as a serverless Express app (Vercel sets `process.env.VERCEL`, so `src/index.ts` skips `app.listen` there and connects to MongoDB per request with a cached connection).

1. Push this repository to GitHub.
2. Vercel > Add New > Project > import the repo (framework preset: **Express**).
3. Add every variable from `.env.example` in Settings > Environment Variables. Set `CLIENT_URL` to the frontend URL (`https://student-freelance-job-board-web.vercel.app`, no trailing slash).
4. In MongoDB Atlas > Network Access allow Vercel's servers (for this coursework `0.0.0.0/0`).
5. Deploy. Every push to `main` redeploys automatically. Check `https://student-freelance-job-board.vercel.app/api/jobs`.

## Screenshots

### Live API response (`GET /api/jobs`)
![GET /api/jobs](docs/screenshots/api-jobs.png)

The full user interface (with screenshots) is in the [frontend repository](https://github.com/yasadidias/student-freelance-job-board-web).

## Author

Yasadi Dias
