# Repository Guidelines

## Project Structure & Module Organization
`System/` is the single workspace root. Place runtime modules in `System/src/` grouped by capability (`agents`, `pipelines`, `io`). Shared configs stay beside their owners, while global prompts/assets sit in `System/assets/`. Keep integration glue or sandbox experiments under `System/labs/`. Mirror the directory layout when adding docs (`System/docs/<topic>.md`) and tests so navigation stays predictable.

## Build, Test, and Development Commands
Bootstrap locally with `python -m pip install -r requirements.txt`. Run `ruff check System/src` for fast linting and `ruff format` to normalize style. Execute the suite via `python -m pytest System/tests`; add `-k <pattern>` for focused runs. Use `mypy System/src` on any type-heavy change and `python -m build` before publishing artifacts to ensure wheels and sdists actually compile.

## Coding Style & Naming Conventions
Target Python 3.11+, four-space indentation, and strict type hints on public APIs. Modules, packages, and functions use `snake_case`; classes stay `PascalCase`; async helpers end with `_async`. Keep files under ~400 lines and lift shared utilities into `System/src/common/`. Docstrings follow Google style, and every network boundary or agent contract merits an inline comment describing assumptions and retries.

## Testing Guidelines
Pytest drives verification. Name files `System/tests/<area>/test_<unit>.py` and tests `test_<behavior>()`. Expect ≥85% statement coverage; if that cannot be met, justify the gap in the PR. Tag expensive suites with `@pytest.mark.slow` and keep fixtures reusable inside `System/tests/fixtures/`. Always run `pytest --maxfail=1 --disable-warnings -q` plus lint/type commands before asking for review.

## Commit & Pull Request Guidelines
Commits should follow Conventional Commits (`feat:`, `fix:`, `docs:`) and stay narrowly focused. Reference tickets in the footer, and mention notable toggles or migrations in the body. PRs need: a summary, reproduction steps or screenshots, linked issues, a checklist of local commands executed, and reviewer assignments (one domain, one QA). Draft status is encouraged while tests run; only request merge once CI is green.

## Security & Configuration Tips
Do not commit credentials from `.ssh/` or plain `.env`; provide `.env.example` with fake values. Document new secrets or third-party scopes in `System/docs/security.md` and update dependency justifications in `System/docs/dependencies.md`. Review sandbox/network constraints before enabling outbound calls, and gate sensitive features behind configuration flags stored in `System/config/`.
