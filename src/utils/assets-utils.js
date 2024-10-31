import { BN } from "bn.js";
import { ethers } from "ethers";

export function aggregateAssets(stealthAddresses, { isNative, chainId, tokenAddress }) {
  return stealthAddresses
    .map(wallet => {
      // Determine if we're looking for a native or ERC20 balance
      const balanceData = isNative
        ? wallet.nativeBalances.find(balance => balance.chainId === chainId)
        : wallet.erc20Balances.find(
          token =>
            token.chainId === chainId &&
            token.address.toLowerCase() === tokenAddress.toLowerCase()
        );

      // If matching balance data is found, format and return the wallet info
      if (balanceData) {
        // Convert balance to BN format to avoid scientific notation
        const balanceBN = toBN(balanceData.balance, isNative ? 18 : balanceData.token.decimals);

        return {
          address: wallet.address || "",
          key: wallet.key || "",
          ephemeralPub: wallet.ephemeralPub || "",
          viewHint: wallet.viewHint,
          balance: balanceData.balance,
          amount: balanceBN.toString(), // Safe string representation of the large number
        };
      }

      // Return null if no matching balance found for this wallet
      return null;
    })
    .filter(wallet => wallet !== null); // Filter out any wallets without a matching balance
}

export function toBN(amount, decimals) {
  const amountStr = amount.toString();

  if (!amountStr.includes('.')) {
    return new BN(amountStr).mul(new BN(10).pow(new BN(decimals))); // Shift integer amount
  }

  const [integerPart, fractionalPart] = amountStr.split('.');
  const adjustedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
  const fullAmountStr = integerPart + adjustedFractional;

  return new BN(fullAmountStr);
}