# OfferProof

Zero-trust job and offer checker. The webpage now uses the HireTrust dashboard theme. Chrome extension evidence (SEC, NY registry, RDAP, MX, DMARC, Wayback, certificates) still runs on the same FastAPI backend. The copilot talks to your local Ollama model.

## Run

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Pull a local model, then start Ollama:

```bash
ollama pull qwen2.5:14b-instruct
ollama serve
```

Build the web UI and start the API:

```bash
cd web && npm install && npm run build && cd ..
uvicorn main:app --reload --port 8000
```

Open http://localhost:8000

For frontend hot reload, run `cd web && npm run dev` and set `WEB_DEV_URL=http://127.0.0.1:5173` in `.env`.

## Chrome extension

1. Keep the API on `http://localhost:8000`.
2. `chrome://extensions` → Developer mode → Load unpacked → select `extension/`.
3. Open a job page and use the popup. **View full report** opens this dashboard with `?company=&domain=`.

## Agent

The copilot and audit endpoints call Ollama at `OLLAMA_BASE_URL` with `OLLAMA_MODEL`. If Ollama is offline, audits fall back to the local heuristic engine and the chat tells you to start Ollama.
