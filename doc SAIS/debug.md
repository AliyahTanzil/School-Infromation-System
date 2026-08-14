# SAIS V0 MASTER DEBUGGING AND STARTUP RECOVERY PROTOCOL

You are the senior full-stack debugging engineer responsible for diagnosing and permanently fixing the SAIS monorepo inside the v0 by Vercel development environment.

Do not make speculative changes.

Do not redesign the application.

Do not migrate databases during this debugging task.

Do not delete data.

Do not disable authentication or database security.

Your objective is to make the existing application reliably reach this state:

```text
Dependencies installed
        ↓
Backend starts
        ↓
Backend port confirmed
        ↓
Database connects
        ↓
Health endpoint responds
        ↓
Frontend starts
        ↓
Frontend communicates with backend
        ↓
User registration works
        ↓
User login works
        ↓
Session works
        ↓
Protected dashboard loads
```

---

# KNOWN CURRENT ERRORS

The following errors have already been observed and MUST be included in the investigation.

## Error 1

```text
Error [ERR_MODULE_NOT_FOUND]
Cannot find package 'cookie-parser'
```

## Error 2

```text
Dev server process (PID 475) exited before port 3000 became available.
```

## Error 3

```text
Fatal error during initialization. Please try again.
```

## Error 4

Browser registration failure:

```text
Unable to create account
```

## Error 5

Browser console:

```text
auth.js:25

POST http://localhost:3000/api/auth/register

net::ERR_CONNECTION_REFUSED
```

---

# CURRENT OBSERVED STARTUP LOG

Use this exact evidence during diagnosis:

```text
04:14:20.253Z [SERVER]
Initializing development environment for git-connected project...

04:14:21.964Z [SERVER]
Installing dependencies with npm@11.13.0...

04:14:22.021Z [SERVER]
Installing dependencies...

04:14:28.275Z [SERVER]
> sais-monorepo@1.0.0 prepare
> node .husky/prepare.mjs

04:14:28.354Z [SERVER]
added 347 packages

04:14:29.318Z [SERVER]
Starting dev server: npm run dev (in frontend)

04:14:29.618Z [SERVER]
> sais-frontend@1.0.0 dev
> vite

04:14:29.818Z [SERVER]
VITE v5.4.21 ready

Local:
http://localhost:3000/

Network:
http://100.64.8.224:3000/

04:15:29.623Z [SERVER]
Fatal error during initialization. Please try again.
```

Important observation:

The supplied log explicitly shows the frontend starting.

The supplied log does NOT yet prove that the backend started successfully.

Do not assume that it did.

---

# PRIMARY DEBUGGING PRINCIPLE

Follow:

```text
OBSERVE
   ↓
REPRODUCE
   ↓
TRACE
   ↓
IDENTIFY ROOT CAUSE
   ↓
APPLY MINIMUM FIX
   ↓
RESTART
   ↓
TEST
   ↓
REGRESSION TEST
```

Never follow:

```text
ERROR
 ↓
GUESS
 ↓
CHANGE RANDOM CODE
```

---

# PHASE 1. IDENTIFY THE ACTUAL MONOREPO STRUCTURE

Before modifying anything, inspect the entire repository.

Determine whether the structure resembles:

```text
/
├── package.json
├── package-lock.json
├── frontend/
│   ├── package.json
│   ├── vite.config.*
│   └── src/
├── backend/
│   ├── package.json
│   └── src/
└── ...
```

Do not assume these names.

Search for every:

```text
package.json
package-lock.json
vite.config.*
vercel.json
.env
.env.local
.env.development
.env.example
server.*
app.*
index.*
```

Determine:

```text
Root workspace
Frontend workspace
Backend workspace
Database workspace
Authentication implementation
Package manager
Workspace configuration
```

Inspect the root `package.json` for:

```json
"workspaces"
```

and all scripts such as:

```text
dev
dev:frontend
dev:backend
start
build
prepare
```

Document the actual architecture before modifying scripts.

---

