# ReleasePilot Architecture

This document records the current backend structure and the reasoning behind several implementation choices.

It describes the repository as it exists today rather than a future target architecture.

## Request flow

A typical management request follows:

```text
HTTP request
    |
    v
Controller
    |
    v
Service
    |
    v
Repository
    |
    v
DataSource
    |
    v
PostgreSQL
```

Controllers translate HTTP input into application calls.

Services contain feature-management behavior.

Repositories contain SQL and persistence behavior.

PostgreSQL stores feature configuration, targeting rules, migration history, and audit records.

## Feature evaluation flow

Evaluation is intentionally separate from CRUD operations.

```text
Evaluate request
      |
      v
Load flag for environment
      |
      v
Globally enabled?
      |
      +--- no ---> FLAG_DISABLED
      |
      v
Load ordered targeting rules
      |
      v
First matching rule?
      |
      +--- yes --> TARGETING_MATCH
      |
      v
0% rollout?
      |
      +--- yes --> ROLLOUT_ZERO
      |
      v
100% rollout?
      |
      +--- yes --> ROLLOUT_FULL
      |
      v
SHA-256 bucket
      |
      +--- bucket < rollout --> ROLLOUT_MATCH
      |
      +--- otherwise --------> ROLLOUT_MISS
```

## Why deterministic bucketing

Using a random value on every evaluation would make percentage rollout unstable.

A user could receive a feature on one request and lose it on the next request without any configuration change.

ReleasePilot instead hashes:

```text
environment:flagName:userKey
```

and maps part of the SHA-256 result into a bucket from `0` to `99`.

This makes repeated evaluations stable for the same input.

Environment is included in the hash because rollout membership is allowed to differ between environments.

User keys are normalized once by trimming surrounding whitespace, but their case is preserved. `User123` and `user123` are therefore distinct rollout identities. Targeting rules on `userKey` use the same case-sensitive semantics, while `country`, `plan`, and `email` comparisons remain case-insensitive.

## Why targeting rules run before percentage rollout

Targeting represents an explicit decision.

For example:

```text
plan EQUALS free
serveEnabled = false
```

should be able to override a general percentage rollout.

Rules therefore execute first in priority order.

Only a user that matches no rule reaches percentage evaluation.

## Rule priority

Lower numeric priority values execute first.

The repository query orders rules by:

```text
priority ASC, id ASC
```

The rule ID provides deterministic ordering when two rules have the same priority.

## Why PostgreSQL

The project relies on relational constraints and explicit querying for:

- unique flag/environment configuration;
- targeting rule ordering;
- audit history;
- migration history.

PostgreSQL is used in development and integration testing so database behavior does not depend on differences between production SQL and an in-memory substitute.

## Why Testcontainers instead of H2

The integration test starts an actual PostgreSQL container.

This choice avoids relying on H2 behavior for PostgreSQL-specific SQL, constraints, migrations, and JDBC behavior.

The trade-off is that integration tests require Docker and take longer than pure unit tests.

## Why JDBC instead of an ORM

The current project uses explicit SQL in repository classes.

This keeps the relationship between application operations and PostgreSQL queries visible and avoids introducing ORM behavior that is not currently needed.

The trade-off is additional mapping and JDBC code.

An ORM could become justified later if the domain model and relationship management become substantially more complex.

## Why DataSource instead of DriverManager

Early development opened JDBC connections directly.

The current version obtains connections through Spring's configured `DataSource`.

This removes database credentials from repository classes and allows the same repository implementation to work with local PostgreSQL, Docker Compose, and Testcontainers configuration.

## Environment identity

A feature name alone is not unique.

The actual configuration identity is:

```text
(name, environment)
```

because:

```text
dev/new_checkout
```

and:

```text
prod/new_checkout
```

may legitimately have different enabled and rollout values.

This rule is also enforced by PostgreSQL.

## Database ownership

Application runtime access and schema migration responsibilities are separate in the local non-Docker setup.

`releasepilot_app` performs application reads and writes.

`releasepilot_migrator` owns schema migration responsibilities.

Flyway records applied migrations in `flyway_schema_history`.

## Audit behavior

Audit entries are append-oriented records describing configuration changes.

The current application records flag creation, state changes, rollout changes, deletion, and targeting-rule changes.

Audit logging currently provides configuration traceability.

It is not yet an authenticated security audit trail because actor identity and authentication have not been implemented.

## Error model

Domain/application errors are translated to HTTP responses centrally.

Examples include:

```text
FeatureFlagNotFoundException
→ 404 Not Found

FeatureFlagAlreadyExistsException
→ 409 Conflict

Invalid arguments
→ 400 Bad Request
```

The intent is to keep repetitive HTTP error mapping out of individual controllers.

## Current boundaries

The architecture currently assumes:

- one ReleasePilot installation;
- no tenant model;
- PostgreSQL as the persistence engine;
- server-side evaluation through the REST API;
- a fixed set of targeting context attributes.

These constraints should be changed only when a concrete requirement justifies additional infrastructure.
