# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2025-09-04

### Added (0.3.0)

- server.config tool (get/update .gitrules.yaml with caching).
- git.rules.simulate tool for policy sequence simulation.
- Structured JSON logging (LOG_FORMAT=json).
- Invocation counters per tool (in-memory).
- Extended error taxonomy (NOT_FOUND, UNAUTHORIZED).
- Deprecation notice for git.workflow.run.

### Changed (0.3.0)

- server.info now includes server.config and git.rules.simulate.
- Version bumped to 0.3.0 (non-breaking additive changes).

## [0.2.0] - 2025-09-04

### Added (0.2.0)

- HTTP transport (POST /tool, GET /health).
- Config/env parsing (GIT_RULES_PROTECTED, GIT_RULES_FEATURE_PREFIX, GIT_RULES_REPO_PATH).
- Basic git introspection for status tool.
- api_version bumped to 1.1.0 with additive capabilities.
- Tool capabilities list includes transports.

## [0.1.0] - 2025-09-04

### Added (0.1.0)

- Initial assistant-agnostic MCP server scaffold.
- Tool contracts & schemas (API v1.0.0).
- server.info, server.health, git.rules.validate, git.rules.status,
  git.workflow.suggest, git.workflow.run (stub).
