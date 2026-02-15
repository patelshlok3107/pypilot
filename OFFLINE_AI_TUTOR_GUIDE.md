"""
Offline AI Tutor Setup & Usage Guide
100% Local - No API Keys Required - Complete Privacy
"""

# OFFLINE AI TUTOR SYSTEM
Complete Offline Python Learning AI with Ollama

## Quick Start (Fastest Way)

```bash
# 1. Build and start everything
cd "c:\Users\shlok\OneDrive\Desktop\ai saas"
docker-compose down
docker-compose up --build

# 2. Wait for Ollama to download Mistral model (~5-10 minutes first time)
# You'll see: [1] Downloading `mistral:latest`...
# Once done, it will say: "Model downloaded successfully"

# 3. Access your app
# Web UI: http://localhost:3000
# API: http://localhost:8000
# Ollama: http://localhost:11434
```

## Features

✅ 100% Offline - No internet required after first setup
✅ No API Keys - Zero external dependencies
✅ Fast Local Model - Mistral 7B (4GB RAM, 5-10 min response)
✅ Privacy First - Everything stays on your computer
✅ Conversation Memory - Remembers chat history
✅ Multiple Modes - Explain | Debug | Practice | Chat

## API Endpoints

All endpoints work 100% offline with Ollama:

### Chat with AI Tutor
```bash
POST /ai-tutor/chat
{
  "message": "What is a Python list?",
  "mode": "general"  # general, explain, debug, practice
}

Response:
{
  "role": "assistant",
  "content": "[Friendly explanation...]",
  "mode": "general",
  "status": "success"
}
```

### Get Conversation History
```bash
GET /ai-tutor/history

Response: [
  {"role": "user", "content": "..."},
  {"role": "assistant", "content": "..."}
]
```

### Clear History
```bash
POST /ai-tutor/clear-history

Response: {"status": "success"}
```

### Explain a Concept
```bash
POST /ai/explain
{
  "topic": "List comprehension",
  "student_level": "beginner",
  "context": "I know basic Python loops"
}
```

### Debug Code
```bash
POST /ai/debug
{
  "code": "x = [1, 2, 3]\nprint(x[5])",
  "error_message": "IndexError: list index out of range"
}
```

### Generate Practice Problem
```bash
POST /ai/practice
{
  "topic": "For loops",
  "difficulty": "easy"
}
```

### Check Tutor Status
```bash
GET /ai-tutor/status

Response:
{
  "status": "online",
  "mode": "offline-local",
  "model": "mistral (or other Ollama model)",
  "message": "AI tutor is running 100% locally - no API keys needed!"
}
```

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/Next.js)                  │
│                     Runs on :3000                            │
└────────────────┬─────────────────────────────────────────────┘
                 │
          POST /ai-tutor/chat
                 │
┌────────────────▼─────────────────────────────────────────────┐
│                  FastAPI Backend                              │
│            Runs on :8000 (No external API calls)             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  • offline_ai_tutor.py (conversation logic)            │  │
│  │  • ai_tutor_chat.py (router endpoints)                 │  │
│  │  • ai_tutor.py (fallback to online if needed)          │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────┬─────────────────────────────────────────────┘
                 │
              HTTP GET/POST
                 │
┌────────────────▼─────────────────────────────────────────────┐
│              Ollama Local LLM Server                          │
│               Runs on :11434                                  │
│  • 100% Local - No external calls                            │
│  • Mistral 7B Model (~4GB RAM)                               │
│  • REST API compatible with OpenAI format                    │
└────────────────┬─────────────────────────────────────────────┘
                 │
         Uses Model Downloaded Locally
                 │
        ┌────────▼────────┐
        │   Mistral 7B    │
        │   (No internet) │
        └─────────────────┘
