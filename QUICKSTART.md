# Quick Start for Teammate

## 1. Clone Repo

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

## 2. Choose Your Branch

```bash
# Frontend engineer
git checkout frontend-dev

# Backend engineer
git checkout backend-dev
```

## 3. Setup Your Environment

### Frontend:

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

### Backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and add GEMINI_API_KEY
python scripts/prepare_demo_data.py
python main.py
```

## 4. Verify It Works

**Frontend:** Open http://localhost:3000
**Backend:** Open http://localhost:8000/docs

## 5. Read the Docs

- `README.md` - Project overview
- `backend/README.md` - API documentation
- `COLLABORATION.md` - How we work together

## 6. Start Building!

**Your first commit:**

```bash
# Make a small change
git add .
git commit -m "test: verify setup works"
git push origin frontend-dev  # or backend-dev
```

---

**Questions?** Slack/Discord me immediately. Don't waste time stuck!