# PHASE 2. DETERMINE WHY ONLY THE FRONTEND APPEARS TO START

The current log says:

```text
Starting dev server: npm run dev (in frontend)
```

Investigate why the v0 environment starts only the frontend workspace.

Determine whether the backend has its own:

```text
npm run dev
npm start
node ...
tsx ...
nodemon ...
```

command.

Run the backend independently before modifying the combined startup process.

Capture:

```text
backend command
backend PID
stdout
stderr
exit code
configured port
actual bound port
```

If the backend crashes, fix that crash before working on frontend authentication.

---

# PHASE 3. FIX COOKIE-PARSER DEPENDENCY CORRECTLY

Known backend error:

```text
ERR_MODULE_NOT_FOUND
Cannot find package 'cookie-parser'
```

Search the repository for:

```text
cookie-parser
```

Determine exactly which backend source file imports it.

Example:

```javascript
import cookieParser from "cookie-parser"
```

or:

```javascript
const cookieParser = require("cookie-parser")
```

Then inspect the `package.json` belonging to THAT backend workspace.

Do not assume installation at repository root is sufficient.

If `cookie-parser` is actively required and missing from the backend workspace, install it into the correct workspace using the repository's npm workspace structure.

For a conventional backend directory this may conceptually be:

```bash
cd backend
npm install cookie-parser
```

If TypeScript types are required:

```bash
npm install -D @types/cookie-parser
```

If npm workspaces are configured, prefer the correct workspace-aware npm command.

Do not guess the workspace name.

Inspect `package.json` first.

After installation verify:

```bash
npm ls cookie-parser
```

and verify that:

```text
backend/package.json
```

contains `cookie-parser` as a runtime dependency.

Also verify that the root/package workspace lockfile is updated.

Do NOT run:

```bash
npm audit fix --force
```

during this debugging process.

The current security vulnerabilities should be documented separately. Do not introduce breaking dependency upgrades while solving runtime startup problems.

---

# PHASE 4. START THE BACKEND INDEPENDENTLY

Before frontend startup, start ONLY the backend.

Do not start Vite yet.

Observe the complete backend logs.

Backend startup must remain alive.

Do not treat:

```text
server starts for one second
```

as success.

Verify that it remains running and is listening on the expected port.

---

# PHASE 5. FIX PORT ARCHITECTURE

Do NOT allow frontend and backend to compete for port 3000.

The preferred development architecture is:

```text
Frontend/Vite
Port 3000

Backend/API
Port 3001
```

unless repository inspection proves a different port allocation is required by v0.

Because v0 currently exposes the Vite application on port 3000, port 3000 should normally remain the frontend preview port.

The backend should normally use a separate internal port such as:

```text
3001
```

Do not blindly move the frontend away from port 3000 if the v0 preview infrastructure expects the frontend there.

Therefore the preferred solution is NOT:

```text
backend = 3000
frontend = random
```

unless repository/environment evidence proves that is required.

The preferred solution is:

```text
backend starts FIRST on 3001

backend health verified

frontend starts SECOND on 3000
```

If port 3001 is occupied, determine which process owns it before choosing another backend port.

---

# PHASE 6. PORT OCCUPANCY CHECK

Before starting either service, inspect active listeners.

Use commands supported by the environment.

Possible examples:

```bash
lsof -i :3000
lsof -i :3001
```

or:

```bash
ss -ltnp
```

Record:

```text
Port
PID
Process
Command
Owner
```

Never kill arbitrary processes.

Only terminate a process after proving that it is an obsolete SAIS process or disposable development process.

Never execute broad destructive commands such as:

```text
killall node
pkill -9 node
```

without identifying the affected processes.

---

# PHASE 7. MAKE BACKEND PORT CONFIGURABLE

The backend must not hard-code port 3000 if the frontend needs port 3000.

Use an environment-based configuration.

Conceptually:

```javascript
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3001
```

But inspect existing environment conventions before modifying code.

Do not introduce multiple conflicting definitions for `PORT`.

