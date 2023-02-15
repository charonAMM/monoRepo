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
    await run("compile")
    console.log("initializing and finalizing charon system to: ", _networkName)

    cit =  "0xa080483eCBc69c63f3348eD224C47F52410fD894"
    e2p =  "0x7983F3c9c7BbF1cB0Fb5D00D810678774D539100"
    p2e = "0xE7bDdDF09DDCCB4b16846DFFC899d5422e4e9244"

    if(_networkName == "mumbai"){
        tellor = "0x8f55D884CAD66B79e1a131f6bCB0e66f4fD84d5B"
        base = "https://mumbai.polygonscan.com/address/"
        baseToken =  "0x97034B86C2368938e2620Ee9083Fc34c9c5b555f"
        charon =  "0x0a760F47a81431472e55422c5b7E222Ef0b3D178"
        chd =  "0x2be74684052063FB424D623461952fA52443D62A"
        cfc =  "0x4AC8541598a95A9315b415d1C0A14541cF66BBBD"
        cChainIDs = [5,10200]
        cAddys = ["0xE7bDdDF09DDCCB4b16846DFFC899d5422e4e9244","0x5243781910cf05C0C6Bd83a6525E722b0FeEFdbb"]

        myContract = await hre.ethers.getContractAt("charonAMM/contracts/bridges/POLtoETHBridge.sol:POLtoETHBridge", p2e)
        await myContract.setCharon(charon);
        console.log("p2e charon address set")
        await myContract.setFxRootTunnel(e2p)
        console.log("p2e fxRootTunnel set")
    }
    else if(_networkName == "goerli"){
        tellor = "0xB3B662644F8d3138df63D2F43068ea621e2981f9"
        base = "https://goerli.etherscan.io/address/"
        baseToken =  "0x9Ad8F4F37283D680ED9Cc9081A7b3a8bD7a31823"
        charon =  "0xE7bDdDF09DDCCB4b16846DFFC899d5422e4e9244"
        chd =  "0x1a11537903308545c4F2964F98314A54c200AA83"
        cfc =  "0x7e7b08D01C8aA22FEdF0aA5E76ed4F2383B192c2"
        gnosisAMB =  "0x8dbC94CfcFd867C39F378D4CdaE79EB97EB7C40b"
        cChainIDs = [80001,10200]
        cAddys = ["0x0a760F47a81431472e55422c5b7E222Ef0b3D178","0x5243781910cf05C0C6Bd83a6525E722b0FeEFdbb"]

        myContract = await hre.ethers.getContractAt("charonAMM/contracts/bridges/ETHtoPOLBridge.sol:ETHtoPOLBridge",e2p)
        await myContract.setCharon(charon);
        console.log("p2e charon address set")
        await myContract.setFxChildTunnel(p2e)
        console.log("p2e fxChildTunnel set")
    }
    else if(_networkName == "chiado"){
        tellor = "0xd71F72C18767083e4e3FE84F9c62b8038C1Ef4f6"
        base = "https://blockscout.chiadochain.net/address/"
        baseToken =  "0xCcC741ba014d1D3077473B491EB8C909ebAcBa9D"
        charon =  "0x5243781910cf05C0C6Bd83a6525E722b0FeEFdbb"
        chd =  "0x07f30eF4E57749cA2b52c04A1EBefab33a3AfeAb"
        cfc =  "0x9Ad8F4F37283D680ED9Cc9081A7b3a8bD7a31823"
        gnosisAMB = "0xB2501D56Dd68c4800e8970C8A47a766053F5dbC7"
        cChainIDs = [5,80001]
        cAddys = ["0xE7bDdDF09DDCCB4b16846DFFC899d5422e4e9244","0x0a760F47a81431472e55422c5b7E222Ef0b3D178"]
    }
    else{
        console.log("No network name ", _networkName, " found")
        process.exit(1)
    }
    myContract = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", cfc)
    await myContract.setCIT(cit, 5, chd);
    console.log("cit address set")

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
