import { ethers } from "ethers";

export const getContract = (address, abi, signer) => {
  if (!signer) {
    throw new Error("Signer is required to interact with the contract.");
  }

  return new ethers.Contract(address, abi, signer);
};
