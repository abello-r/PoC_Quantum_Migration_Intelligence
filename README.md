# PoC Quantum Migration Intelligence

A tool that scans an organization's code and infrastructure, detects which cryptographic algorithms are at risk (RSA, ECC, AES-128...) and automatically generates a prioritized migration plan toward post-quantum cryptography.

## Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + TypeScript + Fastify
- Database: PostgreSQL
- ORM/migrations: Prisma
- Reverse proxy: Nginx
- Infra: Docker Compose

## Local setup

1. Create the environment file:

```sh
cp .env.example .env
```

2. Start the stack:

```sh
docker compose up --build
```

3. Open the app:

```text
http://localhost
```

The frontend is served by Nginx. API requests under `/api` are proxied to the backend.

## PoC workflow

The app turns repository crypto findings into a post-quantum migration roadmap.

Current PoC capabilities:

- Submit a public GitHub repository URL.
- Clone the repository in a temporary backend workspace.
- Detect cryptographic algorithm usage with repository pattern scanning.
- Store scans, normalized findings, and migration recommendations in PostgreSQL.
- Display readiness score, risk distribution, findings, and a prioritized migration plan.

## API

```text
POST /api/scans
GET  /api/scans
GET  /api/scans/:id
GET  /api/scans/:id/findings
GET  /api/scans/:id/migration-plan
```

## Production deployment

The production profile is prepared for:

```text
google-qmi.com
www.google-qmi.com
```

Nginx remains the only public entry point. The backend and database stay internal to Docker Compose.

### Public GitHub API

The app can read public GitHub repository metadata without a token.

`GITHUB_TOKEN` is optional and server-side only. It can be configured later to increase GitHub API rate limits or prepare private repository support.
