# 🦑 Squidl StealthAnnouncer ROFL 🚀

**Squidl StealthAnnouncer ROFL** leverages Oasis Protocol’s Runtime Offchain Logic (ROFL) to strengthen Squidl’s stealth address ecosystem with secure, automated, and private transaction announcements. Designed as a failsafe for stealth address data in case of a backend compromise, StealthAnnouncer ensures that essential metadata is preserved while maintaining full privacy.

---

## 🛠️ How It Works
![Untitled diagram-2024-11-03-005103](https://github.com/user-attachments/assets/a4061242-707b-40bc-9629-8c87ffaf499a)

---

## 🔑 Key Features

### 1. 📢 Event-Based Data Backup
Upon detecting a transaction on a stealth address, **StealthAnnouncer** triggers the `announce` function on the **StealthSigner Contract**, emitting an event that logs the following data:

- **Ephemeral Public Key** 🔑
- **View Hint** 🕵️

This event-based logging preserves critical metadata so it can be queried if Squidl’s backend is compromised. Importantly, the event data **excludes both the stealth address and the meta address**, ensuring user privacy by avoiding any direct link to a main address.

---

### 2. 🤖 ROFL Worker Automation

**ROFL workers** provide automated, hands-off monitoring and announcements for stealth address transactions.

- **Routine Monitoring**: Workers periodically fetch recent stealth addresses with metadata from Squidl’s API:
  
  ```
  https://api.squidl.me/stealth-address/recent
  ```

- **Transaction Detection**: Each address is checked against an `isTransacted` flag from Squidl’s internal API. Once a transaction is flagged, ROFL workers automatically call the `announce` function to log relevant data on-chain, ensuring a secure backup without manual intervention.

This automated system reduces backend dependencies, distributing monitoring tasks and providing resilient, autonomous event logging for stealth addresses.

---

### 3. 🔒 Privacy-First Design

**StealthAnnouncer** prioritizes user anonymity through multiple privacy-focused features:

- **No Direct Link**: Ensures no direct link exists between stealth addresses and a user’s main address. 🔗❌
- **Secure Metadata Association**: Requires both the **ephemeral public key** and **view hint** to make any meaningful connection, making brute-force discovery highly impractical.
- **Stealth Address Protection**: Stealth address identification is prevented—even if accessed, ownership cannot be confirmed without the view hint and public key.

---

## 🌐 Oasis Protocol Integration

By integrating with **Oasis Protocol’s Runtime Offchain Logic (ROFL)**, Squidl benefits from a secure, efficient data logging environment, ensuring:

- **Secure Automated Backup** 🔐: Critical metadata is logged safely, minimizing risks in the event of backend failures.
- **Unbreakable Anonymity** 🕶️: Emitted events omit stealth and meta addresses, preserving complete user privacy even in extreme scenarios.

---

## 🔄 Summary

The **Squidl StealthAnnouncer ROFL** combines Oasis Protocol’s secure off-chain logic with Squidl’s commitment to privacy, delivering automated event-based backups without compromising user anonymity.
