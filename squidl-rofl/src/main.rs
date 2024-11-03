use oasis_runtime_sdk::{crypto::signature::secp256k1::PublicKey, modules::rofl::app::prelude::*, types::address::SignatureAddressSpec};
use serde_json::Value;
use hex;
use chrono::DateTime;
use std::sync::Arc;

/// Address where the StealthSigner contract is deployed.
// #region stealth-signer-contract-address
const STEALTH_SIGNER_CONTRACT_ADDRESS: &str = "0xab536CF0Ad6Ead7B1a69f572d50fDaAb8E9dB98F"; // TODO: Replace with your contract address.
// #endregion stealth-signer-contract-address

struct StealthAnnouncer;

#[async_trait]
impl App for StealthAnnouncer {
    /// Application version.
    const VERSION: Version = sdk::version_from_cargo!();

    /// Identifier of the application (used for registrations).
    // #region app-id
    fn id() -> AppId {
        "rofl1qqn9xndja7e2pnxhttktmecvwzz0yqwxsquqyxdf".into() // TODO: Replace with your application ID.
    }
    // #endregion app-id

    /// Return the consensus layer trust root for this runtime; if `None`, consensus layer integrity
    /// verification will not be performed (e.g. Localnet).
    // #region consensus-trust-root
    fn consensus_trust_root() -> Option<TrustRoot> {
        // The trust root below is for Sapphire Testnet at consensus height 22110615.
        // Some(TrustRoot {
        //     height: 22110615,
        //     hash: "95d1501f9cb88619050a5b422270929164ce739c5d803ed9500285b3b040985e".into(),
        //     runtime_id: "000000000000000000000000000000000000000000000000a6d1e3ebf60dff6c".into(),
        //     chain_context: "0b91b8e4e44b2003a7c5e23ddadb5e14ef5345c0ebcb3ddcae07fa2f244cab76"
        //         .to_string(),
        // })

        None
    }
    // #endregion consensus-trust-root

    /// Application startup logic.
    async fn run(self: Arc<Self>, _env: Environment<Self>) {
        println!("Squidl Stealth Address Announcer ROFL App started!");
    }

    /// Called for each runtime block.
    async fn on_runtime_block(self: Arc<Self>, env: Environment<Self>, _round: u64) {
        if let Err(err) = self.run_oracle(env).await {
            println!("Failed to submit stealth address announcements: {:?}", err);
        }
    }
}

impl StealthAnnouncer {
    /// Fetch recent stealth addresses and announce them on-chain.
    async fn run_oracle(self: Arc<Self>, env: Environment<Self>) -> Result<()> {
        // Fetch recent stealth addresses from Squidl API.
        let stealth_addresses = tokio::task::spawn_blocking(move || -> Result<Value> {
            let rsp: Value = rofl_utils::https::agent()
                .get("https://api.squidl.me/stealth-address/recent")
                .call()?
                .body_mut()
                .read_json()?;
            Ok(rsp)
        })
        .await??;

        if let Value::Array(entries) = stealth_addresses {
            for entry in entries {
                // Extract fields from entry.
                let is_transacted = entry.get("isTransacted")
                    .and_then(Value::as_bool)
                    .ok_or(anyhow::anyhow!("isTransacted field is missing or invalid"))?;

                if !is_transacted {
                    println!("Entry is not transacted, skipping.");
                    continue;
                }

                let ephemeral_pub = entry.get("ephemeralPub")
                    .and_then(Value::as_str)
                    .ok_or(anyhow::anyhow!("ephemeralPub field is missing or invalid"))?;

                let view_hint = entry.get("viewHint")
                    .and_then(Value::as_str)
                    .ok_or(anyhow::anyhow!("viewHint field is missing or invalid"))?;

                let created_at_str = entry.get("createdAt")
                    .and_then(Value::as_str)
                    .ok_or(anyhow::anyhow!("createdAt field is missing or invalid"))?;

                // Check if the ephemeral public key has already been used.
                let is_used = self.check_ephemeral_pub_used(env.clone(), ephemeral_pub).await?;
                if is_used {
                    println!("Ephemeral public key already used, skipping.");
                    continue;
                }

                // Parse 'createdAt' to get 'k'.
                let created_at = DateTime::parse_from_rfc3339(created_at_str)?;
                let k = created_at.timestamp() as u32;

                // Prepare the contract call to the 'announce' function.
                let function_signature = ethabi::short_signature(
                    "announce",
                    &[
                        ethabi::ParamType::Uint(32),
                        ethabi::ParamType::Bytes,
                        ethabi::ParamType::FixedBytes(1),
                    ],
                )
                .to_vec();

                // Convert hex strings to bytes.
                let ephemeral_pub_bytes = hex::decode(ephemeral_pub.trim_start_matches("0x"))?;
                let view_hint_bytes = hex::decode(view_hint.trim_start_matches("0x"))?;

                // Ensure 'viewHint' is exactly 1 byte.
                if view_hint_bytes.len() != 1 {
                    return Err(anyhow::anyhow!("viewHint must be exactly 1 byte"));
                }

                // Encode the function call with parameters.
                let encoded_params = ethabi::encode(&[
                    ethabi::Token::Uint(k.into()),
                    ethabi::Token::Bytes(ephemeral_pub_bytes),
                    ethabi::Token::FixedBytes(view_hint_bytes),
                ]);

                let data = [function_signature, encoded_params].concat();

                // Create and submit the transaction.
                let mut tx = self.new_transaction(
                    "evm.Call",
                    module_evm::types::Call {
                        address: STEALTH_SIGNER_CONTRACT_ADDRESS.parse().unwrap(),
                        value: 0.into(),
                        data,
                    },
                );
                tx.set_fee_gas(200_000);

                // Submit the transaction on-chain.
                env.client().sign_and_submit_tx(env.signer(), tx).await?;
            }
        } else {
            return Err(anyhow::anyhow!("Expected an array of entries"));
        }

        Ok(())
    }

    /// Check if an ephemeral public key has already been used by calling `checkAnnounce`.
    async fn check_ephemeral_pub_used(
        &self,
        env: Environment<Self>,
        ephemeral_pub: &str,
    ) -> Result<bool> {
        // Convert the public key for EVM caller derivation
        let sdk_pub_key = PublicKey::from_bytes(env.signer().public_key().as_bytes())?;
        
        // Prepare the function call data
        let ephemeral_pub_bytes = hex::decode(ephemeral_pub.trim_start_matches("0x"))?;
        let data = [
            ethabi::short_signature("checkAnnounce", &[ethabi::ParamType::Bytes]).to_vec(),
            ethabi::encode(&[ethabi::Token::Bytes(ephemeral_pub_bytes)]),
        ].concat();

        let result = env.client().query::<_, module_evm::types::SimulateCallQuery>(
            0_u64,
            "evm.SimulateCall",
            module_evm::types::SimulateCallQuery {
                gas_price: 10.into(),
                gas_limit: 100_000,
                caller: module_evm::derive_caller::from_sigspec(&SignatureAddressSpec::Secp256k1Eth(sdk_pub_key)).unwrap(),
                address: Some(STEALTH_SIGNER_CONTRACT_ADDRESS.parse().unwrap()),
                value: 0.into(),
                data,
            },
        ).await?;

        // Decode the returned data
        let decoded_output = ethabi::decode(&[ethabi::ParamType::Bool], &result.data)?;

        if let Some(ethabi::Token::Bool(is_used)) = decoded_output.get(0) {
            Ok(*is_used)
        } else {
            Err(anyhow::anyhow!("Invalid output from checkAnnounce"))
        }
    }
}

fn main() {
    StealthAnnouncer.start();
}
