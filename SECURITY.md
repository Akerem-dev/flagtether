# Security

## Supported version

Security fixes currently target the latest version on the `main` branch.

## Reporting a vulnerability

Please do not publish credentials, tokens, private keys, or exploitable vulnerability details in a public issue.

If GitHub private vulnerability reporting is enabled for this repository, use that channel for security reports.

For ordinary non-security bugs, use the repository issue tracker.

## Secrets

The repository must not contain real database passwords or other credentials.

Local secrets belong in `.env` or operating-system environment variables.

`.env.example` contains configuration names only and must not contain working credentials.

## Current security boundaries

FlagTether does not currently implement authentication or authorization.

It should therefore not be exposed directly to an untrusted public network in its current form.

The audit log records configuration changes but does not yet identify authenticated actors.