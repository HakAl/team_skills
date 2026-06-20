from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from console.app import create_app
from console.config import load_config
from tests.test_adapter import _write_fixture_environment


class AppTests(unittest.TestCase):
    def test_shell_includes_static_assets_and_regions(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            config_path, _repo = _write_fixture_environment(Path(tempdir))
            client = TestClient(create_app(load_config(config_path)))

            response = client.get("/")

            self.assertEqual(response.status_code, 200)
            self.assertIn('id="rail"', response.text)
            self.assertIn('id="focus"', response.text)
            self.assertIn('/static/htmx.min.js', response.text)
            self.assertIn('/static/app.css', response.text)
            self.assertIn('hx-get="/rail"', response.text)
            self.assertIn('every 5s', response.text)

    def test_rail_pins_awaiting_cycles_and_renders_tags_and_dlq(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            config_path, _repo = _write_fixture_environment(Path(tempdir))
            client = TestClient(create_app(load_config(config_path)))

            response = client.get("/rail")

            self.assertEqual(response.status_code, 200)
            body = response.text
            self.assertIn("air-awaiting", body)
            self.assertIn("pi-approved", body)
            self.assertIn("eng-merged", body)
            self.assertIn("other-verified", body)
            self.assertLess(body.index("air-awaiting"), body.index("eng-merged"))
            self.assertIn("[Air]", body)
            self.assertIn("[Pi]", body)
            self.assertIn("[Eng]", body)
            self.assertIn("[other]", body)
            self.assertIn("DLQ", body)
            self.assertIn('hx-get="/focus/air-awaiting"', body)
            self.assertIn('hx-target="#focus"', body)

    def test_focus_renders_evidence_and_staged_approve_form(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            config_path, _repo = _write_fixture_environment(Path(tempdir))
            config = load_config(config_path)
            client = TestClient(create_app(config))

            response = client.get("/focus/air-awaiting")

            self.assertEqual(response.status_code, 200)
            body = response.text
            self.assertIn("review_clean", body)
            self.assertIn("finding-1", body)
            self.assertIn("blocking", body)
            self.assertIn("gate-extra", body)
            self.assertIn("pass", body)
            self.assertIn("0 / 3", body)
            self.assertIn("not approved", body)
            self.assertIn("changed", body)
            self.assertIn("dirty worktree", body)
            self.assertIn(
                f"{config.agent_comms_root}/local/bin/cycle-land.sh air-awaiting",
                body,
            )
            self.assertIn('hx-post="/approve/air-awaiting"', body)

    def test_focus_rejects_bad_regex_and_unknown_work_items(self) -> None:
        with tempfile.TemporaryDirectory() as tempdir:
            config_path, _repo = _write_fixture_environment(Path(tempdir))
            client = TestClient(create_app(load_config(config_path)))

            # Encoded-slash URLs normalize to the shell at the HTTP layer (benign, no handler reached); adapter tests cover path-traversal defense.
            self.assertEqual(client.get("/focus/UpperCase").status_code, 404)
            self.assertEqual(client.get("/focus/has_underscore").status_code, 404)
            self.assertEqual(client.get("/focus/dotty.id").status_code, 404)
            self.assertEqual(client.get("/focus/missing-id").status_code, 404)


if __name__ == "__main__":
    unittest.main()
