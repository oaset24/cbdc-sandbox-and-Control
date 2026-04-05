🏦 CBDC Sandbox & Control Infrastructure – Vollständige Cursor Aufgabe
🎯 Projektziel
Baue eine vollständige CBDC (Central Bank Digital Currency) Simulationsplattform.

Diese Plattform ist für Behörden, Banken und staatliche Institutionen gedacht.

Kernprinzipien (NIEMALS vergessen):
✅ Zentrale Kontrolle (Staat / Zentralbank hat IMMER volle Macht)

✅ Keine Anonymität (jede Wallet = verifizierte Identität)

✅ 100% Auditierbarkeit (jede Transaktion wird geloggt)

✅ Compliance First (AML, KYC, Limits)

✅ Programmierbares Geld (Zweckbindung, Ablaufdatum)

❌ Keine Dezentralisierung

❌ Kein anonymes System

❌ Kein Crypto-Hype

🗂️ Projektstruktur
Erstelle folgende Ordnerstruktur:

cbdc-platform/
│
├── frontend/                  # Next.js App
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── central-bank/      # Zentralbank Dashboard
│   │   ├── bank/              # Bank Dashboard
│   │   ├── wallet/            # User Wallet
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # shadcn/ui Komponenten
│   │   ├── dashboard/
│   │   ├── wallet/
│   │   └── compliance/
│   ├── lib/
│   │   ├── api.ts
│   │   ├── web3.ts
│   │   └── store.ts
│   └── types/
│
├── backend/                   # NestJS API
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── transactions/
│   │   ├── compliance/
│   │   ├── admin/
│   │   └── blockchain/
│   └── prisma/
│
├── blockchain/                # Smart Contracts
│   ├── contracts/
│   │   └── CBDCToken.sol
│   ├── scripts/
│   │   ├── deploy.ts
│   │   └── seed.ts
│   └── test/
│
├── docs/
│   ├── API.md
│   └── ARCHITECTURE.md
│
└── docker-compose.yml
⛓️ AUFGABE 1: Smart Contract (Solidity)
Datei: blockchain/contracts/CBDCToken.sol
Schreibe einen vollständigen Solidity Smart Contract mit folgenden Anforderungen:

Rollen (Role-Based Access Control):
CENTRAL_BANK_ROLE   → höchste Autorität
BANK_ROLE           → Distribution Layer
COMPLIANCE_ROLE     → Compliance Officer
USER_ROLE           → Endnutzer
Pflicht-Funktionen:
Mint & Burn (nur CENTRAL_BANK_ROLE):
function mint(address to, uint256 amount) external onlyRole(CENTRAL_BANK_ROLE)
function burn(address from, uint256 amount) external onlyRole(CENTRAL_BANK_ROLE)
Transfer:
function transfer(address to, uint256 amount) external
function forceTransfer(address from, address to, uint256 amount) external onlyRole(CENTRAL_BANK_ROLE)
Account Kontrolle (CENTRAL_BANK_ROLE oder COMPLIANCE_ROLE):
function freezeAccount(address user) external
function unfreezeAccount(address user) external
function isAccountFrozen(address user) external view returns (bool)
Limits:
function setTransactionLimit(uint256 limit) external onlyRole(CENTRAL_BANK_ROLE)
function setDailyLimit(address user, uint256 limit) external onlyRole(BANK_ROLE)
Programmierbares Geld:
function mintWithExpiry(address to, uint256 amount, uint256 expiryTimestamp) external
function mintWithPurpose(address to, uint256 amount, bytes32 purpose) external
Events (alle Aktionen müssen geloggt werden):
event TokensMinted(address indexed to, uint256 amount, address indexed by)
event TokensBurned(address indexed from, uint256 amount, address indexed by)
event AccountFrozen(address indexed user, address indexed by)
event AccountUnfrozen(address indexed user, address indexed by)
event ForceTransfer(address indexed from, address indexed to, uint256 amount)
event LimitSet(address indexed user, uint256 limit)
Sicherheit:
OpenZeppelin verwenden (AccessControl, ReentrancyGuard, Pausable)

onlyRole Modifier überall

require Checks mit klaren Fehlermeldungen

Contract pausierbar (Emergency Stop)

⚙️ AUFGABE 2: Backend (NestJS)
Setup:
nest new backend
cd backend
npm install @prisma/client prisma
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
npm install @nestjs/swagger swagger-ui-express
npm install ioredis
npm install ethers
Datenbank Schema (Prisma):
Erstelle backend/prisma/schema.prisma:

