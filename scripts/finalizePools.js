require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
require("dotenv").config();
const web3 = require('web3');
const c = require("./contractAddys.js")

let tellor,base,myContract,baseToken,charon;
//npx hardhat run scripts/finalizePools.js --network gnosis

let chdMint = web3.utils.toWei("10000")
let gnoAmount = web3.utils.toWei("10000")
let ethAmount = web3.utils.toWei("5.5")
let polAmount = web3.utils.toWei("11620.69")

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function finalizePools() {
    let _amount, tellorBridge1, tellorBridge2;
    let _networkName = hre.network.name
    await run("compile")
    console.log("initializing and finalizing charon system to: ", _networkName)
    cit = c.CIT
    citChain = 100;
    let _feeData = await hre.ethers.provider.getFeeData();
    delete _feeData.lastBaseFeePerGas
    delete _feeData.gasPrice
    tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
    if(_networkName == "polygon"){
        _feeData = {"gasPrice":169000000000}
        base = "https://polygonscan.com/address/"
        baseToken =  c.POLYGON_BASETOKEN
        charon =  c.POLYGON_CHARON
        chd =  c.POLYGON_CHD
        cfc =  c.POLYGON_CFC
        tellorBridge1 = c.POLYGON_TELLORBRIDGE1
        tellorBridge2 = c.POLYGON_TELLORBRIDGE2
        cChainIDs = [10,100]
        cAddys = [c.ETHEREUM_CHARON,c.GNOSIS_CHARON]
        _amount = polAmount;
    }
    else if(_networkName == "optimism"){
        base = "https://optimistic.etherscan.io/address/"
        baseToken =  c.ETHEREUM_BASETOKEN
        charon =  c.ETHEREUM_CHARON
        chd =  c.ETHEREUM_CHD
        cfc =  c.ETHEREUM_CFC
        tellorBridge1 = c.ETHEREUM_TELLORBRIDGE1
        tellorBridge2 = c.ETHEREUM_TELLORBRIDGE2     
        cChainIDs = [137,100]
        cAddys = [c.POLYGON_CHARON,c.GNOSIS_CHARON]
        _amount = ethAmount
    }
    else if(_networkName == "gnosis"){
        base = "https://blockscout.com/xdai/mainnet/address/"
        baseToken =  c.GNOSIS_BASETOKEN
        charon =  c.GNOSIS_CHARON
        chd =  c.GNOSIS_CHD
        cfc =  c.GNOSIS_CFC
        tellorBridge1 = c.GNOSIS_TELLORBRIDGE1
        tellorBridge2 = c.GNOSIS_TELLORBRIDGE2  
        cChainIDs = [10,137]
        cAddys = [c.ETHEREUM_CHARON,c.POLYGON_CHARON]
        _amount = gnoAmount
    }
    else{
        console.log("No network name ", _networkName, " found")
        process.exit(1)
    }
    myContract = await hre.ethers.getContractAt("charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge", tellorBridge1)
    await myContract.setPartnerInfo(cAddys[0],cChainIDs[0], _feeData);
    await sleep(5000)
    console.log("tellorBridge1 partner info set")

    myContract = await hre.ethers.getContractAt("charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge", tellorBridge2)
    await myContract.setPartnerInfo(cAddys[1],cChainIDs[1], _feeData);
    await sleep(5000)
    console.log("tellorBridge2 partner info set")

    myContract = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", cfc)
    await myContract.setCit(cit,citChain, chd, _feeData);
    console.log("cit address set")
    await sleep(5000)

    myContract = await hre.ethers.getContractAt("charonAMM/contracts/Token.sol:Token", baseToken)
    await myContract.approve(charon, _amount, _feeData)//100
    console.log("base token approved")
    await sleep(5000)

    myContract = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon",charon)
    await myContract.finalize(cChainIDs,cAddys,_amount,chdMint,chd,cfc, _feeData);
    console.log("charon finalized")
    await sleep(5000)
}

finalizePools()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
