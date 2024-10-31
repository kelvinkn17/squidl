import { getTransferConfigsForAll } from "./api/getData.js";
import { getContract } from "./helpers/contract.js";
import {
  approve,
  checkApprove,
  getAllowance,
  getBridgeContractAddress,
  getTransferId,
  getTransferObject,
} from "./helpers/txHelper.js";
import BridgeABI from "../../abi/Bridge.sol/Bridge.json";
import { poolBasedTransfer } from "./api/poolBasedTransfer.js";
import { statusTracker } from "./api/statusTracker.js";

const BRIDGE_CONFIGS = {
  chains: [
    {
      "id": 1,
      "name": "Ethereum Mainnet",
      "icon": "https://get.celer.app/cbridge-icons/chain-icon/ETH.png",
      "block_delay": 12,
      "gas_token_symbol": "ETH",
      "explore_url": "https://etherscan.io/",
      "contract_addr": "0x5427FEFA711Eff984124bFBB1AB6fbf5E3DA1820",
      "drop_gas_amt": "0",
      "drop_gas_cost_amt": "0",
      "drop_gas_balance_alert": "100000000000000000",
      "suggested_gas_cost": "213522",
      "flat_usd_fee": 0,
      "farming_reward_contract_addr": "0x61f85fF2a2f4289Be4bb9B72Fc7010B3142B5f41",
      "transfer_agent_contract_addr": "0x9b274BC73940d92d0Af292Bde759cbFCCE661a0b",
      "disabled": false
    },
    {
      "id": 56,
      "name": "BNB Chain",
      "icon": "https://get.celer.app/cbridge-icons/chain-icon/BNB-chain.png",
      "block_delay": 8,
      "gas_token_symbol": "BNB",
      "explore_url": "https://bscscan.com/",
      "contract_addr": "0xdd90E5E87A2081Dcf0391920868eBc2FFB81a1aF",
      "drop_gas_amt": "0",
      "drop_gas_cost_amt": "0",
      "drop_gas_balance_alert": "0",
      "suggested_gas_cost": "151000",
      "flat_usd_fee": 0,
      "farming_reward_contract_addr": "",
      "transfer_agent_contract_addr": "0x3d85B598B734a0E7c8c1b62B00E972e9265dA541",
      "disabled": false
    },
    {
      "id": 23294,
      "name": "Oasis Sapphire",
      "icon": "https://get.celer.app/cbridge-icons/chain-icon/oasis.png",
      "block_delay": 15,
      "gas_token_symbol": "ROSE",
      "explore_url": "https://explorer.oasis.io/mainnet/sapphire/",
      "contract_addr": "0x9B36f165baB9ebe611d491180418d8De4b8f3a1f",
      "drop_gas_amt": "0",
      "drop_gas_cost_amt": "0",
      "drop_gas_balance_alert": "0",
      "suggested_gas_cost": "0",
      "flat_usd_fee": 0,
      "farming_reward_contract_addr": "",
      "transfer_agent_contract_addr": "",
      "disabled": false
    },
  ],
  chain_token: {
    1: {
      token: [
        {
          "token": {
            "symbol": "USDC",
            "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
            "decimal": 6,
            "xfer_disabled": false
          },
          "name": "USD Coin",
          "icon": "https://get.celer.app/cbridge-icons/USDC.png",
          "inbound_lmt": "5000000000000",
          "inbound_epoch_cap": "10000000000000",
          "transfer_disabled": false,
          "liq_add_disabled": false,
          "liq_rm_disabled": false,
          "liq_agg_rm_src_disabled": false,
          "delay_threshold": "",
          "delay_period": 0
        },
        {
          "token": {
            "symbol": "WETH",
            "address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
            "decimal": 18,
            "xfer_disabled": false
          },
          "name": "Wrapped ETH",
          "icon": "https://get.celer.app/cbridge-icons/ETH.png",
          "inbound_lmt": "2000000000000000000000",
          "inbound_epoch_cap": "5000000000000000000000",
          "transfer_disabled": false,
          "liq_add_disabled": false,
          "liq_rm_disabled": false,
          "liq_agg_rm_src_disabled": false,
          "delay_threshold": "",
          "delay_period": 0
        },
      ]
    },
    56: {
      token: [
        {
          "token": {
            "symbol": "wROSE",
            "address": "0xF00600eBC7633462BC4F9C61eA2cE99F5AAEBd4a",
            "decimal": 18,
            "xfer_disabled": true
          },
          "name": "wROSE",
          "icon": "https://get.celer.app/cbridge-icons/ETH.png",
          "inbound_lmt": "",
          "inbound_epoch_cap": "",
          "transfer_disabled": false,
          "liq_add_disabled": false,
          "liq_rm_disabled": false,
          "liq_agg_rm_src_disabled": false,
          "delay_threshold": "",
          "delay_period": 0
        },
        {
          "token": {
            "symbol": "USDC",
            "address": "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
            "decimal": 18,
            "xfer_disabled": false
          },
          "name": "Binance-Peg USD Coin",
          "icon": "https://get.celer.app/cbridge-icons/USDC.png",
          "inbound_lmt": "5000000000000000000000000",
          "inbound_epoch_cap": "4000000000000000000000000",
          "transfer_disabled": false,
          "liq_add_disabled": false,
          "liq_rm_disabled": false,
          "liq_agg_rm_src_disabled": false,
          "delay_threshold": "",
          "delay_period": 0
        },
      ]
    },
    23294: {
      "token": [
        {
          "token": {
            "symbol": "BNB",
            "address": "0xe95E3a9f1a45B5EDa71781448F6047d7B7e31cbF",
            "decimal": 18,
            "xfer_disabled": true
          },
          "name": "Binance Coin",
          "icon": "https://get.celer.app/cbridge-icons/BNB.png",
          "inbound_lmt": "",
          "inbound_epoch_cap": "",
          "transfer_disabled": false,
          "liq_add_disabled": false,
          "liq_rm_disabled": false,
          "liq_agg_rm_src_disabled": false,
          "delay_threshold": "",
          "delay_period": 0
        },
        {
          "token": {
            "symbol": "USDC",
            "address": "0x2c2E3812742Ab2DA53a728A09F5DE670Aba584b6",
            "decimal": 6,
            "xfer_disabled": true
          },
          "name": "USD Coin",
          "icon": "https://get.celer.app/cbridge-icons/USDC.png",
          "inbound_lmt": "",
          "inbound_epoch_cap": "",
          "transfer_disabled": false,
          "liq_add_disabled": false,
          "liq_rm_disabled": false,
          "liq_agg_rm_src_disabled": true,
          "delay_threshold": "",
          "delay_period": 0
        },
        {
          "token": {
            "symbol": "USDT",
            "address": "0xE48151964556381B33f93E05E36381Fd53Ec053E",
            "decimal": 6,
            "xfer_disabled": true
          },
          "name": "Tether USD",
          "icon": "https://get.celer.app/cbridge-icons/USDT.png",
          "inbound_lmt": "",
          "inbound_epoch_cap": "",
          "transfer_disabled": false,
          "liq_add_disabled": false,
          "liq_rm_disabled": false,
          "liq_agg_rm_src_disabled": true,
          "delay_threshold": "",
          "delay_period": 0
        },
        {
          "token": {
            "symbol": "WETH",
            "address": "0xfc6b18d694F2D137dB762B152736Ba098F9808d9",
            "decimal": 18,
            "xfer_disabled": true
          },
          "name": "Wrapped Ether",
          "icon": "https://get.celer.app/cbridge-icons/WETH.png",
          "inbound_lmt": "",
          "inbound_epoch_cap": "",
          "transfer_disabled": false,
          "liq_add_disabled": false,
          "liq_rm_disabled": false,
          "liq_agg_rm_src_disabled": true,
          "delay_threshold": "",
          "delay_period": 0
        },
        {
          "token": {
            "symbol": "wROSE",
            "address": "0x8Bc2B030b299964eEfb5e1e0b36991352E56D2D3",
            "decimal": 18,
            "xfer_disabled": false
          },
          "name": "wROSE",
          "icon": "https://get.celer.app/cbridge-icons/ETH.png",
          "inbound_lmt": "",
          "inbound_epoch_cap": "",
          "transfer_disabled": false,
          "liq_add_disabled": false,
          "liq_rm_disabled": false,
          "liq_agg_rm_src_disabled": false,
          "delay_threshold": "",
          "delay_period": 0
        }
      ]
    },
  },
  pegged_pair_configs: [
    {
      "org_chain_id": 1,
      "org_token": {
        "token": {
          "symbol": "USDC",
          "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
          "decimal": 6,
          "xfer_disabled": false
        },
        "name": "USD Coin",
        "icon": "https://get.celer.app/cbridge-icons/USDC.png",
        "inbound_lmt": "",
        "inbound_epoch_cap": "",
        "transfer_disabled": false,
        "liq_add_disabled": false,
        "liq_rm_disabled": false,
        "liq_agg_rm_src_disabled": false,
        "delay_threshold": "",
        "delay_period": 0
      },
      "pegged_chain_id": 23294,
      "pegged_token": {
        "token": {
          "symbol": "USDC",
          "address": "0x2c2E3812742Ab2DA53a728A09F5DE670Aba584b6",
          "decimal": 6,
          "xfer_disabled": false
        },
        "name": "USD Coin",
        "icon": "https://get.celer.app/cbridge-icons/USDC.png",
        "inbound_lmt": "",
        "inbound_epoch_cap": "",
        "transfer_disabled": false,
        "liq_add_disabled": false,
        "liq_rm_disabled": false,
        "liq_agg_rm_src_disabled": false,
        "delay_threshold": "",
        "delay_period": 0
      },
      "pegged_deposit_contract_addr": "0xB37D31b2A74029B5951a2778F959282E2D518595",
      "pegged_burn_contract_addr": "0xEF3967C8A80f6090D509f822Cf11C2F2795BE0C8",
      "canonical_token_contract_addr": "",
      "vault_version": 0,
      "bridge_version": 2,
      "migration_peg_burn_contract_addr": ""
    }
  ]
}

