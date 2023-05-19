require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
require("dotenv").config();

//npx hardhat run scripts/deploy/deployRegistry.js --network polygon

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function deploy(contractName, ...args) {
    let _feeData = await hre.ethers.provider.getFeeData();
    delete _feeData.lastBaseFeePerGas
    delete _feeData.gasPrice
    const Factory = await ethers.getContractFactory(contractName)
    const instance = await Factory.deploy(...args)
    await sleep(50000)
    return instance.deployed()
}

async function deployRegistry() {
    console.log("deploying registry")
    let registry = await deploy("registry/contracts/Registry.sol:Registry")
    await run("verify:verify",{
        address: registry.address,
        contract:"registry/contracts/Registry.sol:Registry",
        constructorArguments: []
    })
    console.log("registry verified")
    console.log("registry")
    console.log(registry.address)
}

deployRegistry()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
