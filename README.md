# Interactive Data Story Platform (IDSP)

A modern full-stack web application that transforms uploaded datasets (CSV / Excel) into interactive dashboards, visual reports, and AI-generated business insights.

## Stack
- **Frontend:** React 18 + Vite, Recharts, Framer Motion, react-beautiful-dnd, TailwindCSS-like custom CSS, html2pdf.js
- **Backend:** FastAPI, SQLAlchemy, SQLite, Pandas, NumPy, scikit-learn (predictive), ReportLab
- **Auth:** JWT (python-jose) + bcrypt password hashing

## Quick Start

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Default test
1. Sign up (Show Password toggle available)
2. Upload CSV/Excel OR click **Load Sample Dataset**
3. Explore Dashboard → Insights → Story Editor → Export PDF / HTML

See `docs/` for full technical documentation.
