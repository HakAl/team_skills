# Building a Claude Traffic Proxy in One Session

I wanted to track how much my Claude API usage was actually costing me. Not the billing page estimate - the real cost. Per request. Per task. Per tool call.

So I built Langley: an intercepting proxy that captures every Claude API request, extracts token usage, calculates costs, and shows it all in real-time. In one coding session.

## The Problem

Claude's billing shows monthly totals. Helpful, but useless for:

- **Debugging** - "Why did this task cost $5?"
- **Optimization** - "Which tool is eating my context?"
- **Accountability** - "What's this project actually costing?"

I needed request-level visibility. Something that sits between my code and Claude, captures everything, and gives me analytics.

## The Architecture

Langley is a TLS-intercepting proxy. Traffic flows through it transparently:

```
Your App -> HTTPS -> Langley -> HTTPS -> Claude API
                        |
                        v
                   SQLite DB
                        |
                        v
                   Dashboard
```

It generates certificates on-the-fly, captures request/response pairs, parses Claude's SSE streams, extracts token counts, and calculates costs using a pricing table.

The dashboard shows:
- Real-time flow list (WebSocket updates)
- Token counts and costs per request
- Analytics by task, by tool, by day
- Anomaly detection (large contexts, slow responses, retries)

## What Made It Work

**1. Security From the Start**

Before writing code, we did a security analysis. Matt (our auditor persona) found 10 issues to address:

- Credential redaction on write (never store API keys)
- Upstream TLS validation (no self-signed upstream)
- CA key permissions (0600, not world-readable)
- Random certificate serials (not predictable)
- LRU cert cache (prevent memory exhaustion)

These weren't afterthoughts - they shaped the design.

**2. Phased Implementation**

We broke the work into phases:

| Phase | Deliverable |
|-------|-------------|
| 0 | Basic HTTP proxy that forwards requests |
| 1 | TLS interception, SQLite persistence |
| 2 | REST API, WebSocket server, basic UI |
| 3 | Token extraction, cost calculation, analytics |
| 4 | Full dashboard with filtering and charts |
| 5 | Polish, documentation, blog |

Each phase built on the last. Each had a clear deliverable.

**3. Right-Sized Technology**

- **Go** - Single binary, easy deployment, great TLS libraries
- **SQLite** - No server needed, WAL mode for concurrent reads
- **React** - Just works, Vite for fast builds
- **WebSocket** - Real-time without polling

No Kubernetes. No Postgres. No microservices. Just the minimum to solve the problem.

## The Tricky Parts

**SSE Parsing**

Claude's streaming API uses Server-Sent Events. Token counts come in `message_start` and `message_delta` events, scattered across the stream. The parser accumulates them correctly:

```go
case "message_start":
    // Extract input tokens from initial message
    if usage := msg["usage"]; usage != nil {
        flow.InputTokens = usage["input_tokens"]
    }

case "message_delta":
    // Extract output tokens from final delta
    if usage := event["usage"]; usage != nil {
        flow.OutputTokens = usage["output_tokens"]
    }
```

**Task Grouping**

Requests don't come with "task" labels. We infer them:

1. Explicit `X-Langley-Task` header (if you add it)
2. User ID from the request body's metadata
3. Same host with 5-minute gap (new task starts)

This groups related requests together for per-task analytics.

**Anomaly Detection**

The system flags:
- Large contexts (>100k input tokens)
- Slow responses (>30 seconds)
- Rapid repeats (same endpoint, short window = likely retries)
- High single-request cost (>$1)
- Tool failures

These help catch runaway loops and inefficient prompts.

## The Result

Langley is about 2,000 lines of Go and 600 lines of React. It:

- Intercepts HTTPS traffic transparently
- Redacts credentials before storage
- Extracts token usage from SSE streams
- Calculates costs using model-specific pricing
- Shows real-time analytics in a dashboard
- Detects anomalies automatically

All without requiring any changes to your Claude client code. Just set `HTTPS_PROXY` and you're capturing.

## What I Learned

**Plan before code.** We spent time on a security analysis and phased plan before writing implementation code. The plan survived contact with reality - the phases worked as scoped.

**Simple architecture wins.** SQLite handles everything. No external dependencies. Deploys as a single binary (once built with embedded frontend).

**Real-time matters.** The WebSocket updates make debugging feel immediate. Polling would have worked but felt sluggish.

## Try It

The code is at [github.com/HakAl/langley](https://github.com/HakAl/langley).

```bash
# Build
go build -o langley ./cmd/langley

# Trust the CA (see langley -show-ca)
# Run
./langley

# Set proxy
export HTTPS_PROXY=http://localhost:9090

# Open dashboard
# http://localhost:9091
```

Now you can see exactly what Claude is doing with your tokens.

---

*Built by the team in one session. Peter planned, Neo critiqued the architecture, Gary implemented, Reba validated. Langley watches them all now.*
