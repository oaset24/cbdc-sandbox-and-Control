# CBDC Sandbox Platform

Simulationsplattform für eine zentral gesteuerte **Digitalwährung (CBDC)** mit Rollen für Zentralbank, Hausbank, Compliance und Endnutzer. Das System verbindet eine **NestJS-REST-API**, eine **Next.js-Oberfläche**, **PostgreSQL**, **Redis**, optionale **Blockchain-Anbindung** (Hardhat / EVM) und einen **Solidity-Token** (OpenZeppelin).

## Architektur

| Komponente   | Technologie        | Standard-Port |
|-------------|--------------------|---------------|
| Frontend    | Next.js 15 (App Router) | 3000      |
| Backend     | NestJS 10, Prisma 5     | 3001      |
| Datenbank   | PostgreSQL 15           | 5433 (Host-Mapping in Compose) |
| Cache       | Redis 7                 | 6379      |
| Smart Contract | Solidity / Hardhat   | (lokal z. B. 8545) |

**Datenfluss (vereinfacht):**

- Browser → Frontend (`NEXT_PUBLIC_API_URL`, typisch `http://localhost:3001`) mit JWT im `Authorization`-Header.
- Backend → PostgreSQL (Nutzer, Transaktionen, Audit, Blacklist) und Redis (Health).
- Backend → JSON-RPC (`BLOCKCHAIN_RPC_URL`) für `totalSupply`, Salden, Mint/Burn/Freeze, sofern konfiguriert.

## Schnellstart mit Docker

Voraussetzungen: [Docker](https://docs.docker.com/get-docker/) und Docker Compose.

```bash
docker compose up -d --build
```

- **Frontend:** http://localhost:3000  
- **API / Swagger:** http://localhost:3001/api/docs  
- **Health:** http://localhost:3001/  

### Blockchain aus dem Container

Läuft Hardhat (o. Ä.) auf dem **Host**, setzen Sie im Backend z. B.:

- Windows / macOS: `BLOCKCHAIN_RPC_URL=http://host.docker.internal:8545`
- Linux: ggf. `http://172.17.0.1:8545` oder `--add-host=host.docker.internal:host-gateway`

Weitere Variablen (siehe `backend/.env.example`):

- `CBDC_CONTRACT_ADDRESS` — deployed CBDCToken  
- `BLOCKCHAIN_ADMIN_PRIVATE_KEY` — Zentralbank-On-Chain  
- `BLOCKCHAIN_USER_WALLET_PRIVATE_KEY` — Custodial-User-Wallet für Transfers  

Optional per Shell beim Start:

```bash
CBDC_CONTRACT_ADDRESS=0x... BLOCKCHAIN_RPC_URL=http://host.docker.internal:8545 docker compose up -d --build
```

### Frontend-Umgebung im Image

Build-Args in `docker-compose.yml` setzen `NEXT_PUBLIC_API_URL` (Browser ruft die API unter **localhost** auf dem Host auf) und `NEXT_PUBLIC_CONTRACT_ADDRESS` für Anzeige/Vergleich im UI.

## Lokale Entwicklung (ohne Docker-App)

1. **Postgres & Redis** z. B. via `docker compose up -d postgres redis` oder eigene Instanzen.  
2. **Backend:** `cd backend && cp .env.example .env` — `DATABASE_URL`, `JWT_SECRET`, ggf. Blockchain-Variablen setzen.  
   - `npm install`  
   - `npx prisma migrate deploy` (oder `migrate dev`)  
   - `npm run start:dev`  
3. **Frontend:** `cd frontend && cp .env.local.example .env.local` — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CONTRACT_ADDRESS` anpassen.  
   - `npm install`  
   - `npm run dev`  
4. **Seed (optional):** im Ordner `blockchain` siehe `npm run seed` (laut Projekt-Doku).

## API-Übersicht

Authentifizierung: nach `POST /auth/login` den `access_token` als `Bearer` mitsenden.

| Bereich        | Beispiel-Endpunkte |
|----------------|--------------------|
| Auth           | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` |
| Dashboard      | `GET /dashboard/system-stats` (Zentralbank & Hausbank) |
| Admin / On-Chain | `POST /admin/mint`, `POST /admin/burn`, Freeze/Unfreeze, Force-Transfer, `GET /admin/audit-logs` |
| Nutzer         | `GET /users`, `PATCH /users/:id/kyc`, … |
| Transaktionen  | `POST /transactions/transfer` (USER), `GET /transactions`, … |
| Compliance     | `GET /compliance/monitor-accounts`, `GET /compliance/flagged`, Blacklist, Report |
| Blockchain     | `GET /blockchain/balance/me` |

Vollständige, interaktive Doku: **http://localhost:3001/api/docs**

## Sicherheits-Features (Backend)

- **Helmet** — HTTP-Sicherheitsheader (CSP im API-Betrieb abgeschwächt, damit Swagger stabil bleibt).  
- **Rate Limiting** — `@nestjs/throttler`: **100 Anfragen pro IP und 60 Sekunden** (global); Health-Check ohne Limit (`@SkipThrottle`).  
- **Validierung** — globaler `ValidationPipe` mit `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.  
- **Autorisierung** — JWT + rollenbasierte Guards (`CENTRAL_BANK`, `BANK`, `COMPLIANCE`, `USER`).  
- **Persistenz** — Prisma/PostgreSQL (kein Roh-SQL aus dem Client).  

## Tests & Build

```bash
cd backend && npm test && npm run build
cd ../frontend && npm run build
```

## Projektstruktur (Auszug)

```
cbdc-platform/
├── backend/          # NestJS API, Prisma schema & Migrationen
├── frontend/         # Next.js UI
├── blockchain/       # Smart Contracts, Hardhat, Seed-Skripte
├── docker-compose.yml
└── README.md
```

## Lizenz / Hinweis

Demonstrations- und Schulungsprojekt — nicht produktionsreif ohne zusätzliche Härtung, Geheimnisverwaltung und Betriebskonzepte.