The backend startup log should clearly say something equivalent to:

```text
SAIS Backend listening on port 3001
```

---

# PHASE 8. CREATE A BACKEND HEALTH ENDPOINT

Create or verify a lightweight endpoint such as:

```text
GET /api/health
```

or:

```text
GET /health
```

Use whichever matches the existing backend architecture.

It should verify at minimum that the backend HTTP process is alive.

Preferred development response:

```json
{
  "status": "ok",
  "service": "sais-backend"
}
```

If appropriate, create a separate database health test rather than making basic process health depend on expensive database operations.

The startup orchestrator must wait until backend health succeeds before starting or declaring the frontend ready.

---

# PHASE 9. INVESTIGATE DATABASE STARTUP

After the backend can remain alive, inspect database connectivity.

Do not test registration before database connectivity works.

Verify:

```text
Database environment variables present
Database host reachable
Database client initializes
Simple query succeeds
Schema exists
Required tables exist
```

Do not print database credentials.

Report environment variables as:

```text
DATABASE_URL = PRESENT
```

not their actual values.

If Prisma is currently used, inspect:

```text
prisma/schema.prisma
Prisma migrations
Prisma client initialization
DATABASE_URL
DIRECT_URL
```

Do not remove Prisma during this debugging exercise.

---

# PHASE 10. FIX DEVELOPMENT STARTUP ORDER

The monorepo must have one reliable development startup process.

Required sequence:

```text
npm install
    ↓
Backend dependency verification
    ↓
Backend starts
    ↓
Backend port binds
    ↓
Backend health check passes
    ↓
Frontend starts
    ↓
Frontend port binds
    ↓
Frontend preview becomes available
```

Do not start frontend and backend blindly at the exact same time if one depends on the other for initialization.

The system should explicitly know whether each child process started successfully.

If the backend exits, the development command must print the ACTUAL backend error rather than only:

```text
Fatal error during initialization
```

---

# PHASE 11. CREATE A SAFE MONOREPO DEV ORCHESTRATOR

Inspect existing scripts before adding dependencies.

If the project already uses tooling capable of managing multiple workspace processes, use it.

Otherwise implement the smallest maintainable orchestration solution.

The orchestrator must:

```text
Start backend
Capture backend logs
Wait for backend health
Fail visibly if backend exits
Start frontend
Capture frontend logs
Keep both processes alive
Forward termination signals
Clean up child processes on shutdown
```

Do not hide errors.

Output should clearly distinguish:

```text
[BACKEND]
[FRONTEND]
[DATABASE]
```

logs.

---

# PHASE 12. FRONTEND PORT BEHAVIOR

The user requested that the backend start first and the frontend avoid colliding with the backend.

Implement that safely.

However:

Do not blindly give the frontend an unpredictable random port if v0 requires port 3000 for preview.

First detect whether v0 expects the frontend on port 3000.

If it does:

```text
Backend = configurable internal port, default 3001
Frontend = 3000
```

If the environment truly supports a dynamic frontend port, use a controlled available-port detection mechanism.

Do not create random ports without propagating the selected port into all dependent configuration.

---

# PHASE 13. FIX API ROUTING

Current browser request:

```text
POST http://localhost:3000/api/auth/register
```

This MUST be investigated.

Determine whether port 3000 currently represents:

```text
Frontend only
```

or:

```text
Frontend plus API proxy
```

If the backend runs on port 3001 and Vite runs on 3000, do NOT leave an accidental API architecture where browser requests assume the backend also exists directly on 3000.

Preferred Vite development architecture:

```text
Browser
   ↓
http://localhost:3000/api/*
   ↓
Vite proxy
   ↓
http://localhost:3001/api/*
   ↓
SAIS backend
```

This allows frontend code to use:

```javascript
/api/auth/register
```

instead of hard-coding:

```javascript
http://localhost:3000/api/auth/register
```

or:

```javascript
http://localhost:3001/api/auth/register
```

throughout the codebase.

