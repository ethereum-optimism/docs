#! /bin/sh

rm -rf upgrade-erc20 || { echo "Failed to remove directory"; exit 1; }
mkdir upgrade-erc20 || { echo "Failed to create directory"; exit 1; }
cd upgrade-erc20 || { echo "Failed to change directory"; exit 1; }

if [ -z $1 ]
then
  echo Supersim
  # This is a well-known development private key – never use in production
  PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
  URL_CHAIN_A=http://localhost:9545
  URL_CHAIN_B=http://localhost:9546
else
  echo Devnet
  PRIVATE_KEY=$1
  URL_CHAIN_A=https://interop-alpha-0.optimism.io
  URL_CHAIN_B=https://interop-alpha-1.optimism.io
fi

USER_ADDRESS=`cast wallet address --private-key $PRIVATE_KEY`

forge init
forge install OpenZeppelin/openzeppelin-contracts-upgradeable

cat > script/LabSetup.s.sol <<EOF
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {UpgradeableBeacon} from "../lib/openzeppelin-contracts-upgradeable/lib/openzeppelin-contracts/contracts/proxy/beacon/UpgradeableBeacon.sol";
import {BeaconProxy} from "../lib/openzeppelin-contracts-upgradeable/lib/openzeppelin-contracts/contracts/proxy/beacon/BeaconProxy.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MyToken is Initializable, ERC20Upgradeable, OwnableUpgradeable {
    function initialize(string memory name, string memory symbol, uint256 initialSupply) public initializer {
        __ERC20_init(name, symbol);
        __Ownable_init(msg.sender);
        _mint(msg.sender, initialSupply);
    }
}

contract LabSetup is Script {
    function setUp() public {}

    function run() public {
        vm.startBroadcast();

        MyToken token = new MyToken();
        console.log("Token address:", address(token));
        console.log("msg.sender:", msg.sender);

        UpgradeableBeacon beacon = new UpgradeableBeacon(address(token), msg.sender);
        console.log("UpgradeableBeacon:", address(beacon));

        BeaconProxy proxy = new BeaconProxy(address(beacon),
            abi.encodeCall(MyToken.initialize, ("Test", "TST",
		(block.chainid == 901) || (block.chainid == 420120000) ? 10**18 : 0))
        );
        console.log("Proxy:", address(proxy));

        vm.stopBroadcast();
    }
}
EOF

forge script script/LabSetup.s.sol --rpc-url $URL_CHAIN_A --broadcast --private-key $PRIVATE_KEY --tc LabSetup | tee setup_output

BEACON_ADDRESS=`cat setup_output | awk '/Beacon:/ {print $2}'`
ERC20_ADDRESS=`cat setup_output | awk '/Proxy:/ {print $2}'`

echo Run these commands to store the configuration:
echo BEACON_ADDRESS=$BEACON_ADDRESS
echo export ERC20_ADDRESS=$ERC20_ADDRESS
