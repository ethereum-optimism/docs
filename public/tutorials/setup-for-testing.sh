#! /bin/sh

rm -rf testing
mkdir -p testing/forge
cd testing/forge

forge init
find . -name 'Counter*' -exec rm {} \;
cd lib
npm install @eth-optimism/contracts-bedrock
cd ..
echo @eth-optimism/=lib/node_modules/@eth-optimism/ >> remappings.txt

cat > src/Greeter.sol <<EOF
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
 
import { Predeploys } from "@eth-optimism/contracts-bedrock/src/libraries/Predeploys.sol";
 
interface IL2ToL2CrossDomainMessenger {
    function crossDomainMessageContext() external view returns (address sender_, uint256 source_);        
}
 
contract Greeter {
 
    IL2ToL2CrossDomainMessenger public immutable messenger =
        IL2ToL2CrossDomainMessenger(Predeploys.L2_TO_L2_CROSS_DOMAIN_MESSENGER);
 
    string greeting;
 
    event SetGreeting(
        address indexed sender,     // msg.sender
        string greeting
    ); 
 
    event CrossDomainSetGreeting(
        address indexed sender,   // Sender on the other side
        uint256 indexed chainId,  // ChainID of the other side
        string greeting
    );
 
    function greet() public view returns (string memory) {
        return greeting;
    }
 
    function setGreeting(string memory _greeting) public {
        greeting = _greeting;
        emit SetGreeting(msg.sender, _greeting);
 
        if (msg.sender == Predeploys.L2_TO_L2_CROSS_DOMAIN_MESSENGER) {
            (address sender, uint256 chainId) =
                messenger.crossDomainMessageContext();              
            emit CrossDomainSetGreeting(sender, chainId, _greeting);
        }
    }
}
EOF

cat > src/GreetingSender.sol <<EOF
//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Predeploys } from "@eth-optimism/contracts-bedrock/src/libraries/Predeploys.sol";
import { IL2ToL2CrossDomainMessenger } from "@eth-optimism/contracts-bedrock/src/L2/IL2ToL2CrossDomainMessenger.sol";

import { Greeter } from "src/Greeter.sol";

contract GreetingSender {
    IL2ToL2CrossDomainMessenger public immutable messenger =
        IL2ToL2CrossDomainMessenger(Predeploys.L2_TO_L2_CROSS_DOMAIN_MESSENGER);

    address immutable greeterAddress;
    uint256 immutable greeterChainId;

    constructor(address _greeterAddress, uint256 _greeterChainId) {
        greeterAddress = _greeterAddress;
        greeterChainId = _greeterChainId;
    }

    function setGreeting(string calldata greeting) public {
        bytes memory message = abi.encodeCall(
            Greeter.setGreeting,
            (greeting)
        );
        messenger.sendMessage(greeterChainId, greeterAddress, message);
    }
}
EOF


cat > test/GreetingSender.t.sol <<EOF
pragma solidity ^0.8.0;
 
import { Test } from "forge-std/Test.sol";

import { Predeploys } from "@eth-optimism/contracts-bedrock/src/libraries/Predeploys.sol";
import { IL2ToL2CrossDomainMessenger } from "@eth-optimism/contracts-bedrock/src/L2/IL2ToL2CrossDomainMessenger.sol";

import { GreetingSender } from "src/GreetingSender.sol";
import { Greeter } from "src/Greeter.sol";
 
contract GreetingSenderTest is Test {

    address constant targetGreeter = address(0x0123456789012345678901234567890123456789);
    uint256 constant targetChain = 902;

    GreetingSender greetingSender;

    /// @notice Emitted whenever a message is sent to a destination
    /// @param destination  Chain ID of the destination chain.
    /// @param target       Target contract or wallet address.
    /// @param messageNonce Nonce associated with the message sent
    /// @param sender       Address initiating this message call
    /// @param message      Message payload to call target with.
    event SentMessage(
        uint256 indexed destination, address indexed target, uint256 indexed messageNonce, address sender, bytes message
    );    
 
    function setUp() public {
        greetingSender = new GreetingSender(targetGreeter, targetChain);
    }
 
    function test_SendGreeting() public {
        string memory greeting = "Hello";

        bytes memory message = abi.encodeCall(
            Greeter.setGreeting,
            (greeting)
        );
        
        // Ignore the nonce
        vm.expectEmit(true, true, false, true);
        emit SentMessage(targetChain, targetGreeter, 0, address(greetingSender), message);

        greetingSender.setGreeting(greeting);
    }
}
EOF