```

## Configuration

### Use Offline AI (Default)
in `.env`:
```
USE_OFFLINE_AI=true
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=mistral:latest
```

### Switch to Online API (Optional Fallback)
in `.env`:
```
USE_OFFLINE_AI=false
OPENAI_API_KEY=your-key-here
OPENAI_MODEL=openai/gpt-4-turbo
OPENAI_BASE_URL=https://openrouter.ai/api/v1
```

## Model Options

You can use different models with Ollama. Update `OLLAMA_MODEL` in `.env`:

### Faster Models (< 4GB RAM)
```
ollama pull phi:latest          # 2.7B - Very fast, good for quick tasks
ollama pull neural-chat         # Tuned for chat
ollama pull orca-mini           # Better for explanations
```

### Better Quality (4-8GB RAM)
```
ollama pull mistral:latest      # 7B - Recommended, great balance
ollama pull neural-chat:latest  # Optimized for chat
ollama pull zephyr              # Better reasoning
```

### Best Quality (8GB+ RAM, Slower)
```
ollama pull mistral:7b-instruct-q4_K_m
ollama pull neural-chat:latest
ollama pull dolphin-mixtral     # Up to 45B parameters
```

### Switch Model
```bash
# In docker-compose, update the command section or:
# In .env: OLLAMA_MODEL=phi:latest
# Rebuild: docker-compose down && docker-compose up --build
```

## Troubleshooting

### Ollama takes too long to start
```bash
# It's downloading the model. First run takes 5-10 minutes.
# Check progress: docker logs ai-learning-saas-ollama-1
```

### "Connection refused" on :11434
```bash
# Ollama container isn't ready yet. Wait a few seconds and retry.
# Or check: docker ps | grep ollama
```

### "Model not found"
```bash
# Ollama hasn't downloaded Mistral yet.
# Check logs: docker logs ai-learning-saas-ollama-1
# Or manually: docker exec ollama-server ollama pull mistral
```

### Slow Response Times (>30 seconds)
```bash
# Normal for 7B model on CPU. Options:
# 1. Use smaller model: OLLAMA_MODEL=phi:latest
# 2. Use faster hardware/GPU
# 3. Increase timeout in timeout settings
```

### Out of Memory
```bash
# If using large model and running out of RAM:
# 1. Use smaller model: phi, neural-chat, etc.
# 2. Close other apps
# 3. Increase RAM available
```

## Performance Tips

### For Fast Responses
```
1. Use smaller model: phi:latest (2.7GB)
2. Reduce context window (use conversation memory sparingly)
3. Keep requests simple and specific
4. Run on dedicated hardware with more RAM
```

### For Better Responses
```
1. Use Mistral 7B (default, good balance)
2. Allow processing time (30-60 seconds normal)
3. Ask clear, well-formed questions
4. Use specific modes (explain, debug, practice)
```

## Technology Stack

- **LLM**: Ollama + Mistral 7B
- **Backend**: FastAPI + Python
- **Frontend**: React/Next.js
- **Database**: PostgreSQL
- **Containerization**: Docker Compose
- **100% Open Source**: No vendor lock-in

## Security & Privacy

✅ All data stays on your machine
✅ No requests to external servers
✅ No account creation needed
✅ Model runs locally in Docker
✅ Database is dockerized locally
✅ No telemetry or tracking
✅ Complete offline capability

## Development

### Core Files
- `apps/api/app/services/offline_ai_tutor.py` - AI tutor logic
- `apps/api/app/api/routers/ai_tutor_chat.py` - Chat endpoints
- `docker-compose.yml` - Ollama service configuration

### Add Custom System Prompts
Edit `offline_ai_tutor.py`:
```python
def _build_system_prompt(self) -> str:
    return """Your custom prompt here..."""
```

### Change Default Model Behavior
In `offline_ai_tutor.py`, adjust:
- `max_tokens`: Response length (1024 default)
- `temperature`: Creativity (0.7 default, range 0-1)
- System prompt personality

## Next Steps

1. ✅ Application runs fully offline
2. Access http://localhost:3000
3. Start a chat with AI tutor
4. Try different modes: Explain, Debug, Practice
5. Customize prompts for your needs

## Support

If issues:
1. Check docker logs: `docker-compose logs api`
2. Restart: `docker-compose down && docker-compose up`
3. Full rebuild: `docker-compose down && docker-compose up --build`
4. Check internet: Needed to download initial model only

---

**You now have a fully functional offline AI Python tutor! 🚀**
No API keys, no internet needed, complete privacy!
