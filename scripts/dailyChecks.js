require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
require("dotenv").config();
const web3 = require('web3');
//npx hardhat run scripts/manualChecks.js --network mumbai
let tellor,base,baseToken,charon,chd,cit,cfc,builtPoseidon;
var fee = web3.utils.toWei(".006");//.6
var HEIGHT = 23;
var myAddress = "0xD109A7BD41F2bECE58885f1B04b607B5034FfbeD"
var b = "0x2a4eA8464bd2DaC1Ad4f841Dcc7A8EFB4d84A27d"
const fetch = require('node-fetch')

function poseidon(inputs){
    let val = builtPoseidon(inputs)
    return builtPoseidon.F.toString(val)
}

function poseidon2(a,b){
return poseidon([a,b])
}

let xDaiPrice = fetch('https://api.coingecko.com/api/v3/simple/price?ids=xdai&vs_currencies=usd')
let maticPrice = fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd')
let ethPrice = fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')

async function runChecks() {
    let _networkName = hre.network.name
    let chainID = hre.network.config.chainId
    cit =  "0x826c1A89F9A504631d81E41488B050C8B2Df56E7"
    let _amount,myContract, tellor, base, baseToken, charon, chd, cfc, cChainIDs, cAddys;

    let gnoNode = process.env.NODE_URL_GOERLI;
    let polNode = process.env.NODE_URL_MUMBAI;
    let chiNode = process.env.NODE_URL_CHIADO;
    let provider = new ethers.providers.JsonRpcProvider(gnoNode);
    let wallet = new ethers.Wallet(process.env.PK, provider);
    let gnoSigner = wallet.provider.getSigner(wallet.address)
    goerliCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", goerliAddress, gnoSigner)
    tellor = await hre.ethers.getContractAt(abi, tellorAddress,hre.provider);
    provider = new ethers.providers.JsonRpcProvider(chiNode);
    wallet = new ethers.Wallet(process.env.PK, provider);
    let chiSigner = wallet.provider.getSigner(wallet.address)
    chiadoCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", chiadoAddress, chiSigner)
    provider = new ethers.providers.JsonRpcProvider(polNode);
    wallet = new ethers.Wallet(process.env.PK, provider);
    let mumSigner = wallet.provider.getSigner(wallet.address)
    mumbaiCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", mumbaiAddress,mumSigner)
    p2e = await hre.ethers.getContractAt("charonAMM/contracts/bridges/POLtoETHBridge.sol:POLtoETHBridge", p2e, mumSigner)
    e2p = await hre.ethers.getContractAt("charonAMM/contracts/bridges/ETHtoPOLBridge.sol:ETHtoPOLBridge",e2p, gnoSigner)
    await run("compile")
    console.log("running daily checks")

let gnoCfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", cfc, gnoSigner)
let chiCfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", cfc, chiSigner)
let mumCfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", cfc, mumSigner)
cit = await hre.ethers.getContractAt("incentiveToken/contracts/Auction.sol:Auction", cit, gnoSigner)
let gnoChd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", chd, gnoSigner)
let chiChd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", chd, chiSigner)
let mumChd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", chd, mumbSigner)

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

console.log("..all variables initialized correctly")

if(Date.now()/1000 - await cit.endDate() > 0){console.log("CIT Auction is over and ready to start new round!")}

let feePeriod = await cfc.getFeePeriods()
let thisPeriod = await cfc.getFeePeriodByTimestamp(feePeriod[feePeriod.length - 1])
if(Date.now()/1000 - thisPeriod.endDate > 0){console.log("fee period is ready for token balance reporting and distribution!")


What's the current price on each chain
What's the arb opportunity
How many times was each function run in past day
TVL / TDV
Amount of CHD LP'd, free floating public / private

}

runChecks()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
