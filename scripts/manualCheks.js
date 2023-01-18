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

    if(_networkName == "mumbai"){
        tellor = "0x8f55D884CAD66B79e1a131f6bCB0e66f4fD84d5B"
        base = "https://mumbai.polygonscan.com/address/"
        baseToken = "0x23D57956cE5a07D60CbCA5CeceA8afC506DE013D"
        charon = "0x28af28Bb3C63Be91751cf64ac16E5b0f73A8aB10"
        chd = "0x0fB76cC2f59e4D582EE5EEa687a95f2a98Fb8198"
        oracle = "0x3b94C0a8ba635d4356b66bedE55C82115d9CaFEF"
        cfc = "0xA8c1184A981f1b517654EAE6fc0e0585BE7B91D7"
        cChainIDs = [5,10200]
        cAddys = ["0xdF76f7D5C15689ee175b1b73eF12855565bd07D3","0xD3e83D65a08220D9eEF8c8E1167A5E0881Df7550"]
    }
    else if(_networkName == "goerli"){
        tellor = "0xB3B662644F8d3138df63D2F43068ea621e2981f9"
        base = "https://goerli.etherscan.io/address/"
        baseToken = "0x524547A8f3188f8Be5c5699e5eC93E0693EA84b9"
        charon = "0xdF76f7D5C15689ee175b1b73eF12855565bd07D3"
        chd = "0x265c2099d01C0aD083D137F9300D511E99b813c5"
        cfc = "0x7eE7d9e3E8d9A9978E4da96BD49da6030Eb939b9"
        oracle = "0xbBB4148Cc9bde1c9b938AF6b225E8b5260D9078C"
        cChainIDs = [80001,10200]
        cAddys = ["0x28af28Bb3C63Be91751cf64ac16E5b0f73A8aB10","0xD3e83D65a08220D9eEF8c8E1167A5E0881Df7550"]
    }
    else if(_networkName == "chiado"){
        tellor = "0xd71F72C18767083e4e3FE84F9c62b8038C1Ef4f6"
        base = "https://blockscout.chiadochain.net/address/"
        baseToken = "0xAda4924b1B5803980CF3F45C2dE1c8DcafF9FBd5"
        charon = "0xD3e83D65a08220D9eEF8c8E1167A5E0881Df7550"
        chd = "0x9455DBaB68Ae3486768257a9744bC70B7Afc729b"
        cfc = "0xabD25adbF956a96C3A3130a3a0D0A20E684dC701"
        oracle = "0xa643c48A80FFEeF6Eb5868bc786aC81Eb132799d"
        cChainIDs = [5,80001]
        cAddys = ["0xdF76f7D5C15689ee175b1b73eF12855565bd07D3","0x28af28Bb3C63Be91751cf64ac16E5b0f73A8aB10"]
    }
    else{
        console.log("No network name ", _networkName, " found")
        process.exit(1)
    }
    await run("compile")
    console.log("running manual checks on :  ", _networkName)

//charonAMM
assert(await charon.oracle() == oracle.address, "oracle  address should be set")
assert(await charon.levels() == HEIGHT, "merkle Tree height should be set")
assert(await charon.hasher() == hasher.address, "hasher should be set")
assert(await charon.verifier2() == verifier2.address, "verifier2 should be set")
assert(await charon.verifier16() == verifier16.address, "verifier16 should be set")
assert(await charon.token() == token.address, "token should be set")
assert(await charon.fee() == fee, "fee should be set")
assert(await charon.controller() == cfc.address, "controller should be set")
assert(await charon.chainID() == 1, "chainID should be correct")
//finalize
assert(await charon.finalized(), "should be finalized")
assert(await charon.balanceOf(accounts[0].address) - web3.utils.toWei("100") == 0, "should have full balance")
assert(await charon.recordBalance() == web3.utils.toWei("100"), "record Balance should be set")
assert(await charon.recordBalanceSynth() == web3.utils.toWei("1000"), "record Balance synth should be set")
assert(await charon.chd() == chd3.address, "chd should be set")
let pC = await charon.getPartnerContracts();
assert(pC[0][0] == 1, "partner chain should be correct")
assert(pC[0][1] == charon.address, "partner address should be correct")

//cfc 
assert(await cfc.CIT() == cit.address, "cit should be set")
assert(await cfc.charon() == charon.address, "charon should be set")
assert(await cfc.oracle() == oracle.address, "tellor should be set")
assert(await cfc.toOracle() == web3.utils.toWei("10"), "toOracle should be set")
assert(await cfc.toLPs() == web3.utils.toWei("20"), "toLPs should be set")
assert(await cfc.toHolders() == web3.utils.toWei("50"), "toHolders should be set")
assert(await cfc.toUsers() == web3.utils.toWei("20"), "toUsers should be set")
let feePeriod = await cfc.feePeriods(0)
assert(feePeriod > 0, "first fee period shoud be set")
let thisPeriod = await cfc.getFeePeriodByTimestamp(feePeriod)
assert(thisPeriod.endDate - feePeriod == 0, "end date should be set")
assert(await cfc.token() == token.address, "base token should be set")
assert(await cfc.chd() ==chd.address, "chd should be set")

//cit
assert(await cit.bidToken() == token.address, "token should be set")
assert(await cit.mintAmount() == web3.utils.toWei("2000"), "mint amount should be set")
assert(await cit.auctionFrequency() == 86400*7, "auction frequency should be set")
assert(await cit.charonFeeContract() == cfc.address, "cfc should be set")
assert(await cit.endDate() > 0 , "first end date should be set")
assert(await cit.balanceOf(accounts[0].address) == web3.utils.toWei("100000"), "init supply should be minted")
assert(await cit.name() == "Charon Incentive Token", "name should be set")
assert(await cit.symbol() == "CIT", "symbol should be set")
console.log("..all variables initialized correctly")

Make a deposit to another chain
Make a trade
LP additional tokens
Launch governance token on top
Distribute token
Report values initial crossChainBalances
test Add fee
make bid
make sure proceeds are distributed properly in CFC
verify oracle contracts and other cross repo contracts are the same in each repo

}

finalizePools()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
