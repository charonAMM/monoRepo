require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
require("dotenv").config();
const web3 = require('web3');
const c = require("./contractAddys.js")

let tellor,base,myContract,baseToken,charon;
var myAddress = process.env.PUBLICKEY
//npx hardhat run scripts/testFinalize.js --network sepolia

let chdMint = web3.utils.toWei("10000")
let gnoAmount = web3.utils.toWei("10000")
let ethAmount = web3.utils.toWei("5.47")
let polAmount = web3.utils.toWei("10416.65")

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function finalizePools() {
    let _amount, tellorBridge1, tellorBridge2;
    let _networkName = hre.network.name
    await run("compile")
    console.log("initializing and finalizing charon system to: ", _networkName)
    cit = c.ETHEREUM_CIT
    let _feeData = await hre.ethers.provider.getFeeData();
    delete _feeData.lastBaseFeePerGas
    delete _feeData.gasPrice

    if(_networkName == "mumbai"){
        tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
        base = "https://mumbai.polygonscan.com/address/"
        baseToken =  c.POLYGON_BASETOKEN
        charon =  c.POLYGON_CHARON
        chd =  c.POLYGON_CHD
        cfc =  c.POLYGON_CFC
        tellorBridge1 = c.POLYGON_TELLORBRIDGE1
        tellorBridge2 = c.POLYGON_TELLORBRIDGE2
        cChainIDs = [11155111,10200]
        cAddys = [c.ETHEREUM_CHARON,c.GNOSIS_CHARON]
        _amount = polAmount;
    }
    else if(_networkName == "sepolia"){
        tellor = "0x199839a4907ABeC8240D119B606C98c405Bb0B33"
        base = "https://sepolia.etherscan.io/address/"
        baseToken =  c.ETHEREUM_BASETOKEN
        charon =  c.ETHEREUM_CHARON
        chd =  c.ETHEREUM_CHD
        cfc =  c.ETHEREUM_CFC
        tellorBridge1 = c.ETHEREUM_TELLORBRIDGE1
        tellorBridge2 = c.ETHEREUM_TELLORBRIDGE2     
        cChainIDs = [80001,10200]
        cAddys = [c.POLYGON_CHARON,c.GNOSIS_CHARON]
        _amount = ethAmount
    }
    else if(_networkName == "chiado"){
        tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
        base = "https://blockscout.chiadochain.net/address/"
        baseToken =  c.GNOSIS_BASETOKEN
        charon =  c.GNOSIS_CHARON
        chd =  c.GNOSIS_CHD
        cfc =  c.GNOSIS_CFC
        tellorBridge1 = c.GNOSIS_TELLORBRIDGE1
        tellorBridge2 = c.GNOSIS_TELLORBRIDGE2  
        cChainIDs = [11155111,80001]
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
    await myContract.setCit(cit, 11155111, chd, _feeData);
    console.log("cit address set")
    await sleep(5000)

    myContract = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", baseToken)
    await myContract.mint(myAddress, _amount, _feeData)
    console.log("token minted")
    await sleep(5000)

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
