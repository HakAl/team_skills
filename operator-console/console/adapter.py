from __future__ import annotations

import json
import re
import sqlite3
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from .config import Config


WORK_ITEM_RE = re.compile(r"^[a-z0-9][a-z0-9-]*$")
DLQ_STATUSES = {"dlq", "spawn_failed_message_landed"}


@dataclass(frozen=True)
class CycleSummary:
    dispatch_id: str
    state: str
    lane: str
    awaiting_land: bool
    dlq: bool
    dlq_reason: str | None
    repo: str
    updated_at: str | None


@dataclass(frozen=True)
class GitEvidence:
    committed_delta: str
    dirty_diff: str
    staged_diff: str
    status_porcelain: str


@dataclass(frozen=True)
class CycleEvidence:
    dispatch_id: str
    state: str
    findings: list[dict[str, Any]]
    gate_runs: list[dict[str, Any]]
    respawn_count: int
    max_respawns: int
    reviewed_head: str
    approved_head: str | None
    approval: dict[str, Any] | None
    base_commit: str
    repo: str
    target_branch: str
    git: GitEvidence
    git_available: bool
    dlq: bool
    dlq_reason: str | None
    dlq_at: str | None


@dataclass(frozen=True)
class CycleStatus:
    dispatch_id: str
    state: str
    dlq: bool
    dlq_reason: str | None
    dlq_at: str | None
    escalation_reason: str | None


def validate_work_item(s: str) -> bool:
    return bool(WORK_ITEM_RE.fullmatch(s))


def list_cycles(config: Config) -> list[CycleSummary]:
    ledger = _load_dlq_status(config)
    summaries: list[CycleSummary] = []
    for review_path in _review_paths(config):
        record = _load_review(review_path)
        dispatch_id = _required_str(record, "dispatch_id")
        state = _required_str(record, "state")
        repo = _required_str(record, "repo")
        dlq_info = ledger.get(dispatch_id, {})
        summaries.append(
            CycleSummary(
                dispatch_id=dispatch_id,
                state=state,
                lane=_lane_for_repo(config, repo),
                awaiting_land=state == "review_clean",
                dlq=bool(dlq_info.get("dlq", False)),
                dlq_reason=dlq_info.get("failure_reason"),
                repo=repo,
                updated_at=record.get("updated_at"),
            )
        )
    return summaries


def load_evidence(config: Config, work_item: str) -> CycleEvidence:
    if not validate_work_item(work_item):
        raise KeyError(work_item)

    indexed = _review_index(config)
    review_path = indexed.get(work_item)
    if review_path is None:
        raise KeyError(work_item)

    record = _load_review(review_path)
    dispatch_id = _required_str(record, "dispatch_id")
    if dispatch_id != work_item:
        raise ValueError(f"review stem does not match dispatch_id: {work_item}")

    repo = _required_str(record, "repo")
    repo_path = _configured_repo_path(config, repo)
    if repo_path is None:
        raise ValueError(f"repo is outside configured roots: {repo}")

    base_commit = _optional_str(record, "base_commit", "")
    reviewed_head = _optional_str(record, "reviewed_head", "")
    ledger = _load_dlq_status(config).get(dispatch_id, {})
    git = GitEvidence("", "", "", "")
    git_available = True
    if base_commit and reviewed_head:
        try:
            git = GitEvidence(
                committed_delta=_run_allowed(
                    config,
                    ["git", "-C", str(repo_path), "diff", f"{base_commit}..{reviewed_head}"],
                ),
                dirty_diff=_run_allowed(config, ["git", "-C", str(repo_path), "diff"]),
                staged_diff=_run_allowed(
                    config, ["git", "-C", str(repo_path), "diff", "--staged"]
                ),
                status_porcelain=_run_allowed(
                    config, ["git", "-C", str(repo_path), "status", "--porcelain"]
                ),
            )
        except (subprocess.CalledProcessError, FileNotFoundError):
            git = GitEvidence("", "", "", "")
            git_available = False

    return CycleEvidence(
        dispatch_id=dispatch_id,
        state=_required_str(record, "state"),
        findings=_optional_list(record, "findings", []),
        gate_runs=_optional_list(record, "gate_runs", []),
        respawn_count=_optional_int(record, "respawn_count", 0),
        max_respawns=_optional_int(record, "max_respawns", 0),
        reviewed_head=reviewed_head,
        approved_head=record.get("approved_head"),
        approval=record.get("approval"),
        base_commit=base_commit,
        repo=repo,
        target_branch=_required_str(record, "target_branch"),
        git=git,
        git_available=git_available,
        dlq=bool(ledger.get("dlq", False)),
        dlq_reason=ledger.get("failure_reason"),
        dlq_at=ledger.get("dlq_at"),
    )


