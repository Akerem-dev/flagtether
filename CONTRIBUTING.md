# Contributing

FlagTether is currently maintained as a portfolio and learning project, but changes should still follow a reviewable development process.

## Development setup

Before submitting a change:

```bash
mvn clean verify
```

must succeed.

Docker is required for the PostgreSQL integration tests.

For local application startup, use either the documented PostgreSQL setup or Docker Compose.

## Branches

Create focused branches instead of combining unrelated changes.

Example:

```text
feature/targeting-rule-editing
fix/audit-log-order
test/rollout-boundaries
docs/update-docker-setup
```

## Pull requests

A pull request should explain:

- what behavior changed;
- why the change is needed;
- how it was tested;
- whether the database schema changed;
- any known limitation introduced by the change.

Avoid large unrelated refactors in the same pull request as a feature change.

## Database changes

Do not edit a Flyway migration that has already been applied.

Create a new migration instead:

```text
V3__description.sql
V4__description.sql
```

Migration names should describe the schema change rather than an implementation task.

## Tests

Changes to evaluation behavior should include tests for the business outcome, not only whether a method was called.

Examples:

- the same user remains in the same rollout bucket;
- a targeting rule overrides rollout;
- a disabled flag cannot become enabled through rollout;
- invalid rollout values are rejected.

## Secrets

Never commit:

```text
.env
database passwords
API tokens
private keys
production credentials
```

Use `.env.example` for documented configuration names without real secrets.