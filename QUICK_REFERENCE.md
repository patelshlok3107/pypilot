# Offline AI Tutor - Quick Reference

## ⚡ Quick Start (5 minutes)

```bash
# Terminal - Run this once
cd "c:\Users\shlok\OneDrive\Desktop\ai saas"
docker-compose down
docker-compose up --build

# Wait for: "Successfully pulled mistral:latest" message
# Then open: http://localhost:3000
```

## 🚀 Running the Setup Script

```powershell
# Run the interactive setup wizard
.\scripts\offline-ai-setup.ps1

# Choose option:
# 1) Build & start (first time)
# 2) Start existing (next times)
```

## 🤖 Using the AI Tutor

### Chat Modes

| Mode     | Use When                        | Example                    |
| -------- | ------------------------------- | -------------------------- |
| 💬 Chat  | General questions               | "What is a function?"      |
| 📚 Explain | Want concept explanation        | "How do lists work?"       |
| 🐛 Debug | Have code with an error         | Paste code and error       |
| ✍️ Practice | Want to practice Python         | "Give me a loop exercise"  |

### Example Prompts

```
General: "Explain Python lists to me"
Explain: Mode: Explain → "list slicing for beginners"
Debug: Mode: Debug → [Paste error code]
Practice: Mode: Practice → "loops for beginners"
```

## 📡 API Examples

### Simple Chat
```bash
curl -X POST http://localhost:8000/ai-tutor/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is a variable?", "mode":"general"}'
```

### Get History
```bash
curl http://localhost:8000/ai-tutor/history
```

### Clear Conversation
```bash
curl -X POST http://localhost:8000/ai-tutor/clear-history
```

### Check Status
```bash
curl http://localhost:8000/ai-tutor/status
```

## 🔧 Troubleshooting

### Issue: Takes forever to start
- **Fix**: First run downloads Mistral model (5-10 mins)
- Check: `docker logs ai-learning-saas-ollama-1`

### Issue: "Connection refused"
- **Fix**: Wait a few more seconds
- Check: `docker ps` to see if all containers are running

### Issue: Slow responses (30+ seconds)
- **Normal**: 7B model on CPU takes time
- **Options**:
  - Use faster model: `OLLAMA_MODEL=phi:latest`
  - Add more RAM/use GPU
  - Run on faster hardware

### Issue: Out of memory
- Switch to smaller model in `.env`:
  ```
  OLLAMA_MODEL=phi:latest  # 2.7B, very fast
  ```
- Restart: `docker-compose down && docker-compose up`

## 📊 System URLs

| Service | URL                | Purpose              |
| ------- | ------------------ | -------------------- |
| Web UI  | http://localhost:3000 | Chat interface       |
| API     | http://localhost:8000 | Backend API          |
| Docs    | http://localhost:8000/docs | Swagger docs        |
| Ollama  | http://localhost:11434 | LLM server           |

## 🛠️ Docker Commands

```bash
# View all services
docker-compose ps

# View specific service logs
docker-compose logs -f api      # API
docker-compose logs -f ollama   # AI Model
docker-compose logs -f web      # Frontend

# Stop everything
docker-compose stop

# Start everything
docker-compose start

# Full cleanup
docker-compose down -v

# Full rebuild
docker-compose down -v && docker-compose up --build
```

## 🎯 Tutor Capabilities

✅ **Explain Concepts**
- Variables, loops, functions
- List/dict comprehensions
- OOP basics
- Error handling

✅ **Debug Code**
- Syntax errors
- Logic errors
- IndexError, KeyError, etc.
- Type mismatches

✅ **Generate Practice**
- Easy → Hard exercises
- Different topics
- With starter code
- Solution hints

✅ **Chat Features**
- Conversation memory (last 5 msgs)
- Multiple modes
- Friendly tone
- Step-by-step explanations

## 💾 Model Management

### List installed models
```bash
docker exec ollama-server ollama list
```

### Download different model
```bash
docker exec ollama-server ollama pull phi
docker exec ollama-server ollama pull neural-chat
docker exec ollama-server ollama pull mistral
```

### Switch active model
Edit `.env`: `OLLAMA_MODEL=phi:latest`
Restart: `docker-compose down && docker-compose up`

## 🎓 Teaching Tips

### Good Prompt Structure
```
❌ "What is Python?"
✅ "Explain what a Python variable is and show a simple example for beginners"

❌ "Fix my code"
✅ "[Paste code] This gives me TypeError: cannot add int and str. Help!"

❌ "Make a practice problem"
✅ "Give me a practice problem about for loops for beginners with starter code"
```

### Modes in Action
```
General Mode:
  Q: "How do list comprehensions work?"
  A: [Friendly explanation with example]

Explain Mode:
  Context: "list comprehension"
  A: [Detailed breakdown, more formal]

Debug Mode:
  Code: "x = [1, 2, 3]\nprint(x[10])"
  Error: "IndexError: list index out of range"
  A: [Root cause, fix, prevention]

Practice Mode:
  Topic: "for loops"
  Difficulty: "easy"
  A: [Problem statement, starter code, hint]
```

## 🔐 Privacy & Security

✅ **Everything Local**: All data stays on your computer
✅ **No Internet**: After initial setup, completely offline
✅ **No Tracking**: No telemetry or usage tracking
✅ **No Account**: No login required
✅ **Open Source**: All code is your own

## 📈 Performance Tips

For **Fast Responses**:
- Use: `PHI` model (2.7B) - 5-10 sec responses
- Keep: Short, clear questions
- Limit: Conversation to recent messages

For **Better Answers**:
- Use: `MISTRAL` model (7B) - 20-60 sec
- Ask: Detailed, specific questions
- Use: Appropriate mode (Explain/Debug/Practice)

## 🚀 Next Steps

1. Start the system
2. Try all 4 modes
3. Test debugging a real error
4. Generate practice problems
5. Experiment with different models

---

**Questions?** Check `OFFLINE_AI_TUTOR_GUIDE.md` for detailed documentation