cat > test/Greeter.t.sol <<EOF
pragma solidity ^0.8.0;
 
import { Test } from "forge-std/Test.sol";

import { Predeploys } from "@eth-optimism/contracts-bedrock/src/libraries/Predeploys.sol";
import { IL2ToL2CrossDomainMessenger } from "@eth-optimism/contracts-bedrock/src/L2/IL2ToL2CrossDomainMessenger.sol";

import { Greeter } from "src/Greeter.sol";

contract GreeterTest is Test {
    uint256 constant fakeSourceChain = 901;
    address constant fakeSender = address(0x0123456789012345678901234567890123456789);

    event SetGreeting(
        address indexed sender,     // msg.sender
        string greeting
    ); 
 
    event CrossDomainSetGreeting(
        address indexed sender,   // Sender on the other side
        uint256 indexed chainId,  // ChainID of the other side
        string greeting
    );

    Greeter greeter;

    function setUp() public {
        greeter = new Greeter();        
    }

    function prepareRemoteCall() private {
        // Mock calls 
        vm.mockCall(
            Predeploys.L2_TO_L2_CROSS_DOMAIN_MESSENGER,
            bytes(abi.encodePacked(IL2ToL2CrossDomainMessenger.crossDomainMessageSender.selector)),
            bytes(abi.encode(fakeSender))
        );
        vm.mockCall(
            Predeploys.L2_TO_L2_CROSS_DOMAIN_MESSENGER,
            bytes(abi.encodePacked(IL2ToL2CrossDomainMessenger.crossDomainMessageSource.selector)),
            bytes(abi.encode(fakeSourceChain))
        );
        vm.mockCall(
            Predeploys.L2_TO_L2_CROSS_DOMAIN_MESSENGER,
            bytes(abi.encodePacked(bytes4(keccak256("crossDomainMessageContext()")))),
            bytes(abi.encode(fakeSender, fakeSourceChain))
        );
        vm.prank(Predeploys.L2_TO_L2_CROSS_DOMAIN_MESSENGER);
    }

    function test_InteropSetGreeting() public {
        string memory greeting = "Hello";

        prepareRemoteCall();
        vm.expectEmit(true, false, false, true);
        emit SetGreeting(Predeploys.L2_TO_L2_CROSS_DOMAIN_MESSENGER, greeting);
        vm.expectEmit(true, true, false, true);                
        emit CrossDomainSetGreeting(fakeSender, fakeSourceChain, greeting);

        greeter.setGreeting(greeting);
    }

    function test_LocalSetGreeting() public {
        string memory greeting = "Hello";

        vm.expectEmit(true, false, false, true);
        emit SetGreeting(address(this), greeting);

        greeter.setGreeting(greeting);
    }    
}
EOF

cd ..
mkdir hardhat
cd hardhat
npm init -y
npm install --save-dev hardhat
export HARDHAT_CREATE_JAVASCRIPT_PROJECT_WITH_DEFAULTS=1
export HARDHAT_DISABLE_TELEMETRY_PROMPT=true
npx hardhat init --yes
cp ../forge/src/Greeter.sol contracts
cat ../forge/src/GreetingSender.sol | sed 's/src\/Greeter.sol/contracts\/Greeter.sol/' > contracts/GreetingSender.sol
find . -name 'Lock*' -exec rm {} \;
npm install @eth-optimism/contracts-bedrock dotenv @eth-optimism/viem

cat > hardhat.config.js <<EOF
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      forking: {
        url: "https://interop-alpha-0.optimism.io",
      },
    },
  },
};
EOF

cat > test/GreetingSender.js <<EOF
/* eslint-disable node/no-unsupported-es-syntax */
const { expect } = require("chai")
const { ethers } = require("hardhat")
const { anyValue } = require(
  "@nomicfoundation/hardhat-chai-matchers/withArgs"
)
const { contracts, l2ToL2CrossDomainMessengerAbi } = require("@eth-optimism/viem")

