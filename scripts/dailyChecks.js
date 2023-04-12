require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
require("dotenv").config();
const web3 = require('web3');
//npx hardhat run scripts/dailyChecks.js --network mumbai
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

GNOSIS_VERIFIER2='0x7ff0A9F8ec9Ba82f9340DA55A846a12F220D1e41'
GNOSIS_VERIIFER16='0x9EDe7FDe2E135801012D019BAB586C342440dadF'
GNOSIS_HAHSER='0x9edAef26cB70A187926A2962A77c86522564A955'
GNOSIS_BASETOKEN='0x21d20B4c7dCb5521225F5036E0b27c4dF3F42aa3'
GNOSIS_CHARON='0x20301cC7f8d4c734Fd3EAa6038ee3693e0fe8443'
GNOSIS_CFC='0xbC2e8d236EaFd82496A38d729Bd182b71df31C8E'
GNOSIS_CHD='0xdB7d72AE7f59e25f16472e5ED210Ef4809F68a2c'
GNOSIS_TELLORBRIDGE='0x52Ed24159ced5Cfa64b115566215b5aBd4103A6F'
POLYGON_VERIFIER2='0x9df2325EE7341D0a30d65FDfD5EE4Aae87f972fe'
POLYGON_VERIIFER16='0x732aFAdE3D059349673c31d0D902A6a37bFba916'
POLYGON_HAHSER='0x96687ec01eB356EAA002b2c47B9a7a9F416C58a4'
POLYGON_BASETOKEN='0xDB08ef3B408e2Ba6Cc107dc69dE5EBcb168EFcfc'
POLYGON_CHARON='0x2157EE35E7ecc7B66Ad61B82A79d522a44B1aa84'
POLYGON_CFC='0x2A51B6F68c38625fa0404b2a7ebA8B773e1220A6'
POLYGON_CHD='0x5CB6D2cCdAafFa1e82A0Dc12159Dbf8421d5bdeB'
POLYGON_POLTOETHBRIDGE='0xFfED80cF5c45e7463AFd9e0fc664B5C6583B4363'
ETHEREUM_VERIFIER2='0x5dbb7D7A395c99675ac3e39B457eB9920a686e5B'
ETHEREUM_VERIIFER16='0xa062F7E9d43872Ed534a06e4E7b048759e5d9Af2'
ETHEREUM_HAHSER='0x511548e6F2B59FfAe590dFc079878Ca62A344C13'
ETHEREUM_BASETOKEN='0xf45412AE42B77f5C2547adDad4B69197f61C32F6'
ETHEREUM_CHARON='0x6E2eCf3adec22D80AC3f96479C734e6eB4DFD090'
ETHEREUM_CFC='0xD3f676ED12E83a8f627F2B18Ede76F16704904A0'
ETHEREUM_CHD='0xf55b9BF28107d65EC2D2b72f31Aae33f6A548EE7'
ETHEREUM_CIT='0x826c1A89F9A504631d81E41488B050C8B2Df56E7'
ETHEREUM_ETHTOPOLBRIDGE='0x2A51B6F68c38625fa0404b2a7ebA8B773e1220A6'
ETHEREUM_TELLORBRIDGE='0xBeD7029aF194cddc88eF2062Cf6A857349d7ebf2'


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
    goerliCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", ETHEREUM_CHARON, gnoSigner)
    provider = new ethers.providers.JsonRpcProvider(chiNode);
    wallet = new ethers.Wallet(process.env.PK, provider);
    let chiSigner = wallet.provider.getSigner(wallet.address)
    chiadoCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", GNOSIS_CHARON, chiSigner)
    provider = new ethers.providers.JsonRpcProvider(polNode);
    wallet = new ethers.Wallet(process.env.PK, provider);
    let mumSigner = wallet.provider.getSigner(wallet.address)
    mumbaiCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", POLYGON_CHARON,mumSigner)
    p2e = await hre.ethers.getContractAt("charonAMM/contracts/bridges/POLtoETHBridge.sol:POLtoETHBridge", POLYGON_POLTOETHBRIDGE, mumSigner)
    e2p = await hre.ethers.getContractAt("charonAMM/contracts/bridges/ETHtoPOLBridge.sol:ETHtoPOLBridge",ETHEREUM_ETHTOPOLBRIDGE, gnoSigner)
    console.log("running daily checks")

let ethCfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", ETHEREUM_CFC, gnoSigner)
let chiCfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", GNOSIS_CFC, chiSigner)
let mumCfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", POLYGON_CFC, mumSigner)
cit = await hre.ethers.getContractAt("incentiveToken/contracts/Auction.sol:Auction", ETHEREUM_CIT, gnoSigner)
let ethChd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", ETHEREUM_CHD, gnoSigner)
let chiChd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", GNOSIS_CHD, chiSigner)
let mumChd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", POLYGON_CHD, mumSigner)

//finalize
console.log( "my balance ETHEREUM pool tokens: ", ethers.utils.formatEther(await goerliCharon.balanceOf(myAddress)))
console.log( "my balance POLYGON pool tokens: ", ethers.utils.formatEther(await mumbaiCharon.balanceOf(myAddress)))
console.log( "my balance GNOSIS pool tokens: ", ethers.utils.formatEther(await chiadoCharon.balanceOf(myAddress)))


console.log( "my balance ETHEREUM CHD tokens: ", ethers.utils.formatEther(await ethChd.balanceOf(myAddress)))
console.log( "my balance POLYGON CHD tokens: ", ethers.utils.formatEther(await mumChd.balanceOf(myAddress)))
console.log( "my balance GNOSIS CHD tokens: ", ethers.utils.formatEther(await chiChd.balanceOf(myAddress)))
console.log("my CIT balance")

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
// console.log("..all variables initialized correctly")

// if(Date.now()/1000 - await cit.endDate() > 0){console.log("CIT Auction is over and ready to start new round!")}

// let feePeriod = await cfc.getFeePeriods()
// let thisPeriod = await cfc.getFeePeriodByTimestamp(feePeriod[feePeriod.length - 1])
// if(Date.now()/1000 - thisPeriod.endDate > 0){console.log("fee period is ready for token balance reporting and distribution!")


// What's the current price on each chain

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
