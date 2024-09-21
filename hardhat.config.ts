import type { HardhatUserConfig } from "hardhat/config";
import '@oasisprotocol/sapphire-hardhat';
import "@nomicfoundation/hardhat-toolbox";
// import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-ethers";
import "@nomiclabs/hardhat-solhint";
import "hardhat-tracer";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      viaIR: true,
      optimizer: {
          enabled: true,
          runs: 2000,
      },
    },
  },
  networks: {
    'sapphire-testnet': {
      // This is Testnet! If you want Mainnet, add a new network config item.
      url: "https://testnet.sapphire.oasis.io",
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : [],
      chainId: 0x5aff,
    },
    'sapphire-localnet': {
      url: 'http://localhost:8545',
      accounts: process.env.PRIVATE_KEY
        ? [process.env.PRIVATE_KEY]
        : [],
      chainId: 0x5afd,
    },
  },
};

export default config;