model User {
  id          String   @id @default(uuid())
  email       String   @unique
  password    String
  role        Role     @default(USER)
  kycStatus   KYCStatus @default(PENDING)
  walletAddress String? @unique
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  transactions Transaction[]
}

model Transaction {
  id          String   @id @default(uuid())
  from        String
  to          String
  amount      Float
  purpose     String?
  status      TxStatus @default(PENDING)
  flagged     Boolean  @default(false)
  createdAt   DateTime @default(now())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
}

model AuditLog {
  id        String   @id @default(uuid())
  action    String
  userId    String
  details   Json
  createdAt DateTime @default(now())
}

model Blacklist {
  id        String   @id @default(uuid())
  address   String   @unique
  reason    String
  addedBy   String
  createdAt DateTime @default(now())
}

enum Role {
  CENTRAL_BANK
  BANK
  COMPLIANCE
  USER
}

enum KYCStatus {
  PENDING
  VERIFIED
  REJECTED
}

enum TxStatus {
  PENDING
  COMPLETED
  FAILED
  FLAGGED
}
Module die du erstellen musst:
1. Auth Module (src/auth/)
- POST /auth/login        → JWT Token zurückgeben
- POST /auth/register     → User erstellen
- GET  /auth/me           → aktueller User
- Guards: JwtAuthGuard, RolesGuard
2. Users Module (src/users/)
- GET    /users           → alle User (BANK, CENTRAL_BANK)
- GET    /users/:id       → User Details
- PATCH  /users/:id/kyc  → KYC Status setzen
- DELETE /users/:id       → User deaktivieren
3. Transactions Module (src/transactions/)
- POST /transactions/transfer     → Transfer ausführen
- GET  /transactions              → alle Transaktionen
- GET  /transactions/:id          → Details
- GET  /transactions/user/:id     → User Transaktionen
4. Admin Module (src/admin/)
- POST /admin/mint                → Geld erstellen
- POST /admin/burn                → Geld vernichten
- POST /admin/freeze/:address     → Account einfrieren
- POST /admin/unfreeze/:address   → Account freigeben
- POST /admin/force-transfer      → Zwangsüberweisung
- GET  /admin/audit-logs          → Audit Logs
- GET  /admin/system-stats        → Systemstatistiken
5. Compliance Module (src/compliance/)
- GET  /compliance/flagged        → geflaggte Transaktionen
- POST /compliance/blacklist      → Address blacklisten
- GET  /compliance/blacklist      → Blacklist anzeigen
- GET  /compliance/report         → Compliance Report
6. Blockchain Module (src/blockchain/)
- Ethers.js Integration
- Contract Calls (mint, burn, freeze, transfer)
- Event Listener für Contract Events
Compliance Engine Logic:
Implementiere folgende automatische Checks bei jeder Transaktion:

// Prüfe ob Account frozen ist
// Prüfe ob Address auf Blacklist ist
// Prüfe ob Transaktionslimit überschritten wird
// Prüfe ob tägliches Limit überschritten wird
// Flag Transaktionen über 10.000 (AML Regel)
// Prüfe KYC Status des Senders
🎨 AUFGABE 3: Frontend (Next.js)
Setup:
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npx shadcn-ui@latest init
npm install zustand @tanstack/react-query ethers
npm install recharts lucide-react
Seiten die du erstellen musst:
1. Login / Register (app/(auth)/)
Sauberes Login Formular

Role-basiertes Routing nach Login

JWT Token in localStorage speichern

2. Zentralbank Dashboard (app/central-bank/)
Erstelle folgende Unterseiten:

/central-bank/overview
Gesamtmenge im Umlauf (Total Supply)

Anzahl aktiver Wallets

Transaktionen heute

Geflaggte Transaktionen

Charts (Recharts):

Tägliche Transaktionen (Line Chart)

Verteilung nach Banken (Pie Chart)

/central-bank/mint-burn
Mint Formular:

Empfänger Adresse

Betrag

Optional: Zweck (Purpose)

Optional: Ablaufdatum

Burn Formular

Letzte Mint/Burn Aktionen

/central-bank/accounts
Alle Accounts anzeigen

Filter: frozen / active / flagged

Account einfrieren / freigeben Button

Zwangsüberweisung Button

/central-bank/audit
Vollständige Audit Log Tabelle

Filter nach Datum, Aktion, User

Export als CSV

3. Bank Dashboard (app/bank/)
/bank/overview
Eigene Kunden

KYC Pending Anträge

Transaktionsvolumen

/bank/customers
Kundenliste

KYC Status verwalten

Wallet zuweisen

/bank/transactions
Alle Transaktionen der Bank

Flagged Transaktionen hervorheben