/*

 BNB Smart Chain Testnet chainId ->  97
 Mumbai chainId -> 80001
 Linea sepolia chainId ->  59141 

 Oasis sapphire testnet chainId ->  23295 
 Oasis sapphire mainnet chainId ->  23294

 cBridgeBaseUrl testnet -> https://cbridge-v2-test.celer.network
 cBridgeBaseUrl mainnet -> https://cbridge-prod2.celer.app

*/

export async function poolTransfer({
  cBridgeBaseUrl,
  // fromAddress,
  receiverAddress,
  signer,
  srcChainId,
  dstChainId,
  tokenSymbol,
  amount,
  slippageTolerance,
  confirmations = 2,
}) {
  try {
    // Checking bridge
    console.log('Getting transfer configs for all chains');
    // const transferConfigs = await getTransferConfigsForAll({
    //   baseUrl: cBridgeBaseUrl,
    // });
    const transferConfigs = BRIDGE_CONFIGS;

    console.log('from address', signer.address)

    console.log("transfer config: ", transferConfigs);

    const bridgeAddress = getBridgeContractAddress({
      transferConfigs: transferConfigs,
      chainId: srcChainId,
    });

    console.log("bridge address:", bridgeAddress);

    if (!bridgeAddress)
      throw new Error("srcChainId not yet supported by cBridge");

    console.log("signer: ", signer);
    // Get Contract
    const bridgeContract = getContract(bridgeAddress, BridgeABI.abi, signer);

    // Check token
    const isPresentInSrc = !!(
      transferConfigs.chain_token[srcChainId]?.token?.filter(
        (chainToken) =>
          chainToken?.token?.symbol.toUpperCase() == tokenSymbol.toUpperCase()
      ).length > 0
    );

    console.log(
      "scr token supported: ",
      transferConfigs.chain_token[srcChainId]?.token
    );

    console.log("isPresentInSrc: ", isPresentInSrc);

    const isPresentInDst = !!(
      transferConfigs.chain_token[dstChainId]?.token?.filter(
        (chainToken) =>
          chainToken?.token?.symbol.toUpperCase() == tokenSymbol.toUpperCase()
      ).length > 0
    );

    console.log(
      "dst token supported: ",
      transferConfigs.chain_token[dstChainId]?.token
    );

    console.log("isPresentInDst: ", isPresentInDst);

    if (!(isPresentInSrc && isPresentInDst)) {
      throw new Error(
        "Please choose valid tokenSymbol that is supported by given pair of chains"
      );
    }

    // Prepare transfer

    const { transferToken, value, toChain, nonce, fromChain } =
      getTransferObject(
        transferConfigs,
        srcChainId,
        dstChainId,
        tokenSymbol,
        amount
      );

    console.log("checking allowance of tokens... ");
    console.log('transferObject: ', { transferToken, value, toChain, nonce, fromChain });

    const allowance = await getAllowance(
      signer.address,
      bridgeAddress || "",
      transferToken?.token?.address || "",
      fromChain?.id,
      transferToken?.token?.symbol,
      signer,
      transferConfigs.pegged_pair_configs
    );

    console.log("allowance: ", allowance);

    let needToApprove = false;

    const isNative =
      transferConfigs.chains.filter(
        (chain) =>
          chain.id == srcChainId &&
          chain.gas_token_symbol.toUpperCase() == tokenSymbol.toUpperCase()
      ).length > 0;

    needToApprove = checkApprove(
      allowance,
      amount,
      transferToken?.token,
      isNative
    );

    console.log("needToApprove: ", needToApprove);

    if (needToApprove) {
      console.log("Approving the tokens");

      const approveTx = await approve(
        bridgeAddress || "",
        signer,
        transferToken?.token,
        amount
      );
      if (!approveTx) {
        throw new Error(`Cannot approve the token`);
      } else {
        needToApprove = false;
      }
      console.log("approveTx hash: " + approveTx.hash);
      // console.log("Waiting for the confirmations of approveTx");
      // const confirmationReceipt = await approveTx.wait(confirmations);

      // console.log(
      //   `approveTx confirmed upto ${confirmationReceipt.confirmations} confirmations`
      // );
    }

    console.log('getting transferId...');

    console.log({
      fromAddress: signer.address,
      receiverAddress,
      transferToken: transferToken?.token?.address,
      value,
      toChain: toChain?.id,
      nonce,
      fromChain: fromChain?.id,
    })

    const transferId = getTransferId(
      signer.address,
      receiverAddress,
      transferToken?.token?.address,
      value,
      toChain?.id,
      nonce,
      fromChain?.id
    );

    console.log("TransferId:", transferId);

    // Estimation

    // const estimateRequest = {
    //   baseUrl: cBridgeBaseUrl,
    //   srcChainId: srcChainId,
    //   dstChainId: dstChainId,
    //   tokenSymbol: tokenSymbol,
    //   walletAddress: receiverAddress,
    //   slippageTolerance: slippageTolerance,
    //   amount: amount,
    // };

    // Initiate tx
    console.log("bridge: ", bridgeContract);

    const poolTransferTx = await poolBasedTransfer({
      bridge: bridgeContract,
      addr: receiverAddress,
      //   estimateRequest: estimateRequest,
      transferObject: {
        transferToken,
        fromChain,
        toChain,
        value,
        nonce,
      },
      signer: signer,
      isNative: isNative,
    });

    console.log("poolTx: ", poolTransferTx);
    console.log("Waiting for the confirmations of poolTransferTx");

    // const confirmationReceipt = await poolTransferTx.wait(confirmations);

    // console.log(
    //   `poolTransferTx confirmed upto ${confirmationReceipt.confirmations} confirmations`
    // );

    console.log(
      "getTransferStatus for this transaction until the transfer is complete or needs a refund"
    );

    console.log('transferId: ', transferId);

    // const statusResult = await statusTracker({
    //   baseUrl: cBridgeBaseUrl,
    //   transferId: transferId,
    // });

    // console.log("Transfer successful:", statusResult);

    // return {
    //   success: true,
    //   transactionId: transferId,
    // };

    return {
      amount: amount,
      token: transferToken?.token,
      transactionId: transferId,
    }
  } catch (e) {
    console.error("TRANSFER_FAILED: ", e);
    return {
      success: false,
    };
  }
}
