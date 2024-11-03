import { Button } from "@nextui-org/react";
import { Icons } from "../shared/Icons.jsx";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import TokenSelectionDialog from "../dialogs/TokenSelectionDialog.jsx";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChainSelectionDialog from "../dialogs/ChainSelectionDialog.jsx";
import { cnm } from "../../utils/style.js";
import SuccessDialog from "../dialogs/SuccessDialog.jsx";
import { useUser } from "../../providers/UserProvider.jsx";
import { aggregateAssets, toBN } from "../../utils/assets-utils.js";
import { ethers, JsonRpcProvider } from "ethers";
import { useWeb3 } from "../../providers/Web3Provider.jsx";
import { CHAINS } from "../../config.js";
import { BN } from "bn.js";
import { confirmTransaction, handleKeyDown } from "./helpers.js";
import { formatCurrency } from "@coingecko/cryptoformat";
import { poolTransfer } from "../../lib/cBridge/cBridge.js";

// Make it so that the oasis sapphire (chainId: 23294) shows up on ChainSelectionDialog only when the exact token is selected
const SUPPORTED_SAPPHIRE_BRIDGE = [
  {
    fromChainId: 56,
    toChainId: 23294,
    fromToken: "0xF00600eBC7633462BC4F9C61eA2cE99F5AAEBd4a",
    toToken: "",
  },
  {
    fromChainId: 1,
    toChainId: 23294,
    fromToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    toToken: "",
  },
];

