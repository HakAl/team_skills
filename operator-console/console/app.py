from __future__ import annotations

from html import escape
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from . import adapter
from .config import Config


def create_app(config: Config) -> FastAPI:
    app = FastAPI(title="Operator Console")
    static_dir = Path(__file__).resolve().parent.parent / "static"
    app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

    @app.get("/", response_class=HTMLResponse)
    def shell() -> HTMLResponse:
        return HTMLResponse(_page_shell())

    @app.get("/rail", response_class=HTMLResponse)
    def rail() -> HTMLResponse:
        cycles = sorted(
            adapter.list_cycles(config),
            key=lambda cycle: (not cycle.awaiting_land, cycle.dispatch_id),
        )
        return HTMLResponse(_rail(cycles))

    @app.get("/focus/{work_item}", response_class=HTMLResponse)
    def focus(work_item: str) -> HTMLResponse:
        try:
            evidence = adapter.load_evidence(config, work_item)
        except (KeyError, ValueError):
            raise HTTPException(status_code=404, detail="work item not found")
        return HTMLResponse(_focus(config, evidence))

    @app.get("/focus/{work_item}/status", response_class=HTMLResponse)
    def focus_status(work_item: str) -> HTMLResponse:
        try:
            status = adapter.load_status(config, work_item)
        except (KeyError, ValueError):
            raise HTTPException(status_code=404, detail="work item not found")
        return HTMLResponse(_status_banner(status))

    return app


def _page_shell() -> str:
    return """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Operator Console</title>
  <link rel="stylesheet" href="/static/app.css">
  <script src="/static/htmx.min.js"></script>
  <script src="/static/app.js"></script>
</head>
<body>
  <main class="shell">
    <section id="rail" class="rail" hx-get="/rail" hx-trigger="load, every 5s" hx-swap="innerHTML"></section>
    <section id="focus" class="focus" aria-live="polite"></section>
  </main>
</body>
</html>"""


def _rail(cycles: list[adapter.CycleSummary]) -> str:
    if not cycles:
        return '<div class="rail-empty">No cycles found.</div>'
    rows = [_rail_row(cycle) for cycle in cycles]
    return "\n".join(rows)


def _rail_row(cycle: adapter.CycleSummary) -> str:
    classes = ["rail-row"]
    if cycle.awaiting_land:
        classes.append("awaiting")
    if cycle.dlq:
        classes.append("dlq")
    dlq = '<span class="dlq-flag">DLQ</span>' if cycle.dlq else ""
    title = escape(cycle.dlq_reason or "")
    return (
        f'<button class="{" ".join(classes)}" type="button" '
        f'hx-get="/focus/{escape(cycle.dispatch_id)}" hx-target="#focus" title="{title}">'
        f'<span class="lane">{escape(cycle.lane)}</span>'
        f'<span class="dispatch">{escape(cycle.dispatch_id)}</span>'
        f'<span class="state">{escape(cycle.state)}</span>'
        f"{dlq}</button>"
    )


def _focus(config: Config, evidence: adapter.CycleEvidence) -> str:
    command = (
        f"{config.agent_comms_root}/local/bin/cycle-land.sh "
        f"{evidence.dispatch_id}"
    )
    approval = _approval(evidence.approval)
    dlq = _dlq(evidence)
    return f"""<article class="focus-panel">
  <header class="focus-header">
    <div>
      <h1>{escape(evidence.dispatch_id)}</h1>
      <p class="meta">state: <strong>{escape(evidence.state)}</strong></p>
    </div>
  </header>
  <div class="status-region" hx-get="/focus/{escape(evidence.dispatch_id)}/status" hx-trigger="load, every 5s" hx-swap="innerHTML"></div>
  {dlq}
  <section>
    <h2>Findings</h2>
    {_findings(evidence.findings)}
  </section>
  <section>
    <h2>Respawns</h2>
    <p>{evidence.respawn_count} / {evidence.max_respawns}</p>
  </section>
  <section>
    <h2>Gate Runs</h2>
    {_gate_runs(evidence.gate_runs)}
  </section>
  <section class="heads">
    <h2>Heads</h2>
    <dl>
      <dt>reviewed_head</dt><dd>{escape(evidence.reviewed_head)}</dd>
      <dt>approved_head</dt><dd>{escape(evidence.approved_head or "")}</dd>
      <dt>approval</dt><dd>{approval}</dd>
    </dl>
  </section>
  <section class="action-required">
    <h2>Action Required</h2>
    <pre>{escape(command)}</pre>
    <button type="button" class="copy-command" data-clipboard="{escape(command)}">Copy command</button>
  </section>
  <section>
    <h2>Committed Git Diff</h2>
    <pre>{escape(evidence.git.committed_delta)}</pre>
  </section>
  <section>
    <h2>Dirty Tree Status</h2>
    <h3>status --porcelain</h3>
    <pre>{escape(evidence.git.status_porcelain)}</pre>
    <h3>diff</h3>
    <pre>{escape(evidence.git.dirty_diff)}</pre>
    <h3>diff --staged</h3>
    <pre>{escape(evidence.git.staged_diff)}</pre>
  </section>
</article>"""


def _status_banner(status: adapter.CycleStatus) -> str:
    if status.dlq or status.state == "escalated":
        if status.state == "escalated" and status.escalation_reason:
            detail = status.escalation_reason
        else:
            detail = f"{status.dlq_reason or 'DLQ'} {status.dlq_at or ''}"
        return f'<div class="banner halt">HALT: {escape(detail)}</div>'
    if status.state == "verified":
        return '<div class="banner success">Verified - land complete</div>'
    if status.state in {"human_approved", "merged"}:
        return (
            f'<div class="banner landing">Landing in progress '
            f"({escape(status.state)})</div>"
        )
    if status.state == "review_clean":
        return '<div class="banner awaiting">Awaiting land</div>'
    return f'<div class="banner working">Working ({escape(status.state)})</div>'


def _findings(findings: list[dict[str, Any]]) -> str:
    if not findings:
        return '<p class="empty">No findings.</p>'
    items = []
    for finding in findings:
        items.append(
            "<li>"
            f"<strong>{escape(str(finding.get('id', '')))}</strong> "
            f"{escape(str(finding.get('severity', '')))} "
            f"{escape(str(finding.get('status', '')))}"
            f"<p>{escape(str(finding.get('problem', '')))}</p>"
            "</li>"
        )
    return f'<ul class="evidence-list">{"".join(items)}</ul>'


def _gate_runs(gate_runs: list[dict[str, Any]]) -> str:
    if not gate_runs:
        return '<p class="empty">No gate runs.</p>'
    items = []
    for run in gate_runs:
        items.append(
            "<li>"
            f"<strong>{escape(str(run.get('check_id', '')))}</strong> "
            f"{escape(str(run.get('verdict', '')))}"
            f"<p>{escape(str(run.get('argv_or_registry_name', '')))}</p>"
            "</li>"
        )
    return f'<ul class="evidence-list">{"".join(items)}</ul>'


def _approval(approval: Optional[dict[str, Any]]) -> str:
    if not approval:
        return "not approved"
    approver = escape(str(approval.get("approver", "")))
    if approver:
        return f"signed by {approver}"
    return "signed"


def _dlq(evidence: adapter.CycleEvidence) -> str:
    if not evidence.dlq:
        return ""
    reason = escape(evidence.dlq_reason or "DLQ flagged")
    at = escape(evidence.dlq_at or "")
    return f'<div class="dlq-banner">DLQ: {reason} {at}</div>'
