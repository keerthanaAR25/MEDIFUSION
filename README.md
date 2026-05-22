# MediFusion v2.4.1 — AI Clinical Platform

Multimodal LLM System for Clinical Encounter to Multilingual Discharge Summary Generation

## Quick Start (3 Steps)

### Step 1: Install Ollama (Free Local AI)
```bash
# Download from https://ollama.ai
ollama serve
ollama pull llama3
```

### Step 2: Start Backend
```bash
cd backend
pip install -r requirements.txt
# macOS/Linux:
sudo apt install tesseract-ocr  # or: brew install tesseract
python main.py
```

### Step 3: Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## Demo Login
| Role | Username | Password |
|------|----------|----------|
| Doctor | drchen | doctor123 |
| Patient | patient1 | patient123 |

## Features
- 🤖 Real AI analysis via local Ollama LLM (no API key needed)
- 🎙️ Audio transcription (requires: pip install openai-whisper)
- 🔬 Medical image analysis
- 📄 OCR lab report extraction
- 🌍 8-language patient instructions
- 📊 Analytics dashboard
- 🔒 Role-based access (Doctor/Patient/Admin)
- 💡 Animated neural network background

## AI Engine Options
The system supports multiple AI backends:
1. **Ollama (Default - Free/Local)**: Install ollama + pull llama3
2. **Anthropic Claude**: Set ANTHROPIC_API_KEY in backend/.env
3. **OpenAI**: Set api_key in Settings page

## Project Structure
- `frontend/` - Next.js React app (port 3000)
- `backend/` - FastAPI Python server (port 8000)
- `backend/services/` - AI modules (LLM, OCR, Audio, RAG)
- `backend/routers/` - API endpoints
- `backend/database/` - SQLite database models

## Troubleshooting

**"AI analysis failed: Ollama not running"**
→ Run: `ollama serve` then `ollama pull llama3`

**"tesseract not found"**
→ Install: `brew install tesseract` or `sudo apt install tesseract-ocr`

**"Cannot connect to backend"**
→ Ensure backend runs on port 8000: `cd backend && python main.py`

**First analysis is slow (1-3 min)**
→ Normal - Ollama loads model into memory. Subsequent analyses are faster.