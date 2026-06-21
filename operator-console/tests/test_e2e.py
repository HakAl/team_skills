from __future__ import annotations

import importlib.util
import json
import socket
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path

from tests.test_adapter import _write_fixture_environment


UVICORN = importlib.util.find_spec("uvicorn") is not None


@unittest.skipUnless(UVICORN, "uvicorn not installed")
class RealSocketE2ETests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.tmp_path = Path(self.tempdir.name)
        self.config_path, _repo = _write_fixture_environment(self.tmp_path)
        self.operator_console_dir = Path(__file__).resolve().parent.parent
        self.port = _free_port()
        self.process: subprocess.Popen[str] | None = None
        self.httpx = None

        raw = json.loads(self.config_path.read_text(encoding="utf-8"))
        self.config_path.write_text(json.dumps(raw), encoding="utf-8")

    def tearDown(self) -> None:
        if self.process is not None and self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait(timeout=5)
        self.tempdir.cleanup()

    def test_console_serves_fixture_over_real_socket(self) -> None:
        self.process = subprocess.Popen(
            [
                sys.executable,
                "-m",
                "console",
                "--config",
                str(self.config_path),
                "--host",
                "127.0.0.1",
                "--port",
                str(self.port),
            ],
            cwd=self.operator_console_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
        )
        base_url = f"http://127.0.0.1:{self.port}"
        import httpx

        self.httpx = httpx
        self._wait_for_server(base_url)

        shell = self.httpx.get(f"{base_url}/", timeout=5)
        self.assertEqual(shell.status_code, 200)
        self.assertIn('id="rail"', shell.text)
        self.assertIn('id="focus"', shell.text)

        rail = self.httpx.get(f"{base_url}/rail", timeout=5)
        self.assertEqual(rail.status_code, 200)
        self.assertIn("eng-verified", rail.text)
        self.assertIn("[Eng]", rail.text)

        focus = self.httpx.get(f"{base_url}/focus/eng-verified", timeout=5)
        self.assertEqual(focus.status_code, 200)
        self.assertIn("Git evidence unavailable", focus.text)

        healthy_focus = self.httpx.get(f"{base_url}/focus/air-awaiting", timeout=5)
        self.assertEqual(healthy_focus.status_code, 200)
        self.assertIn("changed", healthy_focus.text)

        status = self.httpx.get(f"{base_url}/focus/eng-verified/status", timeout=5)
        self.assertEqual(status.status_code, 200)
        self.assertIn("banner success", status.text)
        self.assertIn("Verified", status.text)

        missing = self.httpx.get(f"{base_url}/focus/UpperCase", timeout=5)
        self.assertEqual(missing.status_code, 404)

    def _wait_for_server(self, base_url: str) -> None:
        deadline = time.monotonic() + 10
        last_error: Exception | None = None
        while time.monotonic() < deadline:
            if self.process is not None and self.process.poll() is not None:
                output = self.process.communicate(timeout=1)[0]
                self.fail(f"server exited before startup\n{output}")
            try:
                response = self.httpx.get(f"{base_url}/", timeout=1)
            except self.httpx.HTTPError as exc:
                last_error = exc
            else:
                if response.status_code == 200:
                    return
            time.sleep(0.1)

        output = ""
        if self.process is not None:
            self.process.terminate()
            try:
                output = self.process.communicate(timeout=5)[0]
            except subprocess.TimeoutExpired:
                self.process.kill()
                output = self.process.communicate(timeout=5)[0]
        self.fail(f"server did not start: {last_error}\n{output}")


def _free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return int(sock.getsockname()[1])


if __name__ == "__main__":
    unittest.main()
