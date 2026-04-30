---
marp: true
theme: default
paginate: true
class: lead
title: AI Study Hub User Manual
---

# AI Study Hub — User Manual
### Collaborative chat + prompts + AI assistance

**Audience:** Students / users of the app  
**Version:** Sprint 2 (Frontend + Backend + MongoDB)

---

## What is AI Study Hub?

AI Study Hub is a collaborative, chat-based platform that lets you:

- Create chats and send messages
- Get AI replies in context (Gemini)
- Save reusable prompts in a prompt library
- Export chat history as **Markdown** or **Plain text**

---

## Quick start (Sprint 2)

You will run 3 things:

- **MongoDB** (local or Atlas)
- **Backend API** (`server/`) on port `3001`
- **Frontend** (project root) on port `5173`

---

## Prerequisites

- **Node.js** installed
- **MongoDB** connection available
- **Gemini API key**

---

## Step 1 — MongoDB

**Option A: Local**

- Start MongoDB locally
- Example URI:

`mongodb://127.0.0.1:27017/ai-study-hub`

**Option B: Atlas**

- Create cluster + user
- Copy your connection string for `MONGODB_URI`

---

## Step 2 — Backend setup (`server/`)

From the project root:

1. Install backend deps:
   - `cd server && npm install`
2. Create `server/.env` (copy from `server/.env.example`)
3. Fill in required values:

- `PORT=3001`
- `CLIENT_ORIGIN=http://localhost:5173`
- `MONGODB_URI=...`
- `JWT_SECRET=...` (long random string)
- `GEMINI_API_KEY=...`
- `GEMINI_MODEL=gemini-2.5-flash` (optional)

Start backend:

- `cd server && npm run dev`

---

## Step 3 — Frontend setup (root)

From the project root:

1. Install deps:
   - `npm install`
2. (Optional) Set API base URL in root `.env`:

- `VITE_API_BASE_URL=http://localhost:3001`

Start frontend:

- `npm run dev`

Open the URL shown (usually `http://localhost:5173`).

---

## Health checks (recommended)

Use these to confirm the backend is running:

- `GET /api/health` → `{ "ok": true }`
- `GET /api/health/db` → `{ "ok": true, "mongoConnected": true|false }`

---

## Creating an account

1. Open the app
2. Go to **Register**
3. Enter:
   - Email
   - Password (8+ chars)
4. Submit to create your account

After registration, you should be signed in automatically.

---

## Logging in

1. Go to **Log in**
2. Enter your email + password
3. Submit

If login succeeds, you’re sent to the **Chat list** page.

---

## Chat list (home page)

On the Chat list page you can:

- See existing chats
- Click **New chat** to create one
- Use **Refresh** to reload chats from the server
- Use **Logout** to sign out
- Open **Prompt library**

---

## Creating a new chat

1. Click **New chat**
2. You’ll be taken into the chat room
3. The chat is stored server-side (MongoDB)

---

## Sending a message

Inside a chat room:

1. Type your message
2. Send it
3. The message is saved to the server and appears in the timeline

---

## Requesting an AI reply

In a chat room, you can request an AI response:

- The server sends your chat history (with participant labels) to Gemini
- The AI reply is saved as a message
- You’ll see the AI message appear in the chat

If AI replies fail, see **Troubleshooting**.

---

## Prompt library

The prompt library lets you save reusable prompts for studying.

Typical actions:

- Create a prompt (title + content)
- Add tags (optional)
- Choose visibility:
  - **Private** (only you)
  - **Public** (visible to others)

---

## Using prompts in chats (workflow)

Suggested workflow:

1. Save a prompt you like in **Prompt library**
2. Copy/paste it into a chat when you need it
3. Modify it for the current question

---

## Exporting a chat

You can export a chat from the backend as:

- **Markdown** (`format=md`, default)
- **Plain text** (`format=txt`)

Exports preserve:

- Message order
- Who sent each message (User / AI model)
- Timestamps

---

## Export formats (examples)

**Markdown export** includes headings like:

- `### user@example.com`
- `### AI (gemini-2.5-flash)`

**Text export** includes bracketed timestamps and sender labels.

---

## Troubleshooting — common problems

**Problem:** Login/Register fails\n
- Check backend is running (`/api/health`)\n
- Check `CLIENT_ORIGIN` matches the frontend URL\n
- Check rate limiting (many rapid auth attempts can be blocked temporarily)\n

---

## Troubleshooting — database

**Problem:** `/api/health/db` shows `mongoConnected: false`\n
- Confirm MongoDB is running / reachable\n
- Verify `MONGODB_URI` is correct\n
- Check firewall / Atlas IP allowlist (if using Atlas)\n

---

## Troubleshooting — AI replies

**Problem:** AI reply endpoint errors\n
- Confirm `GEMINI_API_KEY` is set in `server/.env`\n
- Confirm `GEMINI_MODEL` is valid (optional)\n
- Check backend console logs for Gemini API errors\n

---

## Security tips for users

- Use a strong password (don’t reuse school passwords)
- Don’t paste secrets (API keys, JWTs, credentials) into chats
- If you exported a chat, treat it like a document—store it safely

---

## Support checklist (for debugging)

If something isn’t working, capture:

- Whether backend `/api/health` responds
- Whether `/api/health/db` shows Mongo connected
- Any backend console error messages
- Your `.env` values **excluding secrets**

---

# End

