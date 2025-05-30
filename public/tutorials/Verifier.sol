// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Attestation} from "@ethereum-attestation-service/eas-contracts/contracts/Common.sol";

// Code from https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/interfaces/L2/ICrossL2Inbox.sol,
// which is not in the npm package yet so we copy it.
struct Identifier {
    address origin;
    uint256 blockNumber;
    uint256 logIndex;
    uint256 timestamp;
    uint256 chainId;
}

interface ICrossL2Inbox {
    function validateMessage(Identifier calldata _id, bytes32 _msgHash) external;
}

contract Verifier {

    bytes32 private constant SCHEMA_UID = 0x234dee4d3e6a625b4121e2042d6267058755e53a2ecc55555da51a1e6f06cc58;
    uint256 private constant EVENT_SIG = 0x8bf46bf4cfd674fa735a3d63ec1c9ad4153f033c290341f3a588b75685141b35;
    address private constant EAS_CONTRACT = 0x4200000000000000000000000000000000000021;
    address private constant CROSS_L2_INBOX = 0x4200000000000000000000000000000000000022;

    /// @dev Calculates a UID for a given attestation.
    /// @param attestation The input attestation.
    /// @param bump A bump value to use in case of a UID conflict.
    /// @return Attestation UID.
    function _getUID(Attestation memory attestation, uint32 bump) private pure returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    attestation.schema,
                    attestation.recipient,
                    attestation.attester,
                    attestation.time,
                    attestation.expirationTime,
                    attestation.revocable,
                    attestation.refUID,
                    attestation.data,
                    bump
                )
            );
    }

    function makePayloadHash(
        address recipient,
        address attester,
        bytes32 attestationID
    ) pure private returns (bytes32) {
        return keccak256(
            abi.encode(
                EVENT_SIG,
                recipient,
                attester,
                SCHEMA_UID,
                attestationID
            )
        );
    }
   
    function verifyAttestation(
        address recipient,
        address attester,
        uint256 logIndex,
        uint256 blockNumber,
        uint64 timestamp,
        uint256 chainId,
        string memory name
    ) public {
        Attestation memory attestation;
        attestation.schema = SCHEMA_UID;
        attestation.recipient = recipient;
        attestation.attester = attester;
        attestation.revocable = true;
        attestation.time = timestamp;
        attestation.data = abi.encode(name);
        bytes32 attestationUID = _getUID(attestation, 0);
    
        bytes32 payloadHash = makePayloadHash(recipient, attester, attestationUID);

        Identifier memory logEntryIdentifier;
        logEntryIdentifier.origin = EAS_CONTRACT;
        logEntryIdentifier.blockNumber = blockNumber;
        logEntryIdentifier.logIndex = logIndex;
        logEntryIdentifier.timestamp = timestamp;
        logEntryIdentifier.chainId = chainId;

        // Signal that this is a cross chain call that needs to have the identifier validated
        ICrossL2Inbox(CROSS_L2_INBOX).validateMessage(logEntryIdentifier, payloadHash);

        // Code that uses the attestation goes here        
    }
    
}
