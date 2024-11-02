use oasis_runtime_sdk::modules::rofl::app::prelude::*;
use serde::Deserialize;
use hex;
use ethabi;

/// Address where the StealthSigner contract is deployed.
// #region stealth-signer-contract-address
const STEALTH_SIGNER_CONTRACT_ADDRESS: &str = "..."; // StealthSigner contract address
// #endregion stealth-signer-contract-address

/// Structure representing a stealth address entry from the API.
#[derive(Deserialize)]
struct StealthAddressEntry {
    k: u32,
    ephemeralPublicKey: String,
    viewHint: String,
}

struct StealthAnnouncer;

#[async_trait]
impl App for StealthAnnouncer {
    /// Application version.
    const VERSION: Version = sdk::version_from_cargo!();

    /// Identifier of the application (used for registrations).
    // #region app-id
    fn id() -> AppId {
        "".into() // TODO: Replace with your application ID.
    }
    // #endregion app-id

    /// Return the consensus layer trust root for this runtime; if None, consensus layer integrity
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
        None;
    }
    // #endregion consensus-trust-root

    /// Application startup logic.
    async fn run(self: Arc<Self>, _env: Environment<Self>) {
        // We are running now!
        println!("Squidl Stealth Address Backup ROFL App started!");
    }

    /// Called for each runtime block.
    async fn on_runtime_block(self: Arc<Self>, env: Environment<Self>, _round: u64) {
        // This gets called for each runtime block. It will not be called again until the previous
        // invocation returns and if invocation takes multiple blocks to run, those blocks will be
        // skipped.
        if let Err(err) = self.run_oracle(env).await {
            println!("Failed to submit stealth address announcements: {:?}", err);
        }
    }
}

impl StealthAnnouncer {
    /// Fetch recent stealth addresses and announce them on-chain.
    async fn run_oracle(self: Arc<Self>, env: Environment<Self>) -> Result<()> {
        // Fetch recent stealth addresses from Squidl API.
        let stealth_addresses = tokio::task::spawn_blocking(move || -> Result<Vec<StealthAddressEntry>> {
            // Make a GET request to the Squidl API.
            let rsp: Vec<StealthAddressEntry> = rofl_utils::https::agent()
                .get("https://api.squidl.me/stealth-address/recent")
                .call()?
                .body_mut()
                .read_json()?;
            Ok(rsp)
        })
        .await??;

        // For each stealth address entry, announce it on-chain.
        for entry in stealth_addresses {
            // Check if the ephemeral public key has already been used.
            let is_used = self.check_ephemeral_pub_used(env.clone(), &entry).await?;
            if is_used {
                println!("Ephemeral public key already used, skipping.");
                continue;
            }

            // Prepare the contract call to the 'announce' function.
            let mut tx = self.new_transaction(
                "evm.Call",
                module_evm::types::Call {
                    address: STEALTH_SIGNER_CONTRACT_ADDRESS.parse().unwrap(),
                    value: 0.into(),
                    data: {
                        // ABI encode the 'announce' function call.
                        let function = ethabi::Function {
                            name: "announce".to_owned(),
                            inputs: vec![
                                ethabi::Param {
                                    name: "k".to_owned(),
                                    kind: ethabi::ParamType::Uint(32),
                                    internal_type: None,
                                },
                                ethabi::Param {
                                    name: "ephemeralPub".to_owned(),
                                    kind: ethabi::ParamType::Bytes,
                                    internal_type: None,
                                },
                                ethabi::Param {
                                    name: "viewHint".to_owned(),
                                    kind: ethabi::ParamType::FixedBytes(1),
                                    internal_type: None,
                                },
                            ],
                            outputs: vec![],
                            constant: None,
                            state_mutability: ethabi::StateMutability::NonPayable,
                        };

                        // Convert hex strings to bytes.
                        let ephemeral_pub_bytes = hex::decode(entry.ephemeralPublicKey.trim_start_matches("0x"))?;
                        let view_hint_bytes = hex::decode(entry.viewHint.trim_start_matches("0x"))?;

                        // Ensure view_hint_bytes is exactly 1 byte.
                        let view_hint_bytes = if view_hint_bytes.len() == 1 {
                            view_hint_bytes
                        } else {
                            return Err(anyhow::anyhow!("viewHint must be exactly 1 byte"));
                        };

                        // Encode the function call with parameters.
                        function.encode_input(&[
                            ethabi::Token::Uint(entry.k.into()),
                            ethabi::Token::Bytes(ephemeral_pub_bytes),
                            ethabi::Token::FixedBytes(view_hint_bytes),
                        ])?
                    },
                },
            );
            tx.set_fee_gas(200_000);

            // Submit the transaction to announce the stealth address.
            env.client().sign_and_submit_tx(env.signer(), tx).await?;
        }

        Ok(())
    }

    /// Check if an ephemeral public key has already been used by calling `checkAnnounce`.
    async fn check_ephemeral_pub_used(
        &self,
        env: Arc<Environment<Self>>,
        entry: &StealthAddressEntry,
    ) -> Result<bool> {
        // Prepare the contract call to the 'checkAnnounce' function.
        let data = {
            // ABI encode the 'checkAnnounce' function call.
            let function = ethabi::Function {
                name: "checkAnnounce".to_owned(),
                inputs: vec![
                    ethabi::Param {
                        name: "ephemeralPub".to_owned(),
                        kind: ethabi::ParamType::Bytes,
                        internal_type: None,
                    },
                ],
                outputs: vec![
                    ethabi::Param {
                        name: "",
                        kind: ethabi::ParamType::Bool,
                        internal_type: None,
                    },
                ],
                constant: Some(true),
                state_mutability: ethabi::StateMutability::View,
            };

            // Convert hex string to bytes.
            let ephemeral_pub_bytes = hex::decode(entry.ephemeralPublicKey.trim_start_matches("0x"))?;

            // Encode the function call with parameters.
            function.encode_input(&[ethabi::Token::Bytes(ephemeral_pub_bytes)])?
        };

        // Call the contract function.
        let result = env
            .client()
            .call(
                env.signer(),
                module_evm::types::SimulateCall {
                    address: STEALTH_SIGNER_CONTRACT_ADDRESS.parse().unwrap(),
                    data,
                    value: 0.into(),
                },
            )
            .await?;

        // Decode the returned data.
        let function = ethabi::Function {
            name: "checkAnnounce".to_owned(),
            inputs: vec![],
            outputs: vec![
                ethabi::Param {
                    name: "",
                    kind: ethabi::ParamType::Bool,
                    internal_type: None,
                },
            ],
            constant: Some(true),
            state_mutability: ethabi::StateMutability::View,
        };

        let decoded_output = function.decode_output(&result.data)?;

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
