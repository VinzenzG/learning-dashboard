# Learning Dashboard

A local-first AI-powered learning app that turns your lecture slides (PDF / PPTX) into spaced-repetition flashcards — with gamification, exam mode, and markdown export. Runs entirely on `localhost`, no cloud required.

## Features

- **Auto-ingestion** — drop a PDF or PPTX into `inbox/` (or `inbox/ModuleName/`) and questions are generated automatically via Claude CLI
- **Spaced Repetition (SM-2)** — Anki-style daily review with Again / Hard / Good / Easy ratings
- **8 question types** — Multiple Choice, True/False, Fill-in, Short Answer, Feynman (free-text explanation evaluated by AI)
- **Source attribution** — every flashcard shows which slide it came from (e.g. *Folien 3–5*)
- **Module folders** — `inbox/ModuleName/` groups slides into a module; all questions are exported to `output/ModuleName/filename.md`
- **KI-Zusammenfassung** — AI-generated 1-page module summary exported to `output/ModuleName/_zusammenfassung.md`
- **Exam Mode** — timed mock exam with random questions from a module, no SRS influence
- **Vertiefen** — generate 8 extra hard questions for a weak topic with one click
- **Gamification** — XP, levels (triangular progression), 12 badges, daily streaks
- **Analytics** — accuracy over time, weak spots radar, Ebbinghaus forgetting curve
- **Dark mode** — persisted via localStorage
- **Keyboard shortcuts** — `Space` = flip card, `1/2/3/4` = Again/Hard/Good/Easy

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 + TypeScript + Tailwind CSS 3 + shadcn/ui |
| Backend | Node.js + Express + TypeScript (`tsx --watch`) |
| Database | SQLite via `better-sqlite3` |
| File watching | `chokidar` |
| AI | Claude CLI (auto-detected from VSCode extension) |
| Charts | recharts |

## Setup

### Requirements
- Node.js 18+
- Claude Code CLI (installed via VS Code extension or `npm i -g @anthropic-ai/claude-code`)

### Install & run

```bash
git clone https://github.com/VinzenzG/learning-dashboard
cd learning-dashboard
npm install
npm run dev
```

Frontend opens at [http://localhost:5173](http://localhost:5173), backend runs on port 3001.

### Configuration (`.env.local`)

```env
AI_PROVIDER=claude-cli       # claude-cli | claude-sdk | ollama
ANTHROPIC_API_KEY=           # only needed for claude-sdk
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
WATCH_FOLDER=./inbox
DB_PATH=./data/learning.db
BACKEND_PORT=3001
QUESTIONS_PER_CHUNK=8
```

Copy `.env.local.example` to `.env.local` and adjust as needed.

### Claude CLI path

The app auto-detects Claude CLI from:
1. `CLAUDE_CLI_PATH` environment variable
2. `which claude` (system PATH)
3. `~/.vscode/extensions/anthropic.claude-code-*/resources/native-binary/claude`
4. `~/Library/Application Support/Claude/claude-code/*/claude.app/Contents/MacOS/claude`

## Workflow

```
inbox/Modul-SS26/lecture1.pptx   →  questions generated (8 per chunk)
                                  →  output/Modul-SS26/lecture1.md
                                  →  output/Modul-SS26/_zusammenfassung.md

inbox/other.pdf                   →  questions generated
                                  →  output/other.md
```

Drop files while `npm run dev` is running — the watcher picks them up automatically. Duplicate files are detected via SHA-256 hash and skipped.

## Project Structure

```
Learning/
├── inbox/                   # watched folder (gitignored)
├── output/                  # markdown exports (gitignored)
├── data/                    # SQLite DB (gitignored)
├── backend/
│   └── src/
│       ├── ai/              # Claude CLI / SDK / Ollama adapters
│       ├── db/              # schema, migrations, queries
│       ├── ingestion/       # pipeline, text chunker, markdown export
│       ├── routes/          # REST API + SSE
│       ├── srs/             # SM-2 algorithm
│       └── gamification/    # XP, badges, streaks
└── frontend/
    └── src/
        ├── components/      # UI components
        ├── hooks/           # data fetching hooks
        └── pages/           # Dashboard, DailyReview, ExamMode, Analytics, …
```

## License

MIT
