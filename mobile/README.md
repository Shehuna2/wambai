# Mobile App (Expo + TypeScript)

Single React Native app with Buyer/Vendor mode toggle persisted locally.

## Setup

```bash
cd mobile
npm install
npm run start
```

## What is implemented

- React Navigation tab flows for Buyer and Vendor modes.
- Global auth context and JWT handling.
- Axios client with token injection from `expo-secure-store`.
- Buyer screens: Home, Shops, Cart (grouped by shop), Wallet (balances/top-up/ledger).
- Vendor screens: My Shop, My Products, Vendor Orders with status update.
- Fincra checkout URLs open in `WebView` for top-up flow.
