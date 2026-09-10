# Learning Dashboard — Implementierungsplan

## Context

Ein lokales Learning-Dashboard, das Präsentationsfolien (PDF, PPTX) als Input nimmt, per KI automatisch Testfragen generiert, und diese in einem Spaced-Repetition-System (Kartei-Prinzip) verwaltet. Ziel: evidenzbasiertes, gamifiziertes Lernen direkt aus eigenem Schulungsmaterial — vollständig lokal auf `localhost`, ohne Cloud-Abhängigkeit.

---

## Tech Stack

| Schicht | Technologie |
|---|---|
| Frontend | React 18 + Vite 5 + TypeScript + Tailwind CSS 3 + shadcn/ui |
| Backend | Node.js + Express + TypeScript (`tsx --watch`) |
| Datenbank | SQLite via `better-sqlite3` (zero-config, lokal) |
| File Watching | `chokidar` |
| PDF-Parsing | `pdf-parse` |
| PPTX-Parsing | `adm-zip` + `fast-xml-parser` (PPTX = ZIP + XML) |
| KI primär | `claude` CLI via `child_process.spawn` (Claude Code bereits installiert, kein extra API Key) |
| KI alternativ | Ollama oder `@anthropic-ai/sdk` (konfigurierbar via `.env.local`) |
| Monorepo | npm workspaces + `concurrently` |
| Charts | `recharts` |
| Routing | `react-router-dom` v6 |
| Forms | `react-hook-form` + `zod` |

---

## Projektstruktur

```
Learning/
├── package.json            # npm workspaces root
├── .env.local              # AI_PROVIDER, OLLAMA_MODEL, WATCH_FOLDER, etc.
├── inbox/                  # Hierher fallen Slides (gitignored)
│
├── backend/
│   ├── src/
│   │   ├── index.ts        # Express-App, mounted routes
│   │   ├── config.ts       # .env.local → typed config
│   │   ├── db/
│   │   │   ├── schema.ts   # CREATE TABLE + Migrations
│   │   │   ├── client.ts   # better-sqlite3 Singleton
│   │   │   └── queries/    # learningUnits, questions, srsCards, reviews, sessions, gamification
│   │   ├── watcher/
│   │   │   └── fileWatcher.ts   # chokidar → pipeline trigger
│   │   ├── ingestion/
│   │   │   ├── pipeline.ts      # Orchestrierung: hash → extract → AI → DB
│   │   │   ├── extractPdf.ts
│   │   │   ├── extractPptx.ts
│   │   │   └── textChunker.ts   # ~3000 Zeichen Chunks, Foliengrenzen erhalten
│   │   ├── ai/
│   │   │   ├── adapter.ts       # AIAdapter-Interface + Factory
│   │   │   ├── ollamaAdapter.ts # fetch → localhost:11434
│   │   │   ├── claudeAdapter.ts # SDK oder CLI-spawn
│   │   │   └── prompts.ts       # Fraggenerierung + Feynman-Bewertung
│   │   ├── srs/
│   │   │   └── sm2.ts           # Reiner SM-2 Algorithmus
│   │   ├── gamification/
│   │   │   └── awards.ts        # XP-Berechnung, Badge-Unlock-Checks, Streaks
│   │   └── routes/              # learningUnits, questions, reviews, sessions, gamification, analytics, settings, events(SSE)
│
└── frontend/
    ├── vite.config.ts           # /api → localhost:3001 proxy
    └── src/
        ├── types/api.ts
        ├── lib/api.ts           # Typed fetch wrappers
        ├── hooks/               # useLearningUnits, useDailyReview, useSession, useGamification, usePomodoroTimer
        ├── components/
        │   ├── ui/              # shadcn primitives
        │   ├── layout/          # AppLayout, Sidebar, TopBar
        │   ├── dashboard/       # LearningUnitCard, DueReviewsBadge, IngestionStatus, ForgettingCurveChart
        │   ├── quiz/            # QuestionCard, ConfidenceRater, FeedbackPanel, QualityRater, PomodoroTimer, SessionSummary
        │   ├── flashcard/       # FlashCard (flip), SrsStatusBadge (grün/gelb/rot)
        │   ├── gamification/    # XpBar, StreakCounter, CalendarHeatmap, BadgeGrid
        │   └── analytics/       # AccuracyLineChart, WeakSpotsRadar, SessionHistoryTable
        └── pages/
            ├── Dashboard.tsx        # /
            ├── LearningUnit.tsx     # /unit/:id
            ├── DailyReview.tsx      # /review  ← Hauptlern-Loop
            ├── QuizSession.tsx      # /quiz/:unitId
            ├── Analytics.tsx        # /analytics
            ├── Achievements.tsx     # /achievements
            └── Settings.tsx         # /settings
```

