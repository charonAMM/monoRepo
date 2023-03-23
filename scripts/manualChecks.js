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
//npx hardhat run scripts/manualChecks.js --network mumbai
let tellor,base,baseToken,charon,chd,cit,cfc,builtPoseidon;
var fee = web3.utils.toWei(".006");//.6
var HEIGHT = 23;
var myAddress = "0xD109A7BD41F2bECE58885f1B04b607B5034FfbeD"
var b = "0x2a4eA8464bd2DaC1Ad4f841Dcc7A8EFB4d84A27d"

function poseidon(inputs){
    let val = builtPoseidon(inputs)
    return builtPoseidon.F.toString(val)
}

function poseidon2(a,b){
return poseidon([a,b])
}

let chdMint = web3.utils.toWei("10000")
let gnoAmount = web3.utils.toWei("10000")
let ethAmount = web3.utils.toWei("5.54")
let polAmount = web3.utils.toWei("8695.65")

async function runChecks() {
    let _networkName = hre.network.name
    let chainID = hre.network.config.chainId
    cit =  "0x826c1A89F9A504631d81E41488B050C8B2Df56E7"
    e2p =  "0x2A51B6F68c38625fa0404b2a7ebA8B773e1220A6"
    p2e =  "0xFfED80cF5c45e7463AFd9e0fc664B5C6583B4363"
    let _amount,myContract, tellor, base, baseToken, charon, chd, cfc, cChainIDs, cAddys;

    if(_networkName == "mumbai"){
        tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
        base = "https://mumbai.polygonscan.com/address/"

        baseToken =  "0xDB08ef3B408e2Ba6Cc107dc69dE5EBcb168EFcfc"
        charon =  "0x2157EE35E7ecc7B66Ad61B82A79d522a44B1aa84"
        chd =  "0x5CB6D2cCdAafFa1e82A0Dc12159Dbf8421d5bdeB"
        cfc =  "0x2A51B6F68c38625fa0404b2a7ebA8B773e1220A6"

        cChainIDs = [5]
        cAddys = ["0x6E2eCf3adec22D80AC3f96479C734e6eB4DFD090"]

        _amount = polAmount;
        myContract = await hre.ethers.getContractAt("charonAMM/contracts/bridges/POLtoETHBridge.sol:POLtoETHBridge", p2e)
        if(await myContract.charon() != charon){console.log("charon should be set correctly")}
        if(await myContract.fxRootTunnel() != e2p){console.log("fxRootTunnel should be set correctly")}
    }

    else if(_networkName == "goerli"){
        tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
        base = "https://goerli.etherscan.io/address/"

        baseToken =  "0xf45412AE42B77f5C2547adDad4B69197f61C32F6"
        charon =  "0x6E2eCf3adec22D80AC3f96479C734e6eB4DFD090"
        chd =  "0xf55b9BF28107d65EC2D2b72f31Aae33f6A548EE7"
        cfc =  "0xD3f676ED12E83a8f627F2B18Ede76F16704904A0"
        tellorBridge =  "0xBeD7029aF194cddc88eF2062Cf6A857349d7ebf2"

        cChainIDs = [80001,10200]
        cAddys = ["0x2157EE35E7ecc7B66Ad61B82A79d522a44B1aa84","0x20301cC7f8d4c734Fd3EAa6038ee3693e0fe8443"]
        _amount = ethAmount

        myContract = await hre.ethers.getContractAt("charonAMM/contracts/bridges/ETHtoPOLBridge.sol:ETHtoPOLBridge",e2p)
        await myContract.setCharon(charon);
        if(await myContract.charon() != charon){console.log("charon should be set correctly")}
        if(await myContract.fxChildTunnel() != p2e){console.log("fxChildTunnel should be set correctly")}

        tellorBridge = "0x38810dd60cDD61ab8a50Fd2B98BceB9690114a82"
        myContract = await hre.ethers.getContractAt("charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge", tellorBridge)
        if(await myContract.connectedChainId() != 10200){console.log("connectedChainId should be set correctly")}
    }
    else if(_networkName == "chiado"){
        tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
        base = "https://blockscout.chiadochain.net/address/"

        baseToken =  "0x21d20B4c7dCb5521225F5036E0b27c4dF3F42aa3"
        charon =  "0x20301cC7f8d4c734Fd3EAa6038ee3693e0fe8443"
        chd =  "0xdB7d72AE7f59e25f16472e5ED210Ef4809F68a2c"
        cfc =  "0xbC2e8d236EaFd82496A38d729Bd182b71df31C8E"
        tellorBridge =  "0x52Ed24159ced5Cfa64b115566215b5aBd4103A6F"

        cChainIDs = [5]
        cAddys = ["0x6E2eCf3adec22D80AC3f96479C734e6eB4DFD090"]
        _amount = gnoAmount

        myContract = await hre.ethers.getContractAt("charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge", tellorBridge)
        if(await myContract.connectedChainId() != 5){console.log("connectedChainId should be set correctly")}
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
if(_networkName == "goerli"){
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


// if(_networkName == "_goerli"){
//     await cit.transfer(b, web3.utils.toWei("1"))
//     console.log("cit transfer done")

//     await baseToken.approve(cit.address,web3.utils.toWei("100"))
//     await cit.bid(web3.utils.toWei("100"))
//     console.log("bid successful")
// }

// let _depositAmount = utils.parseEther('10');
// let recBal = await charon.recordBalance();
// let recSynthBal = await charon.recordBalanceSynth();
// await baseToken.mint(myAddress,web3.utils.toWei("100"))
// let _amount = await charon.calcInGivenOut(recBal,
//                                         recSynthBal,
//                                         _depositAmount,
//                                         fee)

// await baseToken.approve(charon.address,_amount)
// let aliceDepositUtxo = new Utxo({ amount: _depositAmount, myHashFunc: poseidon, chainID: cAddys[0] })
// let inputData = await prepareTransaction({
// charon,
// inputs:[],
// outputs: [aliceDepositUtxo],
// account: {
//     owner: myAddress,
//     publicKey: aliceDepositUtxo.keypair.address(),
// },
// privateChainID: cChainIDs[0],
// myHasherFunc: poseidon,
// myHasherFunc2: poseidon2
// })
// let args = inputData.args
// let extData = inputData.extData
// await charon.depositToOtherChain(args,extData,false);
// console.log("deposited to other chain succesfully ")

// await baseToken.approve(charon.address,web3.utils.toWei("10"))
// await charon.swap(false,web3.utils.toWei("10"),0,web3.utils.toWei("500"))
// console.log("swap succesfully performed")

// await chd.approve(charon.address,web3.utils.toWei("50"))
// await baseToken.approve(charon.address,web3.utils.toWei("10"))
// await charon.lpDeposit(web3.utils.toWei("0.5"),web3.utils.toWei("50"),web3.utils.toWei("10"))
// console.log("successfully LPSingle")

// await chd.transfer(b,web3.utils.toWei("1") )
// console.log("chd transfer done")

// await baseToken.mint(myAddress, web3.utils.toWei("200"))
// await baseToken.approve(cfc.address,web3.utils.toWei("100"))
// await cfc.addFees(web3.utils.toWei("100"),false);
// console.log("fee added")

}

runChecks()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
