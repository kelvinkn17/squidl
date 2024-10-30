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
        let formattedAmount
        if(isNative){
          formattedAmount = balanceData.balance * 10 ** 18;
        }else{
          formattedAmount = balanceData.balance * 10 ** balanceData.decimals;
        }

        return {
          address: wallet.address,
          ephemeralPub: wallet.ephemeralPub,
          viewHint: wallet.viewHint,
          balance: balanceData.balance,
          amount: formattedAmount.toString(),
        };
      }

      // Return null if no matching balance found for this wallet
      return null;
    })
    .filter(wallet => wallet !== null); // Filter out any wallets without a matching balance
}