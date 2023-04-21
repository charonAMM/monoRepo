require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
require("dotenv").config();
const c = require("./contractAddys.js")
const web3 = require('web3');
const HASH = require("../build/Hasher.json");
const { utils } = ethers
const Utxo = require('../src/utxo')
const { buildPoseidon } = require("circomlibjs");
const { BigNumber } = require("ethers")
const { prepareTransaction } = require('../src/index');
const { Keypair } = require("../src/keypair");
//npx hardhat run scripts/manualRuns.js --network mumbai
let tellor,base,baseToken,charon,chd,cit,cfc,builtPoseidon;
var fee = web3.utils.toWei(".006");//.6
var HEIGHT = 23;
var myAddress = "0xD109A7BD41F2bECE58885f1B04b607B5034FfbeD"
var b = "0x2a4eA8464bd2DaC1Ad4f841Dcc7A8EFB4d84A27d"
let myKeypair

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

let GNOCHDPrice = ethers.utils.formatEther(await chiadoCharon.getSpotPrice()) / xDaiPrice
let ETHCHDPrice = ethers.utils.formatEther(await goerliCharon.getSpotPrice()) / ethPrice
let POLCHDPrice = ethers.utils.formatEther(await mumbaiCharon.getSpotPrice()) / maticPrice
console.log("GnosisCHDPrice", GNOCHDPrice)
console.log("ETHCHDPrice",ETHCHDPrice)
console.log("POLCHDPrice",POLCHDPrice)

    let _networkName = hre.network.name
    cit =  c.ETHEREUM_CIT
    let _amount,tellor, base, baseToken, charon, chd, cfc, cChainIDs;
    tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
    if(_networkName == "mumbai"){
        base = "https://mumbai.polygonscan.com/address/"
        baseToken =  c.POLYGON_BASETOKEN
        charon =  c.POLYGON_CHARON
        chd =  c.POLYGON_CHD
        cfc =  c.POLYGON_CFC
        cChainIDs = [5]
    }
    else if(_networkName == "goerli"){
        base = "https://goerli.etherscan.io/address/"
        baseToken =  c.ETHEREUM_BASETOKEN
        charon =  c.ETHEREUM_CHARON
        chd =  c.ETHEREUM_CHD
        cfc =  c.ETHEREUM_CFC
        cChainIDs = [80001,10200]
    }
    else if(_networkName == "chiado"){
        base = "https://blockscout.chiadochain.net/address/"
        baseToken =  c.GNOSIS_BASETOKEN
        charon =  c.GNOSIS_CHARON
        chd =  c.GNOSIS_CHD
        cfc =  c.GNOSIS_CFC
        cChainIDs = [5]
    }
    else{
        console.log("No network name ", _networkName, " found")
        process.exit(1)
    }

    await run("compile")
    console.log("running daily runs on :  ", _networkName)

    charon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", charon)
    cfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", cfc)
    cit = await hre.ethers.getContractAt("incentiveToken/contracts/Auction.sol:Auction", cit)
    baseToken = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", baseToken)
    chd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", chd)
    builtPoseidon = await buildPoseidon()
    _lp = false
    _lpCHD = false
    _deposit = false
    _deposit2 = false
    _swap = false
    _chdSwap = false
    _withdraw = false
    _withdrawCHD = false
    _rand = Math.floor(ETHCHDPrice) % 2
    if(_networkName == "goerli"){
        let topBid = await cit.currentTopBid()
        await baseToken.approve(cit.address,topBid + web3.utils.toWei("1"))
        await cit.bid(topBid + web3.utils.toWei("1"))
        console.log("bid successful")
        if(ETHCHDPrice > POLCHDPrice){
            if (_rand == 1){
                _swap = true
                _deposit = true
            }
            else{
                _lp = true
            }
        }
        else{
            if (_rand == 1){
                _chdSwap = true
            }
            else{
                _lpCHD = true
            }
        }
        if(ETHCHDPrice > GNOCHDPrice){
            if (_rand == 1){
                _swap = true
                _deposit2 = true
            }
            else{
                _lp = true
            }
        }
        else{
            if (_rand == 1){
                _chdSwap = true
            }
            else{
                _lpCHD = true
            }
        }
    }else if(_networkName == "mumbai"){
        if(POLCHDPrice > ETHCHDPrice){
            if (_rand == 1){
                _swap = true
                _deposit = true
            }
            else{
                _lp = true
            }
        }
        else{
            if (_rand == 1){
                _chdSwap = true
            }
            else{
                _lpCHD = true
            }
        }
    }else if(_networkName == "chiado"){
        if(GNOCHDPrice > ETHCHDPrice){
            if (_rand == 1){
                _swap = true
                _deposit = true
            }
            else{
                _lp = true
            }
        }
        else{
            if (_rand == 1){
                _chdSwap = true
            }
            else{
                _lpCHD = true
            }
        }
    }
    if(_deposit){
        let _depositAmount = utils.parseEther('10');
        let recBal = await charon.recordBalance();
        let recSynthBal = await charon.recordBalanceSynth();
        await baseToken.mint(myAddress,web3.utils.toWei("100"))
        console.log("tokens minted")
        _Camount = await charon.calcInGivenOut(recBal,
                                                recSynthBal,
                                                _depositAmount,
                                                fee)
    
        await baseToken.approve(charon.address,_Camount)
        console.log("tokens approved")
        let myKey = await new Keypair({privkey:process.env.PK, myHashFunc:poseidon})
        let aliceDepositUtxo = new Utxo({ amount: _depositAmount,keypair:myKey, myHashFunc: poseidon, chainID:cChainIDs[0] })
        let inputData = await prepareTransaction({
            charon:charon,
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
        await charon.depositToOtherChain(args,extData,false,_Camount);
        console.log("deposited to other chain succesfully ")
    }
    if(_swap){
        _adjAmount = BigNumber.from(_amount).div(50)
        await baseToken.approve(charon.address,_adjAmount)
        console.log("approved for swap : ", _adjAmount)
        await charon.swap(false,_adjAmount,0,web3.utils.toWei("999999"))
        console.log("swap succesfully performed")
    }
    if(_lp){
        await chd.approve(charon.address,web3.utils.toWei("5000"))
        await baseToken.approve(charon.address,web3.utils.toWei("1000"))
        await charon.lpDeposit(web3.utils.toWei("0.5"),web3.utils.toWei("5000"),web3.utils.toWei("1000"))
        console.log("successfully LPDeposit")
    }
}

runChecks()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