export function Transfer() {
  const { userData, address } = useUser();
  const [search] = useSearchParams();
  const type = search.get("type");

  const { assets, isAssetsLoading } = useUser();
  const { contract } = useWeb3();
  const navigate = useNavigate();

  // State variables
  const [amount, setAmount] = useState("");
  const [openTokenDialog, setOpenTokenDialog] = useState(false);
  const [openChainDialog, setOpenChainDialog] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedChain, setSelectedChain] = useState(null);
  const [destination, setDestination] = useState(null);
  const [maxBalance, setMaxBalance] = useState(0);
  const [error, setError] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [isPrivate, setIsPrivate] = useState(type === "private");
  const [openSuccess, setOpenSuccess] = useState(false);
  const [successData, setSuccessData] = useState();

  useEffect(() => {
    if (selectedChain && selectedChain.id === 23294) {
      setIsPrivate(true);
    } else if (type === "private") {
      setIsPrivate(true);
    } else {
      setIsPrivate(false);
    }
  }, [selectedChain, type]);

  // if to oasis set destination to connected wallet address
  useEffect(() => {
    if (selectedChain && selectedChain.id === 23294 && address) {
      setDestination(address);
    }
  }, [selectedChain, address]);

  // If selected token is changed, change the selected chain to the same chain as the token
  useEffect(() => {
    if (selectedToken) {
      console.log("Selected Token:", selectedToken);
      setSelectedChain(
        CHAINS.find((chain) => chain.id === selectedToken.chainId)
      );
    }
  }, [selectedToken]);

  // Function to dynamically filter chains based on selected token and bridge support
  const getFilteredChains = () => {
    if (!selectedToken) return [];

    // Check if the selected token matches the Sapphire Bridge requirements
    const isSapphireSupported = SUPPORTED_SAPPHIRE_BRIDGE.some(
      (supportedChain) =>
        supportedChain.fromChainId === selectedToken.chainId &&
        selectedToken.address &&
        supportedChain.fromToken.toLowerCase() ===
          selectedToken.address.toLowerCase()
    );

    // If Sapphire is supported, return both chain with id 23294 and selectedToken's chainId
    return isSapphireSupported
      ? [
          ...CHAINS.filter(
            (chain) => chain.id === 23294 || chain.id === selectedToken.chainId
          ),
        ]
      : [...CHAINS.filter((chain) => chain.id === selectedToken.chainId)];
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    const regex = /^[0-9]*[.]?[0-9]*$/;

    if (regex.test(value)) {
      setAmount(value);
    }

    const amountFloat = parseFloat(value);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      setError("Please enter a valid amount");
    } else if (amountFloat > selectedToken.balance) {
      setError("Insufficient token balance");
    } else {
      setError("");
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(`/`);
    }
  };

  async function handleTransfer() {
    if (!selectedToken || !selectedChain) {
      return toast.error("Please select token and chain");
    }

    if (!amount || amount <= 0) {
      return toast.error("Please enter a valid amount");
    }

    if (!destination) {
      return toast.error("Please enter a destination address");
    }

    if (!assets) {
      return toast.error("No assets available");
    }

    try {
      setIsTransferring(true);
      console.log("Initiating transfer...");

      let transferData;

      // Currently only supports these routes:
      // - wROSE from BSC (56) to Oasis Sapphire (23294)
      // - USDC from Ethereum Mainnet (1) to Oasis Sapphire (23294)

      const isDifferentChain = selectedToken.chainId !== selectedChain.id;

      transferData = {
        userMetaAddress: userData.metaAddress,
        sourceChainId: selectedToken.chainId,
        chainId: selectedChain.id,
        destinationAddress: destination,
        isDifferentChain: isDifferentChain,
        isNative: Boolean(selectedToken?.nativeToken),
        tokenAddress: selectedToken?.nativeToken ? "" : selectedToken.address,
        tokenDecimals: selectedToken?.nativeToken
          ? 18
          : selectedToken.token.decimals,
        token: selectedToken,
      };

      console.log("Transfer data:", transferData);
      const aggregatedAssets = aggregateAssets(assets.stealthAddresses, {
        isNative: transferData.isNative,
        chainId: transferData.sourceChainId,
        tokenAddress: transferData.tokenAddress,
      });

      // Sort assets by balance and prepare the withdrawal queue
      const sortedAssets = aggregatedAssets.sort(
        (a, b) => b.balance - a.balance
      );

      // Convert the amount to a big number in the appropriate unit
      let unitAmount = transferData.isNative
        ? toBN(amount, 18) // Use 18 decimals for native token
        : toBN(amount, transferData.tokenDecimals); // Use token-specific decimals

      // Process the withdraw queue with bn.js for stability
      const withdrawQueue = sortedAssets.reduce((queue, asset) => {
        if (unitAmount.lte(new BN(0))) return queue;

        // Convert asset amount directly to BN with the token's decimals
        console.log({
          amount: asset.amount,
          tokenDecimals: transferData.tokenDecimals,
        });
        const assetAmount = toBN(asset.amount, transferData.tokenDecimals);

        // Calculate the amount to withdraw
        const withdrawAmount = unitAmount.lt(assetAmount)
          ? unitAmount
          : assetAmount;
        unitAmount = unitAmount.sub(withdrawAmount);

        return [
          ...queue,
          {
            address: asset.address,
            key: asset.key,
            ephemeralPub: asset.ephemeralPub,
            amount: withdrawAmount.toString(), // Convert back to string if needed
          },
        ];
      }, []);

      if (unitAmount.gt(new BN(0))) {
        console.warn(
          "Insufficient balance to fulfill the requested withdrawal amount.",
          unitAmount.toString()
        );
        throw new Error("Insufficient balance to complete withdrawal.");
      }

      console.log("Withdraw queue:", withdrawQueue);

      const authSigner = JSON.parse(localStorage.getItem("auth_signer"));
      if (!authSigner) {
        return toast.error("Signer not available");
      }

      const network = CHAINS.find(
        (chain) => chain.id === selectedToken.chainId
      );
      if (!network) {
        throw new Error("Network not found");
      }
      console.log("Network:", network);

      const provider = new JsonRpcProvider(network.rpcUrl);

      let gasPrice;
      if (selectedToken.chainId === 23294 || selectedToken.chainId === 23295) {
        gasPrice = ethers.parseUnits("100", "gwei");
      } else {
        gasPrice = ethers.parseUnits("20", "gwei");
      }

      console.log("Gas Price:", gasPrice.toString());

      // Get gas price
      // Handle the same chain transfer
      if (isDifferentChain === false) {
        const transactions = [];
        for (const queue of withdrawQueue) {
          try {
            // Compute stealth key and stealth address
            const [stealthKey, stealthAddress] =
              await contract.computeStealthKey.staticCall(
                authSigner,
                transferData.userMetaAddress,
                queue.key,
                queue.ephemeralPub
              );

            if (stealthAddress !== queue.address) {
              console.error(
                "Stealth address mismatch:",
                stealthAddress,
                queue.address
              );
              throw new Error("Stealth address mismatch");
            } else {
              console.log(
                "Stealth address match:",
                stealthAddress,
                queue.address
              );
            }

            queue.stealthKey = stealthKey;

            // Create a new signer using the stealth key (private key)
            const stealthSigner = new ethers.Wallet(stealthKey, provider);
            console.log("Stealth Signer:", {
              address: stealthSigner.address,
              privateKey: stealthSigner.privateKey,
            });

            // Handle the native asset (ETH)
            let txData;

            if (transferData.isNative) {
              // TODO: If the balance can't cover the gas fee, reduce the amount
              // Minimal transaction data for ETH transfer
              txData = {
                from: stealthSigner.address,
                to: transferData.destinationAddress,
                value: queue.amount,
                chainId: network.id,
                nonce: await stealthSigner.getNonce(),
                gasPrice: gasPrice,
              };
            } else {
              const tokenContract = new ethers.Contract(
                transferData.tokenAddress,
                [
                  "function transfer(address to, uint256 amount) returns (bool)",
                ],
                stealthSigner
              );

              txData = await tokenContract.transfer.populateTransaction(
                transferData.destinationAddress,
                queue.amount
              );
              txData.from = stealthSigner.address;
              txData.chainId = network.id;
              txData.nonce = await stealthSigner.getNonce();

              txData.gasPrice = gasPrice;
            }

            // Estimate gas limit for the transaction
            const gasEstimate = await provider.estimateGas(txData);
            txData.gasLimit = gasEstimate;

            // Sign the transaction using the stealthSigner
            const signedTx = await stealthSigner.signTransaction(txData);
            transactions.push(signedTx); // Collect the signed transaction
          } catch (error) {
            console.error("Error generating transaction:", error);
            throw error;
          }
        }

        // Send all signed transactions in a batch
        toast.loading("Processing transaction", { id: "withdrawal" });

        let txReceipts = []; // Define txReceipts outside the try-catch block

        try {
          toast.loading("Confirming transactions", { id: "withdrawal" });

          // Send and confirm all transactions
          txReceipts = await Promise.all(
            transactions.map(async (signedTx) => {
              // Send the raw transaction
              const txResponse = await provider.send(
                "eth_sendRawTransaction",
                [signedTx] // Send the signed transaction
              );

              // Wait for transaction to be mined (confirmed)
              const receipt = await confirmTransaction({
                txHash: txResponse,
                provider: provider,
              });
              console.log(`Transaction ${txResponse.hash} confirmed`, receipt);

              return receipt; // Return receipt for each transaction
            })
          );

          console.log("All transactions confirmed:", txReceipts);
        } catch (error) {
          console.error("Error sending or confirming transactions:", error);
          throw new Error("Error sending or confirming transactions");
        }

        const successData = {
          type: "PUBLIC_TRANSFER",
          amount: parseFloat(amount),
          chain: selectedChain,
          token: selectedToken,
          destinationAddress: destination,
          chainId: selectedChain.id,
          txHashes: txReceipts.map((tx) => tx.hash),
        };

        console.log("Success Data:", successData);
        setSuccessData(successData);
        setOpenSuccess(true);

        // txReceipts is now accessible outside the try-catch block
        console.log("Confirmed transactions:", txReceipts);

        toast.success("Withdrawal completed successfully", {
          id: "withdrawal",
        });
      } else if (isDifferentChain === true) {
        // Handle cross-chain transfer
        let txReceipts = [];
        for (const queue of withdrawQueue) {
          const [stealthKey, stealthAddress] =
            await contract.computeStealthKey.staticCall(
              authSigner,
              transferData.userMetaAddress,
              queue.key,
              queue.ephemeralPub
            );

          if (stealthAddress !== queue.address) {
            console.error(
              "Stealth address mismatch:",
              stealthAddress,
              queue.address
            );
            throw new Error("Stealth address mismatch");
          }

          queue.stealthKey = stealthKey;

          // Create a new signer using the stealth key (private key)
          const stealthSigner = new ethers.Wallet(stealthKey, provider);
          console.log("Stealth Signer:", {
            address: stealthSigner.address,
            privateKey: stealthSigner.privateKey,
          });

          const formattedAmount = parseFloat(
            ethers.formatUnits(queue.amount, transferData.tokenDecimals)
          );

          console.log("hehe");

          const res = await poolTransfer({
            cBridgeBaseUrl: "https://cbridge-prod2.celer.app",
            receiverAddress: transferData.destinationAddress,
            signer: stealthSigner,
            srcChainId: transferData.sourceChainId,
            dstChainId: transferData.chainId,
            tokenSymbol: transferData.token.token.symbol,
            amount: formattedAmount,
            slippageTolerance: 3000,
          });

          console.log("Pool Transfer Response:", res);
          txReceipts.push(res);
        }

        console.log("All transactions confirmed:", txReceipts);

        const successData = {
          type: "PRIVATE_TRANSFER",
          amount: parseFloat(amount),
          chain: selectedChain,
          token: selectedToken,
          destinationAddress: destination,
          chainId: selectedChain.id,
          transferIds: txReceipts.map((tx) => tx.transactionId),
        };

        console.log("Success Data:", successData);
        setSuccessData(successData);
        setOpenSuccess(true);
        toast.success("Withdrawal completed successfully", {
          id: "withdrawal",
        });
      }
    } catch (error) {
      console.error("Error during withdrawal:", error);
      toast.error(`Error during withdrawal: ${error.message}`, {
        id: "withdrawal",
      });
    } finally {
      setIsTransferring(false);
    }
  }

  return (
    <>
      <SuccessDialog
        open={openSuccess}
        setOpen={setOpenSuccess}
        botButtonHandler={() => {
          setOpenSuccess(false);
          // Reset the form
          setAmount("");
          setSelectedToken(null);
          setSelectedChain(null);
          setDestination("");
          setError("");
          setIsTransferring(false);
          setSuccessData(null);
        }}
        botButtonTitle={"Done"}
        title={"Transaction Successful"}
        caption={"Your transaction has been submitted successfully."}
        successData={successData}
      />
      <div
        className={
          "relative flex flex-col w-full max-w-md items-start justify-center bg-light-white rounded-[32px] p-4 md:p-6"
        }
      >
        <TokenSelectionDialog
          open={openTokenDialog}
          assets={assets}
          setOpen={setOpenTokenDialog}
          isPrivacy={type ? (type === "privacy" ? true : false) : false}
          selectedToken={selectedToken}
          setSelectedToken={setSelectedToken}
          setAmount={setMaxBalance}
        />

        <ChainSelectionDialog
          open={openChainDialog}
          setOpen={setOpenChainDialog}
          chains={getFilteredChains()}
          selectedChain={selectedChain}
          setSelectedChain={setSelectedChain}
          isPrivacy={type ? (type === "privacy" ? true : false) : false}
        />

        <div className="relative flex gap-4 w-full items-center justify-center">
          <h1 className="absolute text-[#161618] font-bold">Transfer</h1>

          <button
            onClick={handleBack}
            className="relative flex w-fit mr-auto items-center justify-center bg-white rounded-full size-11 aspect-square"
          >
            <Icons.back className="text-black size-6" />
          </button>
        </div>

        {/* Transfer */}

        <div className="flex flex-col gap-3 w-full mt-12">
          <div className="relative flex border-[2px] gap-4 bg-white border-[#E4E4E4] rounded-[16px]">
            {/* Token */}

            <button
              onClick={() => setOpenTokenDialog(true)}
              disabled={isAssetsLoading}
              className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-2 pl-4 py-5 w-full"
            >
              <h1 className="absolute left-0 -top-7 text-sm text-[#A1A1A3]">
                Token
              </h1>

              <div className="relative flex flex-row gap-2 items-center justify-between w-full">
                <div className="flex items-center gap-4">
                  {!selectedToken ? (
                    <div className="size-6">
                      <img
                        src="/assets/coin-earth.png"
                        alt="ic"
                        className={cnm(
                          "object-contain w-full h-full",
                          !selectedToken && "grayscale"
                        )}
                      />
                    </div>
                  ) : (
                    <div className="relative size-8">
                      <img
                        src={
                          selectedToken?.nativeToken
                            ? selectedToken.nativeToken.logo
                            : selectedToken.token.logo
                        }
                        alt="ic"
                        className="object-contain w-full h-full"
                      />
                      <img
                        src={selectedToken.chainLogo}
                        alt="ic"
                        className="absolute top-0 -right-2 object-contain size-4"
                      />
                    </div>
                  )}
                  <div
                    className={cnm(
                      "font-medium text-start text-sm",
                      selectedToken ? "text-neutral-600" : "text-neutral-300"
                    )}
                  >
                    {selectedToken ? (
                      <div className="flex flex-col items-start text-start">
                        <p className="text-sm">
                          {selectedToken?.nativeToken
                            ? selectedToken.nativeToken.name
                            : selectedToken.token.name}
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          {selectedToken.chainName}
                        </p>
                      </div>
                    ) : isAssetsLoading ? (
                      "Loading..."
                    ) : (
                      "Select Token"
                    )}
                  </div>
                </div>
                <Icons.dropdown className="text-[#252525]" />
              </div>
            </button>

            <div className="h-auto w-[4px] bg-[#E4E4E4] mx-auto" />

            {/* Chain */}
            <button
              onClick={() => setOpenChainDialog(true)}
              disabled={!selectedToken}
              className="relative flex flex-col  md:flex-row items-start md:items-center justify-between pr-4 py-5 w-full"
            >
              <h1 className="absolute left-0 -top-7 text-sm text-[#A1A1A3]">
                Chain
              </h1>

              <div className="relative  flex flex-row gap-2 items-center justify-between w-full">
                <div className="flex gap-3 items-center">
                  {
                    <div className="size-6">
                      <img
                        src={
                          selectedChain
                            ? selectedChain.imageUrl
                            : "/assets/coin-earth.png"
                        }
                        alt="ic"
                        className={cnm(
                          "object-contain w-full h-full",
                          !selectedChain && "grayscale"
                        )}
                      />
                    </div>
                  }
                  <p
                    className={cnm(
                      "font-medium text-sm text-start",
                      selectedChain ? "text-neutral-600" : "text-neutral-300"
                    )}
                  >
                    {selectedChain ? selectedChain.name : "Select Chain"}
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Input Amount */}
          <div className="flex flex-col w-full gap-0.5">
            <h1 className="text-sm text-[#A1A1A3]">Amount</h1>

            <div className="mt-1 flex items-center justify-between bg-white h-16 w-full rounded-[16px] border-[2px] border-[#E4E4E4]">
              <input
                className="flex-1 py-2 px-4 bg-transparent transition-colors placeholder:text-[#A1A1A3] focus-visible:outline-none focus-visible:ring-none disabled:cursor-not-allowed disabled:opacity-50"
                value={amount}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="0.00"
              />

              <div className="flex relative">
                <div className="flex flex-col items-end justify-center text-end right-16 pr-2 absolute h-full top-0 pointer-events-none">
                  <p className="text-xs text-[#A1A1A3]">Balance</p>
                  <p className="text-[#A1A1A3] text-sm">
                    {formatCurrency(parseFloat(maxBalance.toFixed(5)), "")}
                  </p>
                </div>

                <div className="h-16 w-[2px] bg-[#E4E4E4]" />

                <button
                  onClick={() => {
                    setAmount(maxBalance);
                  }}
                  className=" text-[#563EEA] font-bold text-sm flex items-center justify-center w-14"
                >
                  Max
                </button>
              </div>
            </div>
            <div className="text-red-500 text-sm">{error}</div>
          </div>
        </div>

        {/* Destination */}
        <div className="flex flex-col gap-2 w-full mt-3">
          <h1 className="text-sm text-[#A1A1A3]">Destination Address</h1>
          {!isPrivate ? (
            <div className="flex flex-col gap-2">
              <input
                className="h-16 w-full bg-white rounded-[16px] border-[2px] border-[#E4E4E4] px-6 bg-transparent transition-colors placeholder:text-[#A1A1A3] focus-visible:outline-none focus-visible:ring-none disabled:cursor-not-allowed disabled:opacity-50"
                value={destination}
                onChange={(e) => {
                  const val = e.target.value;
                  setDestination(val);
                }}
                placeholder="Address"
              />
            </div>
          ) : null}

          {/* if Oasis is destination */}
          {isPrivate && (
            <div className="flex flex-col bg-oasis-blue p-0.5 rounded-[16px]">
              <div className="flex items-center justify-between gap-4 bg-[#EEEEFF] px-4 py-5 rounded-[14px]">
                <p className="font-medium text-[#161618]">
                  Your Oasis Private wallet
                </p>

                <div className="size-9 bg-white rounded-full p-1">
                  <img
                    src="/assets/oasis-logo.png"
                    alt="ic"
                    className="object-contain w-full h-full"
                  />
                </div>
              </div>

              <p className="py-2 items-center text-center text-xs font-medium text-[#F4F4F4]">
                On Oasis, your funds stay private and untraceable
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={handleTransfer}
          isLoading={isTransferring}
          isDisabled={
            !selectedToken || !selectedChain || !amount || !destination
          }
          className="h-16 mt-[10vh] md:mt-[15vh] bg-primary w-full rounded-[42px] font-bold text-white"
        >
          {isTransferring ? "Transferring your funds..." : "Transfer"}
        </Button>
      </div>
    </>
  );
}
