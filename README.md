# ReleasePilot

ReleasePilot is a self-hosted feature flag backend for controlling how features are exposed across development, staging, and production environments.

It was built to explore the engineering behind feature-management systems: deterministic rollouts, user targeting, environment isolation, audit history, database migrations, and API-level testing.

The repository currently contains the backend platform. A web administration interface is not part of the current version yet.

## Why this exists

Shipping a feature often needs more control than a boolean stored in application code.

A team may want to:

- enable a feature in development but keep it disabled in production;
- expose a release to only a percentage of users;
- target users by country, plan, email, or user key;
- preserve the same rollout decision for the same user;
- understand why an evaluation returned `true` or `false`;
- keep a history of configuration changes.

ReleasePilot implements those behaviors as a small feature-management service rather than hiding them behind a third-party SDK.

### Current scope

The current backend supports:

- feature flag creation, updates, lookup, and deletion;
- `dev`, `staging`, and `prod` configurations;
- deterministic percentage rollouts;
- targeting rules with explicit priority;
- targeting by user key, country, plan, and email;
- audit history;
- REST API error responses;
- PostgreSQL persistence;
- versioned Flyway migrations;
- OpenAPI documentation;
- unit and PostgreSQL integration tests;
- Docker-based local execution.

### Non-goals of the current version

The current version is not intended to be:

- a multi-tenant SaaS platform;
- an authentication or identity provider;
- a replacement for commercial feature-management products;
- a distributed low-latency edge evaluation system;
- a complete admin UI.

Those areas are intentionally outside the current backend scope.

## Quick start

The shortest reproducible setup uses Docker.

### Requirements

- Docker
- Docker Compose

Clone the repository and enter the project directory:

```bash
git clone <REPOSITORY_URL>
cd releasepilot
```

Create the local environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Set a local PostgreSQL password inside `.env`:

```text
POSTGRES_PASSWORD=change-this-password
```

Start the application:

```bash
docker compose up --build
```

When startup completes, open:

```text
http://localhost:8080/swagger-ui.html
```

The OpenAPI document is available at:

```text
http://localhost:8080/v3/api-docs
```

Stop the stack:

```bash
docker compose down
```

Remove the local PostgreSQL volume as well:

```bash
docker compose down -v
```

## First working example

Create a feature flag in the production environment:

```http
POST /api/environments/prod/flags
Content-Type: application/json

{
  "name": "new_checkout",
  "enabled": true,
  "rolloutPercentage": 20
}
```

Evaluate it for a user:

```http
GET /api/environments/prod/flags/new_checkout/evaluate?userKey=user-123
```

An evaluation returns both the decision and the reason used to reach it.

Example:

```json
{
  "flagName": "new_checkout",
  "environment": "prod",
  "userKey": "user-123",
  "enabled": false,
  "reason": "ROLLOUT_MISS",
  "rolloutPercentage": 20,
  "bucket": 63,
  "matchedRuleId": null
}
```

The same environment, flag name, and user key produce the same rollout bucket.

## Evaluation model

ReleasePilot evaluates a flag in this order:

```text
Request
  |
  v
Feature flag exists?
  |
  v
Globally enabled?
  |
  +---- no ----> disabled
  |
  v
Targeting rules by priority
  |
  +---- match --> rule result
  |
  v
Percentage rollout
  |
  v
SHA-256 deterministic bucket
  |
  v
enabled / disabled
```

Random numbers are intentionally not used for percentage rollouts.

The bucket input contains:

```text
environment + flagName + userKey
```

This prevents a user from randomly moving in and out of a rollout between repeated requests.

## Targeting rules

Rules may target:

```text
userKey
country
plan
email
```

Supported operators are:

```text
EQUALS
NOT_EQUALS
CONTAINS
STARTS_WITH
ENDS_WITH
```

Rules are evaluated in ascending priority order.

For example:

```text
priority = 5
plan EQUALS free
serveEnabled = false
```

is evaluated before:

```text
priority = 10
country EQUALS TR
serveEnabled = true
```

If no rule matches, evaluation falls back to the percentage rollout.

## Environments

A flag is configured independently for:

```text
dev
staging
prod
```

For example, the same flag may be configured as:

```text
new_checkout

dev
enabled = true
rollout = 100

staging
enabled = true
rollout = 50

prod
enabled = true
rollout = 10
```

The uniqueness boundary in PostgreSQL is therefore the combination of flag name and environment rather than flag name alone.

