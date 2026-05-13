# fmu-ia

```
fmu-ia/
├── frontend/   # React + Vite + TailwindCSS (CardVault UI)
└── backend/    # Python FastAPI + scikit-learn chatbot
```

---

## Backend

### Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Run

```bash
uvicorn main:app --reload
# API available at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

### How it works

The chatbot uses a **Multinomial Naive Bayes** classifier (`sklearn`) with a
**CountVectorizer** (unigrams + bigrams) trained on `intents.json`.

- `intents.json` — training data: intents, patterns and responses (in Portuguese)
- `chatbot.py` — `CardVaultChatbot` class: trains on startup, exposes `respond()`
- `main.py` — FastAPI app with a `POST /chat` endpoint

**Add new intents** by appending objects to `intents.json` and restarting the server.

---

## Frontend

### Setup

```bash
cd frontend
npm install
```

### Run

```bash
npm run dev
# App available at http://localhost:5173
```

> The chatbot popup calls `http://localhost:8000/chat`. Start the backend first.
