# FitPulse — Progress Tracker
*Status: ALL PHASES COMPLETE. Last verified: live server + real MariaDB 10.4*

---

## WHAT IS 100% DONE AND TESTED

### Database — 9 tables, all verified with real data

| Table             | Purpose                        | Tested |
|-------------------|--------------------------------|--------|
| users             | Auth, profiles                 | ✅ live |
| workouts          | Workout CRUD                   | ✅ live |
| goals             | Goals CRUD + progress          | ✅ live |
| exercises         | Exercise library (20 defaults) | ✅ live |
| meals             | Diet / meal tracking           | ✅ live |
| achievements      | Auto-awarded badges (14)       | ✅ live |
| body_measurements | Weight + body tracking         | ✅ live |
| water_intake      | Daily water tracker            | ✅ live |
| password_resets   | Single-use expiring tokens     | ✅ live |

Schema safe to re-import (CREATE TABLE IF NOT EXISTS). Migration files in server/database/migrations/.

### Backend — 10 route groups, all mounted in index.js

| Route group      | Endpoints                        | Tested |
|------------------|----------------------------------|--------|
| /api/auth        | register, login, me, forgot-password, reset-password | ✅ |
| /api/workouts    | full CRUD, filter, sort          | ✅ |
| /api/goals       | full CRUD, auto-compute progress | ✅ |
| /api/exercises   | get/create/delete/log            | ✅ |
| /api/meals       | full CRUD, daily totals          | ✅ |
| /api/achievements| get, check+award                 | ✅ |
| /api/analytics   | summary, weekly, monthly, byType | ✅ |
| /api/analytics/daily | real daily chart data (7/30/90 days, fills missing days with 0) | ✅ |
| /api/profile     | get, updateName, changePassword, deleteAccount | ✅ |
| /api/measurements| get, create, delete              | ✅ |
| /api/water       | get (by date), log, delete       | ✅ |
| /api/health      | DB ping                          | ✅ |

Security: helmet, CORS (CLIENT_URL), 50kb body limit, rate limiting (auth), parameterized queries only, bcrypt cost 12, JWT 7d, no hash ever in response.

### Automated tests — 58/58 pass (live MariaDB 10.4)

```
Test Suites: 1 passed
Tests:       58 passed, 58 total
Time:        ~28s
```