def load_status(config: Config, work_item: str) -> CycleStatus:
    if not validate_work_item(work_item):
        raise KeyError(work_item)

    indexed = _review_index(config)
    review_path = indexed.get(work_item)
    if review_path is None:
        raise KeyError(work_item)

    record = _load_review(review_path)
    dispatch_id = _required_str(record, "dispatch_id")
    if dispatch_id != work_item:
        raise ValueError(f"review stem does not match dispatch_id: {work_item}")

    repo = _required_str(record, "repo")
    if _configured_repo_path(config, repo) is None:
        raise ValueError(f"repo is outside configured roots: {repo}")

    ledger = _load_dlq_status(config).get(dispatch_id, {})
    escalation = record.get("escalation")
    escalation_reason = (
        escalation.get("reason") if isinstance(escalation, dict) else None
    )
    return CycleStatus(
        dispatch_id=dispatch_id,
        state=_required_str(record, "state"),
        dlq=bool(ledger.get("dlq", False)),
        dlq_reason=ledger.get("failure_reason"),
        dlq_at=ledger.get("dlq_at"),
        escalation_reason=escalation_reason,
    )


def _review_paths(config: Config) -> list[Path]:
    paths: list[Path] = []
    for path in config.reviews_dir.glob("*.json"):
        name = path.name
        if name.endswith(".dod.json") or name.endswith(".lock"):
            continue
        paths.append(path)
    return sorted(paths)


def _review_index(config: Config) -> dict[str, Path]:
    return {path.stem: path for path in _review_paths(config)}


def _load_review(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        record = json.load(handle)
    if not isinstance(record, dict):
        raise ValueError(f"review record must be an object: {path}")
    return record


def _load_dlq_status(config: Config) -> dict[str, dict[str, Any]]:
    uri = f"file:{config.db_path}?mode=ro"
    rows: dict[str, dict[str, Any]] = {}
    with sqlite3.connect(uri, uri=True) as conn:
        cursor = conn.execute(
            """
            SELECT dispatch_id, status, failure_reason, dlq_at
            FROM dispatch_ledger
            """
        )
        for dispatch_id, status, failure_reason, dlq_at in cursor.fetchall():
            if status in DLQ_STATUSES:
                rows[str(dispatch_id)] = {
                    "dlq": True,
                    "failure_reason": failure_reason,
                    "dlq_at": dlq_at,
                }
            elif dispatch_id not in rows:
                rows[str(dispatch_id)] = {
                    "dlq": False,
                    "failure_reason": failure_reason,
                    "dlq_at": dlq_at,
                }
    return rows


def _lane_for_repo(config: Config, repo: str) -> str:
    for lane, root in config.repo_roots.items():
        if _path_is_within(Path(repo).expanduser().resolve(), root):
            return f"[{lane.capitalize()}]"
    return "[other]"


def _configured_repo_path(config: Config, repo: str) -> Path | None:
    repo_path = Path(repo).expanduser().resolve()
    for root in config.repo_roots.values():
        if _path_is_within(repo_path, root):
            return repo_path
    return None


def _path_is_within(path: Path, root: Path) -> bool:
    return path == root or root in path.parents


def _run_allowed(config: Config, argv: list[str]) -> str:
    normalized_argv = _normalize_git_argv(argv)
    if not any(
        tuple(normalized_argv[: len(prefix)]) == prefix for prefix in config.allowed_commands
    ):
        raise ValueError(f"command is not allowed: {argv[0]}")
    completed = subprocess.run(
        argv,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    return completed.stdout


def _normalize_git_argv(argv: list[str]) -> list[str]:
    if len(argv) >= 3 and argv[0] == "git" and argv[1] == "-C":
        return [argv[0], *argv[3:]]
    return argv


def _required_str(record: dict[str, Any], key: str) -> str:
    value = record.get(key)
    if not isinstance(value, str):
        raise ValueError(f"review field must be a string: {key}")
    return value


def _optional_str(record: dict[str, Any], key: str, default: str) -> str:
    value = record.get(key, default)
    if not isinstance(value, str):
        raise ValueError(f"review field must be a string: {key}")
    return value


def _optional_int(record: dict[str, Any], key: str, default: int) -> int:
    value = record.get(key, default)
    if not isinstance(value, int):
        raise ValueError(f"review field must be an int: {key}")
    return value


def _optional_list(
    record: dict[str, Any], key: str, default: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    value = record.get(key, default)
    if not isinstance(value, list):
        raise ValueError(f"review field must be a list: {key}")
    return value
