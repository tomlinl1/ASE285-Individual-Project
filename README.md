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