Inspect `vite.config.js`, `vite.config.ts`, or equivalent.

Configure the development proxy if the architecture supports it.

Conceptually:

```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true
    }
  }
}
```

Adapt this to the actual repository.

Do not blindly paste this configuration.

---

# PHASE 14. REMOVE INCORRECT HARDCODED API BASE URLS

Search the frontend for:

```text
localhost:3000
localhost:3001
127.0.0.1
/api/
VITE_API_URL
API_URL
BASE_URL
axios.create
```

Pay special attention to:

```text
auth.js
```

because the current console reports:

```text
auth.js:25
POST http://localhost:3000/api/auth/register
```

Determine how that URL is constructed.

Do not replace it randomly.

For development, prefer relative API paths when a Vite proxy is configured:

```javascript
/api/auth/register
```

For production, determine the actual deployment architecture before setting a production API base URL.

Never hard-code localhost into production frontend code.

---

# PHASE 15. VERIFY VITE PROXY

After configuration:

Browser sends:

```text
POST /api/auth/register
```

Vite should forward it internally to:

```text
backend_port/api/auth/register
```

Test:

```text
GET /api/health
```

through the frontend origin.

Expected chain:

```text
Browser
 ↓
localhost:3000/api/health
 ↓
Vite
 ↓
localhost:3001/api/health
 ↓
Backend
 ↓
200 OK
```

Only after this works should registration be tested.

---

# PHASE 16. FIX CORS AND COOKIE CONFIGURATION

Because authentication may use cookies, inspect:

```text
cookie-parser
cors
credentials
SameSite
Secure
HttpOnly
domain
path
session middleware
JWT cookie handling
```

Do not randomly enable:

```text
Access-Control-Allow-Origin: *
```

together with credentialed cookies.

For development, configure frontend/backend origins correctly according to the architecture.

If the Vite proxy makes browser communication same-origin, preserve that advantage where practical.

---

# PHASE 17. TRACE REGISTRATION END TO END

Once server health is confirmed, trace:

```text
Registration Form
      ↓
AuthContext.jsx
      ↓
auth.js
      ↓
Axios/fetch
      ↓
Vite proxy
      ↓
Backend registration endpoint
      ↓
Validation
      ↓
Database
      ↓
Password hashing
      ↓
User creation
      ↓
Role/profile creation
      ↓
Response
```

The current trace mentions:

```text
register @ auth.js:25
register @ AuthContext.jsx:30
App.jsx:138
```

Inspect those exact locations.

Determine whether registration failure occurs at:

```text
network
proxy
backend
database
validation
duplicate constraint
password hashing
role assignment
response serialization
```

Report the exact failure.

---

# PHASE 18. VERIFY REGISTRATION ROUTE EXISTS

Confirm that the backend actually contains:

```text
POST /api/auth/register
```

or determine the real route.

Check route mounting carefully.

For example, if backend code does:

```javascript
app.use('/api/auth', authRouter)
```

and router does:

```javascript
router.post('/register', ...)
```

then the final route is:

```text
POST /api/auth/register
```

Do not change frontend URLs until the actual backend route has been verified.

---

# PHASE 19. REGISTRATION TEST

Test registration directly against the backend first.

Conceptually:

```text
POST backend-port/api/auth/register
```

Expected:

```text
2xx success
```

Then verify the database.

Confirm:

```text
User row exists
Password stored correctly as hash
Role/profile relationship exists
No duplicate identity
Required foreign keys valid
```

Then test registration through the Vite proxy.

This establishes:

```text
Backend route works directly
+
Frontend proxy works
+
Frontend form works
```

---

# PHASE 20. TRACE LOGIN END TO END

After registration passes, test login.

Trace:

```text
Login Form
 ↓
AuthContext
 ↓
auth.js
 ↓
POST /api/auth/login
 ↓
Vite proxy
 ↓
Backend
 ↓
User lookup
 ↓
Password verification
 ↓
Token/session creation
 ↓
Cookie/token response
 ↓
Frontend auth state
 ↓
Protected route
```

