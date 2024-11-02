// Usage: pnpm hardhat run --network <network> scripts/run-vigil.ts

import type { BigNumberish, Signer } from 'ethers';
import { ethers } from 'hardhat';
import dotenv from 'dotenv';
import { bech32 } from "bech32";
dotenv.config();

const roflAppID = "rofl1qqn9xndja7e2pnxhttktmecvwzz0yqwxsquqyxdf"

async function main() {
  const StealthSigner = await ethers.getContractFactory('StealthSigner');

  const users = await ethers.getSigners();
  console.log('Users:', users.map((user) => user.address));

  // Rofl ID handler
  const { prefix, words } = bech32.decode(roflAppID);
  const rawAppID = new Uint8Array(bech32.fromWords(words));
  console.log('Rofl App ID:', rawAppID);

  const [user] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  const stealthSigner = await StealthSigner.deploy(user, rawAppID);
  await stealthSigner.connect(ethers.provider);
  const contractAddress = await stealthSigner.getAddress();
  console.log('StealthSigner deployed to:', contractAddress);

  const auth = await signAuthToken(user, contractAddress, network.chainId);
  const metaAddressIndex = 0;
  // console.log('Viewing Public Key:', await stealthSigner.viewingPub());
  // console.log('Spend Public Key:', await stealthSigner.spendPub());

  const tx = await stealthSigner.register(auth);
  console.log('Registering user in', tx.hash);
  await tx.wait();
  
  // const metaAddress = await user.getAddress();
  // const labelIndex = 0;
  const [metaAddress, spendPub, viewingPub] = await stealthSigner.getMetaAddress.staticCall(auth, metaAddressIndex);
  const labelIndex = 0;
  console.log("metaAddress0:", [metaAddress, spendPub, viewingPub]);
  console.log(await stealthSigner.getMetaAddress.staticCall(auth, 1));

  try {
    console.log('Checking the address');
    const [address1, ePub1, tag1] = await stealthSigner.generateStealthAddress.staticCall(metaAddress, labelIndex);
    console.log([address1, ePub1, tag1]);
    console.log(await stealthSigner.checkStealthAddress.staticCall(metaAddress, labelIndex, ePub1, tag1));
    const [key1, addr1] = await stealthSigner.computeStealthKey.staticCall(auth, metaAddress, labelIndex, ePub1);

    if (addr1 !== address1) {
      console.log('Uh oh. The address is incorrect!', [address1, addr1]);
      process.exit(1);
    }

    const wallet1 = new ethers.Wallet(key1);
    if (wallet1.address !== address1) {
      console.log('Uh oh. The stealth key is incorrect!', [address1, wallet1.address]);
      process.exit(1);
    }

    const [address2, ePub2, tag2] = await stealthSigner.connect(ethers.provider).generateStealthAddress.staticCall(metaAddress, labelIndex)
    console.log([address2, ePub2, tag2]);
    console.log(await stealthSigner.checkStealthAddress.staticCall(metaAddress, labelIndex, ePub2, tag2));
    const [key2, addr2] = await stealthSigner.computeStealthKey.staticCall(auth, metaAddress, labelIndex, ePub2);

    if (addr2 !== address2) {
      console.log('Uh oh. The address is incorrect!', [address2, addr2]);
      process.exit(1);
    }

    const wallet2 = new ethers.Wallet(key2);
    if (wallet2.address !== address2) {
      console.log('Uh oh. The stealth key is incorrect!', [address2, wallet2.address]);
      process.exit(1);
    }

    const nonce = 0;
    const feeData = await ethers.provider.getFeeData();
    const gasPrice = feeData.gasPrice || 20_000;
    const network = await ethers.provider.getNetwork();
    const rawTx = await stealthSigner.createTransaction.staticCall(
      auth,
      metaAddress,
      0,
      ePub2,
      nonce,
      gasPrice,
      network.chainId,
    );
    console.log("Transaction Bytes:", rawTx);
    const tx = ethers.Transaction.from(rawTx);
    console.log(`Transaction (isSigned: ${tx.isSigned()}):`, tx);

  } catch (e: any) {
    console.log('failed to fetch address:', e.message);
  }
  console.log('Waiting...');

  // Manually generate some transactions to increment local Docker
  // container block
  if ((await ethers.provider.getNetwork()).name == 'sapphire_localnet') {
    await generateTraffic(10);
  }

  await new Promise((resolve) => setTimeout(resolve, 30_000));
  console.log('Checking the address again');
  await (await stealthSigner.generateStealthAddress(metaAddress, labelIndex)).wait(); // Reveal the secret.
  const address = await stealthSigner.generateStealthAddress.staticCallResult(metaAddress, labelIndex); // Get the value.
  console.log('The secret ingredient is', address);
}

async function signAuthToken(signer: Signer, verifyingContract: string, chainId: BigNumberish) {
  const currentTime = Math.floor(Date.now() / 1000); // Get current time in seconds (uint32 format)
  // const [signer] = await ethers.getSigners();
  const user = await signer.getAddress();

  // Define the domain for EIP-712 signature
  const domain = {
    name: "SignInExample.SignIn",
    version: "1",
    chainId: chainId,
    verifyingContract: verifyingContract // Get contract address
};

  // Define the types for the signTypedData structure
  const types = {
      SignIn: [
          { name: 'user', type: "address" },
          { name: 'time', type: 'uint32' },
      ]
  };

  // Values to sign
  const values = {
      user,
      time: currentTime
  };

  // Ask the user to sign the typed data
  const signature = await signer.signTypedData(domain, types, values);

  // Extract r, s, v from the signature
  const rsv = ethers.Signature.from(signature);

  const auth = { user, time: currentTime, rsv };
  return auth;
}

async function generateTraffic(n: number) {
  const signer = await ethers.provider.getSigner();
  for (let i = 0; i < n; i++) {
    await signer.sendTransaction({
      to: "0x000000000000000000000000000000000000dEaD",
      value: ethers.parseEther("1.0"),
      data: "0x"
    });
  };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});