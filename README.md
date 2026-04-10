---
marp: true
theme: default
paginate: true
class: lead
---

# AI Study Hub — Individual Project
### Chat-based AI platform with collaboration & model choice

**Student-Focused Core Features**
- Group chats with AI participation
- Community prompt library
- Side-by-side AI model comparison
- Exportable chat conversations

---

# Project Description

**AI Study Hub** is a collaborative, chat-based AI application designed to help students learn, brainstorm, and solve problems together using multiple AI models. Unlike traditional single-user chat assistants, this platform emphasizes shared conversations, model transparency, and reusable prompts to support group learning and experimentation.

The application allows users to engage in group discussions with an AI assistant, compare responses from different AI models, and export conversations for studying, documentation, or submission purposes.

---

# Problem Domain

Students increasingly rely on AI tools for learning, but most existing platforms are designed for **individual use only**. This creates several challenges:

- Limited collaboration when working in study groups
- No easy way to compare how different AI models respond
- Difficulty reusing effective prompts
- Inability to export AI-assisted discussions for later reference

AI Study Hub addresses these gaps by providing a shared, transparent, and student-oriented environment for AI-assisted collaboration.

---

# Core Features (Overview)

1. Group chats with AI participation  
2. Community-driven prompt library  
3. AI model comparison mode  
4. Exportable chat conversations  

---

# Feature 1: Group Chats + AI

- Multiple users participate in a shared chat room
- AI assistant responds within group context
- Messages labeled by user and AI role
- Supports collaborative brainstorming and problem-solving
- Ideal for study groups and team projects

---

# Feature 2: Prompt Library

- Users can save effective prompts
- Public and private prompt visibility
- Prompt categorization (e.g. coding, writing, studying)
- Reusable prompts across chats
- Community upvoting for high-quality prompts

---

# Feature 3: Model Comparison

- Single prompt sent to multiple AI models
- Responses displayed side-by-side
- Highlights differences in style and accuracy
- Helps students understand strengths and limitations of models
- Users can select a preferred model per chat

---

# Feature 4: Export Chats

- Export full conversations as:
  - Markdown
  - Plain text
- Preserves message order and roles
- Useful for:
  - Study notes
  - Assignment documentation
  - Project reports

---

# Key Requirements (Implementation Notes)

- React-based single-page application
- Global state management (Redux or Context API)
- Direct integration with multiple AI APIs
- Client-side persistence using browser storage
- Modular feature design for future expansion

---

# Data Model (High-Level)

```json
{
  "ChatRoom": {
    "id": "uuid",
    "title": "string",
    "participants": ["userId"],
    "createdAt": "ISODate"
  },
  "Message": {
    "id": "uuid",
    "chatRoomId": "uuid",
    "sender": "user|ai",
    "model": "string",
    "content": "string",
    "createdAt": "ISODate"
  },
  "Prompt": {
    "id": "uuid",
    "title": "string",
    "content": "string",
    "tags": ["string"],
    "visibility": "public|private"
  }
}
```
--- 

# Architecture

- React single-page frontend
- State management for chats, prompts, and models
- AI API integration layer supporting multiple models
- Browser-based persistence for chats and prompts

--- 

# Testing Strategy

- Acceptance Tests
  - Users can send messages in group chats
  - AI responds within shared context
  - Chats export correctly

- Integration Tests
  - State updates sync with storage
  - Model comparison responses render correctly

- End-to-End Tests
  - Full group chat flow with AI
  - Prompt saved → reused → exported
 
  --- 

# Schedule & Milestones

## Sprint 1

- React project setup
- Basic chat UI
- Single-model AI integration
- Local state persistence

---

## Sprint 2

- Group chat functionality
- Prompt library
- Model comparison view
- Export feature
- Testing & UI refinement

---

# Running the app (Sprint 1)

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and set your Gemini API key:
   - Get a key at [Google AI Studio](https://aistudio.google.com/apikey)
   - Add `VITE_GEMINI_API_KEY=your_key` to `.env` (Sprint 1 only; Sprint 2 uses server-side Gemini)
3. Start the dev server: `npm run dev`
4. Open the URL shown in the terminal (e.g. http://localhost:5173). Chats and messages persist in the browser via localStorage.

---

# Running the app (Sprint 2)

Sprint 2 adds a **backend API** + **MongoDB** + **user accounts**. You must run:

- **MongoDB** (local or Atlas)
- **Backend** (`server/`) on port `3001`
- **Frontend** (root) on port `5173`

## 0. Prereqs

- Node.js installed
- A MongoDB database (local MongoDB or MongoDB Atlas)
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

## 1. MongoDB setup

### Option A: Local MongoDB

- Ensure MongoDB is running locally (default: `mongodb://127.0.0.1:27017`)
- You can use this connection string in the backend env:

`MONGODB_URI=mongodb://127.0.0.1:27017/ai-study-hub`

### Option B: MongoDB Atlas

- Create a free Atlas cluster
- Create a database user and allow your IP
- Copy your connection string and use it for `MONGODB_URI`, for example:

`MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority`

## 2. Backend setup (Sprint 2 API)

From the project root:

1. Install backend dependencies:

`cd server && npm install`

2. Create a backend `.env` file:

- Copy `server/.env.example` to `server/.env`
- Fill in these values:

`PORT=3001`  
`CLIENT_ORIGIN=http://localhost:5173`  
`MONGODB_URI=...`  
`JWT_SECRET=...` (use a long random string)  
`GEMINI_API_KEY=...`  
`GEMINI_MODEL=gemini-2.5-flash`

3. Start the backend dev server:

`cd server && npm run dev`

4. Confirm it’s running:

- `GET http://localhost:3001/api/health` → should return `{ "ok": true }`
- `GET http://localhost:3001/api/health/db` → returns `{ ok: true, mongoConnected: true|false }`

## 3. Frontend setup (React)

From the project root:

1. Install frontend dependencies:

`npm install`

2. (Optional) Set frontend API base URL (defaults to `http://localhost:3001`)

Create `.env` (root) with:

`VITE_API_BASE_URL=http://localhost:3001`

3. Start the frontend dev server:

`npm run dev`

4. Open the URL shown in the terminal (usually http://localhost:5173).

## 4. Quick test checklist (Sprint 2)

1. Open the frontend and **register** a new account
2. Create a **new chat**
3. Send a message → backend stores it in MongoDB
4. The app requests **AI reply** → backend calls Gemini (`gemini-2.5-flash`) and stores the AI response
5. Go to `/prompts` and **save a prompt**
6. In a chat, click **Export (md)** (backend serves markdown; you can also use `format=txt`)

