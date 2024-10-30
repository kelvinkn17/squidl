import { getSigner, getWeb3Provider } from "@dynamic-labs/ethers-v6";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import {
  wrapEthersProvider,
  wrapEthersSigner,
} from "@oasisprotocol/sapphire-ethers-v6";
import { ethers } from "ethers";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { CONTRACT_ADDRESS, customEvmNetworks } from "../config";
import ContractABI from "../abi/StealthSigner.json";
import toast from "react-hot-toast";
import { sleep } from "../utils/process.js";

/**
 * @typedef {Object} Web3ContextType
 * @property {boolean} isLoaded - Indicates if the provider is loaded.
 * @property {ethers.providers.Provider | null} provider - The Ethers provider.
 * @property {ethers.Signer | null} signer - The Ethers signer.
 * @property {ethers.Contract | null} contract - The Ethers contract instance.
 */

/** @type {React.Context<Web3ContextType>} */
const Web3Context = createContext({
  isLoaded: false,
  provider: null,
  signer: null,
  contract: null,
});

export const useWeb3 = () => useContext(Web3Context);

export default function Web3Provider({ children }) {
  const { primaryWallet, handleLogOut } = useDynamicContext();

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [isLoaded, setLoaded] = useState(false);
  const [isNetworkChecking, setIsNetworkChecking] = useState(false);

  const isInitiating = useRef(false);

  const oasis = customEvmNetworks.find((chain) => chain.group === "oasis");

  async function init() {
    if (isInitiating.current) return;
    isInitiating.current = true;
    try {
      const _provider = await getWeb3Provider(primaryWallet);
      const _signer = await getSigner(primaryWallet);
      const wrappedProvider = wrapEthersProvider(_provider);
      const wrappedSigner = wrapEthersSigner(_signer);
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        ContractABI.abi,
        wrappedSigner
      );

      setProvider(wrappedProvider);
      setSigner(wrappedSigner);
      setContract(contract);
      setLoaded(true);

      monitorNetworkChange();
    } catch (e) {
      console.error("Error initializing web3 provider", e);
      setLoaded(false);
    } finally {
      isInitiating.current = false;
    }
  }

  async function switchNetworkIfNeeded(withLoading = false) {
    if (withLoading) {
      if (isNetworkChecking) return;
      setIsNetworkChecking(true);
    }

    console.log("checking...");

    try {
      const network = await provider?.getNetwork();

      if (network?.chainId !== oasis.chainId) {
        if (primaryWallet?.connector?.supportsNetworkSwitching()) {
          try {
            await primaryWallet.switchNetwork(oasis.chainId);

            await init();
            return;
          } catch (error) {
            console.error("Error switching network:", error);
            toast.error(
              `Failed to switch network. Please switch to ${oasis.name} manually.`
            );
            await sleep(2000);

            handleLogOut();
            return;
          }
        } else {
          toast.error(
            `Network switching not supported. Please switch to ${oasis.name} manually.`
          );
          await sleep(2000);
          handleLogOut();
          return;
        }
      } else {
        toast.info(`Already connected to ${oasis.name} network.`);
        await init();
        return;
      }
    } catch (error) {
      console.error("Error checking network:", error);
      toast.error(`Error connecting to the network. Please switch manually.`);
      await sleep(2000);
      handleLogOut();
      return;
    } finally {
      setIsNetworkChecking(false);
    }
  }

  function monitorNetworkChange() {
    const connector = primaryWallet.connector;

    if (!connector) {
      console.error("No connector found.");
      return;
    }

    // Listen for network changes
    connector.on("chainChange", async (_) => {
      if (signer) {
        await switchNetworkIfNeeded(true);
      }
    });
  }

  useEffect(() => {
    if (primaryWallet) {
      switchNetworkIfNeeded(false);
    }
  }, [primaryWallet]);

  return (
    <Web3Context.Provider
      value={{
        provider,
        signer,
        contract,
        isLoaded,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}
