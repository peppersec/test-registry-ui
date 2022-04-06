# Script for testing the Relayer on the Hardhat fork

## Installation

### 1. Install nvm

https://github.com/nvm-sh/nvm#installing-and-updating

https://github.com/coreybutler/nvm-windows#installation--upgrades (for Windows)

### 2. Clone repo

```
git clone git@github.com:peppersec/test-registry-ui.git
```

### 3. Install required node version

```
nvm install
```

### 4.Switch node version

```
nvm use
```

### 5. Install yarn

```
npm install --global yarn
```

### 6. Install npm packages

```
yarn
```

## Run script

### 1. Switch node version

```
nvm use
```

### 2. Copy example env

```
cp .env.example .env
```

### 3. Open env file and write the following variables

```
# Fork RPC URL
# RPC_URL=https://hardhat.ztake.org/test-relayer/

# Wallet that will receive the test tokens
# WALLET_ADDRESS=0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266

# URL address of the fake Relayer
# MAINNET_RELAYER_URL=test-relayer.tornado.cash
```

### 4. Run script

```
yarn start
```

### 5. Use testrelayer.eth on the UI