Do not combine registration and login troubleshooting until registration connectivity is stable.

---

# PHASE 21. LOGIN TEST MATRIX

Test:

```text
Valid registered user
Correct password

Valid registered user
Wrong password

Unknown user

Duplicate registration attempt

Valid login
Refresh browser

Valid login
Protected dashboard

Logout

Login again
```

Return appropriate HTTP statuses.

Do not convert all errors to HTTP 500.

---

# PHASE 22. INVESTIGATE THE 60-SECOND FAILURE

The timing is important.

Frontend becomes ready around:

```text
04:14:29
```

Fatal initialization appears around:

```text
04:15:29
```

approximately 60 seconds later.

Investigate whether v0 has an initialization/readiness timeout caused by the expected application endpoint or process not becoming fully healthy.

Do NOT automatically conclude that the 60-second delay means a specific timeout mechanism.

Collect evidence.

Investigate:

```text
Backend never launched
Backend crashed
Required readiness process missing
Preview health check failure
Port mismatch
Child process termination
Workspace dev command exiting
Environment initialization failure
```

Capture all logs immediately preceding the fatal initialization message.

---

# PHASE 23. INVESTIGATE THE OLD PID 475 ERROR

Known prior error:

```text
Dev server process (PID 475) exited before port 3000 became available.
```

Do not automatically call this a port collision.

The process may have crashed BEFORE opening the port.

Determine whether its chain was:

```text
process starts
 ↓
imports backend module
 ↓
cookie-parser missing
 ↓
ERR_MODULE_NOT_FOUND
 ↓
process exits
 ↓
port never becomes available
```

If logs prove this, record `cookie-parser` as the root cause for that specific startup attempt.

If not, continue investigation.

---

# PHASE 24. DISTINGUISH THREE DIFFERENT PORT FAILURES

Do not mix these cases.

## Case A. Real port collision

```text
Backend attempts 3000
Frontend already owns 3000
EADDRINUSE
```

Fix by assigning separate ports.

## Case B. Backend dependency crash

```text
Backend starts
cookie-parser import fails
Backend exits
Port never binds
```

Fix dependency/workspace configuration.

## Case C. Frontend/environment shuts down

```text
Vite successfully binds 3000
Later parent development environment fails
Vite disappears
Browser receives ERR_CONNECTION_REFUSED
```

Find the parent initialization failure.

More than one case may be happening in different startup attempts.

---

# PHASE 25. DO NOT CONFUSE CONNECTION REFUSED WITH HTTP ERROR

Current browser error:

```text
net::ERR_CONNECTION_REFUSED
```

means the browser did not receive an HTTP response from the requested server.

This is different from:

```text
404
401
403
500
```

Therefore do not debug database registration logic until connectivity has been restored.

Required order:

```text
Server reachable
 ↓
API route reachable
 ↓
HTTP response received
 ↓
Authentication logic debugged
```

---

# PHASE 26. STRUCTURED LOGGING

Improve development logs enough to show service state.

Desired startup output:

```text
[SAIS] Starting development environment

[BACKEND] Checking dependencies
[BACKEND] Starting...
[BACKEND] Port: 3001
[BACKEND] Health: PASS

[DATABASE] Connection: PASS

[FRONTEND] Starting...
[FRONTEND] Port: 3000
[FRONTEND] Ready

[PROXY] /api -> backend:3001

[SAIS] Development environment ready
```

If backend crashes:

```text
[BACKEND] FAILED
Error:
<actual exception>
```

Never replace the real error with only:

```text
Fatal error during initialization
```

---

# PHASE 27. PROCESS LIFECYCLE MANAGEMENT

If a combined development script is created, it must handle child-process lifecycle correctly.

When the parent stops:

```text
Backend child stopped
Frontend child stopped
No orphan processes
Ports released
```

When backend unexpectedly exits:

```text
Actual backend exit code shown
Actual stderr shown
Development startup marked failed
```

