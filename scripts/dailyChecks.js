require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
const c = require("./contractAddys.js")
require("dotenv").config();
const web3 = require('web3');
//npx hardhat run scripts/dailyChecks.js --network mumbai
var myAddress = "0xD109A7BD41F2bECE58885f1B04b607B5034FfbeD"
var b = "0x2a4eA8464bd2DaC1Ad4f841Dcc7A8EFB4d84A27d"
const fetch = require('node-fetch');
const { buildPoseidon } = require("circomlibjs");
const { Keypair } = require("../src/keypair.js");
const Utxo = require("../src/utxo.js");
const { toFixedHex } = require('../src/utils.js')

function poseidon(inputs){
    let val = builtPoseidon(inputs)
    return builtPoseidon.F.toString(val)
}

function poseidon2(a,b){
return poseidon([a,b])
}

async function getPrivateBalance(charonInstance, myKeypair,chainID){
    let filter = charonInstance.filters.NewCommitment()
    let events = await charonInstance.queryFilter(filter,0,"latest")
    let thisUTXO
    let myAmount = 0
    let myNullifier;
    for(i = 0; i< events.length; i++){
        try {
            thisUTXO = Utxo.decrypt(myKeypair, events[i].args._encryptedOutput, events[i].args._index)
            thisUTXO.chainID = chainID;
            //nowCreate nullifier
            try{
                myNullifier = thisUTXO.getNullifier(poseidon)
                myNullifier = toFixedHex(myNullifier)
                if(!await charonInstance.isSpent(myNullifier)){
                    myAmount += parseInt(thisUTXO.amount);
                }
            }catch{
                console.log("nullifier error", i)
            }
        } catch{
            //console.log("not here")
        }
    }
    return ethers.utils.formatEther(myAmount.toString());
}


async function runChecks() {
    let xDaiPrice,maticPrice,ethPrice;

    try{
        xDaiPrice =await fetch('https://api.coingecko.com/api/v3/simple/price?ids=xdai&vs_currencies=usd').then(response => response.json());
        xDaiPrice = xDaiPrice["xdai"]["usd"]
        console.log("xDai price: ",xDaiPrice)
    }catch{
        xDaiPrice = 1;
        console.log("couldnt fetch xdai price")
    }
    try {
        maticPrice = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd').then(response => response.json());
        maticPrice = maticPrice["matic-network"]["usd"]
        console.log("matic price", maticPrice)
    }catch{
        maticPrice = 1.15
        console.log("couldnt fetch matic price")
    }
    try{
        ethPrice = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd').then(response => response.json());
        ethPrice = ethPrice["ethereum"]["usd"]
        console.log("eth price", ethPrice)
    }catch{
        ethPrice = 1800
        console.log("couldn't fetch eth price")
    }
    builtPoseidon = await buildPoseidon()
    let gnoNode = process.env.NODE_URL_GOERLI;
    let polNode = process.env.NODE_URL_MUMBAI;
    let chiNode = process.env.NODE_URL_CHIADO;
    let provider = new ethers.providers.JsonRpcProvider(gnoNode);
    let wallet = new ethers.Wallet(process.env.PK, provider);
    let gnoSigner = wallet.provider.getSigner(wallet.address)
    goerliCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.ETHEREUM_CHARON, gnoSigner)
    provider = new ethers.providers.JsonRpcProvider(chiNode);
    wallet = new ethers.Wallet(process.env.PK, provider);
    let chiSigner = wallet.provider.getSigner(wallet.address)
    chiadoCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.GNOSIS_CHARON, chiSigner)
    provider = new ethers.providers.JsonRpcProvider(polNode);
    wallet = new ethers.Wallet(process.env.PK, provider);
    let mumSigner = wallet.provider.getSigner(wallet.address)
    mumbaiCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.POLYGON_CHARON,mumSigner)
    p2e = await hre.ethers.getContractAt("charonAMM/contracts/bridges/POLtoETHBridge.sol:POLtoETHBridge", c.POLYGON_POLTOETHBRIDGE, mumSigner)
    e2p = await hre.ethers.getContractAt("charonAMM/contracts/bridges/ETHtoPOLBridge.sol:ETHtoPOLBridge",c.ETHEREUM_ETHTOPOLBRIDGE, gnoSigner)
    console.log("running daily checks")

let ethCfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", c.ETHEREUM_CFC, gnoSigner)
let chiCfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", c.GNOSIS_CFC, chiSigner)
let mumCfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", c.POLYGON_CFC, mumSigner)
cit = await hre.ethers.getContractAt("incentiveToken/contracts/Auction.sol:Auction", c.ETHEREUM_CIT, gnoSigner)
let ethChd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", c.ETHEREUM_CHD, gnoSigner)
let chiChd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", c.GNOSIS_CHD, chiSigner)
let mumChd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", c.POLYGON_CHD, mumSigner)

console.log( "my balance ETHEREUM pool tokens: ", ethers.utils.formatEther(await goerliCharon.balanceOf(myAddress)))
console.log( "my balance POLYGON pool tokens: ", ethers.utils.formatEther(await mumbaiCharon.balanceOf(myAddress)))
console.log( "my balance GNOSIS pool tokens: ", ethers.utils.formatEther(await chiadoCharon.balanceOf(myAddress)))

console.log( "my balance ETHEREUM CHD tokens: ", ethers.utils.formatEther(await ethChd.balanceOf(myAddress)))
console.log( "my balance POLYGON CHD tokens: ", ethers.utils.formatEther(await mumChd.balanceOf(myAddress)))
console.log( "my balance GNOSIS CHD tokens: ", ethers.utils.formatEther(await chiChd.balanceOf(myAddress)))

let myKeypair = new Keypair({privkey:process.env.PK, myHashFunc: poseidon});
console.log("my private balance ETHEREUM CHD", await getPrivateBalance(goerliCharon,myKeypair,5))
console.log("my private balance GNOSIS CHD", await getPrivateBalance(chiadoCharon,myKeypair,10200))
console.log("my private balance POLYGON CHD", await getPrivateBalance(mumbaiCharon,myKeypair,80001))

// console.log("my CIT balance")

console.log("ETHEREUM")
console.log("RecordBalance: ",ethers.utils.formatEther(await goerliCharon.recordBalance()))
console.log("RecordBalanceSynth: ",ethers.utils.formatEther(await goerliCharon.recordBalanceSynth()))
console.log("Total Supply: ",ethers.utils.formatEther(await goerliCharon.totalSupply()))
console.log("CHD Total Supply", ethers.utils.formatEther(await ethChd.totalSupply()))
console.log("CIT TotalSupply ", ethers.utils.formatEther(await cit.totalSupply()))

console.log("GNOSIS")
console.log("RecordBalance: ",ethers.utils.formatEther(await chiadoCharon.recordBalance()))
console.log("RecordBalanceSynth: ",ethers.utils.formatEther(await chiadoCharon.recordBalanceSynth()))
console.log("Total Supply: ",ethers.utils.formatEther(await chiadoCharon.totalSupply()))
console.log("CHD Total Supply", ethers.utils.formatEther(await chiChd.totalSupply()))

console.log("POLYGON")
console.log("RecordBalance: ",ethers.utils.formatEther(await mumbaiCharon.recordBalance()))
console.log("RecordBalanceSynth: ",ethers.utils.formatEther(await mumbaiCharon.recordBalanceSynth()))
console.log("Total Supply: ",ethers.utils.formatEther(await mumbaiCharon.totalSupply()))
console.log("CHD Total Supply", ethers.utils.formatEther(await mumChd.totalSupply()))
console.log("..all variables initialized correctly")

// if(Date.now()/1000 - await cit.endDate() > 0){console.log("CIT Auction is over and ready to start new round!")}

// let feePeriod = await cfc.getFeePeriods()
// let thisPeriod = await cfc.getFeePeriodByTimestamp(feePeriod[feePeriod.length - 1])
// if(Date.now()/1000 - thisPeriod.endDate > 0){console.log("fee period is ready for token balance reporting and distribution!")


let GNOCHDPrice = ethers.utils.formatEther(await chiadoCharon.getSpotPrice()) / xDaiPrice
let ETHCHDPrice = ethers.utils.formatEther(await goerliCharon.getSpotPrice()) / ethPrice
let POLCHDPrice = ethers.utils.formatEther(await mumbaiCharon.getSpotPrice()) / maticPrice

console.log("Gnosis CHD Price : ", GNOCHDPrice)
console.log("Ethereum CHD Price : ", ETHCHDPrice)
console.log("Polygon CHD Price : ", POLCHDPrice)
// What's the arb opportunity
// How many times was each function run in past day
// TVL / TDV
// Amount of CHD LP'd, free floating public / private

}

runChecks()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
