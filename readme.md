# Crypto Crash Game - Backend Developer Assignment

This project implements a **Crypto Crash Game** backend as specified in the assignment. Players bet using USD (converted to crypto), watch a multiplier rise in real-time, and attempt to cash out before the game crashes.

---

## 🚀 Live Demo

* **Frontend:** [https://crypto-crash.netlify.app](https://crypto-crash.netlify.app)
* **Backend API:** [https://crashcryptogame.onrender.com](https://crashcryptogame.onrender.com)

---

## 📁 GitHub Repositories

* **Frontend:** [https://github.com/blacxtar/CryptoGameUI](https://github.com/blacxtar/CryptoGameUI)
* **Backend:** [https://github.com/blacxtar/CrashCryptoGame](https://github.com/blacxtar/CrashCryptoGame)

---

## 🛠 Setup Instructions

### Backend (Node.js, Express, MongoDB)

1. **Clone the repo:**

```bash
git clone https://github.com/blacxtar/CrashCryptoGame.git
cd CrashCryptoGame
```

2. **Install dependencies:**

```bash
npm install
```

3. **Create `.env` file:**

```
PORT=5000
MONGO_URI=<your_mongodb_uri>
```

4. **Run the server:**

```bash
npm start
```

5. **Run locally with Socket support:**
   Visit: `http://localhost:5000`

---

## 🎮 Game Overview

* A new game round starts every 10 seconds.
* Players bet in USD (converted to BTC/ETH using real-time CoinGecko prices).
* A multiplier starts at 1.00x and increases exponentially.
* The game crashes at a random multiplier (e.g., 1.5x to 100x) determined by a **provably fair hash algorithm**.
* Players can cash out any time before crash to win. If they don’t, they lose their bet.

---

## 🔐 Provably Fair Crash Algorithm

* Uses SHA-256 hash of a fixed seed + round number:

```js
hash = sha256(seed + roundNumber)
crashPoint = (parseInt(hash.slice(0, 8), 16) % 10000) / 100 + 1
```

* This gives a crash point between **1.00x** and **101.00x**, which is transparent and verifiable.

---

## 💱 Crypto Price Integration

* **CoinGecko API** used to fetch real-time prices for BTC and ETH.
* Price data is cached for 60 seconds to avoid rate limits.
* If API fails, cached values or fallback prices are used.

```js
$10 USD / $60,000 (BTC price) = 0.00016667 BTC
```

---

## 👛 Wallet & Transactions

* Simulated wallet system in MongoDB:

```js
wallet: {
  BTC: { amount: Number, usdValue: Number },
  ETH: { amount: Number, usdValue: Number }
}
```

* Every bet/cashout logs a mock transaction with hash and price at the time.

---

## 🔌 WebSockets (Socket.IO)

* Real-time updates for:

  * `round_start`
  * `multiplier_update`
  * `round_crash`
  * (extendable: cashouts, announcements)
* Multiplier updates every **100ms**.

---

## 🧪 API Endpoints

| Method | Endpoint                   | Description                    |
| ------ | -------------------------- | ------------------------------ |
| POST   | `/api/v1/players`    | Create a new player            |
| POST   | `/api/v1/bet`              | Place a bet in USD             |
| POST   | `/api/v1/cashout`          | Cash out before crash          |
| GET    | `/api/v1/wallet/:playerId` | Get wallet info (crypto + USD) |
| GET    | `/api/v1/round-history`    | Get history of past rounds     |

---

## 📡 WebSocket Events

| Event Name          | Direction | Payload Example                    |
| ------------------- | --------- | ---------------------------------- |
| `round_start`       | Server -> | `{ roundNumber, crashPointHash }`  |
| `multiplier_update` | Server -> | `{ multiplier: "2.35" }`           |
| `round_crash`       | Server -> | `{ roundNumber, finalMultiplier }` |

---

## 🌱 Seed Data Instructions

Use this endpoint to create sample players:

```http
POST /api/v1/create-player
Body: { "name": "Alice" }
```

Or manually insert into MongoDB 3–5 player documents with sample BTC/ETH balance.

---

## 📬 Postman Collection

A Postman collection with:

Bet

Cashout

Get wallet

Round history

Create player

...is available in the /postman/ folder .

---

## 💡 Architecture Summary

* **Game Logic:** runs on intervals every 10s
* **Crash Point:** deterministic using seed+roundNumber
* **Wallets:** simulated via MongoDB
* **Real-time:** via Socket.IO with 100ms updates
* **Crypto Conversion:** live prices via CoinGecko, cached with fallback
* **Security:** input validation, hash transparency, CORS enabled

---


