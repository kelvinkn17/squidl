import { getTransferConfigsForAll } from "./api/getData.js";
import { getContract } from "./helpers/contract.js";
import {
  approve,
  checkApprove,
  getAllowance,
  getBridgeContractAddress,
  getTransferId,
  getTransferObject,
} from "./helpers/txHelper.js";
import BridgeABI from "../../abi/Bridge.sol/Bridge.json";
import { poolBasedTransfer } from "./api/poolBasedTransfer.js";
import { statusTracker } from "./api/statusTracker.js";

/*

 BNB Smart Chain Testnet chainId ->  97
 Mumbai chainId -> 80001
 Linea sepolia chainId ->  59141 

 Oasis sapphire testnet chainId ->  23295 
 Oasis sapphire mainnet chainId ->  23294

 cBridgeBaseUrl testnet -> https://cbridge-v2-test.celer.network
 cBridgeBaseUrl mainnet -> https://cbridge-prod2.celer.app

*/

export async function poolTransfer({
  cBridgeBaseUrl,
  receiverAddress,
  signer,
  srcChainId,
  dstChainId,
  tokenSymbol,
  amount,
  slippageTolerance,
  confirmations = 2,
}) {
  try {
    // Checking bridge
    const transferConfigs = await getTransferConfigsForAll({
      baseUrl: cBridgeBaseUrl,
    });

    console.log("transfer config: ", transferConfigs);

    const bridgeAddress = getBridgeContractAddress({
      transferConfigs: transferConfigs,
      chainId: srcChainId,
    });

    console.log("bridge address:", bridgeAddress);

    if (!bridgeAddress)
      throw new Error("srcChainId not yet supported by cBridge");

    console.log("signer: ", signer);
    // Get Contract
    const bridgeContract = getContract(bridgeAddress, BridgeABI.abi, signer);

    // Check token
    const isPresentInSrc = !!(
      transferConfigs.chain_token[srcChainId]?.token?.filter(
        (chainToken) =>
          chainToken?.token?.symbol.toUpperCase() == tokenSymbol.toUpperCase()
      ).length > 0
    );

    console.log(
      "scr token supported: ",
      transferConfigs.chain_token[srcChainId]?.token
    );

    console.log("isPresentInSrc: ", isPresentInSrc);

    const isPresentInDst = !!(
      transferConfigs.chain_token[dstChainId]?.token?.filter(
        (chainToken) =>
          chainToken?.token?.symbol.toUpperCase() == tokenSymbol.toUpperCase()
      ).length > 0
    );

    console.log(
      "dst token supported: ",
      transferConfigs.chain_token[dstChainId]?.token
    );

    console.log("isPresentInDst: ", isPresentInDst);

    if (!(isPresentInSrc && isPresentInDst)) {
      throw new Error(
        "Please choose valid tokenSymbol that is supported by given pair of chains"
      );
    }

    // Prepare transfer

    const { transferToken, value, toChain, nonce, fromChain } =
      getTransferObject(
        transferConfigs,
        srcChainId,
        dstChainId,
        tokenSymbol,
        amount
      );

    console.log("checking allowance of tokens... ");

    const allowance = await getAllowance(
      receiverAddress,
      bridgeAddress || "",
      transferToken?.token?.address || "",
      fromChain?.id,
      transferToken?.token?.symbol,
      signer,
      transferConfigs.pegged_pair_configs
    );

    console.log("allowance: ", allowance);

    let needToApprove = false;

    const isNative =
      transferConfigs.chains.filter(
        (chain) =>
          chain.id == srcChainId &&
          chain.gas_token_symbol.toUpperCase() == tokenSymbol.toUpperCase()
      ).length > 0;

    needToApprove = checkApprove(
      allowance,
      amount,
      transferToken?.token,
      isNative
    );

    console.log("needToApprove: ", needToApprove);

    if (needToApprove) {
      console.log("Approving the tokens");
      const approveTx = await approve(
        bridgeAddress || "",
        signer,
        transferToken?.token,
        amount
      );
      if (!approveTx) {
        throw new Error(`Cannot approve the token`);
      } else {
        needToApprove = false;
      }
      console.log("approveTx hash: " + approveTx.hash);
      //   console.log("Waiting for the confirmations of approveTx");
      //   const confirmationReceipt = await approveTx.wait(confirmations);

      //   console.log(
      //     `approveTx confirmed upto ${confirmationReceipt.confirmations} confirmations`
      //   );
    }

    const transferId = getTransferId(
      receiverAddress,
      transferToken?.token?.address,
      value,
      toChain?.id,
      nonce,
      fromChain?.id
    );

    console.log("TransferId:", transferId);

    // Estimation

    // const estimateRequest = {
    //   baseUrl: cBridgeBaseUrl,
    //   srcChainId: srcChainId,
    //   dstChainId: dstChainId,
    //   tokenSymbol: tokenSymbol,
    //   walletAddress: receiverAddress,
    //   slippageTolerance: slippageTolerance,
    //   amount: amount,
    // };

    // Initiate tx
    console.log("bridge: ", bridgeContract);

    const poolTransferTx = await poolBasedTransfer({
      bridge: bridgeContract,
      addr: receiverAddress,
      //   estimateRequest: estimateRequest,
      transferObject: {
        transferToken,
        fromChain,
        toChain,
        value,
        nonce,
      },
      signer: signer,
      isNative: isNative,
    });

    console.log("poolTx: ", poolTransferTx);
    console.log("Waiting for the confirmations of poolTransferTx");

    // const confirmationReceipt = await poolTransferTx.wait(confirmations);

    // console.log(
    //   `poolTransferTx confirmed upto ${confirmationReceipt.confirmations} confirmations`
    // );

    console.log(
      "getTransferStatus for this transaction until the transfer is complete or needs a refund"
    );

    const statusResult = await statusTracker({
      baseUrl: cBridgeBaseUrl,
      transferId: transferId,
    });

    console.log("Transfer successful:", statusResult);

    return {
      success: true,
      transactionId: transferId,
    };
  } catch (e) {
    console.error("TRANSFER_FAILED: ", e);
    return {
      success: false,
    };
  }
}
