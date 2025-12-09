// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title L1Burn
 * @notice L1Burn keeps track of the total amount of ETH burned on L1
 */
contract L1Burn {
    /**
     * @notice The system caller responsible for L1 attributes transactions
     */
    address internal constant DEPOSITOR_ACCOUNT = 0xDeaDDEaDDeAdDeAdDEAdDEaddeAddEAdDEAd0001;

    /**
     * @notice Total amount of ETH burned on L1
     */
    uint256 public total;

    /**
     * @notice Mapping of block numbers to total burn
     */
    mapping (uint64 => uint256) public reports;

    /**
     * @notice Thrown when a burn report is received from the non-depositor account
     */
    error Unauthorized();

    /**
     * @notice Allows the system address to submit a report
     *
     * @param _blockNumber L1 block number the report corresponds to
     * @param _burnAmount Amount of ETH burned in the block
     */
    function report(uint64 _blockNumber, uint64 _burnAmount) external {
        if (msg.sender != DEPOSITOR_ACCOUNT) {
            revert Unauthorized();
        }

        total += _burnAmount;
        reports[_blockNumber] = total;
    }

    /**
     * @notice Tallies up the total burn since a given block number
     *
     * @param _blockNumber L1 block number to tally from
     *
     * @return Total amount of ETH burned since the given block number
     */
    function tally(uint64 _blockNumber) external view returns (uint256) {
        return total - reports[_blockNumber];
    }
}