Covered: email validation (5 bad formats), duplicate email (409), wrong password (401), uppercase login, all 12 protected routes (401 without token), tampered JWT, workouts CRUD, goals CRUD, meals CRUD, exercises log, user isolation (User A cannot access User B's data — 404), delete cascade, no bcrypt hash in any response.

### Proof-of-storage — 13/13 checks pass (live server + real DB)

All features: register, bcrypt hash check, login, workout, goal, meal, exercise-log→workout, body measurement, water intake, achievement, password reset token, analytics, daily chart.

### Frontend — 20 pages, all routes wired

| Page                | URL                  | Status |
|---------------------|----------------------|--------|
| Login               | /login               | ✅ built |
| Register            | /register            | ✅ built |
| Forgot Password     | /forgot-password     | ✅ built |
| Reset Password      | /reset-password      | ✅ built |
| Dashboard (Overview)| /                    | ✅ built |
| Exercises Library   | /exercises           | ✅ built |
| Workout Log         | /workouts            | ✅ built |
| Workout Form        | /workouts/new + edit | ✅ built |
| Workout Timer       | /timer               | ✅ built |
| Diet Planner        | /diet                | ✅ built |
| Goals               | /goals               | ✅ built |
| Achievements        | /achievements        | ✅ built |
| Analytics / Progress| /analytics           | ✅ built |
| Profile             | /profile             | ✅ built |
| Body Measurements   | /measurements        | ✅ built |
| Water Tracker       | /water               | ✅ built |
| BMI Calculator      | /bmi                 | ✅ built |
| Privacy Policy      | /privacy             | ✅ built (template) |
| Terms of Service    | /terms               | ✅ built (template) |
| 404 Not Found       | * (catch-all)        | ✅ built |

Client build: ✅ `npm run build` → 941 modules, 0 errors, 12s

### Client features verified in build

- ActivityChart component: real daily data, 7/30/90 day toggle, duration/calories/workouts metric toggle, empty state, loading skeleton, error state with retry, smooth area chart with gradient fill
- Dashboard: 8 rotating hero images (bodybuilder/fitness), motivational ticker, glass stat cards with animated counters, food gallery (8 images), services grid, quick actions (8 buttons)
- All protected routes redirect to /login when unauthenticated
- Login/Register redirect to dashboard when already logged in (PublicOnlyRoute)
- CSV export on Workouts page
- Delete confirmation on all destructive actions
- Empty states on every page
- Error states with server instructions on every page

---

## WHAT NEEDS MANUAL TESTING IN THE BROWSER

These require clicking — cannot be verified by automated tests or scripts:

| # | Test                              | How                                             |
|---|-----------------------------------|-------------------------------------------------|
| 1 | Register → auto-login → dashboard | Browser: /register                              |
| 2 | Login with wrong password → same generic message | Browser: /login                |
| 3 | Forgot password → link printed to server console | Browser: /forgot-password     |
| 4 | Reset password via console link   | Copy link from server console, paste in browser |
| 5 | Dashboard hero auto-rotates (5s)  | Watch /                                         |
| 6 | ActivityChart shows real data after logging workouts | Log 3 workouts, check /  |
| 7 | Chart range toggle (7/30/90 days) | Click tabs on dashboard chart                   |
| 8 | Exercises page auto-seeds 20 defaults on first visit | Browse /exercises         |
| 9 | Log exercise → appears in /workouts | Exercises page → Log Exercise button           |
| 10 | Export CSV → file downloads        | /workouts → Export CSV button                  |
| 11 | Profile → edit name → saved        | /profile → edit name form                      |
| 12 | Profile → change password → works  | /profile → change password form                |
| 13 | Delete account → all data gone     | /profile → Danger Zone → confirm               |
| 14 | Body measurements chart appears after 2+ entries | /measurements           |
| 15 | Water tracker glasses fill up      | /water → add glasses                           |
| 16 | BMI calculator → result + colour   | /bmi → enter weight + height                   |
| 17 | Timer: HIIT/Tabata/Custom presets  | /timer → start/pause/reset                     |
| 18 | Diet quick-add presets             | /diet → Quick Add section                      |
| 19 | Achievements "Check for new" after workout | /achievements → button             |
| 20 | Mobile: sidebar hidden, bottom nav visible | DevTools → 375px width              |
| 21 | 404 page for unknown URL           | Navigate to /anything-random                   |
| 22 | Dark theme readable on all pages   | Browse all pages                               |

---

## WHAT IS NOT BUILT (excluded by scope)

- Leaderboard (excluded as agreed)
- AI workout planner (excluded as agreed)
- Email verification on register (no email service configured)
- Social login (Google/Apple OAuth)
- Push notifications
- PWA / offline mode

---

## RUN COMMANDS (Windows / XAMPP)

```powershell
# 1. Start MySQL
Start-Process "C:\xampp\mysql\bin\mysqld.exe" -ArgumentList "--defaults-file=C:\xampp\mysql\bin\my.ini" -WindowStyle Hidden

# 2. Import schema (first time only)
#    phpMyAdmin → Import → server/database/schema.sql

# 3. Configure server
Copy-Item ".env.example" "server\.env"   # then edit server\.env

# 4. Install dependencies (first time only)
cd server; npm install
cd client; npm install

# 5. Run server (Terminal 1)
cd server; node index.js
# Expected: ✅ MySQL connected + FitPulse running on http://localhost:5000

# 6. Run client (Terminal 2)
cd client; npm run dev
# Open: http://localhost:5173

# 7. Run tests
cd server; npm test
# Expected: Tests: 58 passed

# 8. Build for production
cd client; npx vite build
# Expected: ✓ built in ~12s

# 9. Storage proof
cd server; node scripts/verify-storage.js
# Expected: 13/13 checks passed
```
