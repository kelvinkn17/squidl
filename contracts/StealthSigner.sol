// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

// Uncomment this line to use console.log
import "hardhat/console.sol";

import {Sapphire} from "@oasisprotocol/sapphire-contracts/contracts/Sapphire.sol";
import {EthereumUtils} from "@oasisprotocol/sapphire-contracts/contracts/EthereumUtils.sol";
import {Secp256k1} from "./Secp256k1.sol";
import {EIP155Signer} from "@oasisprotocol/sapphire-contracts/contracts/EIP155Signer.sol";
import {Subcall} from "@oasisprotocol/sapphire-contracts/contracts/Subcall.sol";

import {Enclave, autoswitch, Result} from "@oasisprotocol/sapphire-contracts/contracts/OPL.sol";

interface RemoteContract {
    function example(uint256 test) external;
}

struct SignatureRSV {
    bytes32 r;
    bytes32 s;
    uint256 v;
}

contract StealthSigner is Enclave {
    // contract StealthSigner {
    bytes32 public constant EIP712_DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );
    string public constant SIGNIN_TYPE = "SignIn(address user,uint32 time)";
    bytes32 public constant SIGNIN_TYPEHASH = keccak256(bytes(SIGNIN_TYPE));
    bytes32 public immutable DOMAIN_SEPARATOR;

    bytes21 public roflAppID;

    struct UserKeyPair {
        bytes pub;
        bytes32 key;
    }

    // One viewingPairs per metaAddress
    mapping(string => UserKeyPair) private viewingPairs;

    // One spendPair per user address
    mapping(address => UserKeyPair) private spendPairs;

    // Store the owner of the metaAddresses privately
    mapping(string => address) private owners;

    // Store the metaAddresses of the user privately
    mapping(address => string[]) private metaAddresses;

    // address public scanner;

    constructor(
        address otherEnd,
        bytes21 _roflAppID
    ) payable Enclave(otherEnd, autoswitch("bsc")) {
        // scanner = _scanner;

        // Test Vectors
        // viewingKey = 0x0000000000000000000000000000000000000000000000000000000000000002;
        // viewingPub = derivePubKey(bytes.concat(viewingKey));
        // // (viewingPubX, viewingPubY) = EthereumUtils.k256Decompress(viewingPub);
        // spendKey = 0x0000000000000000000000000000000000000000000000000000000000000003;
        // spendPub = derivePubKey(bytes.concat(spendKey));
        // // (spendPubX, spendPubY) = EthereumUtils.k256Decompress(spendPub);

        registerEndpoint("register", _register);

        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                EIP712_DOMAIN_TYPEHASH,
                keccak256("SignInExample.SignIn"),
                keccak256("1"),
                block.chainid,
                address(this)
            )
        );

        (bytes memory viewingPub, bytes32 viewingKey) = generateKeypair();
        (bytes memory spendPub, bytes32 spendKey) = generateKeypair();

        string memory metaAddress = string(
            abi.encodePacked(
                "st:eth:0x",
                bytesToHex(spendPub),
                bytesToHex(viewingPub)
            )
        );
        viewingPairs[metaAddress] = UserKeyPair(viewingPub, viewingKey);
        spendPairs[msg.sender] = UserKeyPair(spendPub, spendKey);
        owners[metaAddress] = msg.sender;
        metaAddresses[msg.sender].push(metaAddress);

        roflAppID = _roflAppID;
    }

    struct SignIn {
        address user;
        uint32 time;
        SignatureRSV rsv;
    }

    struct MetaAddress {
        bytes spendPub;
        bytes viewingPub;
    }

    modifier authenticated(SignIn calldata auth) {
        // Must be signed within 24 hours ago.
        require(auth.time > (block.timestamp - (60 * 60 * 24)));

        // Validate EIP-712 sign-in authentication.
        bytes32 authdataDigest = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(abi.encode(SIGNIN_TYPEHASH, auth.user, auth.time))
            )
        );

        address recovered_address = ecrecover(
            authdataDigest,
            uint8(auth.rsv.v),
            auth.rsv.r,
            auth.rsv.s
        );

        require(auth.user == recovered_address, "Invalid Sign-In");

        _;
    }

    function _register(bytes calldata _args) internal returns (Result) {
        (SignIn memory auth, bytes32 node) = abi.decode(
            _args,
            (SignIn, bytes32)
        );

        string memory metaAddress;
        (bytes memory viewingPub, bytes32 viewingKey) = generateKeypair();
        UserKeyPair memory spendKeyPair = spendPairs[auth.user];

        // Only one spending key per user
        if (spendKeyPair.key != 0) {
            metaAddress = string(
                abi.encodePacked(
                    "st:eth:0x",
                    bytesToHex(spendKeyPair.pub),
                    bytesToHex(viewingPub)
                )
            );
            viewingPairs[metaAddress] = UserKeyPair(viewingPub, viewingKey);

            postMessage(
                "registerCallback",
                abi.encode(node, MetaAddress(spendKeyPair.pub, viewingPub))
            );
        } else {
            (bytes memory spendPub, bytes32 spendKey) = generateKeypair();
            metaAddress = string(
                abi.encodePacked(
                    "st:eth:0x",
                    bytesToHex(spendPub),
                    bytesToHex(viewingPub)
                )
            );
            viewingPairs[metaAddress] = UserKeyPair(viewingPub, viewingKey);
            spendPairs[auth.user] = UserKeyPair(spendPub, spendKey);

            postMessage(
                "registerCallback",
                abi.encode(node, MetaAddress(spendPub, viewingPub))
            );
        }

        owners[metaAddress] = auth.user;
        metaAddresses[auth.user].push(metaAddress);

        return Result.Success;
    }

    function register(SignIn calldata auth) public authenticated(auth) {
        string memory metaAddress;
        (bytes memory viewingPub, bytes32 viewingKey) = generateKeypair();
        UserKeyPair memory spendKeyPair = spendPairs[auth.user];

        // Only one spending key per user
        if (spendKeyPair.key != 0) {
            metaAddress = string(
                abi.encodePacked(
                    "st:eth:0x",
                    bytesToHex(spendKeyPair.pub),
                    bytesToHex(viewingPub)
                )
            );
            viewingPairs[metaAddress] = UserKeyPair(viewingPub, viewingKey);
        } else {
            (bytes memory spendPub, bytes32 spendKey) = generateKeypair();
            metaAddress = string(
                abi.encodePacked(
                    "st:eth:0x",
                    bytesToHex(spendPub),
                    bytesToHex(viewingPub)
                )
            );
            viewingPairs[metaAddress] = UserKeyPair(viewingPub, viewingKey);
            spendPairs[auth.user] = UserKeyPair(spendPub, spendKey);
        }

        owners[metaAddress] = auth.user;
        metaAddresses[auth.user].push(metaAddress);
    }

    function getMetaAddress(
        SignIn calldata auth,
        uint256 index
    )
        public
        view
        authenticated(auth)
        returns (
            string memory metaAddress,
            bytes memory spendPub,
            bytes memory viewingPub
        )
    {
        metaAddress = metaAddresses[auth.user][index];

        UserKeyPair memory viewingPair = viewingPairs[metaAddress];
        require(viewingPair.key != 0, "metaAddress not registered yet");
        viewingPub = viewingPair.pub;

        UserKeyPair memory spendPair = spendPairs[auth.user];
        require(spendPair.key != 0, "metaAddress not registered yet");
        spendPub = spendPair.pub;

        // // TODO: Let Bm = Bspend + hash(bscan || m)·G where m is an incrementable integer starting from 1
        // metaAddress = string(abi.encodePacked("st:eth:0x", bytesToHex(spendPub), bytesToHex(viewingPub)));
    }

    function generateStealthAddress(
        string calldata metaAddress,
        uint32 k
    )
        public
        view
        returns (
            address stealthAddress,
            bytes memory ephemeralPub,
            bytes1 viewHint
        )
    {
        UserKeyPair memory viewingPair = viewingPairs[metaAddress];
        require(viewingPair.key != 0, "metaAddress not registered yet");
        bytes memory viewingPub = viewingPair.pub;

        UserKeyPair memory spendPair = spendPairs[owners[metaAddress]];
        require(spendPair.key != 0, "metaAddress not registered yet");
        bytes memory spendPub = spendPair.pub;

        // Generate a random 32-byte entropy ephemeral private key .
        // For each private key ai, check that the private key produces a point with an even Y coordinate and negate the private key if not
        bytes32 ephemeralKey;
        (ephemeralPub, ephemeralKey) = generateKeypair();

        // Test Vectors
        // ephemeralKey = 0xd952fe0740d9d14011fc8ead3ab7de3c739d3aa93ce9254c10b0134d80d26a30;
        // ephemeralPub = derivePubKey(bytes.concat(ephemeralKey));

        // (uint256 viewingPubX, uint256 viewingPubY) = Secp256k1.deriveXY(viewingPub);
        (uint256 viewingPubX, uint256 viewingPubY) = EthereumUtils
            .k256Decompress(viewingPub);
        console.log("viewingPubX", viewingPubX, "viewingPubY", viewingPubY);

        // A shared secret is computed as p-ephemeral·P-view
        // Let ecdh_shared_secret = a·Bscan
        (uint256 sX, uint256 sY) = Secp256k1.ecMul(
            uint256(ephemeralKey),
            viewingPubX,
            viewingPubY
        );

        // Let k = 0
        // uint32 k = 0;

        // The shared secret is hashed.
        // Let tk = hash/SharedSecret(serP(ecdh_shared_secret) || ser32(k))
        bytes32 sKey = keccak256(abi.encodePacked(bytes32(sX), bytes32(sY), k));

        // If tk is not valid tweak, i.e., if tk = 0 or tk is larger or equal to the secp256k1 group order, fail
        require(uint256(sKey) < Secp256k1.NN, "tweak is too large");

        // The view tag is extracted by taking the most significant byte of the shared secret.
        viewHint = sKey[0];

        // Multiply the hashed shared secret with the generator point, and add it to P-spend.
        // Let Pmn = Bm + tk·G
        bytes memory sPub = derivePubKey(bytes.concat(sKey));
        // (uint256 sPubX, uint256 sPubY) = sPubYSecp256k1.deriveXY(sPub);
        (uint256 sPubX, uint256 sPubY) = EthereumUtils.k256Decompress(sPub);
        (uint256 spendPubX, uint256 spendPubY) = EthereumUtils.k256Decompress(
            spendPub
        );
        (uint256 stealthPubX, uint256 stealthPubY) = Secp256k1.ecAdd(
            spendPubX,
            spendPubY,
            sPubX,
            sPubY
        );

        // Encode Pk or Pmn as an Ethereum address
        // stealthAddress = EthereumUtils.toEthereumAddress(stealthPubX, stealthPubY);
        stealthAddress = address(
            uint160(
                uint256(keccak256(abi.encodePacked(stealthPubX, stealthPubY)))
            )
        );
    }

    function checkStealthAddress(
        string calldata metaAddress,
        uint32 k,
        bytes calldata ephemeralPub,
        bytes1 viewHint
    ) public view returns (address stealthAddress) {
        UserKeyPair memory viewingPair = viewingPairs[metaAddress];
        bytes32 viewingKey = viewingPair.key;
        require(viewingKey != 0, "metaAddress not registered yet");

        UserKeyPair memory spendPair = spendPairs[owners[metaAddress]];
        require(spendPair.key != 0, "metaAddress not registered yet");
        bytes memory spendPub = spendPair.pub;

        // TODO: only allow the scanner to call this function
        // require(msg.sender == scanner, "only the scanner can call this function");

        // Let A = A1 + A2 + ... + An, where each Ai is the public key of an ephemeral key pair.
        (uint256 ephemeralPubX, uint256 ephemeralPubY) = EthereumUtils
            .k256Decompress(ephemeralPub);

        // Shared secret is computed by multiplying the viewing private key with the ephemeral public key of the announcement
        // Bob detects this payment by calculating P0 = Bspend + hash(input_hash·bscan·A || 0)·G with his online device
        // Let ecdh_shared_secret = bscan·A
        (uint256 sX, uint256 sY) = Secp256k1.ecMul(
            uint256(viewingKey),
            ephemeralPubX,
            ephemeralPubY
        );

        // Let k = 0
        // uint32 k = 0;

        // Let tk = hash/SharedSecret(serP(ecdh_shared_secret) || ser32(k))
        bytes32 sKey = keccak256(abi.encodePacked(bytes32(sX), bytes32(sY), k));

        // If tk is not valid tweak, i.e., if tk = 0 or tk is larger or equal to the secp256k1 group order, fail
        require(uint256(sKey) < Secp256k1.NN, "tweak is too large");

        // The view tag is extracted by taking the most significant byte and can be compared to the given view tag.
        // If the view tags do not match, this Announcement is not for the user and the remaining steps can be skipped. If the view tags match, continue on.
        require(sKey[0] == viewHint, "view tag mismatch");

        // Multiply the hashed shared secret with the generator point, and add it to P-spend.
        // Compute Pk = Bspend + tk·G
        // Let Pmn = Bm + tk·G
        bytes memory sPub = derivePubKey(bytes.concat(sKey));
        // (uint256 sPubX, uint256 sPubY) = sPubYSecp256k1.deriveXY(sPub);
        (uint256 sPubX, uint256 sPubY) = EthereumUtils.k256Decompress(sPub);
        (uint256 spendPubX, uint256 spendPubY) = EthereumUtils.k256Decompress(
            spendPub
        );
        (uint256 stealthPubX, uint256 stealthPubY) = Secp256k1.ecAdd(
            spendPubX,
            spendPubY,
            sPubX,
            sPubY
        );

        // Encode Pk or Pmn as an Ethereum address
        // stealthAddress = EthereumUtils.toEthereumAddress(stealthPubX, stealthPubY);
        stealthAddress = address(
            uint160(
                uint256(keccak256(abi.encodePacked(stealthPubX, stealthPubY)))
            )
        );
    }

    function _computeStealthKey(
        string calldata metaAddress,
        uint32 k,
        bytes calldata ephemeralPub
    ) internal view returns (bytes32 stealthKey, address stealthAddress) {
        UserKeyPair memory viewingPair = viewingPairs[metaAddress];
        bytes32 viewingKey = viewingPair.key;
        require(viewingKey != 0, "metaAddress not registered yet");

        UserKeyPair memory spendPair = spendPairs[owners[metaAddress]];
        bytes32 spendKey = spendPair.key;
        require(spendKey != 0, "metaAddress not registered yet");

        // Let A = A1 + A2 + ... + An, where each Ai is the public key of an ephemeral key pair.
        (uint256 ephemeralPubX, uint256 ephemeralPubY) = EthereumUtils
            .k256Decompress(ephemeralPub);

        // Shared secret is computed by multiplying the viewing private key with the ephemeral public key of the announcement
        // Q = secp256k1.multiply(S, p_scan)
        (uint256 sX, uint256 sY) = Secp256k1.ecMul(
            uint256(viewingKey),
            ephemeralPubX,
            ephemeralPubY
        );

        // Let k = 0
        // uint32 k = 0;

        // Let tk = hash/SharedSecret(serP(ecdh_shared_secret) || ser32(k))
        // Q_hex = sha3.keccak_256(Q[0].to_bytes(32, "big")+Q[1].to_bytes(32, "big")).hexdigest()
        bytes32 sKey = keccak256(abi.encodePacked(bytes32(sX), bytes32(sY), k));

        // Bob can spend from his cold storage signing device using (bspend + hash(bscan·A || 0)) mod n as the private key.
        // Let d = (bspend + tk + hash/Label(ser256(bscan) || ser32(m))) mod n, where hash/Label(ser256(bscan) || ser32(m)) is the optional label
        stealthKey = bytes32(
            addmod(uint256(spendKey), uint256(sKey), Secp256k1.NN)
        );

        bytes memory stealthPub = derivePubKey(bytes.concat(stealthKey));
        stealthAddress = EthereumUtils.k256PubkeyToEthereumAddress(stealthPub);
    }

    function computeStealthKey(
        SignIn calldata auth,
        string calldata metaAddress,
        uint32 k,
        bytes calldata ephemeralPub
    )
        public
        view
        authenticated(auth)
        returns (bytes32 stealthKey, address stealthAddress)
    {
        // Require EIP712 signed session
        require(owners[metaAddress] == auth.user, "Unauthorized user");

        return _computeStealthKey(metaAddress, k, ephemeralPub);
    }

    function createTransaction(
        SignIn calldata auth,
        string calldata metaAddress,
        uint32 k,
        bytes calldata ephemeralPub,
        uint64 nonce,
        uint256 gasPrice,
        uint chainId
    ) public view authenticated(auth) returns (bytes memory) {
        // Require EIP712 signed session
        require(owners[metaAddress] == auth.user, "Unauthorized user");

        EIP155Signer.EthTx memory unsignedTx = EIP155Signer.EthTx({
            nonce: nonce,
            gasPrice: gasPrice,
            gasLimit: 1000000,
            // to: remoteContract, // address of RemoteContract
            to: address(this),
            value: 0,
            data: abi.encodeCall(
                // RemoteContract.example,
                this.calledByOurselves,
                (gasPrice)
            ),
            chainId: chainId == 0x0 ? block.chainid : chainId
        });

        (bytes32 stealthKey, address stealthAddress) = _computeStealthKey(
            metaAddress,
            k,
            ephemeralPub
        );

        return EIP155Signer.sign(stealthAddress, stealthKey, unsignedTx);
    }

    event TestEvent(uint example);

    function calledByOurselves(uint256 example) public {
        // require(msg.sender == address(this), "only self");
        emit TestEvent(example);
    }

    function bytesToHex(
        bytes memory buffer
    ) internal pure returns (string memory) {
        // Fixed buffer size for hexadecimal convertion
        bytes memory converted = new bytes(buffer.length * 2);

        bytes memory _base = "0123456789abcdef";

        for (uint256 i = 0; i < buffer.length; i++) {
            converted[i * 2] = _base[uint8(buffer[i]) / _base.length];
            converted[i * 2 + 1] = _base[uint8(buffer[i]) % _base.length];
        }

        return string(converted);
    }

    /**
     * @notice Generate an  SEC P256 k1 keypair (compressed)
     * @param privKey SEC P256 k1 private key.
     * @return pubKey SEC P256 k1 public key.
     */
    function derivePubKey(
        bytes memory privKey
    ) internal view returns (bytes memory pubKey) {
        (pubKey, ) = Sapphire.generateSigningKeyPair(
            Sapphire.SigningAlg.Secp256k1PrehashedKeccak256,
            privKey
        );
    }

    /**
     * @notice Generate an  SEC P256 k1 keypair and
     * corresponding public address.
     * @return pubKey SEC P256 k1 pubkey.
     * @return secretKey Secret key used for signing.
     */
    function generateKeypair()
        internal
        view
        returns (bytes memory pubKey, bytes32 secretKey)
    {
        bytes memory randSeed = Sapphire.randomBytes(32, "");
        secretKey = bytes32(randSeed);
        (pubKey, ) = Sapphire.generateSigningKeyPair(
            Sapphire.SigningAlg.Secp256k1PrehashedKeccak256,
            randSeed
        );

        // Optional: Optimize for even public keys only (allowing for 32-bytes view and spend keys)
        uint8 prefix = uint8(pubKey[0]);
        if (prefix == 0x03) {
            // Negate the private key
            randSeed = abi.encodePacked(Secp256k1.NN - uint256(secretKey));
            secretKey = bytes32(randSeed);

            // Update the public key to 0x02 prefix
            bytes32 pubX;
            assembly {
                pubX := mload(add(pubKey, 33))
            }
            pubKey = abi.encodePacked(uint8(0x02), pubX);
        }
    }

    // Mapping to track if an ephemeral public key has been used
    mapping(bytes32 => bool) private usedEphemeralPub;

    // Event to log announcements for backup purposes
    // Intended for ROFL (TEE-based worker) use to periodically call this function
    event Announce(
        uint32 indexed k,
        bytes32 indexed ephemeralPubHash,
        bytes1 viewHint,
        uint256 timestamp
    );

    // Announce function specifically designed for use by ROFL workers.
    // ROFL workers will call this function to log the ephemeral public key and view hint
    // for active/transacted stealth addresses, ensuring a backup in case of backend compromise.
    function announce(
        uint32 k,
        bytes calldata ephemeralPub,
        bytes1 viewHint
    ) public {
        // Ensure only the authorized ROFL app can submit.
        Subcall.roflEnsureAuthorizedOrigin(roflAppID);

        // Calculate the hash of the ephemeral public key to save space and ensure uniqueness
        bytes32 ephemeralPubHash = keccak256(ephemeralPub);

        // Ensure that each ephemeral public key can only be used once
        require(
            !usedEphemeralPub[ephemeralPubHash],
            "Ephemeral public key already used"
        );

        // Mark the ephemeral public key as used
        usedEphemeralPub[ephemeralPubHash] = true;

        // Emit an event to log the announcement, including the key, view hint, and timestamp
        emit Announce(k, ephemeralPubHash, viewHint, block.timestamp);
    }

    // Function to check if an ephemeral public key has already been used.
    // ROFL workers can call this function to verify if a specific key has been announced.
    function checkAnnounce(
        bytes calldata ephemeralPub
    ) public view returns (bool) {
        return usedEphemeralPub[keccak256(ephemeralPub)];
    }
}