Do not allow a silent zombie process to continue occupying ports.

---

# PHASE 28. ENVIRONMENT VARIABLE AUDIT

Inspect all environment variable references.

Build an internal table containing:

```text
Variable
Used by
Required
Present/Missing
Client-safe/Server-only
```

Never print secret values.

Pay particular attention to:

```text
PORT
BACKEND_PORT
VITE_API_URL
DATABASE_URL
JWT_SECRET
SESSION_SECRET
COOKIE_SECRET
NODE_ENV
FRONTEND_URL
CORS_ORIGIN
```

Use the actual variables discovered in the repository.

Do not add duplicate environment conventions unless required.

---

# PHASE 29. DO NOT EXPOSE SERVER SECRETS TO VITE

Anything prefixed with:

```text
VITE_
```

can become frontend-accessible.

Never place:

```text
database password
JWT signing secret
service-role key
private API credentials
```

inside client-facing Vite environment variables.

Only public configuration belongs there.

---

# PHASE 30. PACKAGE WORKSPACE VALIDATION

Because this is identified in the log as:

```text
sais-monorepo@1.0.0
```

treat workspace dependency correctness as high priority.

Verify that dependencies used by backend runtime code belong to the backend package.

Verify:

```text
package.json
package-lock.json
workspace definitions
npm installation
Node module resolution
```

Do not depend accidentally on package hoisting.

A clean installation must produce the same working result.

---

# PHASE 31. CLEAN-INSTALL TEST

After dependency fixes, verify the repository can work from a clean dependency installation.

Do this without deleting application data.

A fresh dependency installation should successfully resolve:

```text
cookie-parser
backend runtime dependencies
frontend runtime dependencies
shared workspace packages
```

If it only works because an old `node_modules` directory contains undeclared packages, the problem is not fixed.

---

# PHASE 32. BUILD TEST

Once development startup succeeds, run the relevant build commands.

Check:

```text
Frontend build
Backend build if applicable
TypeScript compilation
Workspace build
```

Do not suppress compile errors to make the build green.

Document unrelated warnings separately.

---

# PHASE 33. CURRENT NPM VULNERABILITY WARNINGS

Current install reports:

```text
9 vulnerabilities
5 moderate
2 high
2 critical
```

Record these in the debugging report.

Do NOT automatically run:

```bash
npm audit fix --force
```

during startup debugging.

First stabilize runtime functionality.

Then separately inspect:

```bash
npm audit
```

and create a dependency remediation plan.

Security warnings must not be ignored permanently, but they should not trigger unrelated breaking upgrades during root-cause diagnosis.

---

# PHASE 34. SUCCESS CRITERIA FOR PORT MANAGEMENT

Port debugging is not considered complete until:

```text
Backend has its own port
Frontend has its own port
No EADDRINUSE
No accidental collision
Backend starts first
Backend health passes
Frontend starts afterwards
Vite preview remains reachable
/api requests reach backend
No hardcoded incorrect localhost URL
```

---

# PHASE 35. SUCCESS CRITERIA FOR REGISTRATION

Registration is only PASS when:

```text
Frontend registration form submits
 ↓
Request reaches backend
 ↓
Backend validates request
 ↓
Database creates user
 ↓
Role/profile creation succeeds
 ↓
Successful HTTP response returned
 ↓
Frontend shows successful state
```

---

# PHASE 36. SUCCESS CRITERIA FOR LOGIN

Login is only PASS when:

```text
Created user can enter credentials
 ↓
Request reaches backend
 ↓
Password verification succeeds
 ↓
Session/token is created
 ↓
Frontend receives authenticated state
 ↓
Protected dashboard loads
 ↓
Refresh preserves correct session behavior
```

---

# PHASE 37. AUTOMATED SMOKE TEST

Create a lightweight development smoke test covering:

```text
Backend process alive
Backend health endpoint = 200
Frontend process alive
Frontend page = reachable
Frontend /api/health proxy = 200
Registration endpoint = reachable
Login endpoint = reachable
Database = reachable
```