describe("GreetingSender", function () {
  const targetGreeter = "0x0123456789012345678901234567890123456789"
  const targetChain = 902

  const deployFixture = async () => {

    const GreetingSender = await ethers.getContractFactory(
      "GreetingSender"
    )
    const greetingSender = await GreetingSender.deploy(
      targetGreeter,
      targetChain
    )
    
    const messenger = new ethers.Contract(
      contracts.l2ToL2CrossDomainMessenger.address,
      l2ToL2CrossDomainMessengerAbi,     
      ethers.provider
    );

    return { greetingSender, messenger };
  }

  it("emits SentMessage with the right arguments", async () => {
    const { greetingSender, messenger } = await deployFixture()

    const greeting = "Hello"

    // build the exact calldata the test expects
    const iface = new ethers.Interface([
      "function setGreeting(string)",
    ])
    const calldata = iface.encodeFunctionData("setGreeting", [
      greeting,
    ])

    await expect(greetingSender.setGreeting(greeting))
      .to.emit(messenger, "SentMessage")
      .withArgs(
        targetChain,
        targetGreeter,
        anyValue,
        greetingSender.target,
        calldata
      )
  })
})
EOF

cat > test/Greeter.js <<EOF
const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { contracts } = require("@eth-optimism/viem")

describe("Greeter", () => {
  const fakeSender = "0x0123456789012345678901234567890123456789";
  const fakeSourceChain = 901;

  async function deployFixture() {

    const MockMessenger = await ethers.getContractFactory("MockL2ToL2Messenger");
    const mock = await MockMessenger.deploy(fakeSender, fakeSourceChain);

    // overwrite predeploy with mock code
    await network.provider.send("hardhat_setCode", [
      contracts.l2ToL2CrossDomainMessenger.address,
      await ethers.provider.getCode(mock.target),
    ]);

    const Greeter = await ethers.getContractFactory("Greeter");
    const greeter = await Greeter.deploy();

    const messenger = new ethers.Contract(
      contracts.l2ToL2CrossDomainMessenger.address,
      MockMessenger.interface,
      ethers.provider
    );

    return { greeter, messenger, mockMessenger: mock };
  }

  it("emits SetGreeting with the right arguments when called locally", async () => {
    const { greeter } = await deployFixture();
    const greeting = "Hello";

    await expect(greeter.setGreeting(greeting))
      .to.emit(greeter, "SetGreeting")
      .withArgs((await ethers.getSigners())[0].address, greeting);
  });

  it("emits SetGreeting and CrossDomainSetGreeting with the right arguments when called remotely", 
    async () => {
        const { greeter } = await deployFixture();
        const greeting = "Hello";

        const impersonatedMessenger = 
            await ethers.getImpersonatedSigner(contracts.l2ToL2CrossDomainMessenger.address);
        const tx = await (await ethers.getSigners())[0].sendTransaction({
            to: contracts.l2ToL2CrossDomainMessenger.address,
            value: ethers.parseEther("1.0")
        });


        await expect(
        greeter.connect(impersonatedMessenger).setGreeting(greeting)
        )
        .to.emit(greeter, "SetGreeting")
        .withArgs(contracts.l2ToL2CrossDomainMessenger.address, greeting);

        await expect(
        greeter.connect(impersonatedMessenger).setGreeting(greeting)
        )
        .to.emit(greeter, "CrossDomainSetGreeting")
        .withArgs(fakeSender, fakeSourceChain, greeting);
    });
});
EOF

cat > contracts/MockL2ToL2Messenger.sol <<EOF
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockL2ToL2Messenger {
    address immutable public fakeSender;
    uint256 immutable public fakeSource;

    constructor(address _fakeSender, uint256 _fakeSource) {
        fakeSender = _fakeSender;
        fakeSource = _fakeSource;
    }

    function crossDomainMessageSender() external view returns (address) {
        return fakeSender;
    }

    function crossDomainMessageSource() external view returns (uint256) {
        return fakeSource;
    }

    function crossDomainMessageContext() external view returns (address, uint256) {
        return (fakeSender, fakeSource);
    }

    // Taken from https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/L2/L2ToL2CrossDomainMessenger.sol
    event SentMessage(
        uint256 indexed destination, address indexed target, uint256 indexed messageNonce, address sender, bytes message
    );

    function sendMessage(
        uint256 _destination,
        address _target,
        bytes calldata _message
    )
        external
    {
        uint256 nonce = 0xdead60a7;   // nonoce
        emit SentMessage(_destination, _target, nonce, msg.sender, _message);
    }

    // We need to receive ETH to be able to call Greeter.
    receive() external payable {
        // Accept ETH. No logic needed.
    }       
}
EOF
