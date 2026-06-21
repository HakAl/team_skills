from __future__ import annotations

import argparse
import os

from .app import create_app
from .config import load_config


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve the operator console.")
    parser.add_argument(
        "--config",
        default=os.environ.get("OPERATOR_CONSOLE_CONFIG", "config.json"),
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    import uvicorn

    config = load_config(args.config)
    app = create_app(config)
    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