Do not create destructive production test users.

Use development/test configuration.

---

# PHASE 38. DEBUGGING PRIORITY

Execute corrections in this exact order:

```text
1. Inspect monorepo
        ↓
2. Inspect root/workspace scripts
        ↓
3. Reproduce backend independently
        ↓
4. Fix cookie-parser / missing dependencies
        ↓
5. Start backend independently
        ↓
6. Resolve backend port
        ↓
7. Establish backend health endpoint
        ↓
8. Test database
        ↓
9. Establish backend-first startup
        ↓
10. Start Vite frontend
        ↓
11. Configure /api proxy
        ↓
12. Remove incorrect localhost assumptions
        ↓
13. Test /api/health through frontend
        ↓
14. Test registration directly
        ↓
15. Test registration through frontend
        ↓
16. Test login
        ↓
17. Test session
        ↓
18. Test dashboard
        ↓
19. Run clean-install test
        ↓
20. Run build test
```

Do not skip ahead.

---

# PHASE 39. FILES THAT MUST BE INSPECTED

Search for and inspect relevant versions of:

```text
/package.json
/package-lock.json

/frontend/package.json
/frontend/vite.config.js
/frontend/vite.config.ts
/frontend/src/**/auth.js
/frontend/src/**/AuthContext.jsx
/frontend/src/**/App.jsx

/backend/package.json
/backend/src/**
/backend/server.*
/backend/app.*

/prisma/schema.prisma
/.env*
/backend/.env*
/frontend/.env*
/vercel.json
```

Adapt based on the real repository.

---

# PHASE 40. DO NOT PERFORM THESE ACTIONS

Do not:

```text
Delete database
Reset Prisma
Delete migrations
Replace authentication architecture
Migrate to Supabase
Remove existing tables
Regenerate user IDs
Disable CORS permanently
Disable cookie security permanently
Disable authentication
Disable authorization
Use wildcard credentials configuration
Kill all Node processes
Hard-code production URLs
Expose secrets
Run npm audit fix --force
Rewrite the entire application
```

This task is debugging and recovery only.

---

# PHASE 41. REQUIRED ROOT CAUSE REPORT

Create:

```text
docs/SAIS-V0-DEBUGGING-REPORT.md
```

Document each issue using:

```text
ERROR ID:
ERROR MESSAGE:

OBSERVED BEHAVIOR:

AFFECTED LAYER:

ROOT CAUSE:

EVIDENCE:

FILES AFFECTED:

FIX APPLIED:

TEST PERFORMED:

RESULT:

REGRESSION STATUS:
```

---

# PHASE 42. ERROR IDs

Use at least these identifiers:

```text
DEV-001
Dev environment initialization failure

PORT-001
Port collision or port allocation problem

DEP-001
cookie-parser missing

BACKEND-001
Backend startup failure

API-001
API unreachable

AUTH-001
Registration failure

AUTH-002
Login failure

DB-001
Database connection failure

PROXY-001
Frontend/backend proxy failure
```

Add additional IDs as discovered.

---

# PHASE 43. FINAL HEALTH REPORT

At completion print:

```text
========================================
SAIS DEVELOPMENT HEALTH CHECK
========================================

Monorepo dependencies:
PASS / FAIL

cookie-parser:
PASS / FAIL

Backend startup:
PASS / FAIL

Backend remains alive:
PASS / FAIL

Backend port:
<actual port>

Backend health:
PASS / FAIL

Database connection:
PASS / FAIL

Frontend startup:
PASS / FAIL

Frontend remains alive:
PASS / FAIL

Frontend port:
<actual port>

Port collision:
PASS / FAIL

API proxy:
PASS / FAIL

/api/health:
PASS / FAIL

Registration endpoint:
PASS / FAIL

Create user:
PASS / FAIL

User persisted:
PASS / FAIL

Login:
PASS / FAIL

Session:
PASS / FAIL

Protected dashboard:
PASS / FAIL

Clean installation:
PASS / FAIL

Build:
PASS / FAIL

========================================
OVERALL:
PASS / FAIL
========================================
```

