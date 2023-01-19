require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
require("dotenv").config();
const { verify } = require("crypto");
const web3 = require('web3');
const HASH = require("../build/Hasher.json");
const { exit } = require("process");

let tellor,base,myContract,baseToken,charon,oracle;
var myAddress = "0xD109A7BD41F2bECE58885f1B04b607B5034FfbeD"

async function finalizePools() {
    let _networkName = hre.network.name
    let chainID = hre.network.config.chainId

    if(_networkName == "mumbai"){
        tellor = "0x8f55D884CAD66B79e1a131f6bCB0e66f4fD84d5B"
        base = "https://mumbai.polygonscan.com/address/"
        baseToken =  "0x449Ee7C67Ba0F97aa66290F885CC1519eE136bA0"
        charon =  "0xDf1163e76105548a9B71829Ac7d7e8fB83874FB0"
        oracle =  "0x6dd9e5B2d861f3C17988F70589CEFa7bb560f2B5"
        chd =  "0x3B915fE1dE6b689133080348cF6D658854747390"
        cit =  "0x70725546174986C2626377ff47887096CD9cd717"
        cfc =  "0x072D2558C78b1598EF989B2BFcd24bcc546f1284"
        cChainIDs = [5,10200]
        cAddys = ["0xdF76f7D5C15689ee175b1b73eF12855565bd07D3","0xD3e83D65a08220D9eEF8c8E1167A5E0881Df7550"]
    }
    else if(_networkName == "goerli"){
        tellor = "0xB3B662644F8d3138df63D2F43068ea621e2981f9"
        base = "https://goerli.etherscan.io/address/"
        baseToken =  "0xA4Fe7f0724ffbb69F55E3E3A38234a9B91AD4a9E"
        charon =  "0x1Ed985e19AC90038885D45216f38A6a23FaF174b"
        oracle =  "0x0Bb762fD0b90418C159d87aF706aAdE13b4432C4"
        chd =  "0x5280399F2BE09Deebf3f971665527aD873e3772C"
        cit =  "0x15723cecEeA0eC9d11952CE1cc9d0b37772ec662"
        cfc =  "0x0d3C08e4b3674155D24879251c74dec72E987e73"
        cChainIDs = [80001,10200]
        cAddys = ["0x28af28Bb3C63Be91751cf64ac16E5b0f73A8aB10","0xD3e83D65a08220D9eEF8c8E1167A5E0881Df7550"]
    }
    else if(_networkName == "chiado"){
        tellor = "0xd71F72C18767083e4e3FE84F9c62b8038C1Ef4f6"
        base = "https://blockscout.chiadochain.net/address/"
        baseToken =  "0x431c22B4e2923df8e73F9f3f643AF57677aC89a7"
        charon =  "0x5C69551859E27E93f8f4179Fb87691fe6FF292bC"
        oracle =  "0x659A57d4Bd449148142aAD40183DcaE2A7C41Cc7"
        chd =  "0x428Fbc07B3f2F84683752dCEd6108909C930B264"
        cit =  "0x84544A451A0Eb2F963e735c84033740106F3C60A"
        cfc =  "0xb003F713503Bcb02307E3DDe10456fcC7cDE263F"
        cChainIDs = [5,80001]
        cAddys = ["0xdF76f7D5C15689ee175b1b73eF12855565bd07D3","0x28af28Bb3C63Be91751cf64ac16E5b0f73A8aB10"]
    }
    else{
        console.log("No network name ", _networkName, " found")
        process.exit(1)
    }
    await run("compile")
    console.log("initializing and finalizing charon system to: ", _networkName)

    myContract = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", baseToken)
    await myContract.mint(myAddress, web3.utils.toWei("1000"))
    console.log("token minted")
    await myContract.approve(charon,web3.utils.toWei("100"))//100
    console.log("base token approved")
    myContract = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon",charon)
    await myContract.finalize(cChainIDs,cAddys,web3.utils.toWei("100"),web3.utils.toWei("1000"),chd,cfc);
    console.log("charon finalized")
}

finalizePools()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
