# CareerFlow development branch

This branch adds the job seeker and employer workflows to the existing MERN app.

## Features
- Job seekers: browse/filter open jobs, review details, apply once per job, and view application statuses.
- Employers: post jobs, review their listings, open/close listings, view applicants for their jobs, and update application statuses.
- Security: JWT authentication for protected APIs and role/ownership checks; duplicate application prevention.
- Frontend: role-gated dashboard routes, shared Axios API client, login route fix, logout navigation.

## Laptop setup

Use Node 22 or a Vite-compatible Node release and a running MongoDB instance.

1. In `backend`, run `npm install`. Configure `backend/.env`:
   ```dotenv
   MONGO_URI=mongodb://127.0.0.1:27017/CareerFlow
   JWT_SECRET=replace-with-a-long-random-secret
   PORT=5000
   ```
   Then run `npm start`.
2. In `frontend`, run `npm ci` then `npm run dev`.
3. Browse to `http://localhost:5173`; register one job seeker and one employer account.

If frontend and backend have different origins, specify the browser-visible API endpoint in `frontend/.env.local`:
```dotenv
VITE_API_URL=http://localhost:5000/api
```

## Test manually
1. Employer logs in and creates a job.
2. Job seeker logs in, searches, views details, and applies.
3. The application shows in My applications.
4. Repeat application request: server should return HTTP 409.
5. Employer views applicants and updates status.
6. Job seeker sees the updated status.
7. Employer closes job; it disappears from the open-job listing and rejects new applications.
8. An unauthenticated user cannot POST a job or submit an application.
9. Job seekers cannot create jobs; employers cannot apply to jobs.
10. Employer A cannot view applicants or update applications for Employer B's jobs.

## Important notes
- Keep `.env` files and credentials out of Git.
- The existing database may have both `Jobs` and `jobs` collections. Mongoose's default model naming uses lowercase plurals. Do not delete collections until you have backed up and reconciled data.
- The old Admin page is a placeholder and has no admin authentication; it is not exposed as a navigable route.
- This branch has not been end-to-end tested against your live MongoDB environment.
- The user interface changes in this branch were made against GitHub's October 13 base version. Back up or commit newer laptop-only work before switching branches.
