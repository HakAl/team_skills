# Operator Console

## Run Locally

Copy `config.example.json` to `config.json` and edit the paths for your local agent-comms root, reviews directory, database, and repo roots.

Start the console:

```bash
scripts/console.sh start
```

Or run it directly:

```bash
uv run --with fastapi --with uvicorn --no-project --python 3.11 python -m console
```

Open `http://127.0.0.1:8765`.

Stop the console:

```bash
scripts/console.sh stop
```

The normal test gate is `uv run --with fastapi --with httpx --no-project --python 3.11 python -m unittest`.

The real socket e2e test is `uv run --with fastapi --with httpx --with uvicorn --no-project --python 3.11 python -m unittest tests.test_e2e`.

Runtime is local only: the console binds `127.0.0.1` and does not require external network access at runtime.
