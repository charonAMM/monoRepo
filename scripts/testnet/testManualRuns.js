require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
require("dotenv").config();
const c = require("./testAddys.js")
const web3 = require('web3');
const HASH = require("../../build/Hasher.json");
const { utils } = ethers
const Utxo = require('../../src/utxo')
const { buildPoseidon } = require("circomlibjs");
const { BigNumber } = require("ethers")
const { prepareTransaction } = require('../../src/index');
const { Keypair } = require("../../src/keypair");
//npx hardhat run scripts/testnet/testManualRuns.js --network mumbai
let cit,builtPoseidon;
var fee = web3.utils.toWei(".006");//.6
var myAddress = process.env.PUBLICKEY

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

function poseidon(inputs){
    let val = builtPoseidon(inputs)
    return builtPoseidon.F.toString(val)
}

function poseidon2(a,b){
return poseidon([a,b])
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
    let ethNode = process.env.NODE_URL_SEPOLIA;
    let polNode = process.env.NODE_URL_MUMBAI;
    let chiNode = process.env.NODE_URL_CHIADO;
    let provider = new ethers.providers.JsonRpcProvider(ethNode);
    let wallet = new ethers.Wallet(process.env.PK, provider);
    let ethSigner = wallet.provider.getSigner(wallet.address)
    sepCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.ETHEREUM_CHARON, ethSigner)
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
let ETHCHDPrice = ethers.utils.formatEther(await sepCharon.getSpotPrice()) / ethPrice
let POLCHDPrice = ethers.utils.formatEther(await mumbaiCharon.getSpotPrice()) / maticPrice
let midCHDPrice = (GNOCHDPrice + ETHCHDPrice + POLCHDPrice) / 3
console.log("GnosisCHDPrice", GNOCHDPrice)
console.log("ETHCHDPrice",ETHCHDPrice)
console.log("POLCHDPrice",POLCHDPrice)
console.log("midPrice", midCHDPrice);

    let _networkName = hre.network.name
    cit =  c.CIT
    let _amount,tellor, base, baseToken, charon, chd, cfc, cChainIDs;
    tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
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
    let _feeData = await hre.ethers.provider.getFeeData();
    delete _feeData.lastBaseFeePerGas
    delete _feeData.gasPrice
    _lp = false
    _lpCHD = false
    _deposit = false
    _deposit2 = false
    _swap = false
    _chdSwap = false
    _withdraw = false
    _withdrawCHD = false
    _arbSwap = false
    _arbSwap2 = false
    _rand = getRandomInt(2)
    if(_networkName == "sepolia"){
        let topBid = await cit.currentTopBid()
        let amt = topBid.add(web3.utils.toWei("1"))
        await baseToken.mint(myAddress, amt);
        await baseToken.approve(cit.address,amt,_feeData)
        await cit.bid(amt,_feeData)
        console.log("bid successful")
        const now = Date.now();
        if(await cit.endDate()* 1000 - now < 0){
            await cit.startNewAuction();
            console.log("new auction started")
        }else(
            console.log("new auction not started")
        )
        if(ETHCHDPrice > midCHDPrice * 1.05){
            _arbSwap = true
        }else if (ETHCHDPrice < midCHDPrice * .95){
            _arbSwap2 = true
        }
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
        if(POLCHDPrice > midCHDPrice * 1.05){
            _arbSwap = true
        }else if (POLCHDPrice < midCHDPrice * .95){
            _arbSwap2 = true
        }
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
      if(POLCHDPrice > GNOCHDPrice){
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
    }else if(_networkName == "chiado"){
        if(GNOCHDPrice > midCHDPrice * 1.05){
            _arbSwap = true
        }else if (GNOCHDPrice < midCHDPrice * .95){
            _arbSwap2 = true
        }
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
        if(GNOCHDPrice > POLCHDPrice){
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
                _deposit2 = true
            }
            else{
                _lpCHD = true
            }
        }
    }
    if(_arbSwap){
        await chd.approve(charon.address,web3.utils.toWei("10"),_feeData)
        await sleep(5000)
        console.log("approved for swap : ", web3.utils.toWei("10"))
        await charon.swap(true,web3.utils.toWei("10"),0,web3.utils.toWei("999999"),_feeData)
        await sleep(5000)
        console.log("swap succesfully performed")
        console.log("sold CHD, arb swap performed")
    }
    if(_arbSwap2){
        await baseToken.approve(charon.address,web3.utils.toWei("10"),_feeData)
        await sleep(5000)
        console.log("approved for swap : ", web3.utils.toWei("10"))
        await charon.swap(false,web3.utils.toWei("10"),0,web3.utils.toWei("999999"),_feeData)
        await sleep(5000)
        console.log("swap succesfully performed")
        console.log("bought CHD, arb swap2 performed")
    }
    if(_deposit){
        let charon2 = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", cAddys[0])
        let _depositAmount = utils.parseEther('10');
        let recBal = await charon.recordBalance();
        let recSynthBal = await charon.recordBalanceSynth();
        await baseToken.mint(myAddress,web3.utils.toWei("100"),_feeData)
        sleep(5000)
        console.log("tokens minted")
        _Camount = await charon.calcInGivenOut(recBal,
                                                recSynthBal,
                                                _depositAmount,
                                                fee)
        await sleep(5000)
        await baseToken.approve(charon.address,_Camount,_feeData)
        await sleep(5000)
        console.log("tokens approved")
        let myKey = await new Keypair({privkey:process.env.PK, myHashFunc:poseidon})
        let aliceDepositUtxo = new Utxo({ amount: _depositAmount,keypair:myKey, myHashFunc: poseidon, chainID:cChainIDs[0] })
        let inputData = await prepareTransaction({
            charon:charon2,
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
        await charon.depositToOtherChain(args,extData,false,_Camount,_feeData);
        await sleep(5000)
        console.log("deposited to other chain succesfully ")
    }
    if(_deposit2){
        let charon2 = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", cAddys[1])
        let _depositAmount = utils.parseEther('10');
        let recBal = await charon.recordBalance();
        let recSynthBal = await charon.recordBalanceSynth();
        await baseToken.mint(myAddress,web3.utils.toWei("100"),_feeData)
        await sleep(5000)
        console.log("tokens minted")
        _Camount = await charon.calcInGivenOut(recBal,
                                                recSynthBal,
                                                _depositAmount,
                                                fee)
    
        await baseToken.approve(charon.address,_Camount,_feeData)
        await sleep(5000)
        console.log("tokens approved")
        let myKey = new Keypair({ privkey: process.env.PK, myHashFunc: poseidon })
        let aliceDepositUtxo = new Utxo({ amount: _depositAmount,keypair:myKey, myHashFunc: poseidon, chainID:cChainIDs[1] })
        let inputData = await prepareTransaction({
            charon:charon2,
            inputs:[],
            outputs: [aliceDepositUtxo],
            account: {
                owner: myAddress,
                publicKey: aliceDepositUtxo.keypair.address(),
            },
            privateChainID: cChainIDs[1],
            myHasherFunc: poseidon,
            myHasherFunc2: poseidon2
        })
        let args = inputData.args
        let extData = inputData.extData
        await charon.depositToOtherChain(args,extData,false,_Camount,_feeData);
        await sleep(5000)
        console.log("deposited to other chain succesfully2 ")
    }
    if(_swap){
        await baseToken.approve(charon.address,web3.utils.toWei("1"),_feeData)
        await sleep(5000)
        console.log("approved for swap : ", web3.utils.toWei("1"))
        await charon.swap(false,web3.utils.toWei("1"),0,web3.utils.toWei("999999"),_feeData)
        await sleep(5000)
        console.log("swap succesfully performed")
    }
    if(_lp){
        await chd.approve(charon.address,web3.utils.toWei("5000"),_feeData)
        await sleep(5000)
        await baseToken.approve(charon.address,web3.utils.toWei("1000"),_feeData)
        await sleep(5000)
        await charon.lpDeposit(web3.utils.toWei("0.5"),web3.utils.toWei("5000"),web3.utils.toWei("1000"),_feeData)
        await sleep(5000)
        console.log("successfully LPDeposit")
    }
}

runChecks()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
