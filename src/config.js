import StealthSignerABI from "./abi/StealthSigner.json";

// export const CONTRACT_ADDRESS = "0x6b84f47Ef5c73AA8A9bc0D7Ff18ba3487aA5C1D3";
export const CONTRACT_ADDRESS = import.meta.env.VITE_SQUIDL_STEALTHSIGNER_CONTRACT_ADDRESS;

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
    address: import.meta.env.VITE_SQUIDL_STEALTHSIGNER_CONTRACT_ADDRESS,
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
  {
    blockExplorerUrls: ["https://bscscan.com"], // Explorer for the Testnet
    chainId: 0x38,
    chainName: "Binance Smart Chain",
    chainlistUrl: "https://chainlist.org/chain/56",
    iconUrls: ["https://app.dynamic.xyz/assets/networks/bnb.svg"],
    name: "Binance Smart Chain",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    networkId: 0x38,
    rpcUrls: ["https://binance.llamarpc.com"],
    vanityName: "Binance Smart Chain",
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
    group: "oasis",
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
    iconUrls: ["https://app.dynamic.xyz/assets/networks/bsc.svg"],
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
    group: "oasis",
  },
];

export const customEvmNetworks =
  import.meta.env.VITE_APP_ENVIRONMENT === "dev"
    ? TESTNET_CHAINS
    : MAINNET_CHAINS;

export const CHAINS = [
  // Mainnet Chains
  {
    id: 1,
    name: "Ethereum Mainnet",
    chainlistUrl: "https://chainlist.org/chain/1",
    rpcUrl: `https://mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`,
    nativeToken: "ETH",
    blockExplorerUrl: "https://etherscan.io",
    imageUrl: "https://filebucketz.sgp1.cdn.digitaloceanspaces.com/misc/chains/ethereum.svg",
    isTestnet: false,
    network: "mainnet",
  },
  {
    id: 137,
    name: "Polygon Mainnet",
    chainlistUrl: "https://chainlist.org/chain/137",
    rpcUrl: `https://polygon-mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`,
    nativeToken: "MATIC",
    blockExplorerUrl: "https://polygonscan.com",
    imageUrl: "https://filebucketz.sgp1.cdn.digitaloceanspaces.com/misc/chains/matic.svg",
    isTestnet: false,
    network: "mainnet",
  },
  {
    id: 56,
    name: "Binance Smart Chain",
    chainlistUrl: "https://chainlist.org/chain/56",
    rpcUrl: `https://bsc-mainnet.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`,
    nativeToken: "BNB",
    blockExplorerUrl: "https://bscscan.com/",
    imageUrl: "https://filebucketz.sgp1.cdn.digitaloceanspaces.com/misc/chains/bsc.svg",
    isTestnet: false,
    network: "mainnet",
  },
  {
    id: 23294,
    name: "Oasis Sapphire Mainnet",
    chainlistUrl: "https://chainlist.org/chain/23294",
    rpcUrl: "https://sapphire.oasis.io",
    nativeToken: "ROSE",
    blockExplorerUrl: "https://explorer.oasis.io/mainnet/sapphire",
    imageUrl: "https://filebucketz.sgp1.cdn.digitaloceanspaces.com/misc/chains/oasis.svg",
    isTestnet: false,
    network: "mainnet",
    compatibility: [137],
  },
  // Testnet Chains
  {
    id: 11155111,
    name: "Ethereum Sepolia",
    chainlistUrl: "https://chainlist.org/chain/11155111",
    rpcUrl: `https://sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_API_KEY}`,
    nativeToken: "ETH",
    blockExplorerUrl: "https://sepolia.etherscan.io/",
    imageUrl: "https://filebucketz.sgp1.cdn.digitaloceanspaces.com/misc/chains/ethereum.svg",
    isTestnet: true,
    network: "testnet",
  },
  {
    id: 23295,
    name: "Oasis Sapphire Testnet",
    chainlistUrl: "https://chainlist.org/chain/23295",
    rpcUrl: "https://testnet.sapphire.oasis.io",
    nativeToken: "TEST",
    blockExplorerUrl: "https://explorer.oasis.io/testnet/sapphire",
    imageUrl: "https://filebucketz.sgp1.cdn.digitaloceanspaces.com/misc/chains/oasis.svg",
    isTestnet: true,
    network: "testnet",
    compatibility: [137],
  },
];