---

## Datenbank-Schema (SQLite)

**Tabellen:** `learning_units`, `questions`, `srs_cards`, `reviews`, `sessions`, `user_stats`, `badges`

Key constraints:
- `learning_units.file_hash` UNIQUE — verhindert Doppelverarbeitung
- `srs_cards.question_id` UNIQUE — 1:1 mit question
- `reviews` loggt jeden einzelnen Antwortversuch
- `user_stats` hat immer genau eine Zeile (id=1)
- Index auf `srs_cards.next_review_at` (Hot Query: "welche Karten sind heute fällig?")

Fragetypen in `questions.question_type`: `mc` | `truefalse` | `fillin` | `shortanswer` | `feynman`

SRS-Status in `srs_cards.status`: `new` | `learning` | `review` | `mastered` (= grün/gelb/rot Mapping)

---

## KI-Adapter-Interface

```typescript
interface AIAdapter {
  generateQuestions(text: string, unitTitle: string, count?: number): Promise<GeneratedQuestion[]>
  evaluateFeynmanAnswer(question: string, userAnswer: string): Promise<FeynmanEvaluation>
}
```

**Standard: Claude CLI Adapter** — spawnt `claude -p "<prompt>"` als child_process, liest stdout, parst JSON. Kein separater API Key nötig, nutzt die bestehende Claude Code Installation.

Factory-Funktion liest `AI_PROVIDER` aus `.env.local` (default: `claude-cli`). Alle Adapter liefern dasselbe `GeneratedQuestion[]`-Format. Bei JSON-Parse-Fehler: ein automatischer Retry mit vereinfachtem Prompt.

**Sprache:** Prompts sind language-agnostic — die KI erkennt die Sprache der Folien automatisch und generiert Fragen in derselben Sprache.

---

## Ingestion Pipeline

```
inbox/ (PDF/PPTX hineinwerfen)
  → chokidar 'add' event
  → SHA-256 Hash → DB-Check (Duplikatschutz)
  → INSERT learning_unit (status='pending')
  → SSE event: ingestion_start
  → Text-Extraktion (pdf-parse oder adm-zip+xml)
  → textChunker → Chunks ~3000 Zeichen
  → AI: generateQuestions() pro Chunk
  → INSERT questions + srs_cards (alle auf 'new')
  → UPDATE learning_unit (status='ready')
  → SSE event: ingestion_complete
```

---

## SM-2 Algorithmus (`backend/src/srs/sm2.ts`)

Reine Funktion `sm2(input) → output`:
- `quality` 0-5 (Frontend-Buttons: Again=1, Hard=2, Good=4, Easy=5)
- quality < 3 → Reset auf interval=1, repetitions=0
- quality ≥ 3 → Standard-SM-2-Intervallformel
- `ease_factor` min 1.3, angepasst nach Antwortqualität
- `status` Mapping: interval ≥ 21 Tage = mastered (grün), ≥ 6 Tage = review (gelb), sonst learning (rot)

---

## Lernwissenschaftliche Features (Best Practices 2024/2025)

| Feature | Wissenschaftliche Basis | Umsetzung |
|---|---|---|
| Spaced Repetition | Ebbinghaus Vergessenskurve | SM-2 Algorithmus |
| Active Recall | Testing Effect (Roediger & Karpicke) | Alle Fragetypen, kein passives Lesen |
| Elaborative Feedback | Desirable Difficulties (Bjork) | Erklärung immer nach Antwort anzeigen |
| Confidence Metacognition | Calibration Research | Confidence-Rating VOR dem Aufdecken |
| Interleaving | Interleaved Practice | Daily Review mischt Topics |
| Feynman Technique | Transfer-appropriate Processing | Free-text Erklärung, AI bewertet |
| Multiple Fragetypen | Varied Retrieval | MC, T/F, Fill-in, Short Answer, Feynman |
| Gamification | Self-Determination Theory | Streaks, XP, Level, Badges |
| Pomodoro Sessions | Focused Attention Research | 25-min Timer im Quiz |
| Forgetting Curve Viz | Metacognition / Awareness | Chart zeigt Retention-Verfall ohne Review |
| Weak Spots Radar | Deliberate Practice | RadarChart nach Topic-Tags |

---

## Gamification

**XP-System:**
- Antwort richtig: +10 XP
- Karte → mastered: +25 XP
- Alle Karten einer Einheit mastered: +100 XP
- Perfekte Session (≥10 Karten, 100%): +50 Bonus
- Feynman Score ≥ 4/5: +20 XP

