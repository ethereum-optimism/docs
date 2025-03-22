// First, create a new Foundry project with the OpenZeppelin libraries

const {execSync} = await import("child_process")
const process = await import('node:process')
const {writeFile} = await import("node:fs/promises")

// The supersim environment
const urls = {
    "A": "http://127.0.0.1:9545",
    "B": "http://127.0.0.1:9546",
    "L1":"http://127.0.0.1:8545"
}

const privateKeys = [
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
    "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
    "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
    "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
    "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
    "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
    "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e",
    "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356",
    "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97",
    "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6"
]

const addresses = [
    "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    "0x976EA74026E726554dB657fA54763abd0C3a0aa9",
    "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955",
    "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f",
    "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720"
]

// Create the directory
execSync("mkdir upgrade-erc20")
process.chdir("upgrade-erc20")

// Create a Foundry project with the OpenZeppelin contracts
execSync("forge init")
execSync("forge install OpenZeppelin/openzeppelin-contracts")
execSync("forge install OpenZeppelin/openzeppelin-contracts-upgradeable")

// Contract files
await writeFile("src/MyToken.sol", `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

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
`)

await writeFile("src/DeployProxy.sol", `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployProxy {

    function deploy(address logic, address admin, bytes memory data) public returns (address) {
        address newProxyAddress = address(new TransparentUpgradeableProxy(logic, admin, data));
        return newProxyAddress;
    }
}
`)

const forgeParams = (chain, account) => 
        `--rpc-url ${urls[chain]} --private-key ${privateKeys[account]}`

const deployContract = name =>
    execSync(`forge create ${name} ${forgeParams("A", 0)} --broadcast \
        | awk '/Deployed to:/ {print $3}'
       `)
   .toString().slice(0,-1)


// Deploy the ERC-20
// Don't initialize it, because the storage in that address is irrelevant.
// The relevant storage is what will be in the proxy address.
const erc20Address = deployContract("MyToken")

// Deploy and initialize the proxy
const proxyDeployerAddress = deployContract("DeployProxy")
const res = JSON.parse(
    execSync(`cast send ${proxyDeployerAddress} ${forgeParams("A", 0)} "deploy(address,address,bytes)" ${erc20Address} ${addresses[0]} 0x \
        | awk '/logs / {print $2}'
`).toString())
// The first log entry comes from the proxy
const proxyAddress = res[0].address

// Initialize the ERC-20 contract in the proxy storage
execSync(`cast send ${proxyAddress} ${forgeParams("A", 0)} "initialize(string,string,uint256)" Test Tst ${"1".padEnd(19, "0")}`)

console.log(`Proxy deployer on chain A: ${proxyDeployerAddress}`)
console.log(`ERC-20 on chain A: ${proxyAddress}`)
console.log(`One token owned by ${addresses[0]}`)
console.log(`Run this command to verify:
    cast call ${proxyAddress} --rpc-url ${urls.A} "balanceOf(address)" ${addresses[0]} | cast from-wei`)