import StealthSignerABI from "./abi/StealthSigner.json";

// export const CONTRACT_ADDRESS = "0x6b84f47Ef5c73AA8A9bc0D7Ff18ba3487aA5C1D3";
export const CONTRACT_ADDRESS = "0x201F0a5Ad2dD0ac254E808D4D6961D0aceaF3F00";

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
    abi: StealthSignerABI,
  },
};

export const MAINNET_CHAINS = [
  // ethereum
  {
    blockExplorerUrls: ["https://etherscan.io"], // Explorer for the Testnet
    chainId: 0x1,
    chainName: "Ethereum",
    iconUrls: ["https://app.dynamic.xyz/assets/networks/eth.svg"],
    name: "Ethereum",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    networkId: 0x1,
    rpcUrls: ["https://eth.drpc.org"],
    vanityName: "Ethereum",
  },
  // polygon
  {
    blockExplorerUrls: ["https://polygonscan.com"], // Explorer for the Testnet
    chainId: 0x89,
    chainName: "Polygon",
    iconUrls: ["https://app.dynamic.xyz/assets/networks/eth.svg"],
    name: "Polygon",
    nativeCurrency: {
      name: "Pol",
      symbol: "POL",
      decimals: 18,
    },
    networkId: 0x89,
    rpcUrls: ["https://rpc.ankr.com/polygon"],
    vanityName: "Polygon",
  },
  // oasis sapphire
  {
    blockExplorerUrls: ["https://explorer.oasis.io/mainnet/sapphire"], // Explorer for the Testnet
    chainId: 0x5afe,
    chainName: "Oasis Sapphire",
    iconUrls: ["https://app.dynamic.xyz/assets/networks/eth.svg"],
    name: "Sapphire",
    nativeCurrency: {
      name: "Rose",
      symbol: "ROSE",
      decimals: 18,
    },
    networkId: 0x5afe,
    rpcUrls: ["https://sapphire.oasis.io"],
    vanityName: "Oasis Sapphire",
  },
];

export const TESTNET_CHAINS = [
  // ethereum sepolia
  {
    blockExplorerUrls: ["https://sepolia.etherscan.io"], // Explorer for the Testnet
    chainId: 0xaa36a7,
    chainName: "Ethereum Sepolia",
    iconUrls: ["https://app.dynamic.xyz/assets/networks/eth.svg"],
    name: "Ethereum Sepolia",
    nativeCurrency: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
    },
    networkId: 0xaa36a7,
    rpcUrls: ["https://sepolia.drpc.org"],
    vanityName: "Ethereum Sepolia",
  },
  // polygon amoy
  {
    blockExplorerUrls: ["https://amoy.polygonscan.com"], // Explorer for the Testnet
    chainId: 0x13882,
    chainName: "Polygon Amoy",
    iconUrls: ["https://app.dynamic.xyz/assets/networks/matic.svg"],
    name: "Polygon Amoy",
    nativeCurrency: {
      name: "Pol",
      symbol: "POL",
      decimals: 18,
    },
    networkId: 0x13882,
    rpcUrls: ["https://polygon-amoy.drpc.org"],
    vanityName: "Polygon Amoy",
  },
  // oasis sapphire testnet
  {
    blockExplorerUrls: ["https://testnet.explorer.sapphire.oasis.io"], // Explorer for the Testnet
    chainId: 0x5aff,
    chainName: "Sapphire Testnet",
    iconUrls: ["https://app.dynamic.xyz/assets/networks/eth.svg"],
    name: "Sapphire Testnet",
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

export const customEvmNetworks =
  import.meta.env.VITE_APP_ENVIRONMENT === "dev"
    ? TESTNET_CHAINS
    : MAINNET_CHAINS;
