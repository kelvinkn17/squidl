import { getSigner, getWeb3Provider } from "@dynamic-labs/ethers-v6";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import {
  wrapEthersProvider,
  wrapEthersSigner,
} from "@oasisprotocol/sapphire-ethers-v6";
import { ethers } from "ethers";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { CONTRACT_ADDRESS } from "../config";
import ContractABI from "../abi/StealthSigner.json";

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
  const { primaryWallet } = useDynamicContext();

  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [isLoaded, setLoaded] = useState(false);
  const isInitiating = useRef(false);

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
    } catch (e) {
      console.error("Error initializing web3 provider", e);
      setLoaded(false);
    } finally {
      isInitiating.current = false;
    }
  }

  useEffect(() => {
    if (primaryWallet) {
      init();
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
