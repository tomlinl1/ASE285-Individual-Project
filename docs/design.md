---
marp: true
theme: default
paginate: true
class: lead
title: AI Study Hub Design Document
---

# AI Study Hub — Design Document
### Architecture, data model, API, security, testing

**Version:** Sprint 2 (Frontend + Backend + MongoDB + Gemini)

---

## Problem & goals

**Problem:** Most AI chat tools are designed for single-user use and don’t support shared study workflows well.
**Goals:**
- Collaborative chat rooms
- AI replies within a shared context
- Reusable prompt library
- Exportable conversations
- Course-aligned security practices

---

## High-level architecture

**Frontend (Vite + React + TS)**
- SPA with routes for auth, chats, prompts
- Context-based state management (`AuthContext`, `ChatContext`)

**Backend (Node + Express + TS)**
- REST API
- JWT auth
- MongoDB via Mongoose
- Gemini integration server-side

---

## Deployment/runtime topology (dev)

- Browser → Frontend (`http://localhost:5173`)
- Frontend → Backend API (`http://localhost:3001`)
- Backend → MongoDB (local/Atlas)
- Backend → Gemini API (external)

---

## Frontend structure (key modules)

**Routing**

- `/login` (Log in)
- `/register` (Register)
- `/` (Chat list — requires login)
- `/chat/:id` (Chat room — requires login)
- `/prompts` (Prompt library — requires login)

---

## `AuthContext` (frontend)

Responsibilities:
- Store JWT token and user identity
- Persist to browser storage
- Provide an `ApiClient` configured with `Authorization: Bearer <token>`

Key behaviors:
- `login(token, user)` writes to localStorage
- `logout()` clears localStorage

---

## `ChatContext` (frontend)

Responsibilities:
- Load chat rooms for the signed-in user
- Create new chat rooms
- Load messages per room
- Post user messages
- Invite participants
- Keep UI responsive with `isLoading` and `refresh()`

---

## `ApiClient` (frontend)

Responsibilities:
- Central HTTP client with base URL:
  - `VITE_API_BASE_URL` (default `http://localhost:3001`)
- Adds headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer ...` when logged in
- Error handling:
  - Reads `{ error: string }` JSON when present
  - Falls back to HTTP `statusText`

---

## Backend structure (Express)

Core middleware:
- `cors` with `CLIENT_ORIGIN`
- `express.json({ limit: '1mb' })`
- global rate limiting (`express-rate-limit`)

Routers (mounted under `/api`):
- `health`
- `auth`
- `chats`
- `prompts`
- `export`

---

## Auth design (backend)

Endpoints:
- `POST /api/auth/register` → `{ token, user }`
- `POST /api/auth/login` → `{ token, user }`
- `GET /api/auth/me` → `{ id, email }`

Implementation details:
- Passwords hashed with `bcryptjs` (cost factor 12)
- JWT signed with `JWT_SECRET`:
  - `sub` = user id
  - expires in `7d`

---

## Authorization (backend)

`requireAuth` middleware:
- Requires `Authorization: Bearer <token>`
- Verifies JWT with `JWT_SECRET`
- Extracts `sub` into `req.userId`

Protected route pattern:
- Most chat/prompt/export routes call `router.use(requireAuth)`

---

## Chat design (backend)

Endpoints:
- `GET /api/chats` (list rooms for current user)
- `POST /api/chats` (create room)
- `GET /api/chats/:id/messages` (messages)
- `POST /api/chats/:id/messages` (add user message)
- `POST /api/chats/:id/ai-reply` (Gemini reply)
- `POST /api/chats/:id/participants` (invite by email)
- `GET /api/chats/:id/detail` (room + members)

Design choices:
- Rooms are filtered by `participants` containing `req.userId`
- Messages are stored per room and returned sorted by time

---

## Prompt library design (backend)

Endpoints:
- `GET /api/prompts?visibility=public|mine|...`
- `POST /api/prompts`
- `PATCH /api/prompts/:id` (owner only)
- `DELETE /api/prompts/:id` (owner only)

Key properties:
- `visibility: public|private`
- `tags: string[]`
- `ownerUserId`

---

## Export design (backend)

Endpoint:
- `GET /api/chats/:id/export?format=md|txt`

Behavior:
- Verifies user is a chat participant
- Loads messages and resolves user IDs → emails
- Produces:
  - `text/markdown` (default)
  - `text/plain` when `format=txt`

---

## AI integration (Gemini)

Where AI runs:
- **Backend** calls Gemini via REST API

Why server-side?
- Keeps the Gemini API key out of the browser
- Centralizes rate limiting and error handling

Input format:
- Converts chat history into Gemini `contents`
- Labels user turns as `[email]: message` when possible

---

## Data model (MongoDB / Mongoose)

Core collections:
- **User**: `email`, `passwordHash`
- **ChatRoom**: `title`, `participants[]`
- **Message**: `chatRoomId`, `sender`, `model`, `content`, optional `userId`
- **Prompt**: `title`, `content`, `tags[]`, `visibility`, `ownerUserId`, `upvotes`

---

## Validation & error handling

Backend uses `zod` to validate:
- register/login request bodies
- message and prompt inputs
- invite email

Standard error responses:
- `400` invalid input
- `401` missing/invalid token
- `404` not found
- `409` duplicate email
- `500` unexpected server errors

---

## Security considerations (course-aligned)

Authentication:
- JWT with expiration
- Password hashing (`bcryptjs`)

Abuse prevention:
- Rate limiting on auth endpoints and globally

Input safety:
- `zod` schema validation
- JSON body size limit (`1mb`)

Cross-origin:
- CORS restricted to configured `CLIENT_ORIGIN`

Secrets management:
- Secrets stored in `.env` (not committed)

---

## Testing strategy (implemented)

All tests live under `tests/` and run with Vitest.

- **Unit**: isolated functions/utilities (frontend + backend middleware)
- **Integration**: React context/routing and backend routes via Supertest (DB mocked)
- **Regression**: lock in security/robustness behaviors (error handling, auth messaging)
- **Acceptance**: API-level happy path (register → chat → message → export)

---

## Key configuration & environment variables

Frontend:
- `VITE_API_BASE_URL` (default `http://localhost:3001`)

Backend:
- `PORT` (default `3001`)
- `CLIENT_ORIGIN` (default `http://localhost:5173`)
- `MONGODB_URI` (required)
- `JWT_SECRET` (required)
- `GEMINI_API_KEY` (required)
- `GEMINI_MODEL` (optional)

---

# End

