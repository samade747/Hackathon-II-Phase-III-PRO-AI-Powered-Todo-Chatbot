# 🤖 AI Agentixz USA — World-Class Todo Chatbot

AI Agentixz USA is a high-fidelity, intelligent task management ecosystem built to the "PRO" specifications of the Hackathon II Phase III. It combines cinematic UI/UX design with advanced AI orchestration via the Model Context Protocol (MCP) and LLM-powered semantic understanding.

---

## 🌟 World-Class Features

### 🧠 Intelligence Layer
- **LLM-Powered Intent Extraction**: Uses GPT-4o-mini to semantically parse user requests, identifying intents (add, list, complete, delete) and extracting slots (priority, recurrence).
- **Natural Urdu Support**: Full bilingual support with real-time, context-aware translation from Urdu to English for task processing.
- **MCP Orchestration**: Standardized Model Context Protocol (MCP) server for robust and modular tool execution.

### ⚡ Tactical Task Management
- **Mission Respawn (Recurrence)**: Automated logic that creates the next instance of recurring tasks (Daily, Weekly, Monthly) upon completion.
- **Priority Protocol**: Color-coded tactical priorities (Urgent, High, Medium, Low) for elite objective tracking.
- **Mission Duration (Timer)**: Real-time task timers synchronized across the database to track productivity.
- **Bulk Add Mode**: Intelligent multi-line processing for adding multiple objectives simultaneously.

### 🎨 Cinematic Interface
- **Premium Visualization**: Real-time "Mission Progress" charts and "Tactical Priority" distribution graphs.
- **Interactive Toasts**: High-end notification system with an integrated "Undo" mechanism for task deletions.
- **Cinematic Transitions**: Powered by Framer Motion for a fluid, premium, and interactive user experience.

---

## 🛠 Technology Stack

- **Frontend**: Next.js (Tailwind CSS, Framer Motion, Lucide React, Better Auth)
- **Backend**: FastAPI (Python), Uvicorn, Python-dotenv
- **Database**: Supabase (PostgreSQL, Auth, RLS)
- **AI**: OpenAI (via Python SDK), FastMCP (Model Context Protocol)

---

## 🚀 Installation & Setup

### 1. Database Configuration (Supabase)
Run the following scripts in your Supabase SQL Editor:
1.  [`database_init.sql`](file:///d:/github/Hackathon-II-Phase-III-PRO-AI-Powered-Todo-Chatbot/database_init.sql): Sets up the `tasks` table and Row Level Security (RLS).
2.  [`database_upgrade.sql`](file:///d:/github/Hackathon-II-Phase-III-PRO-AI-Powered-Todo-Chatbot/database_upgrade.sql): Adds advanced world-class features (priority, recurrence, timers).

### 2. Backend Setup
1.  **Dependencies**: `cd backend && pip install -r requirements.txt`
2.  **Environment Variables**: Create `backend/.env` with:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    OPENAI_API_KEY=your_openai_api_key
    ```
3.  **Run**: `python -m uvicorn app.main:app --reload --port 8000`

### 3. Frontend Setup
1.  **Dependencies**: `cd frontend && npm install`
2.  **Environment Variables**: Create `frontend/.env.local` with:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    NEXT_PUBLIC_API_URL=http://localhost:8000
    ```
3.  **Run**: `npm run dev`

---

## 📡 Production Deployment

### Vercel (Frontend)
Ensure you set the following **Environment Variables** in the Vercel Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` (Points to your deployed backend)

### Backend Deployment
The backend is designed for subfolder projects (e.g., Railway). Ensure `load_dotenv()` is correctly pointed and all Supabase keys are provided in the production environment.

---

## 🛡 Security (RLS)
The application uses **Row Level Security** in Supabase, ensuring that users can only view and manage tasks associated with their own `user_id`.

---

## ✍️ Authors & License
Created for Hackathon II — Phase III PRO.
**Status**: Ready for Deployment 🚀🇺🇸
