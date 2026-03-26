# zeroto

AI-powered startup idea validator. Paste your idea, get a viability score, financial projections, a roadmap, and a full business plan — in seconds.

---

## What it does

zeroto runs your startup idea through a multi-step AI pipeline:

1. **Quick read** — instant title, summary, and viability score (1–10)
2. **Clarifying questions** — a short Q&A to sharpen the analysis
3. **Full report** — investment range, revenue projections, break-even timeline, business plan steps, roadmap milestones, and who you need to hire

Registered users get a personal dashboard to save, revisit, and chat with all their past ideas.

---

## Stack

| Layer | Tech |
| Landing page | Vanilla HTML, CSS, JavaScript |
| Dashboard app | React + Vite, Zustand, React Router |
| Backend | FastAPI (Python) |
| Auth | JWT — stored via Zustand, attached by Axios interceptor |

---

## Project structure


zeroto/
├── frontend/
│   └── landing/          # Public-facing landing page
│       ├── index.html    # Hero, input, skeleton loader
│       ├── results.html  # Full analysis results
│       ├── css/
│       └── js/
├── app/                  # React dashboard (authenticated users)
│   └── src/
│       ├── App.jsx
│       ├── pages/        # Login, Register, Dashboard, NewIdea
│       ├── components/
│       │   ├── layout/   # Sidebar, TopBar
│       │   ├── idea/     # IdeaCard, IdeaHeader, tabs (Money, Plan, Problems, Chat, People)
│       │   ├── pipeline/ # IdeaInput, QuickRead, Questions, SkeletonResult
│       │   └── ui/       # Shared components
│       ├── hooks/        # useAuth, useIdeas, useChat
│       ├── api/          # Axios client with JWT interceptor
│       └── stores/       # Zustand auth store
└── backend/              # FastAPI API
    ├── .env              # (not committed)
    └── vvv/              # (virtual environment, not committed)


---

## Getting started

### Backend

cd backend
python -m venv vvv
source vvv/bin/activate      # Windows: vvv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env         # fill in your API keys
uvicorn main:app --reload

The API will be available at `http://localhost:8000`.

### Landing page

Open `frontend/landing/index.html` directly in your browser, or serve it with any static server:

npx serve frontend/landing

### React dashboard

cd app
npm install
npm run dev


---

## Environment variables

Create `backend/.env` with the following:

ANTHROPIC_API_KEY=your_key_here
# add any other keys (DB, JWT secret, etc.)

---

## .gitignore highlights

node_modules/
backend/vvv/
backend/.env