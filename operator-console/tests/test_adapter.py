from __future__ import annotations

import json
import sqlite3
import subprocess
import tempfile
import unittest
from pathlib import Path

from console.adapter import list_cycles, load_evidence, validate_work_item
from console.adapter import _run_allowed
from console.config import load_config


READ_ONLY_ALLOWLIST = [
    "git diff",
    "git diff --staged",
    "git status --porcelain",
    "git log",
]


class AdapterTests(unittest.TestCase):
    def test_list_cycles_lanes_awaiting_and_dlq(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            config_path, _repo = _write_fixture_environment(Path(tempdir))
            config = load_config(config_path)

            summaries = {cycle.dispatch_id: cycle for cycle in list_cycles(config)}

            self.assertEqual(summaries["air-awaiting"].lane, "[Air]")
            self.assertEqual(summaries["pi-approved"].lane, "[Pi]")
            self.assertEqual(summaries["eng-merged"].lane, "[Eng]")
            self.assertEqual(summaries["other-verified"].lane, "[other]")
            self.assertTrue(summaries["air-awaiting"].awaiting_land)
            self.assertFalse(summaries["pi-approved"].awaiting_land)
            self.assertTrue(summaries["air-awaiting"].dlq)
            self.assertEqual(summaries["air-awaiting"].dlq_reason, "worker failed")
            self.assertFalse(summaries["pi-approved"].dlq)

    def test_load_evidence_validates_allowlist_and_reads_git(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            config_path, repo = _write_fixture_environment(Path(tempdir))
            config = load_config(config_path)

            evidence = load_evidence(config, "air-awaiting")

            self.assertEqual(evidence.dispatch_id, "air-awaiting")
            self.assertEqual(evidence.state, "review_clean")
            self.assertTrue(evidence.base_commit)
            self.assertTrue(evidence.reviewed_head)
            self.assertIn("changed", evidence.git.committed_delta)
            self.assertIn("dirty worktree", evidence.git.dirty_diff)
            self.assertIn("staged change", evidence.git.staged_diff)
            self.assertIn("MM tracked.txt", evidence.git.status_porcelain)
            self.assertEqual(evidence.repo, str(repo))

    def test_load_evidence_rejects_unknown_and_traversal(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            config_path, _repo = _write_fixture_environment(Path(tempdir))
            config = load_config(config_path)

            self.assertTrue(validate_work_item("valid-id-1"))
            self.assertFalse(validate_work_item("../x"))
            self.assertFalse(validate_work_item("..%2f"))

            with self.assertRaises(KeyError):
                load_evidence(config, "missing-id")
            with self.assertRaises(KeyError):
                load_evidence(config, "../x")

    def test_load_evidence_refuses_out_of_root_repo(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            config_path, _repo = _write_fixture_environment(Path(tempdir))
            config = load_config(config_path)

            with self.assertRaisesRegex(ValueError, "outside configured roots"):
                load_evidence(config, "other-verified")

    def test_config_rejects_writable_roots_and_forbidden_commands(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            tmp_path = Path(tempdir)
            config_path, _repo = _write_fixture_environment(tmp_path)
            raw = json.loads(config_path.read_text(encoding="utf-8"))

            raw["writable_state_roots"] = [str(tmp_path)]
            bad_writes = tmp_path / "bad-writes.json"
            bad_writes.write_text(json.dumps(raw), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "writable_state_roots"):
                load_config(bad_writes)

            raw["writable_state_roots"] = []
            raw["allowed_commands"] = ["git", "approve"]
            bad_command = tmp_path / "bad-command.json"
            bad_command.write_text(json.dumps(raw), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "forbidden command"):
                load_config(bad_command)

    def test_run_allowed_normalizes_git_dash_c_and_refuses_writes(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            tmp_path = Path(tempdir)
            config_path, repo = _write_fixture_environment(tmp_path)
            config = load_config(config_path)

            self.assertIsInstance(
                _run_allowed(config, ["git", "-C", str(repo), "diff"]), str
            )
            self.assertIsInstance(
                _run_allowed(config, ["git", "-C", str(repo), "diff", "--staged"]), str
            )
            self.assertIsInstance(
                _run_allowed(config, ["git", "-C", str(repo), "status", "--porcelain"]),
                str,
            )
            self.assertIsInstance(
                _run_allowed(config, ["git", "-C", str(repo), "log", "--oneline", "-1"]),
                str,
            )

            with self.assertRaises(ValueError):
                _run_allowed(config, ["git", "-C", str(repo), "push"])
            with self.assertRaises(ValueError):
                _run_allowed(config, ["git", "-C", str(repo), "reset", "--hard"])

    def test_load_evidence_defaults_early_state_fields(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            tmp_path = Path(tempdir)
            config_path, repo = _write_fixture_environment(tmp_path)
            config = load_config(config_path)
            early_path = config.reviews_dir / "air-awaiting.json"
            record = json.loads(early_path.read_text(encoding="utf-8"))
            for key in (
                "base_commit",
                "reviewed_head",
                "respawn_count",
                "max_respawns",
                "findings",
                "gate_runs",
            ):
                record.pop(key, None)
            early_path.write_text(json.dumps(record), encoding="utf-8")

            evidence = load_evidence(config, "air-awaiting")

            self.assertEqual(evidence.repo, str(repo))
            self.assertEqual(evidence.base_commit, "")
            self.assertEqual(evidence.reviewed_head, "")
            self.assertEqual(evidence.respawn_count, 0)
            self.assertEqual(evidence.max_respawns, 0)
            self.assertEqual(evidence.findings, [])
            self.assertEqual(evidence.gate_runs, [])
            self.assertEqual(evidence.git.committed_delta, "")
            self.assertEqual(evidence.git.dirty_diff, "")
            self.assertEqual(evidence.git.staged_diff, "")
            self.assertEqual(evidence.git.status_porcelain, "")


def _write_fixture_environment(tmp_path: Path) -> tuple[Path, Path]:
    root = tmp_path / "agent-comms"
    reviews_dir = root / "local" / "dispatch" / "reviews"
    data_dir = root / "data"
    reviews_dir.mkdir(parents=True)
    data_dir.mkdir(parents=True)

    air_root = tmp_path / "ai-research"
    pi_root = tmp_path / "prompt_injection"
    eng_root = tmp_path / "_skills-operator-console"
    repo = air_root / "project"
    for path in (repo, pi_root, eng_root):
        path.mkdir(parents=True)

    base_commit, reviewed_head = _init_git_repo(repo)

    replacements = {
        "air-awaiting": {"repo": str(repo)},
        "pi-approved": {"repo": str(pi_root)},
        "eng-merged": {"repo": str(eng_root)},
        "other-verified": {"repo": str(tmp_path / "outside")},
    }
    for dispatch_id, values in replacements.items():
        record = _load_review_template(dispatch_id)
        record.update(
            {
                **values,
                "base_commit": base_commit,
                "reviewed_head": reviewed_head,
            }
        )
        _write_review(reviews_dir, record)

    (reviews_dir / "skip-me.dod.json").write_text("{}", encoding="utf-8")

    db_path = data_dir / "agent-comms.sqlite"
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            """
            CREATE TABLE dispatch_ledger (
                dispatch_id TEXT PRIMARY KEY,
                status TEXT,
                failure_reason TEXT,
                dlq_at TEXT
            )
            """
        )
        conn.execute(
            """
            INSERT INTO dispatch_ledger
            VALUES ('air-awaiting', 'dlq', 'worker failed', '2026-06-20T15:01:00Z')
            """
        )
        conn.execute(
            """
            INSERT INTO dispatch_ledger
            VALUES ('pi-approved', 'closed', NULL, NULL)
            """
        )

    config_path = tmp_path / "config.json"
    config_path.write_text(
        json.dumps(
            {
                "agent_comms_root": str(root),
                "reviews_dir": "local/dispatch/reviews",
                "db_path": str(db_path),
                "repo_roots": {
                    "air": str(air_root),
                    "pi": str(pi_root),
                    "eng": str(eng_root),
                },
                "allowed_commands": READ_ONLY_ALLOWLIST,
                "writable_state_roots": [],
            }
        ),
        encoding="utf-8",
    )
    return config_path, repo


def _load_review_template(dispatch_id: str) -> dict[str, object]:
    path = Path(__file__).parent / "fixtures" / "reviews" / f"{dispatch_id}.json"
    return json.loads(path.read_text(encoding="utf-8"))


def _init_git_repo(repo: Path) -> tuple[str, str]:
    _run(["git", "init"], repo)
    _run(["git", "config", "user.email", "test@example.com"], repo)
    _run(["git", "config", "user.name", "Test User"], repo)

    tracked = repo / "tracked.txt"
    tracked.write_text("base\n", encoding="utf-8")
    _run(["git", "add", "tracked.txt"], repo)
    _run(["git", "commit", "-m", "base"], repo)
    base_commit = _run(["git", "rev-parse", "HEAD"], repo).strip()

    tracked.write_text("base\nchanged\n", encoding="utf-8")
    _run(["git", "commit", "-am", "reviewed"], repo)
    reviewed_head = _run(["git", "rev-parse", "HEAD"], repo).strip()

    tracked.write_text("base\nchanged\nstaged change\n", encoding="utf-8")
    _run(["git", "add", "tracked.txt"], repo)
    tracked.write_text("base\nchanged\nstaged change\ndirty worktree\n", encoding="utf-8")
    return base_commit, reviewed_head


def _write_review(reviews_dir: Path, record: dict[str, object]) -> None:
    path = reviews_dir / f"{record['dispatch_id']}.json"
    path.write_text(json.dumps(record), encoding="utf-8")


def _run(argv: list[str], cwd: Path) -> str:
    return subprocess.run(
        argv,
        cwd=cwd,
        check=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    ).stdout


if __name__ == "__main__":
    unittest.main()
