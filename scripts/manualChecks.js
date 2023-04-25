require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
require("dotenv").config();
const web3 = require('web3');
const c = require("./contractAddys.js")
//npx hardhat run scripts/manualChecks.js --network mumbai

var fee = web3.utils.toWei(".006");//.6
var HEIGHT = 23;
var myAddress = process.env.PUBLICKEY
let chdMint = web3.utils.toWei("10000")
let gnoAmount = web3.utils.toWei("10000")
let ethAmount = web3.utils.toWei("5.47")
let polAmount = web3.utils.toWei("10416.65")

async function runChecks() {
    let _networkName = hre.network.name
    let chainID = hre.network.config.chainId
    let cit =  c.ETHEREUM_CIT
    let _amount,myContract,baseToken, charon, chd, cfc, cChainIDs, cAddys;

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

    await run("compile")
    console.log("running manual checks on :  ", _networkName)

myContract = await hre.ethers.getContractAt("charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge", tellorBridge1)
if(await myContract.connectedChainId() != cChainIDs[0]){console.log("connectedChainId should be set correctly")}
myContract = await hre.ethers.getContractAt("charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge", tellorBridge2)
if(await myContract.connectedChainId() != cChainIDs[1]){console.log("connectedChainId should be set correctly")}
//charonAMM
charon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", charon)
cfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", cfc)
cit = await hre.ethers.getContractAt("incentiveToken/contracts/Auction.sol:Auction", cit)
baseToken = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", baseToken)
chd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", chd)

if(await charon.levels() != HEIGHT){console.log( "merkle Tree height should be set")}
if(await charon.token() != baseToken.address){console.log("token should be set")}
if(await charon.fee() != fee){console.log("fee should be set")}
if(await charon.controller() != cfc.address){console.log("controller should be set")}
if(await charon.chainID() != chainID){console.log("chainID should be correct")}
//finalize
if(await charon.balanceOf(myAddress) - web3.utils.toWei("100") != 0){console.log( "should have full balance")}
if(await charon.recordBalance() != _amount){console.log("record Balance should be set")}
if(await charon.recordBalanceSynth() != chdMint){console.log("record Balance synth should be set")}
if(await charon.chd() != chd.address){console.log("chd should be set")}
let pC = await charon.getPartnerContracts();
if(pC[0][0] != cChainIDs[0]){console.log( "partner chain should be correct")}
if(pC[0][1] !=  cAddys[0]){console.log("partner address should be correct")}
if(pC[1][0] != cChainIDs[1]){console.log( "partner chain should be correct2")}
if(pC[1][1] !=  cAddys[1]){console.log("partner address should be correct2")}
//cfc 
if(await cfc.cit() != cit.address){console.log( "cit should be set")}
if(await cfc.charon() != charon.address){console.log("charon should be set")}
if(await cfc.toOracle() != web3.utils.toWei("10")){console.log("toOracle should be set")}
if(await cfc.toLPs() != web3.utils.toWei("20")){console.log("toLPs should be set")}
if(await cfc.toHolders() != web3.utils.toWei("50")){console.log("toHolders should be set")}
if(await cfc.toUsers() != web3.utils.toWei("20")){console.log("toUsers should be set")}
let feePeriod = await cfc.feePeriods(0)
if(feePeriod == 0){console.log("first fee period shoud be set")}
let thisPeriod = await cfc.getFeePeriodByTimestamp(feePeriod)
if(thisPeriod.endDate - feePeriod != 0){console.log("end date should be set")}
if(await cfc.token() != baseToken.address){console.log( "base token should be set")}
if(await cfc.chd() !=chd.address){console.log("chd should be set")}
//cit
if(_networkName == "sepolia"){
    if(await cit.bidToken() != baseToken.address){console.log("token should be set")}
    if(await cit.mintAmount() != web3.utils.toWei("10000")){console.log("mint amount should be set")}
    if(await cit.auctionFrequency() != 86400*7){console.log("auction frequency should be set")}
    if(await cit.charonFeeContract() != cfc.address){console.log("cfc should be set")}
    if(await cit.endDate() ==0){console.log("first end date should be set")}
    if(await cit.balanceOf(myAddress) != web3.utils.toWei("10000")){console.log("init supply should be minted")}
    if(await cit.name() != "Charon Incentive Token"){console.log("name should be set")}
    if(await cit.symbol() != "CIT"){console.log( "symbol should be set")}
}
console.log("..all variables initialized correctly")
}

runChecks()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
