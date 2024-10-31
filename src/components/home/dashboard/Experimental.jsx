import { Button } from "@nextui-org/react";
import React, { useState } from "react";
import { useWeb3 } from "../../../providers/Web3Provider";
import toast from "react-hot-toast";
import { ethers, JsonRpcProvider } from "ethers";
import { CHAINS, sapphireTestnet } from "../../../config";
import axios from "axios";
import { getSigner } from "@dynamic-labs/ethers-v6";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { poolTransfer } from "../../../lib/cBridge/cBridge.js";
import { ASSETS_DUMMY } from "./dummy.js";
import { aggregateAssets } from "../../../utils/assets-utils.js";
import { useUser } from "../../../providers/UserProvider.jsx";
import { is } from '../../../../node_modules/date-fns/locale/is';

export default function Experimental() {
  const { contract, signer } = useWeb3();
  const { assets } = useUser();
  const { primaryWallet } = useDynamicContext();

  const [isLoading, setIsLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  const handleCheckStealthAddress = async () => {
    try {
      console.log("Checking stealth address...");
      setIsLoading(true);

      const metaAddress =
        "st:eth:0x025c66a53b27a3dbe6e591c6ef58a022538922341a650231a30a04e65494333a7802fc0af3018b0cec9159541bb5efc76c583b6f330a9bb97486cf553e3f6c8dc717";
      const ephemeralPub =
        "0x02e609640b58587b1382d4d6701a7d963c7d0f0fa72e71af78c3ae2514e5effb17";
      const k = 1;
      const viewHint = "0x1f";
      const expected = "0xF366E7D225d99AB2F5fA3416fC2Da2D6497F0747";

      const stealthAddress = await contract.checkStealthAddress.staticCall(
        metaAddress,
        k,
        ephemeralPub,
        viewHint
      );

      if (stealthAddress === expected) {
        console.log("Stealth address is correct");
        toast.success("Stealth address is correct");
      }
    } catch (error) {
      console.error("Error checking stealth address", error);
      toast.error("Error checking stealth address");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async ({
    amount = 0.0005
  }) => {
    try {
      console.log("Initiating withdrawal...");
      setIsLoading(true);

      const metaAddress =
        "st:eth:0x025c66a53b27a3dbe6e591c6ef58a022538922341a650231a30a04e65494333a7802fc0af3018b0cec9159541bb5efc76c583b6f330a9bb97486cf553e3f6c8dc717";

      const assets = aggregateAssets(ASSETS_DUMMY.stealthAddresses, {
        isNative: true,
        chainId: 11155111,
        tokenAddress: "",
      })

      console.log("Assets:", assets);

      const destinationAddress = "0x278A2d5B5C8696882d1D2002cE107efc74704ECf";
      const isNative = true;
      const chainId = 11155111;

      // Mock token data for ERC20 tokens
      const tokenAddress = "0x53844F9577C2334e541Aec7Df7174ECe5dF1fCf0";
      const tokenDecimals = 18;

      // Convert Ether amount to Wei for calculation
      let etherAmount = amount * 10 ** 18;
      if (etherAmount <= 0) {
        throw new Error("Invalid withdrawal amount.");
      }

      // Sort assets by balance and prepare the withdrawal queue
      const sortedAssets = assets.sort(
        (a, b) => b.balance - a.balance
      );

      const withdrawQueue = sortedAssets.reduce((queue, asset) => {
        if (etherAmount <= 0) return queue;

        const withdrawAmount = Math.min(etherAmount, parseInt(asset.amount));
        etherAmount -= withdrawAmount;

        return [
          ...queue,
          {
            address: asset.address,
            ephemeralPub: asset.ephemeralPub,
            amount: withdrawAmount,
          },
        ];
      }, []);

      if (etherAmount > 0) {
        console.warn(
          "Insufficient balance to fulfill the requested withdrawal amount."
        );
        throw new Error("Insufficient balance to complete withdrawal.");
      }

      console.log("Withdraw queue:", withdrawQueue);

      const authSigner = JSON.parse(localStorage.getItem("auth_signer"));
      if (!authSigner) {
        return toast.error("Signer not available");
      }

      const network = CHAINS.find((chain) => chain.id === chainId);
      console.log("Network:", network);

      if (!network) {
        throw new Error("Network not found");
      }

      const provider = new JsonRpcProvider(network.rpcUrl);
      const transactions = [];

      for (const queue of withdrawQueue) {
        try {
          console.log({
            auth: authSigner,
            metaAddress,
            k: 51,
            ephemeralPub: queue.ephemeralPub,
          });

          // Compute stealth key and stealth address
          const [stealthKey, stealthAddress] =
            await contract.computeStealthKey.staticCall(
              authSigner,
              metaAddress,
              51,
              queue.ephemeralPub
            );

          queue.stealthKey = stealthKey;

          // Create a new signer using the stealth key (private key)
          const stealthSigner = new ethers.Wallet(stealthKey, provider);
          console.log('Stealth signer:', {
            address: stealthSigner.address,
            privateKey: stealthSigner.privateKey
          });

          // Handle the native asset (ETH)
          let txData;

          if (isNative) {
            // TODO: If the balance can't cover the gas fee, reduce the amount

            // Minimal transaction data for ETH transfer
            txData = {
              from: stealthSigner.address,
              to: destinationAddress,
              value: queue.amount,
              chainId: network.id,
              nonce: await stealthSigner.getNonce(),
              gasPrice: ethers.parseUnits("20", "gwei"),
            };
          } else {
            // TODO: Handle ERC20 tokens
            const tokenContract = new ethers.Contract(
              tokenAddress,
              ["function transfer(address to, uint256 amount) returns (bool)"],
              stealthSigner
            );
            const tokenAmount = ethers.utils.parseUnits(
              String(queue.amount),
              tokenDecimals
            );

            txData = await tokenContract.populateTransaction.transfer(
              destinationAddress,
              tokenAmount
            );
            txData.chainId = network.id;
            txData.nonce = await stealthSigner.getNonce();
            txData.gasPrice = ethers.parseUnits("20", "gwei");
          }

          // Estimate gas limit for the transaction
          const gasEstimate = await provider.estimateGas(txData);
          txData.gasLimit = gasEstimate;

          // Sign the transaction using the stealthSigner
          const signedTx = await stealthSigner.signTransaction(txData);
          transactions.push(signedTx); // Collect the signed transaction
        } catch (error) {
          console.error("Error generating transaction:", error);
        }
      }

      // Send all signed transactions in a batch
      toast.loading("Processing transaction", { id: "withdrawal" });

      let txReceipts = []; // Define txReceipts outside the try-catch block

      try {
        // Send and confirm all transactions
        txReceipts = await Promise.all(
          transactions.map(async (signedTx) => {
            // Send the raw transaction
            const txResponse = await provider.send(
              "eth_sendRawTransaction",
              [signedTx] // Send the signed transaction
            );

            // Wait for transaction to be mined (confirmed)
            const receipt = await provider.waitForTransaction(txResponse);

            console.log(`Transaction ${txResponse.hash} confirmed`, receipt);
            return receipt; // Return receipt for each transaction
          })
        );

        console.log("All transactions confirmed:", txReceipts);
      } catch (error) {
        console.error("Error sending or confirming transactions:", error);
      }

      // txReceipts is now accessible outside the try-catch block
      console.log("Confirmed transactions:", txReceipts);

      toast.success("Withdrawal completed successfully", { id: "withdrawal" });
    } catch (error) {
      console.error("Error during withdrawal:", error);
      toast.error(`Error during withdrawal: ${error.message}`, {
        id: "withdrawal",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdrawBridge = async ({
    amount = 0.000123,
    metaAddress = "st:eth:0x025c66a53b27a3dbe6e591c6ef58a022538922341a650231a30a04e65494333a7802fc0af3018b0cec9159541bb5efc76c583b6f330a9bb97486cf553e3f6c8dc717",
    sourceChainId = 56,
    destinationChainId = 23294,
    destinationAddress = "0x278A2d5B5C8696882d1D2002cE107efc74704ECf",
    tokenAddress = "0xf00600ebc7633462bc4f9c61ea2ce99f5aaebd4a",
    tokenDecimals = 18,
    isNative = false,
    chainId = 56, // BSC
  }) => {
    try {
      console.log("Initiating withdrawal...");
      setIsLoading(true);

      toast.loading("Preparing withdrawal, please wait...", {
        id: "withdrawal",
      });

      const _assets = aggregateAssets(assets.stealthAddresses, {
        isNative: false,
        chainId: 56,
        tokenAddress: tokenAddress,
      })

      console.log("Assets:", _assets);

      // Sort assets by balance and prepare the withdrawal queue
      const sortedAssets = _assets.sort(
        (a, b) => b.balance - a.balance
      );

      let unitAmount = isNative ? (amount * 10 ** 18) : amount * 10 ** tokenDecimals;

      const withdrawQueue = sortedAssets.reduce((queue, asset) => {
        if (unitAmount <= 0) return queue;

        const withdrawAmount = Math.min(unitAmount, parseInt(asset.amount));
        unitAmount -= withdrawAmount;

        return [
          ...queue,
          {
            address: asset.address,
            ephemeralPub: asset.ephemeralPub,
            amount: withdrawAmount,
          },
        ];
      }, []);

      console.log("Withdraw queue:", withdrawQueue);

      if (unitAmount > 0) {
        console.warn(
          "Insufficient balance to fulfill the requested withdrawal amount."
        );
        throw new Error("Insufficient balance to complete withdrawal.");
      }

      const authSigner = JSON.parse(localStorage.getItem("auth_signer"));
      if (!authSigner) {
        return toast.error("Signer not available");
      }

      const network = CHAINS.find((chain) => chain.id === chainId);
      console.log("Network:", network);

      if (!network) {
        throw new Error("Network not found");
      }

      const provider = new JsonRpcProvider(network.rpcUrl);

      let txReceipts = [];
      for (const queue of withdrawQueue) {
        const [stealthKey, stealthAddress] =
          await contract.computeStealthKey.staticCall(
            authSigner,
            metaAddress,
            2,
            queue.ephemeralPub
          );

        queue.stealthKey = stealthKey;

        // Create a new signer using the stealth key (private key)
        const stealthSigner = new ethers.Wallet(stealthKey, provider);
        console.log('Stealth signer:', {
          address: stealthSigner.address,
          privateKey: stealthSigner.privateKey
        })

        console.log({
          receiverAddress: destinationAddress,
          signer: stealthSigner,
          srcChainId: sourceChainId,
          dstChainId: destinationChainId,
          tokenSymbol: "wROSE",
          amount: amount,
          slippageTolerance: 3000,
        })

        const res = await poolTransfer({
          cBridgeBaseUrl: "https://cbridge-prod2.celer.app",
          receiverAddress: destinationAddress,
          signer: stealthSigner,
          srcChainId: sourceChainId,
          dstChainId: destinationChainId,
          tokenSymbol: "wROSE",
          amount: amount,
          slippageTolerance: 3000,
        })

        console.log('celer pool transfer response:', res);
        txReceipts.push(res);
      }

      console.log("Confirmed transactions:", txReceipts);

      toast.success("Withdrawal completed successfully",
        { id: "withdrawal" }
      );
    } catch (error) {
      console.error("Error during withdrawal:", error);
      toast.error(`Error during withdrawal: ${error.message}`, {
        id: "withdrawal",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function testTransfer() {
    /*

 BNB Smart Chain Testnet chainId ->  97
 Mumbai chainId -> 80001
 Linea sepolia chainId ->  59141 

 Oasis sapphire testnet chainId ->  23295 
 Oasis sapphire mainnet chainId ->  23294

 cBridgeBaseUrl testnet -> https://cbridge-v2-test.celer.network
 cBridgeBaseUrl mainnet -> https://cbridge-prod2.celer.app

*/
    try {
      setTransferLoading(true);

      const signer = await getSigner(primaryWallet);

      const res = await poolTransfer({
        cBridgeBaseUrl: "https://cbridge-prod2.celer.app",
        receiverAddress: "0x02919065a8Ef7A782Bb3D9f3DEFef2FA0a4d1f37",
        signer: signer,
        srcChainId: 1,
        dstChainId: 23294,
        tokenSymbol: "WETH",
        amount: 0.0008,
        slippageTolerance: 3000,
      });

      console.log(res);
    } catch (e) {
      console.log(e);
    } finally {
      setTransferLoading(false);
    }
  }

  return (
    <div className="bg-white shadow-xl p-4 w-full rounded-xl">
      <div className="font-semibold">Experimental</div>

      <div className="flex flex-col gap-4 mt-5">
        <Button
          isLoading={isLoading}
          onClick={handleCheckStealthAddress}
          color="primary"
        >
          Check Stealth Address
        </Button>

        <Button isLoading={isLoading} onClick={handleWithdraw} color="primary">
          Withdraw
        </Button>

        <Button isLoading={isLoading} onClick={handleWithdrawBridge} color="primary">
          Withdraw Bridge
        </Button>

        <Button
          isLoading={transferLoading}
          onClick={testTransfer}
          color="primary"
        >
          CBridge Transfer
        </Button>
      </div>
    </div>
  );
}