## Architecture

The backend follows a Controller → Service → Repository flow.

```text
HTTP Client
    |
    v
Spring MVC Controller
    |
    v
Application Service
    |
    +-------------------------+
    |                         |
    v                         v
Evaluation / Rules        Audit logging
    |
    v
Repository
    |
    v
Spring DataSource
    |
    v
PostgreSQL
```

Database schema changes are managed separately through Flyway.

More detail, including design decisions and trade-offs, is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Repository layout

```text
releasepilot/
├── src/
│   ├── main/
│   │   ├── java/com/releasepilot/
│   │   └── resources/
│   │       └── db/migration/
│   └── test/
│       └── java/com/releasepilot/
├── .github/
│   └── workflows/
├── Dockerfile
├── compose.yaml
├── pom.xml
└── README.md
```

`src/main/java/com/releasepilot` contains the HTTP, application, evaluation, persistence, and configuration code.

`src/main/resources/db/migration` is the authoritative database migration history.

`src/test/java/com/releasepilot` contains unit and integration tests.

## Database migrations

Flyway owns schema evolution.

Migration files currently live at:

```text
src/main/resources/db/migration/
```

Current migrations:

```text
V1__initial_schema.sql
V2__schema_integrity.sql
```

Existing migrations should not be edited after they have been applied. New schema changes should be introduced as a new migration version.

## Testing

Run all tests:

```bash
mvn clean test
```

Run the complete Maven verification lifecycle:

```bash
mvn clean verify
```

The test suite currently covers domain validation, evaluation behavior, stable percentage bucketing, targeting behavior, and an integration flow against a real PostgreSQL instance started by Testcontainers.

The integration tests do not replace PostgreSQL with an in-memory database.

### What is not currently covered

The current backend test suite does not claim coverage for:

- browser-level E2E flows;
- a web administration UI;
- production load or stress testing;
- multi-node consistency;
- authentication and authorization;
- every security threat model.

Those are outside the current implemented scope.

## Running without Docker

Requirements:

- Java 21
- Maven
- PostgreSQL

The application database and migration user passwords are provided through environment variables.

PowerShell example:

```powershell
$env:RELEASEPILOT_DB_PASSWORD = "your-application-password"
$env:RELEASEPILOT_DB_MIGRATION_PASSWORD = "your-migration-password"

mvn spring-boot:run
```

Database credentials are intentionally not stored in the repository.

## API documentation

With ReleasePilot running:

```text
Swagger UI
http://localhost:8080/swagger-ui.html

OpenAPI
http://localhost:8080/v3/api-docs
```

Swagger is useful for manually exercising the REST endpoints during development.

## Audit history

Configuration changes are recorded in PostgreSQL.

Current audit actions include:

```text
FLAG_CREATED
FLAG_ENABLED
FLAG_DISABLED
FLAG_ROLLOUT_UPDATED
FLAG_DELETED
RULE_CREATED
RULE_DELETED
```

Recent entries can be retrieved from:

```http
GET /api/audit?limit=50
```

Audit history is currently intended for configuration traceability, not as a complete security event log.

## Design decisions

A few choices in this repository are intentional:

- Rollout assignment uses deterministic hashing rather than random evaluation.
- Integration tests use PostgreSQL through Testcontainers instead of substituting H2.
- SQL remains explicit in repositories rather than introducing an ORM at this stage.
- Spring owns database connections through `DataSource`; repositories do not manage credentials directly.
- Schema evolution belongs to Flyway migrations rather than startup-time table creation.
- Environment is part of a feature flag's identity because release configuration differs between `dev`, `staging`, and `prod`.

The longer rationale is documented in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Known limitations

ReleasePilot currently has several deliberate limitations:

- no authentication or role-based access control;
- no hosted public demo yet;
- no React administration interface yet;
- no distributed cache;
- no SDK for application-side local evaluation;
- no real-time streaming of flag changes;
- targeting attributes are currently limited to a small fixed set;
- audit records do not yet contain authenticated actor identities.

These limitations are documented rather than hidden because they define the actual boundary of the current version.

## Contributing

Development and pull-request expectations are documented in [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Do not commit credentials, tokens, `.env` files, or production secrets.

Security reporting instructions are documented in [SECURITY.md](SECURITY.md).

## Status

The backend feature-management engine is implemented and tested.

The next product milestone is the administration frontend and end-to-end browser coverage.