Do not report overall PASS if registration and login have not actually been tested.

---

# CRITICAL ARCHITECTURAL TARGET

Unless repository or v0 constraints prove otherwise, target this development topology:

```text
             v0 DEVELOPMENT ENVIRONMENT
                       │
                       ▼
                ROOT DEV SCRIPT
                       │
                       ▼
              START BACKEND FIRST
                       │
                       ▼
              Backend :3001
                       │
                Health check
                       │
                      PASS
                       │
                       ▼
              START FRONTEND
                       │
                       ▼
                Vite :3000
                       │
             Browser accesses UI
                       │
                       ▼
                    /api/*
                       │
                 Vite proxy
                       │
                       ▼
              Backend :3001
                       │
                       ▼
                 Database/Auth
```

The browser should normally see only:

```text
http://localhost:3000
```

during Vite development.

The browser should not need to know the internal backend development port when the Vite proxy architecture is used.

---

# CRITICAL REGISTRATION TARGET

Correct request flow:

```text
Registration Form
       ↓
auth.js
       ↓
POST /api/auth/register
       ↓
Vite :3000
       ↓
Proxy
       ↓
Backend :3001
       ↓
Auth Controller
       ↓
Database
       ↓
201 / successful response
       ↓
Frontend
```

Not:

```text
Frontend
       ↓
Assumes localhost:3000 is backend
       ↓
Backend not there
       ↓
ERR_CONNECTION_REFUSED
```

---

# IMPORTANT NOTE ABOUT CURRENT EVIDENCE

Do not prematurely report:

```text
"The frontend grabbed port 3000 before the backend."
```

The logs supplied so far prove:

```text
Vite successfully started on port 3000.
```

They do NOT yet prove:

```text
Backend attempted to bind port 3000.
```

They also do not prove:

```text
EADDRINUSE occurred.
```

Investigate before reaching that conclusion.

The backend may instead have:

```text
never been started
```

or:

```text
crashed because cookie-parser was missing
```

or:

```text
crashed because of another backend initialization error.
```

Identify which one is true from evidence.

---

# IMPORTANT NOTE ABOUT ERR_CONNECTION_REFUSED

The browser error:

```text
POST http://localhost:3000/api/auth/register
net::ERR_CONNECTION_REFUSED
```

must not immediately be classified as an authentication bug.

A refused TCP connection occurs before normal registration logic can execute.

Therefore first establish:

```text
process
↓
port
↓
HTTP
↓
API
↓
auth
↓
database
```

in that order.

---

# FINAL INSTRUCTION TO V0

Begin now with diagnostics.

Do not begin by editing `auth.js`.

Do not begin by changing port numbers.

Do not begin by reinstalling every dependency.

Do not begin by replacing the backend.

First inspect the monorepo and reproduce the backend startup independently.

Find exactly why the backend is not shown as successfully running in the supplied v0 initialization log.

Resolve the known `cookie-parser` `ERR_MODULE_NOT_FOUND` problem if it still exists.

Then establish a dedicated backend port.

Start the backend first.

Verify its health endpoint.

Verify its database connection.

Only then start the Vite frontend.

Keep the Vite frontend on port 3000 if that is required by the v0 preview environment.

Route `/api/*` from the frontend to the backend through the development proxy.

Then test registration and login.

For every correction:

```text
Diagnose
→ Fix
→ Restart
→ Test
→ Record result
```

If a correction fails, do not stack another speculative correction on top of it.

Revert or reassess the failed correction and use the new logs to identify the next root cause.

The task is complete only when the entire chain works:

```text
v0 initialization
        ↓
dependencies
        ↓
backend
        ↓
database
        ↓
health endpoint
        ↓
frontend
        ↓
API proxy
        ↓
registration
        ↓
login
        ↓
session
        ↓
dashboard
```
