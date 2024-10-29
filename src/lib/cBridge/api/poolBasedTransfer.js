import { ethers } from "ethers";
import axios from "axios";
import { transactor } from "../helpers/txHelper.js";

export async function poolBasedTransfer({
  bridge,
  addr,
  estimateRequest,
  transferObject,
  signer,
  isNative,
}) {
  const { transferToken, toChain, value, nonce } = transferObject;

  //   const estimateAmount = await estimateAmt(estimateRequest);
  //   const slippage =
  //     estimateRequest.getSlippageTolerance() ||
  //     estimateAmount.getMaxSlippage() ||
  //     0;

  //   console.log("slippage: ", slippage);

  console.log({
    addr: addr,
    token: transferToken?.token?.address,
    amount: value,
    dstChainId: toChain?.id,
    nonce: nonce,
    maxSlippage: 5000,
  });

  try {
    const result = await transactor(
      isNative
        ? bridge.sendNative(
            addr,
            value,
            ethers.toBigInt(toChain?.id),
            ethers.toBigInt(nonce),
            5000,
            { value, gasLimit: 200000 }
          )
        : bridge.send(
            addr,
            transferToken?.token?.address,
            value,
            ethers.toBigInt(toChain?.id),
            ethers.toBigInt(10),
            5000,
            { gasLimit: 200000 }
          ),
      signer
    );

    return result;
  } catch (error) {
    console.error("Error in poolBasedTransfer:", error?.message || error);
    throw error;
  }
}

export async function estimateAmt({
  baseUrl,
  srcChainId,
  dstChainId,
  tokenSymbol,
  walletAddress = "",
  slippageTolerance,
  amount,
  isPegged = false,
}) {
  try {
    const url = `${baseUrl}/v2/estimateAmt?src_chain_id=${srcChainId}&dst_chain_id=${dstChainId}&token_symbol=${tokenSymbol}&amt=${amount}&slippage_tolerance=${slippageTolerance}${
      walletAddress ? `&usr_addr=${walletAddress}` : ""
    }${isPegged ? "&is_pegged=true" : ""}`;

    const response = await axios.get(url);

    return response.data;
  } catch (error) {
    console.error("Error in estimateAmt:", error?.message || error);
    throw error;
  }
}
