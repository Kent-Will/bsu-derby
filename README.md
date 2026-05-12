# 🏇 BSU Derby — Blockchain Horse Racing

> A real-time blockchain-powered horse racing platform built as a COSC Capstone Project at Bowie State University.

## 🌐 Live Demo

**👉 [Click here to open BSU Derby](https://bsu-derby.vercel.app)**

> The application is hosted on Vercel. GitHub Pages is not used because this project requires a live Node.js backend server which GitHub Pages does not support. Vercel is the industry standard for React application deployment.

---

## 📋 Project Overview

BSU Derby allows users to:
- Connect a MetaMask wallet on the Ethereum Sepolia testnet
- Deposit ETH in exchange for BSUD casino tokens
- Watch live animated horse races in real time
- Bet tokens on horses and win proportional payouts
- View a global leaderboard of top players

---

## 🏗️ Architecture

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Smart Contract | Solidity + OpenZeppelin ERC20 | Ethereum Sepolia Testnet |
| Backend | Node.js + Express + Socket.io | AWS EC2 |
| Database | MySQL | AWS RDS |
| Frontend | React.js + ethers.js | Vercel |

---

## 📁 Repository Structure

```
bsu-derby/
├── contract/          # Hardhat project + Solidity smart contract
├── backend/           # Node.js backend server + REST API + race engine
└── frontend/          # React frontend application
```

---

## 🔗 Contract Details

- **Network:** Ethereum Sepolia Testnet
- **Contract Address:** `0x9b11008F5054c95C247344d587610Bcba448E247`
- **View on Etherscan:** [sepolia.etherscan.io](https://sepolia.etherscan.io/address/0x9b11008F5054c95C247344d587610Bcba448E247)
- **Token Name:** BSU Derby Token (BSUD)
- **Exchange Rate:** 100,000 BSUD per 1 ETH

---

## 🚀 Running Locally

### Prerequisites
- Node.js v18+
- Git
- MetaMask browser extension
- `.env` file with database credentials (contact developer)

### 1. Clone the repo
```bash
git clone https://github.com/Kent-Will/bsu-derby.git
cd bsu-derby
```

### 2. Start the backend
```bash
cd backend
npm install
node server.js
```
You should see:
```
BSU Derby backend running on port 3001 🏇
Creating new race...
```

### 3. Start the frontend
Open a new terminal:
```bash
cd frontend
npm install
npm start
```
Open http://localhost:3000 in your browser.

### 4. Configure MetaMask
- Switch to **Sepolia Testnet**
- Get free Sepolia ETH from [sepolia-faucet.pk910.de](https://sepolia-faucet.pk910.de)
- Connect your wallet on the login screen

---

## 👥 Team

- William — Bowie State University, Computer Science

---

## 📄 License

Academic project — Bowie State University COSC Capstone
