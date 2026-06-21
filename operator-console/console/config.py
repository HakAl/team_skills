from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path


FORBIDDEN_COMMAND_TOKENS = {"cycle-land.sh", "approve", "push_approval"}


@dataclass(frozen=True)
class Config:
    agent_comms_root: Path
    reviews_dir: Path
    db_path: Path
    repo_roots: dict[str, Path]
    allowed_commands: list[tuple[str, ...]]
    writable_state_roots: list[Path]


def load_config(path: str | Path) -> Config:
    config_path = Path(path).expanduser().resolve()
    with config_path.open("r", encoding="utf-8") as handle:
        raw = json.load(handle)

    required = {
        "agent_comms_root",
        "reviews_dir",
        "repo_roots",
        "allowed_commands",
        "writable_state_roots",
    }
    missing = sorted(required - raw.keys())
    if missing:
        raise ValueError(f"missing config keys: {', '.join(missing)}")

    agent_comms_root = _resolve_path(raw["agent_comms_root"])
    reviews_dir = _resolve_path(raw["reviews_dir"], base=agent_comms_root)
    db_path = _resolve_path(
        raw.get("db_path", Path("~/.agent-comms/agent-comms.sqlite")),
        base=agent_comms_root,
    )

    repo_roots_raw = raw["repo_roots"]
    if not isinstance(repo_roots_raw, dict) or not repo_roots_raw:
        raise ValueError("repo_roots must be a non-empty object")
    repo_roots = {
        str(lane): _resolve_path(root) for lane, root in repo_roots_raw.items()
    }

    writable_state_roots_raw = raw["writable_state_roots"]
    if writable_state_roots_raw != []:
        raise ValueError("writable_state_roots must be empty in phase 1")

    allowed_commands = _normalize_allowed_commands(raw["allowed_commands"])
    _reject_forbidden_commands(allowed_commands)

    return Config(
        agent_comms_root=agent_comms_root,
        reviews_dir=reviews_dir,
        db_path=db_path,
        repo_roots=repo_roots,
        allowed_commands=allowed_commands,
        writable_state_roots=[],
    )


def _resolve_path(value: object, base: Path | None = None) -> Path:
    if not isinstance(value, (str, Path)):
        raise ValueError(f"path must be a string: {value!r}")
    path = Path(value).expanduser()
    if not path.is_absolute() and base is not None:
        path = base / path
    return path.resolve()


def _normalize_allowed_commands(value: object) -> list[tuple[str, ...]]:
    if not isinstance(value, list) or not value:
        raise ValueError("allowed_commands must be a non-empty list")

    commands: list[tuple[str, ...]] = []
    for item in value:
        if isinstance(item, str):
            parts = tuple(part for part in item.split() if part)
        elif isinstance(item, list) and all(isinstance(part, str) for part in item):
            parts = tuple(item)
        else:
            raise ValueError("allowed_commands entries must be strings or string lists")
        if not parts:
            raise ValueError("allowed_commands entries cannot be empty")
        commands.append(parts)
    return commands


def _reject_forbidden_commands(commands: list[tuple[str, ...]]) -> None:
    for command in commands:
        for token in command:
            name = Path(token).name
            if name in FORBIDDEN_COMMAND_TOKENS:
                raise ValueError(f"forbidden command in allowed_commands: {token}")

