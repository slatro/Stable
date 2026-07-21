# Stablr - Stablecoin FX AMM on Arc Testnet

Stablr is a decentralized stablecoin FX AMM protocol built on the Arc Testnet. It allows users to swap mock USDC and EURC, provide liquidity, and experience the predictable settlement performance of the Arc network.

## 🚀 Features
- **Wallet Connect**: Seamless integration with Arc Testnet.
- **Mint Faucet**: Mint mock tokens (mUSDC/mEURC) for testing.
- **Swap**: Constant-product AMM (x * y = k) with 0.3% fee.
- **Liquidity Pool**: Add and remove liquidity to earn (mock) fees.
- **Professional UI**: Dark fintech aesthetic inspired by institutional trading platforms.
- **Arcscan Integration**: Direct links to view transactions on the block explorer.

## 🛠 Tech Stack
- **Smart Contracts**: Solidity, Hardhat, OpenZeppelin.
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS.
- **Web3**: Wagmi, Viem.

## 📂 Project Structure
```text
Stablr/
├── contracts/        # Solidity smart contracts
├── scripts/          # Deployment and interaction scripts
├── test/             # Smart contract tests
└── frontend/         # Next.js web application
    ├── src/app/      # Main pages and layout
    ├── src/components/ # Reusable UI components
    └── src/config/   # Contract addresses and ABIs
```

## ⚙️ Setup & Deployment

### 1. Smart Contracts
```bash
# Install dependencies
npm install

# Run tests
npx hardhat test

# Deploy to Arc Testnet
# Ensure you have PRIVATE_KEY in .env
npx hardhat run scripts/deploy.ts --network arcTestnet
```

### 2. Frontend
```bash
cd frontend

# Install dependencies
npm install

# Run locally
npm run dev
```

## 🌐 Arc Testnet Details
- **Network Name**: Arc Testnet
- **RPC URL**: `https://rpc.testnet.arc.network`
- **Chain ID**: `5042002`
- **Native Token**: USDC (used for gas)
- **Explorer**: `https://testnet.arcscan.app`

## ⚠️ Important Warnings
1. **Testnet only**: Use a test wallet only. Do not send real funds.
2. **Mock assets**: mUSDC and mEURC have no real-world value.
3. **Not audited**: This is a beta testnet demo.

## 🔮 Future Improvements
- StableSwap curve for low-slippage stablecoin pairs.
- CCTP integration for cross-chain settlement.
- Advanced LP analytics and yield tracking.
- Agent payment routing.
