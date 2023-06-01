require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
require("dotenv").config();
const c = require("./contractAddys.js")
const web3 = require('web3');
const { utils } = ethers
const Utxo = require('../src/utxo')
const { buildPoseidon } = require("circomlibjs");
const { prepareTransaction } = require('../src/index');
const { Keypair } = require("../src/keypair");
//npx hardhat run scripts/manualRuns.js --network gnosis
let cit,builtPoseidon;
var fee = web3.utils.toWei(".006");//.6
var myAddress = process.env.MAINNETKEY

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
    let ethNode = process.env.NODE_URL_OPTIMISM;
    let polNode = process.env.NODE_URL_POLYGON;
    let chiNode = process.env.NODE_URL_GNOSIS;
    let provider = new ethers.providers.JsonRpcProvider(ethNode);
    let wallet = new ethers.Wallet(process.env.MAINPK, provider);
    let ethSigner = wallet.provider.getSigner(wallet.address)
    sepCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.ETHEREUM_CHARON, ethSigner)
    provider = new ethers.providers.JsonRpcProvider(chiNode);
    wallet = new ethers.Wallet(process.env.MAINPK, provider);
    let chiSigner = wallet.provider.getSigner(wallet.address)
    chiadoCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.GNOSIS_CHARON, chiSigner)
    provider = new ethers.providers.JsonRpcProvider(polNode);
    wallet = new ethers.Wallet(process.env.MAINPK, provider);
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
    let tellor, base, baseToken, charon, chd, cfc, cChainIDs;
    let _feeData = await hre.ethers.provider.getFeeData();
    delete _feeData.lastBaseFeePerGas
    delete _feeData.gasPrice
    tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
    if(_networkName == "polygon"){
        _feeData = {"gasPrice":160000000000}
        base = "https://polygonscan.com/address/"
        baseToken =  c.POLYGON_BASETOKEN
        charon =  c.POLYGON_CHARON
        chd =  c.POLYGON_CHD
        cfc =  c.POLYGON_CFC
        tellorBridge1 = c.POLYGON_TELLORBRIDGE1
        tellorBridge2 = c.POLYGON_TELLORBRIDGE2
        cChainIDs = [10,100]
        cAddys = [c.ETHEREUM_CHARON,c.GNOSIS_CHARON]
    }
    else if(_networkName == "optimism"){
        base = "https://optimistic.etherscan.io/address/"
        baseToken =  c.ETHEREUM_BASETOKEN
        charon =  c.ETHEREUM_CHARON
        chd =  c.ETHEREUM_CHD
        cfc =  c.ETHEREUM_CFC
        tellorBridge1 = c.ETHEREUM_TELLORBRIDGE1
        tellorBridge2 = c.ETHEREUM_TELLORBRIDGE2     
        cChainIDs = [137,100]
        cAddys = [c.POLYGON_CHARON,c.GNOSIS_CHARON]
    }
    else if(_networkName == "gnosis"){
        base = "https://blockscout.com/xdai/mainnet/address/"
        baseToken =  c.GNOSIS_BASETOKEN
        charon =  c.GNOSIS_CHARON
        chd =  c.GNOSIS_CHD
        cfc =  c.GNOSIS_CFC
        tellorBridge1 = c.GNOSIS_TELLORBRIDGE1
        tellorBridge2 = c.GNOSIS_TELLORBRIDGE2  
        cChainIDs = [10,137]
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
    console.log("using fee Data: ", _feeData)
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
    let _10Dollars
    _rand = getRandomInt(2)
    if(_networkName == "optimism"){
        _10Dollars = 10 / ethPrice
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
    }else if(_networkName == "polygon"){
        _10Dollars = 10 / maticPrice
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
    }else if(_networkName == "gnosis"){
        _10Dollars = 10 / xDaiPrice
        let topBid = await cit.currentTopBid()
        const now = Date.now();
        if(await cit.endDate()* 1000 - now < 0){
            await cit.estimateGas.startNewAuction();
            await cit.startNewAuction();
            await sleep(5000)
            console.log("new auction started")
        }else(
            console.log("new auction not started")
        )
        if(await cit.topBidder() != myAddress){
            amt = topBid.add(web3.utils.toWei(".1"))
            if(baseToken.balanceOf(myAddress) > amt){
                await baseToken.estimateGas.approve(cit.address,amt,_feeData);//will error out if throw
                await baseToken.approve(cit.address,amt,_feeData)
                await cit.estimateGas.bid(amt,_feeData)
                await cit.bid(amt,_feeData)
                await sleep(5000)
                console.log("bid successful")
            }else{
                console.log("don't have enought to be top bid")
            }
        } 
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
    _10Dollars = await web3.utils.toWei(String(_10Dollars), 'ether')
    if(_arbSwap){
        await chd.estimateGas.approve(charon.address,_10Dollars,_feeData)
        await chd.approve(charon.address,_10Dollars,_feeData)
        await sleep(5000)
        console.log("approved for swap : ", web3.utils.fromWei(_10Dollars))
        await charon.estimateGas.swap(true,_10Dollars,0,web3.utils.toWei("999999"),_feeData)
        await charon.swap(true,_10Dollars,0,web3.utils.toWei("999999"),_feeData)
        await sleep(5000)
        console.log("swap succesfully performed")
        console.log("sold CHD, arb swap performed")
    }
    if(_arbSwap2){
        await baseToken.estimateGas.approve(charon.address,_10Dollars,_feeData)
        await baseToken.approve(charon.address,_10Dollars,_feeData)
        await sleep(5000)
        console.log("approved for swap : ", web3.utils.fromWei(_10Dollars))
        await charon.estimateGas.swap(false,_10Dollars,0,web3.utils.toWei("999999"),_feeData)
        await charon.swap(false,_10Dollars,0,web3.utils.toWei("999999"),_feeData)
        await sleep(5000)
        console.log("swap succesfully performed")
        console.log("bought CHD, arb swap2 performed")
    }
    if(_deposit){
        let charon2 = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", cAddys[0])
        let _depositAmount = utils.parseEther('10');
        let recBal = await charon.recordBalance();
        let recSynthBal = await charon.recordBalanceSynth();
        _Camount = await charon.calcInGivenOut(recBal,
            recSynthBal,
            _depositAmount,
            fee)

        if(await baseToken.balanceOf(myAddress) > _Camount){
            await baseToken.estimateGas.approve(charon.address,_Camount,_feeData)
            await baseToken.approve(charon.address,_Camount,_feeData)
            await sleep(6000)
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
            await charon.estimateGas.depositToOtherChain(args,extData,false,_Camount,_feeData);
            await charon.depositToOtherChain(args,extData,false,_Camount,_feeData);
            await sleep(5000)
            console.log("deposited to other chain succesfully ")
        }
    }
    if(_deposit2){
        let charon2 = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", cAddys[1])
        let _depositAmount = utils.parseEther('10');
        let recBal = await charon.recordBalance();
        let recSynthBal = await charon.recordBalanceSynth();
        _Camount = await charon.calcInGivenOut(recBal,
                                                recSynthBal,
                                                _depositAmount,
                                                fee)
        if(await baseToken.balanceOf(myAddress) > _Camount){
            await baseToken.estimateGas.approve(charon.address,_Camount,_feeData)
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
            await charon.estimateGas.depositToOtherChain(args,extData,false,_Camount,_feeData);
            await charon.depositToOtherChain(args,extData,false,_Camount,_feeData);
            await sleep(5000)
            console.log("deposited to other chain succesfully2 ")
        }
    }
    if(_swap){
        let _Camount = web3.utils.toWei("1");
        if(await baseToken.balanceOf(myAddress) > _Camount){
            await baseToken.approve(charon.address,_Camount,_feeData)
            await sleep(5000)
            console.log("approved for swap : ", _Camount)
            await charon.estimateGas.swap(false,_Camount,0,web3.utils.toWei("999999"),_feeData)
            await charon.swap(false,_Camount,0,web3.utils.toWei("999999"),_feeData)
            await sleep(5000)
            console.log("swap succesfully performed")
        }
    }
    if(_lp){
        console.log("need to set up LP")
        // await chd.approve(charon.address,web3.utils.toWei("5000"),_feeData)
        // await sleep(5000)
        // await baseToken.approve(charon.address,web3.utils.toWei("1000"),_feeData)
        // await sleep(5000)
        // await charon.lpDeposit(web3.utils.toWei("0.5"),web3.utils.toWei("5000"),web3.utils.toWei("1000"),_feeData)
        // await sleep(5000)
        // console.log("successfully LPDeposit")
    }
}

runChecks()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
