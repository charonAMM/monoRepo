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

let tellor,base,myContract,baseToken,charon,oracle,chd,cit,cfc,builtPoseidon;
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
        cAddys = ["0x1Ed985e19AC90038885D45216f38A6a23FaF174b","0x5C69551859E27E93f8f4179Fb87691fe6FF292bC"]
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
        cAddys = ["0xDf1163e76105548a9B71829Ac7d7e8fB83874FB0","0x5C69551859E27E93f8f4179Fb87691fe6FF292bC"]
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
        cAddys = ["0x1Ed985e19AC90038885D45216f38A6a23FaF174b","0xDf1163e76105548a9B71829Ac7d7e8fB83874FB0"]
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
oracle = await hre.ethers.getContractAt("charonAMM/contracts/helpers/Oracle.sol:Oracle", oracle)
builtPoseidon = await buildPoseidon()

if(await charon.oracle() != oracle.address){console.log( "oracle  address should be set")}
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
if(await cfc.oracle() != oracle.address){console.log("tellor should be set")}
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
if(await cit.bidToken() != baseToken.address){console.log("token should be set")}
if(await cit.mintAmount() != web3.utils.toWei("10000")){console.log("mint amount should be set")}
if(await cit.auctionFrequency() != 86400*30){console.log("auction frequency should be set")}
if(await cit.charonFeeContract() != cfc.address){console.log("cfc should be set")}
if(await cit.endDate() ==0){console.log("first end date should be set")}
if(await cit.balanceOf(myAddress) != web3.utils.toWei("100000")){console.log("init supply should be minted")}
if(await cit.name() != "Charon Incentive Token"){console.log("name should be set")}
if(await cit.symbol() != "CIT"){console.log( "symbol should be set")}
console.log("..all variables initialized correctly")
//     let _depositAmount = utils.parseEther('10');
//     let recBal = await charon.recordBalance();
//     let recSynthBal = await charon.recordBalanceSynth();
//     await baseToken.mint(myAddress,web3.utils.toWei("100"))
//     let _amount = await charon.calcInGivenOut(recBal,
//                                             recSynthBal,
//                                             _depositAmount,
//                                             fee)

//     await baseToken.approve(charon.address,_amount)
//     let aliceDepositUtxo = new Utxo({ amount: _depositAmount, myHashFunc: poseidon, chainID: cAddys[0] })
//     let inputData = await prepareTransaction({
//     charon,
//     inputs:[],
//     outputs: [aliceDepositUtxo],
//     account: {
//         owner: myAddress,
//         publicKey: aliceDepositUtxo.keypair.address(),
//     },
//     privateChainID: cAddys[0],
//     myHasherFunc: poseidon,
//     myHasherFunc2: poseidon2
//     })
//     let args = inputData.args
//     let extData = inputData.extData
//     await charon.depositToOtherChain(args,extData,false);
// console.log("deposited to other chain succesfully ")

    await baseToken.approve(charon.address,web3.utils.toWei("10"))
    await charon.swap(false,web3.utils.toWei("10"),0,web3.utils.toWei("500"))
console.log("swap succesfully performed")
await chd.approve(charon.address,web3.utils.toWei("50"))
await baseToken.approve(charon.address,web3.utils.toWei("10"))
await charon.lpDeposit(web3.utils.toWei("0.5"),web3.utils.toWei("50"),web3.utils.toWei("10"))
console.log("successfully LPSingle")
// await chd.transfer(b,web3.utils.toWei("1") )
// console.log("chd transfer done")

// await cit.transfer(b, web3.utils.toWei("1"))
// console.log("cit transfer done")
// await baseToken.mint(myAddress, web3.utils.toWei("200"))
// await baseToken.approve(cfc.address,web3.utils.toWei("100"))
// await cfc.addFees(web3.utils.toWei("100"),false);
// console.log("fee added")
// await baseToken.approve(cit.address,web3.utils.toWei("100"))
// await cit.bid(web3.utils.toWei("100"))
// console.log("bid successful")

}

runChecks()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
