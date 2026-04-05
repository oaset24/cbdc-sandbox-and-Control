# Smart Contract Tasks (Solidity)

## Ziel
CBDC Token mit zentraler Kontrolle

## Aufgaben

- [ ] ERC20 Basis implementieren
- [ ] Rollen definieren (CentralBank, Bank, User)

### Core Funktionen
- [ ] mint(address to, uint256 amount)
- [ ] burn(address from, uint256 amount)
- [ ] transfer(address to, uint256 amount)

### Kontrollfunktionen
- [ ] freezeAccount(address user)
- [ ] unfreezeAccount(address user)
- [ ] forceTransfer(address from, address to, uint256 amount)

### Limits
- [ ] setTransactionLimit(uint256 limit)

### Events
- [ ] TransferLogged
- [ ] AccountFrozen
- [ ] MintExecuted

## Sicherheit
- [ ] onlyRole Modifier
- [ ] Reentrancy Guard