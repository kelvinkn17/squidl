import { Button } from "@nextui-org/react";
import { Icons } from "../shared/Icons.jsx";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import TokenSelectionDialog from "../dialogs/TokenSelectionDialog.jsx";
import { useNavigate, useSearchParams } from "react-router-dom";
import { squidlAPI } from "../../api/squidl.js";
import ChainSelectionDialog from "../dialogs/ChainSelectionDialog.jsx";
import { cnm } from "../../utils/style.js";
import SuccessDialog from "../dialogs/SuccessDialog.jsx";
import { useUser } from "../../providers/UserProvider.jsx";
import { aggregateAssets, toBN } from "../../utils/assets-utils.js";
import { ethers, JsonRpcProvider } from "ethers";
import { useWeb3 } from "../../providers/Web3Provider.jsx";
import { CHAINS, TESTNET_CHAINS } from "../../config.js";
import { BN } from "bn.js";
import { confirmTransaction, handleKeyDown } from "./helpers.js";

// Make it so that the oasis sapphire (chainId: 23294) shows up on ChainSelectionDialog only when the exact token is selected
const SUPPORTED_SAPPHIRE_BRIDGE = [
  {
    fromChainId: 56,
    toChainId: 23294,
    fromToken: "0xF00600eBC7633462BC4F9C61eA2cE99F5AAEBd4a",
    toToken: ""
  }
]

