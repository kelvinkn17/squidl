import { ethers } from "ethers";

import ERC20ABI from "@openzeppelin/contracts/build/contracts/ERC20.json";
import { erc20Abi_bytes32 } from '../../../../node_modules/viem/constants/abis';

const tokenInterface = new ethers.Interface(ERC20ABI.abi);

export function getBridgeContractAddress({ transferConfigs, chainId }) {
  return transferConfigs.chains.find((chain) => chain.id === chainId)
    ?.contract_addr;
}

export function getTransferObject(
  transferConfigs,
  srcChainId,
  dstChainId,
  tokenSymbol,
  transferValue
) {
  const transferObject = {};
  const transferToken = transferConfigs.chain_token[
    `${srcChainId}`
  ]?.token.find(({ token }) => token.symbol === tokenSymbol);

  const fromChain = transferConfigs.chains.find(({ id }) => id === srcChainId);
  const toChain = transferConfigs.chains.find(({ id }) => id === dstChainId);

  const value = safeParseUnits(
    transferValue,
    transferToken?.token?.decimal ?? 18
  );
  const nonce = new Date().getTime();

  Object.assign(transferObject, {
    transferToken,
    fromChain,
    toChain,
    value,
    nonce,
  });
  return transferObject;
}

export async function transactor(tx, signer) {
  try {
    let result;

    // If tx is a promise, resolve it and return the result
    if (tx instanceof Promise) {
      result = await tx;
      console.log("tx hash:", result.hash);
    } else {
      tx.gasPrice = tx.gasPrice || ethers.parseUnits("4.1", "gwei");
      tx.gasLimit = tx.gasLimit || 120000n;

      console.log("Sending Transaction:", tx);

      // Send the transaction using the signer
      result = await signer.sendTransaction(tx);
      console.log("tx hash:", result.hash);
    }

    return result;
  } catch (error) {
    console.error("Transaction failed:", error);
    console.error("Transaction Data:", tx);
    throw error;
  }
}

export function getTransferId(
  fromAddress,
  toAddress,
  tokenAddress,
  value,
  toChainId,
  nonce,
  fromChainId
) {
  return ethers.solidityPackedKeccak256(
    ["address", "address", "address", "uint256", "uint64", "uint64", "uint64"],
    [
      fromAddress,
      toAddress,
      tokenAddress,
      value?.toString(),
      toChainId?.toString(),
      nonce?.toString(),
      fromChainId?.toString(),
    ]
  );
}

const getTokenBalanceAddress = (
  originalAddress,
  fromChainId,
  tokenSymbol,
  peggedPairs
) => {
  if (!fromChainId || !tokenSymbol || !peggedPairs) {
    return originalAddress;
  }

  const peggedTokens = peggedPairs?.filter((item) => {
    return (
      item.pegged_chain_id === fromChainId &&
      tokenSymbol === item.pegged_token.token.symbol
    );
  });

  if (
    peggedTokens &&
    peggedTokens.length > 0 &&
    peggedTokens[0].canonical_token_contract_addr.length > 0
  ) {
    return peggedTokens[0].canonical_token_contract_addr;
  }

  return originalAddress;
};

export const getAllowance = async (
  walletAddress,
  spenderAddress,
  originalAddress,
  fromChainId,
  tokenSymbol,
  signer,
  peggedPairs
) => {
  try {
    const tokenAddress = getTokenBalanceAddress(
      originalAddress,
      fromChainId,
      tokenSymbol,
      peggedPairs
    );

    console.log("Token Address: ", tokenAddress);

    if (!ethers.isAddress(tokenAddress)) {
      throw new Error("Invalid token address.");
    }

    const tokenContract = new ethers.Contract(
      tokenAddress,
      tokenInterface,
      signer
    );

    console.log("Token Contract: ", tokenContract);

    // Ensure the contract has the allowance function
    if (!tokenContract.allowance) {
      throw new Error("Token contract does not implement 'allowance' method.");
    }

    const allowance = await tokenContract.allowance(
      walletAddress,
      spenderAddress
    );

    console.log("Allowance: ", allowance);

    return allowance;
  } catch (error) {
    console.error("Error fetching allowance:", error.message || error);
    console.error("Details:", {
      walletAddress,
      spenderAddress,
      originalAddress,
      fromChainId,
      tokenSymbol,
    });

    // Optional: You can rethrow the error if needed or return a default value.
    return null;
  }
};

export const checkApprove = (allowance, amount, token, isNative) => {
  if (isNative) {
    return false;
  }
  if (!allowance || allowance == 0n) {
    return true;
  }
  console.log("Allowance: " + allowance);
  const amountBN = BigInt(
    safeParseUnits(amount || "0", token?.decimal ?? 18).toString()
  );
  console.log("Amount (BigInt):", amountBN.toString());

  const isGreaterThanAllowance = amountBN > allowance;
  console.log("Need to approve:", isGreaterThanAllowance);
  return isGreaterThanAllowance;
};

export const approve = async (spenderAddress, signer, token, amount) => {
  if (!token) {
    return;
  }
  try {
    const tokenContract = new ethers.Contract(
      token.address,
      erc20Abi_bytes32,
      signer
    );

    console.log('Approving', {
      spenderAddress,
      tokenContract,
    })

    const approveTx = await transactor(
      tokenContract.approve(
        spenderAddress,
        ethers.MaxUint256,
        { gasLimit: 100000 }
      ),
      signer
    );
    await approveTx.wait();
    return approveTx;
  } catch (e) {
    console.error(`-Failed to approve token. Error:`, e);
    return;
  }
};

function safeParseUnits(value, decimals = 18) {
  try {
    return ethers.parseUnits(String(value), decimals);
  } catch (error) {
    console.error("Failed to parse units:", error);
    return ethers.toBigInt(0);
  }
}
