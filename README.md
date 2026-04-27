# AI Forge — Software Generation Compiler

> **Natural Language → Structured Config → Validated → Executable → Working Application**

A production-grade multi-stage AI pipeline that converts natural language descriptions into validated, executable application configurations.

## 🏗️ Architecture

```
User Prompt
    │
    ▼
┌─────────────────────┐
│ Stage 1: Intent     │  Parse NL → structured intent
│   Extraction        │  (features, roles, entities)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Stage 2: System     │  Intent → app architecture
│   Design            │  (entities, flows, permissions)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Stage 3: Schema     │  Design → 4 schemas (parallel)
│   Generation        │  UI | API | DB | Auth
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Stage 4: Refinement │  Cross-validate all layers
│   & Validation      │  Fix inconsistencies
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Validation + Repair │  Zod schemas + programmatic
│   Engine            │  + LLM-based repair
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Execution           │  Config → Working HTML app
│   Simulator         │  Sandboxed iframe preview
└─────────────────────┘
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Google Gemini API key ([Get free key](https://aistudio.google.com/apikey))

### Setup

```bash
# Install dependencies
cd ai-platform
npm install

# Configure API key
# Edit .env.local and add your Gemini API key:
# GEMINI_API_KEY=your_key_here

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📋 Features

### 1. Multi-Stage Generation Pipeline (Mandatory)
- **Stage 1: Intent Extraction** — Parse user prompt into structured form
- **Stage 2: System Design** — Convert intent → app architecture
- **Stage 3: Schema Generation** — Generate UI, API, DB, Auth schemas in parallel
- **Stage 4: Refinement** — Cross-validate and resolve inconsistencies

### 2. Strict Schema Enforcement
- Zod-based schemas for every pipeline stage
- Guaranteed valid JSON output
- Type safety and required field validation
- Cross-layer referential integrity checks

### 3. Validation + Repair Engine (Core)
- **Programmatic repairs**: Missing fields, type coercion, enum fixes
- **LLM-based repair**: Targeted re-generation for complex errors
- **Hallucination detection**: Flags unreferenced fields
- **No brute-force retries**: Surgical, error-specific repairs

### 4. Deterministic Behavior
- Low temperature (0.1-0.2) for consistent outputs
- Structured output mode (JSON response MIME type)
- Modular generation with narrow scope per stage
- Strict schema contracts enforce consistent structure

### 5. Execution Awareness
- Generated configs compile to working HTML/CSS/JS applications
- Sandboxed iframe preview with responsive device toggles
- Fallback app generation if LLM generation fails

### 6. Failure Handling
| Scenario | Response |
|----------|----------|
| Vague prompt | Returns clarification questions |
| Conflicting requirements | Makes assumptions, documents them |
| LLM timeout | Retry with exponential backoff (3x) |
| Invalid JSON | Parse repair + JSON extraction |
| Schema failures | Targeted repair, not full retry |

### 7. Evaluation Framework
- 20 test prompts (10 real products + 10 edge cases)
- Tracked metrics: success rate, retries, failure types, latency
- API endpoint: `POST /api/evaluate`

### 8. Cost vs Quality Tradeoffs
- Token usage tracking per stage
- Latency breakdown by pipeline stage
- Cost estimation per generation
- Parallel schema generation for speed

## 🧪 Evaluation

Run the evaluation framework:

```bash
# Via API
curl -X POST http://localhost:3000/api/evaluate -H "Content-Type: application/json" -d '{"count": 5}'

# Full suite (20 prompts)
curl -X POST http://localhost:3000/api/evaluate -H "Content-Type: application/json" -d '{}'
```

### Metrics Tracked
- Success rate (%)
- Average latency per request
- Repairs per request
- Failure type distribution
- Token usage and cost

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router) |
| Styling | Vanilla CSS with design tokens |
| LLM | Google Gemini 2.0 Flash |
| Validation | Zod |
| Runtime | Sandboxed iframe |

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── generate/route.js    # Main generation endpoint
│   │   └── evaluate/route.js    # Evaluation framework
│   ├── globals.css              # Design system
│   ├── layout.js                # Root layout
│   └── page.js                  # Main page
├── components/
│   ├── PromptInput.js           # Prompt textarea + examples
│   ├── PipelineVisualizer.js    # Stage progress display
│   ├── SchemaViewer.js          # Tabbed JSON viewer
│   ├── ExecutionPreview.js      # Sandboxed app preview
│   ├── MetricsPanel.js          # Performance metrics
│   └── ClarificationDialog.js  # Ambiguity resolution
└── lib/
    ├── llm.js                   # Gemini API client
    ├── pipeline/
    │   ├── index.js             # Pipeline orchestrator
    │   ├── stage1-intent.js     # Intent extraction
    │   ├── stage2-design.js     # System design
    │   ├── stage3-schema.js     # Schema generation
    │   └── stage4-refine.js     # Refinement layer
    ├── validation/
    │   ├── schemas.js           # Zod schemas
    │   ├── validator.js         # Validation engine
    │   └── repair.js            # Intelligent repair
    ├── execution/
    │   └── simulator.js         # App generation
    └── evaluation/
        ├── dataset.js           # 20 test prompts
        └── runner.js            # Evaluation runner
```

## ⚠️ Important Notes

- The system uses Google Gemini 2.0 Flash (free tier: 15 RPM, 1M tokens/day)
- Same input produces consistent output within reasonable variance (deterministic strategies applied)
- The repair engine handles real-world LLM messiness without brute-force retries
- Generated HTML apps are sandboxed for security

## 📧 Author

Built as a demo task for the AI Platform Engineer (Founding Intern) position.