4. User Wallet (app/wallet/)
/wallet/dashboard
Kontostand (groß anzeigen)

Letzte Transaktionen

KYC Status Badge

/wallet/send
Transfer Formular:

Empfänger Adresse

Betrag

Verwendungszweck

Bestätigungsschritt

/wallet/history
Vollständige Transaktionshistorie

Status Badges (pending, completed, flagged)

UI Komponenten die du brauchst:
components/
├── ui/                    # shadcn Basis
├── dashboard/
│   ├── StatsCard.tsx      # Statistik Karte
│   ├── TransactionTable.tsx
│   ├── AuditLogTable.tsx
│   └── Charts.tsx
├── wallet/
│   ├── BalanceCard.tsx
│   ├── SendForm.tsx
│   └── TransactionItem.tsx
└── compliance/
    ├── FlagBadge.tsx
    ├── KYCBadge.tsx
    └── FreezeButton.tsx
Design Anforderungen:
Farben: Dunkel + Blau (staatlich, seriös)

Keine bunten Crypto-Farben

Professionelles Enterprise-Look

Responsive (Desktop first)

Loading States überall

Error Handling überall

🐳 AUFGABE 4: Docker Setup
docker-compose.yml:
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: cbdc_db
      POSTGRES_USER: cbdc_user
      POSTGRES_PASSWORD: cbdc_secure_pass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://cbdc_user:cbdc_secure_pass@postgres:5432/cbdc_db
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your_super_secret_key
    depends_on:
      - postgres
      - redis

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    depends_on:
      - backend

volumes:
  postgres_data:
🔐 AUFGABE 5: Sicherheit
Backend:
[ ] Helmet.js (HTTP Security Headers)

[ ] Rate Limiting (100 req/min pro IP)

[ ] Input Validation (class-validator)

[ ] SQL Injection Schutz (Prisma)

[ ] CORS konfigurieren

Smart Contract:
[ ] Reentrancy Guard

[ ] Integer Overflow Schutz (Solidity 0.8+)

[ ] Access Control überall

[ ] Emergency Pause Funktion

Frontend:
[ ] XSS Schutz

[ ] Token sicher speichern

[ ] Sensitive Daten nie im Frontend

📋 AUFGABE 6: Seed Daten
Erstelle blockchain/scripts/seed.ts:

Erstelle folgende Test-Accounts:

1. Zentralbank Account
   - Role: CENTRAL_BANK
   - Email: centralbank@cbdc.gov
   - Password: Admin1234!

2. Bank Account
   - Role: BANK
   - Email: bank@sparkasse.de
   - Password: Bank1234!

3. User Accounts (3 Stück)
   - Role: USER
   - KYC: verified
   - Jeder mit 1000 CBDC Token

4. Einen gefrorenen Account (Demo)
5. Einen geflaggten Account (Demo)
📊 AUFGABE 7: API Dokumentation
Swagger unter /api/docs einrichten

Alle Endpoints dokumentieren

Request/Response Beispiele

Auth Header Beispiele

✅ Definition of Done
Das Projekt ist fertig wenn:

[ ] Smart Contract deployed (lokales Netzwerk)

[ ] Backend läuft auf Port 3001

[ ] Frontend läuft auf Port 3000

[ ] Login funktioniert für alle 3 Rollen

[ ] Mint / Burn funktioniert

[ ] Transfer funktioniert

[ ] Freeze / Unfreeze funktioniert

[ ] Audit Log wird befüllt

[ ] Compliance Engine flaggt große Transaktionen

[ ] Docker Compose startet alles

🚀 Reihenfolge (wichtig!)
Baue in dieser Reihenfolge:

1. Smart Contract (Basis)
2. Backend Setup + DB
3. Auth System
4. Admin API (Mint, Freeze)
5. Transaction API
6. Compliance Engine
7. Frontend Setup
8. Login / Auth UI
9. Zentralbank Dashboard
10. Bank Dashboard
11. User Wallet
12. Docker Setup
13. Seed Daten
14. Testing
⚠️ Wichtige Hinweise für Cursor
TypeScript ÜBERALL (kein JavaScript)

Keine any Types

Error Handling bei jedem API Call

Loading States im Frontend

Kommentare auf Deutsch oder Englisch (konsistent bleiben)

Saubere Commit Messages

.env.example Datei erstellen

💼 Ziel
Am Ende soll eine Demo-fähige Plattform stehen, die du:

Banken zeigen kannst

Behörden präsentieren kannst

Als Proof-of-Concept verkaufen kannst

Preis: 20.000 € – 80.000 € pro Projekt