import StealthSignerABI from "./abi/StealthSigner.json"

// export const CONTRACT_ADDRESS = "0x6b84f47Ef5c73AA8A9bc0D7Ff18ba3487aA5C1D3";
export const CONTRACT_ADDRESS = "0x201F0a5Ad2dD0ac254E808D4D6961D0aceaF3F00"

export const sapphireTestnet = {
  chainId: 0x5aff,
  chainName: "Sapphire Testnet",
  rpcUrls: ["https://testnet.sapphire.oasis.io"],
  nativeCurrency: {
    name: "Rose",
  symbol: "ROSE",
    decimals: 18,
  },
  blockExplorerUrls: ["https://testnet.explorer.sapphire.oasis.io"], // Explorer for the Testnet
  stealthSignerContract: {
    address: "0x201F0a5Ad2dD0ac254E808D4D6961D0aceaF3F00",
    abi: StealthSignerABI
  },
};

export const customEvmNetworks = [
  {
    blockExplorerUrls: ["https://testnet.explorer.sapphire.oasis.io"], // Explorer for the Testnet
    chainId: 0x5aff,
    chainName: "Sapphire Testnet",
    iconUrls: ["https://app.dynamic.xyz/assets/networks/eth.svg"],
    name: "Ethereum",
    nativeCurrency: {
      name: "Test",
      symbol: "TEST",
      decimals: 18,
    },
    networkId: 0x5aff,
    rpcUrls: ["https://testnet.sapphire.oasis.io"],
    vanityName: "Sapphire Testnet",
  },
];
