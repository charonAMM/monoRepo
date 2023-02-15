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
const { utils } = ethers
const Utxo = require('../src/utxo')
const { buildPoseidon } = require("circomlibjs");
const { prepareTransaction } = require('../src/index')

let tellor,base,baseToken,charon,chd,cit,cfc,builtPoseidon;
var fee = web3.utils.toWei(".02");//2%
var HEIGHT = 5;
var myAddress = "0xD109A7BD41F2bECE58885f1B04b607B5034FfbeD"
var b = "0x2a4eA8464bd2DaC1Ad4f841Dcc7A8EFB4d84A27d"

function poseidon(inputs){
    let val = builtPoseidon(inputs)
    return builtPoseidon.F.toString(val)
}

function poseidon2(a,b){
return poseidon([a,b])
}


async function runChecks() {
    let _networkName = hre.network.name
    let chainID = hre.network.config.chainId

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

    await run("compile")
    console.log("running manual checks on :  ", _networkName)

//charonAMM
charon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", charon)
cfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", cfc)
cit = await hre.ethers.getContractAt("incentiveToken/contracts/Auction.sol:Auction", cit)
baseToken = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", baseToken)
chd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", chd)
builtPoseidon = await buildPoseidon()

if(await charon.levels() != 5){console.log( "merkle Tree height should be set")}
if(await charon.token() != baseToken.address){console.log("token should be set")}
if(await charon.fee() != fee){console.log("fee should be set")}
if(await charon.controller() != cfc.address){console.log("controller should be set")}
if(await charon.chainID() != chainID){console.log("chainID should be correct")}
//finalize
if(await charon.finalized() == false){console.log("should be finalized")}
if(await charon.balanceOf(myAddress) - web3.utils.toWei("100") != 0){console.log( "should have full balance")}
if(await charon.recordBalance() != web3.utils.toWei("100")){console.log("record Balance should be set")}
if(await charon.recordBalanceSynth() != web3.utils.toWei("1000")){console.log("record Balance synth should be set")}
if(await charon.chd() != chd.address){console.log("chd should be set")}
let pC = await charon.getPartnerContracts();
if(pC[0][0] != cChainIDs[0]){console.log( "partner chain should be correct")}
if(pC[1][0]!= cChainIDs[1]){console.log( "partner chain should be correct")}
if(pC[0][1] !=  cAddys[0]){console.log("partner address should be correct")}
if(pC[1][1] !=  cAddys[1]){console.log("partner address should be correct2")}
//cfc 
if(await cfc.CIT() != cit.address){console.log( "cit should be set")}
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
if(_networkName == "_goerli"){
    if(await cit.bidToken() != baseToken.address){console.log("token should be set")}
    if(await cit.mintAmount() != web3.utils.toWei("10000")){console.log("mint amount should be set")}
    if(await cit.auctionFrequency() != 86400*30){console.log("auction frequency should be set")}
    if(await cit.charonFeeContract() != cfc.address){console.log("cfc should be set")}
    if(await cit.endDate() ==0){console.log("first end date should be set")}
    if(await cit.balanceOf(myAddress) != web3.utils.toWei("100000")){console.log("init supply should be minted")}
    if(await cit.name() != "Charon Incentive Token"){console.log("name should be set")}
    if(await cit.symbol() != "CIT"){console.log( "symbol should be set")}

    await cit.transfer(b, web3.utils.toWei("1"))
    console.log("cit transfer done")

    await baseToken.approve(cit.address,web3.utils.toWei("100"))
    await cit.bid(web3.utils.toWei("100"))
    console.log("bid successful")
}
console.log("..all variables initialized correctly")

let _depositAmount = utils.parseEther('10');
let recBal = await charon.recordBalance();
let recSynthBal = await charon.recordBalanceSynth();
await baseToken.mint(myAddress,web3.utils.toWei("100"))
let _amount = await charon.calcInGivenOut(recBal,
                                        recSynthBal,
                                        _depositAmount,
                                        fee)

await baseToken.approve(charon.address,_amount)
let aliceDepositUtxo = new Utxo({ amount: _depositAmount, myHashFunc: poseidon, chainID: cAddys[0] })
let inputData = await prepareTransaction({
charon,
inputs:[],
outputs: [aliceDepositUtxo],
account: {
    owner: myAddress,
    publicKey: aliceDepositUtxo.keypair.address(),
},
privateChainID: cChainIDs[0],
myHasherFunc: poseidon,
myHasherFunc2: poseidon2
})
let args = inputData.args
let extData = inputData.extData
await charon.depositToOtherChain(args,extData,false);
console.log("deposited to other chain succesfully ")

await baseToken.approve(charon.address,web3.utils.toWei("10"))
await charon.swap(false,web3.utils.toWei("10"),0,web3.utils.toWei("500"))
console.log("swap succesfully performed")

await chd.approve(charon.address,web3.utils.toWei("50"))
await baseToken.approve(charon.address,web3.utils.toWei("10"))
await charon.lpDeposit(web3.utils.toWei("0.5"),web3.utils.toWei("50"),web3.utils.toWei("10"))
console.log("successfully LPSingle")

await chd.transfer(b,web3.utils.toWei("1") )
console.log("chd transfer done")

await baseToken.mint(myAddress, web3.utils.toWei("200"))
await baseToken.approve(cfc.address,web3.utils.toWei("100"))
await cfc.addFees(web3.utils.toWei("100"),false);
console.log("fee added")

}

runChecks()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