export function Transfer() {
  const { userData } = useUser();
  const [search] = useSearchParams();
  const type = search.get("type");
  // const isPrivate = type === "private";

  const { assets, isAssetsLoading } = useUser();
  const { contract } = useWeb3();
  const navigate = useNavigate();

  // State variables
  const [amount, setAmount] = useState("");
  const [openTokenDialog, setOpenTokenDialog] = useState(false);
  const [openChainDialog, setOpenChainDialog] = useState(false);
  const [selectedToken, setSelectedToken] = useState(null);
  const [selectedChain, setSelectedChain] = useState(null);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [destination, setDestination] = useState("0x278A2d5B5C8696882d1D2002cE107efc74704ECf");
  const [maxBalance, setMaxBalance] = useState(0);
  const [error, setError] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  // If the user is transferring to Oasis (23294), set isPrivate to true
  useEffect(() => {
    if (selectedChain && selectedChain.id === 23294) {
      setIsPrivate(true);
    } else {
      setIsPrivate(false);
    }
  }, [selectedChain]);

  // If selected token is changed, change the selected chain to the same chain as the token
  useEffect(() => {
    if (selectedToken) {
      setSelectedChain(CHAINS.find((chain) => chain.id === selectedToken.chainId));
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
        supportedChain.fromToken.toLowerCase() === selectedToken.address.toLowerCase()
    );

    console.log("Is Sapphire Supported:", isSapphireSupported);

    // If Sapphire is supported, return both chain with id 23294 and selectedToken's chainId
    return isSapphireSupported
      ? [
        ...CHAINS.filter(
          (chain) => chain.id === 23294 || chain.id === selectedToken.chainId
        )
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
        tokenDecimals: selectedToken?.nativeToken ? 18 : selectedToken.token.decimals,
        token: selectedToken,
      };


      console.log("Transfer data:", transferData);
      console.log("Stealth addresses:", assets.stealthAddresses);

      console.log('aggregate:', {
        isNative: transferData.isNative,
        chainId: transferData.chainId,
        tokenAddress: transferData.tokenAddress,
      })

      const aggregatedAssets = aggregateAssets(assets.stealthAddresses, {
        isNative: transferData.isNative,
        chainId: transferData.sourceChainId,
        tokenAddress: transferData.tokenAddress,
      });

      console.log("Assets from handle transfer:", aggregatedAssets);

      // Sort assets by balance and prepare the withdrawal queue
      const sortedAssets = aggregatedAssets.sort(
        (a, b) => b.balance - a.balance
      );

      // Convert the amount to a big number in the appropriate unit
      let unitAmount = transferData.isNative
        ? toBN(amount, 18) // Use 18 decimals for native token
        : toBN(amount, transferData.tokenDecimals); // Use token-specific decimals

      console.log("Initial Unit Amount:", unitAmount.toString());

      // Process the withdraw queue with bn.js for stability
      const withdrawQueue = sortedAssets.reduce((queue, asset) => {
        if (unitAmount.lte(new BN(0))) return queue;

        // Convert asset amount directly to BN with the token's decimals
        console.log({
          amount: asset.amount,
          tokenDecimals: transferData.tokenDecimals,
        })
        const assetAmount = toBN(asset.amount, transferData.tokenDecimals);
        console.log(`Processing asset with amount: ${assetAmount.toString()} and address: ${asset.address}`);

        // Calculate the amount to withdraw
        const withdrawAmount = unitAmount.lt(assetAmount) ? unitAmount : assetAmount;
        unitAmount = unitAmount.sub(withdrawAmount);

        console.log(`Withdraw Amount: ${withdrawAmount.toString()}`);
        console.log(`Remaining Unit Amount: ${unitAmount.toString()}`);

        return [
          ...queue,
          {
            address: asset.address,
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

      const network = CHAINS.find((chain) => chain.id === transferData.chainId);
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
            metaAddress: transferData.userMetaAddress,
            k: 1,
            ephemeralPub: queue.ephemeralPub,
          });

          // Compute stealth key and stealth address
          const [stealthKey, stealthAddress] =
            await contract.computeStealthKey.staticCall(
              authSigner,
              transferData.userMetaAddress,
              1,
              queue.ephemeralPub
            );

          console.log("Stealth address:", { stealthAddress, stealthKey });

          queue.stealthKey = stealthKey;

          // Create a new signer using the stealth key (private key)
          const stealthSigner = new ethers.Wallet(stealthKey, provider);
          console.log("Stealth signer:", stealthSigner);

          // Handle the native asset (ETH)
          let txData;

          if (transferData.isNative) {
            // TODO: If the balance can't cover the gas fee, reduce the amount
            console.log("INSIDE IS NATIVE");
            // Minimal transaction data for ETH transfer
            txData = {
              from: stealthSigner.address,
              to: transferData.destinationAddress,
              value: queue.amount,
              chainId: network.id,
              nonce: await stealthSigner.getNonce(),
              gasPrice: ethers.parseUnits("20", "gwei"),
            };
          } else {
            // TODO: Handle ERC20 tokens
            const tokenContract = new ethers.Contract(
              transferData.tokenAddress,
              ["function transfer(address to, uint256 amount) returns (bool)"],
              stealthSigner
            );

            console.log("queue.amount", queue.amount);
            
            txData = await tokenContract.transfer.populateTransaction(
              transferData.destinationAddress,
              queue.amount
            );
            txData.from = stealthSigner.address;
            txData.chainId = network.id;
            txData.nonce = await stealthSigner.getNonce();
            txData.gasPrice = ethers.parseUnits("20", "gwei");
          }

          console.log("Transaction data:", txData);

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
            })
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
        }}
        botButtonTitle={"Done"}
        title={"Transaction Successful"}
        caption={"Your transaction has been submitted successfully."}
      />
      <div
        className={
          "relative flex flex-col w-full max-w-md items-start justify-center bg-[#F9F9FA] rounded-[32px] p-4 md:p-6"
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
          <div className="relative flex border-[2px] gap-4 border-[#E4E4E4] rounded-[16px]">
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
                        src={selectedToken?.nativeToken ? selectedToken.nativeToken.logoUrl : selectedToken.token.logo}
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
                      "font-medium",
                      selectedToken ? "text-neutral-600" : "text-neutral-300"
                    )}
                  >
                    {selectedToken ? (
                      <div className="flex flex-col items-start text-start">
                        <p>{selectedToken?.nativeToken ? selectedToken.nativeToken.name : selectedToken.token.name}</p>
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
              className="relative flex flex-col md:flex-row items-start md:items-center justify-between pr-4 py-5 w-full"
            >
              <h1 className="absolute left-0 -top-7 text-sm text-[#A1A1A3]">
                Chain
              </h1>

              <div className="relative flex flex-row gap-2 items-center justify-between w-full">
                <div className="flex gap-2">
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
                      "font-medium",
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

            <div className="mt-1 flex items-center justify-between h-16 w-full rounded-[16px] border-[2px] border-[#E4E4E4] px-6">
              <input
                className="py-2 bg-transparent transition-colors placeholder:text-[#A1A1A3] focus-visible:outline-none focus-visible:ring-none disabled:cursor-not-allowed disabled:opacity-50"
                value={amount}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="0.00"
              />

              <div className="flex gap-4">
                <div className="flex flex-col items-end justify-center text-end">
                  <p className="text-xs text-[#A1A1A3]">Balance</p>
                  <p className="text-[#A1A1A3] text-sm">{maxBalance}</p>
                </div>

                <div className="h-16 w-[2px] bg-[#E4E4E4]" />

                <button
                  onClick={() => {
                    setAmount(maxBalance);
                  }}
                  className=" text-[#563EEA] font-bold text-sm"
                >
                  Max
                </button>
              </div>
            </div>
            <div className="text-red-500 text-sm">
              {error}
            </div>
          </div>
        </div>

        {/* Destination */}
        <div className="flex flex-col gap-2 w-full mt-3">
          <h1 className="text-sm text-[#A1A1A3]">Destination Address</h1>
          {type === "main" ? (
            <div className="flex flex-col gap-2">
              <input
                className="h-16 w-full rounded-[16px] border-[2px] border-[#E4E4E4] px-6 bg-transparent transition-colors placeholder:text-[#A1A1A3] focus-visible:outline-none focus-visible:ring-none disabled:cursor-not-allowed disabled:opacity-50"
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
            <div className="flex flex-col bg-[#2127FF] p-0.5 rounded-[16px]">
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
          isDisabled={!selectedToken || !selectedChain || !amount || !destination}
          className="h-16 mt-[10vh] md:mt-[15vh] bg-[#563EEA] w-full rounded-[42px] font-bold text-white"
        >
          {isTransferring ? "Transferring your funds..." : "Transfer"}
        </Button>
      </div>
    </>
  );
}