**Level:** Triangulare Progression — Level N = `50 * N * (N+1)` gesamt-XP

**Streak-Logik:** Tagesdaten vergleichen nach jeder Session. Lücke > 1 Tag → Reset.

**Badges (Auswahl):** `first_review`, `week_warrior`, `month_master`, `unit_master`, `perfectionist`, `speed_demon`, `feynman_fan`, `comeback_kid`, `overachiever`

---

## API-Routen (REST + SSE)

```
GET  /api/health
GET  /api/events                    ← SSE stream für Ingestion-Fortschritt
GET  /api/learning-units
GET  /api/learning-units/:id
POST /api/learning-units/:id/reprocess

GET  /api/reviews/due?limit=20&interleave=true
POST /api/reviews                   ← SM-2 Update + XP + Badge-Check

POST /api/sessions
PATCH /api/sessions/:id

GET  /api/gamification/stats
GET  /api/analytics/accuracy?days=30
GET  /api/analytics/weak-spots
GET  /api/analytics/forgetting-curve

GET  /api/settings
PATCH /api/settings
```

---

## .env.local

**Hinweis zu gescannten PDFs:** `pdf-parse` liefert leeren Text → `status='warning'` + Hinweis im Dashboard. OCR ist nicht in Scope. Workaround: Originalfolien als text-basiertes PDF oder PPTX exportieren.

---

## .env.local

```
AI_PROVIDER=claude-cli          # claude-cli | claude-sdk | ollama
ANTHROPIC_API_KEY=              # nur für claude-sdk
WATCH_FOLDER=./inbox
DB_PATH=./backend/data/learning.db
BACKEND_PORT=3001
QUESTIONS_PER_CHUNK=6
```

---

## Phasen-Rollout

### Phase 1 — Grundgerüst + Pipeline (Tage 1–4)
PDF ablegen → Fragen im Browser sehen
- [ ] npm workspace setup, Express + SQLite schema, PDF-Extraktion, Ollama-Adapter
- [ ] Ingestion Pipeline End-to-End
- [ ] Frontend: Dashboard + Unit-Detail (Fragenliste)

### Phase 2 — SRS Review Loop (Tage 5–8)
Anki-artiger Daily-Review-Loop
- [ ] SM-2 implementieren, `srs_cards` befüllen
- [ ] Daily Review Page: FlashCard + ConfidenceRater + QualityRater
- [ ] Streak + XP (ohne Badges), DueReviewsBadge auf Dashboard

### Phase 3 — PPTX + Fragetypen + Claude-Adapter (Tage 9–12)
- [ ] PPTX-Extraktion, Fill-in / Short Answer / Feynman-Modus
- [ ] Claude-Adapter (SDK + CLI-Fallback), Settings-Page
- [ ] SSE Ingestion-Fortschritt im Browser, Topic-Interleaving

### Phase 4 — Gamification + Analytics (Tage 13–17)
- [ ] Vollständiges Badge-System, XpBar mit Animation
- [ ] CalendarHeatmap, Achievements-Page
- [ ] AccuracyLineChart + WeakSpotsRadar + ForgettingCurveChart
- [ ] PomodoroTimer, SessionSummary

### Phase 5 — Polish (Tage 18–21)
- [ ] Dark Mode, Keyboard-Shortcuts (`Space`=flip, `1-4`=Qualität)
- [ ] Reprocess-Button, Session-History, CSV-Export
- [ ] README mit Setup-Anleitung (Ollama installieren, Workflow erklären)

---

## Kritische Dateien

- `backend/src/db/schema.ts` — alle anderen hängen davon ab
- `backend/src/ingestion/pipeline.ts` — komplexeste Backend-Datei
- `backend/src/srs/sm2.ts` — Korrektheit des Schedulings
- `backend/src/ai/adapter.ts` — isoliert alle KI-Komplexität
- `frontend/src/pages/DailyReview.tsx` — primäre User-Interaktionsfläche

---

## Verifizierung (End-to-End Test)

1. `npm run dev` im Root → Backend auf :3001, Frontend auf :5173
2. PDF in `inbox/` ablegen → Browser zeigt Fortschrittsbalken → Einheit erscheint im Dashboard
3. "Daily Review" starten → Karten flippen, Qualität bewerten → XP steigt
4. Gleiche PDF nochmal ablegen → wird ignoriert (Hash-Check)
5. Settings auf Claude-Adapter wechseln → Reprocess → neue Fragen generiert
6. Nach 7 Tagen Streak → `week_warrior` Badge erscheint als Toast
