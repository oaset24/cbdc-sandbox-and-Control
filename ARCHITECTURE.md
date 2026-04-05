# System Architecture

## Komponenten

### 1. Frontend
- Next.js (App Router)
- TypeScript
- TailwindCSS
- Dashboard (Admin, Bank, User)

### 2. Backend
- NestJS
- PostgreSQL
- Redis

Funktionen:
- Auth (JWT, RBAC)
- KYC Management
- Compliance Engine
- Audit Logging

### 3. Blockchain
- Quorum Network
- Solidity Smart Contracts

### 4. Identity Layer
- Mock KYC (MVP)
- Erweiterbar mit externen APIs

---

## Rollen

### Zentralbank
- Mint / Burn
- Freeze Accounts
- Global Rules

### Banken
- Wallet Management
- KYC

### Nutzer
- Transaktionen
- Wallet Zugriff

---

## Datenfluss

User → Backend → Smart Contract  
Admin → Backend → Smart Contract  
Backend → DB (Audit Logs)