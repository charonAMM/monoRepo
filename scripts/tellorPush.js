require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
const h = require("usingtellor/test/helpers/helpers.js");
require("dotenv").config();
const { abi } = require("usingtellor/artifacts/contracts/TellorPlayground.sol/TellorPlayground.json")
const c = require("./contractAddys.js");
const { ethers } = require("hardhat");
const abiCoder = new ethers.utils.AbiCoder()

//npx hardhat run scripts/tellorPush.js --network gnosis

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let submits = 0;
async function tellorSubmits(_charon1, _charon2, _tellor, _chain2, _index, _trb, _autopay, _tip){ //e.g. chi, sep, t on chi
    let _feeData = await hre.ethers.provider.getFeeData();
    delete _feeData.lastBaseFeePerGas
    delete _feeData.gasPrice
    console.log("using fee Data: ", _feeData)
    toSubmit = []
    inputIds = []
    let filter = _charon2.filters.DepositToOtherChain()
    let events = await _charon2.queryFilter(filter, startTime , "latest")
    filter = _charon1.filters.OracleDeposit()
    let  oracleEvents = await _charon1.queryFilter(filter, startTime , "latest")
    for(i = 0; i< oracleEvents.length; i++){
        thisId = parseInt(oracleEvents[i].args._inputData);
        inputIds.push(thisId);
    }
    for(i = 0; i< events.length; i++){
        if(inputIds.indexOf(events[i].args._depositId * 1) == -1){
                toSubmit.push(events[i].args._depositId)
        }
    }
    let _query,_value, _tx, _ts;
    for(i=0;i<toSubmit.length;i++){
        _query = await getTellorData(_tellor,_charon2.address,_chain2,toSubmit[i]);
        _value = await _charon2.getOracleSubmission(toSubmit[i]);
        _ts = await hre.ethers.provider.getBlock()
        _value = abiCoder.encode(['bytes', 'uint256'],[abiCoder.encode(['bytes'],[_value]),_ts.timestamp]);
        if(_query.nonce > 0){
            //check if 12 hours old
            _ts = await _tellor.getTimestampbyQueryIdandIndex(_query.queryId,0)
            //if yes do oracle deposit
            if(Date.now()/1000 - _ts > 86400/2){
                _encoded = await ethers.utils.AbiCoder.prototype.encode(['uint256'],[toSubmit[i]]);
                await _charon1.oracleDeposit(_index,_encoded,_feeData);
                await sleep(5000)
                console.log("oracleDeposit for id :", toSubmit[i])
            }else{
                console.log("need more time for Id: ",toSubmit[i])
            }
        }else{
            if(submits == 0){
                _tx = await _tellor.submitValue(_query.queryId, _value,0, _query.queryData,_feeData);
                await sleep(5000)
                console.log("submitting for id :", toSubmit[i])
                submits = 1
            }
            else{
                console.log("reporter in lock for ID: ", toSubmit[i])
                if(_trb.balanceOf(myAddress) > _tip){
                    await _trb.approve(_autopay.address,_tip,_feeData)
                    console.log("submitting approve")
                    await sleep(5000)
                    _tx - await _autopay.tip(_query.queryId,_tip,_query.queryData,_feeData)
                    await sleep(5000)
                    console.log("submitting tip for id :", toSubmit[i], " chainID", _chain2)
                }else{
                    console.log("need more TRB to tip!!")
                }
            }
         }
    }
}

async function tellorPush() {
    let _networkName = hre.network.name
    let tellor
    await run("compile")
    console.log("running oracle deposit on :  ", _networkName)
    eth_charon = c.ETHEREUM_CHARON
    chi_charon = c.GNOSIS_CHARON
    mum_charon = c.POLYGON_CHARON
    tellorAddress = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
    autopayAddress = "0x9BE9B0CFA89Ea800556C6efbA67b455D336db1D0"
    startTime = 0;
    //charonAMM
    let ethChain = 10
    let polChain = 137
    let gnoChain = 100
    if(_networkName == "optimism"){
        tokenAddress = "0xaf8cA653Fa2772d58f4368B0a71980e9E3cEB888"
    }else if(_networkName == "gnosis"){
        tokenAddress = "0xAAd66432d27737ecf6ED183160Adc5eF36aB99f2"
    }else if(_networkName == "polygon"){
        tokenAddress = "0xE3322702BEdaaEd36CdDAb233360B939775ae5f1"
    }
    tellor = await hre.ethers.getContractAt(abi, tellorAddress,hre.provider);
    autopay = await hre.ethers.getContractAt(abi2, autopayAddress,hre.provider);
    trb = await hre.ethers.getContractAt(abi2, tokenAddress,hre.provider);
    let ethNode = process.env.NODE_URL_OPTIMISM;
    let polNode = process.env.NODE_URL_POLYGON;
    let chiNode = process.env.NODE_URL_GNOSIS;
    let eprovider = new ethers.providers.JsonRpcProvider(ethNode);
    let ewallet = new ethers.Wallet(process.env.MAINPK, eprovider);
    let ethSigner = ewallet.provider.getSigner(ewallet.address)
    sepCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.ETHEREUM_CHARON, ethSigner)
    cprovider = new ethers.providers.JsonRpcProvider(chiNode);
    cwallet = new ethers.Wallet(process.env.MAINPK, cprovider);
    let chiSigner = cwallet.provider.getSigner(cwallet.address)
    chiadoCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.GNOSIS_CHARON, chiSigner)
    mprovider = new ethers.providers.JsonRpcProvider(polNode);
    mwallet = new ethers.Wallet(process.env.MAINPK, mprovider);
    let mumSigner = mwallet.provider.getSigner(mwallet.address)
    mumbaiCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.POLYGON_CHARON,mumSigner)

    if(_networkName == "gnosis"){
        charon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.GNOSIS_CHARON)
        await tellorSubmits(charon,sepCharon,tellor,ethChain,0, trb, autopay, ethers.utils.parseEther(".1"));
        await tellorSubmits(charon,mumbaiCharon,tellor, polChain,1,trb, autopay, ethers.utils.parseEther(".1"));
        console.log("tellorPush finished on gnosis")
    }else if(_networkName == "optimism"){
        charon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.ETHEREUM_CHARON)
        await tellorSubmits(charon,chiadoCharon,tellor, gnoChain,1,trb, autopay, ethers.utils.parseEther(".1"));
        await tellorSubmits(charon,mumbaiCharon,tellor, polChain,0,trb, autopay, ethers.utils.parseEther(".1"));
        console.log("tellorPush finished on optimism")
    }else if(_networkName == "polygon"){
        charon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.POLYGON_CHARON)
        await tellorSubmits(charon,sepCharon,tellor, ethChain,0,trb, autopay, ethers.utils.parseEther(".1"));
        await tellorSubmits(charon,chiadoCharon,tellor, gnoChain,1,trb, autopay, ethers.utils.parseEther(".1"));
        console.log("tellorPush finished on polygon")
    }
}

async function getTellorData(tInstance,cAddress,chain,depositID){
    let ABI = ["function getOracleSubmission(uint256 _depositId)"];
    let iface = new ethers.utils.Interface(ABI);
    let funcSelector = iface.encodeFunctionData("getOracleSubmission", [depositID])

    queryData = abiCoder.encode(
        ['string', 'bytes'],
        ['EVMCall', abiCoder.encode(
            ['uint256','address','bytes'],
            [chain,cAddress,funcSelector]
        )]
        );
        queryId = h.hash(queryData)
        nonce = await tInstance.getNewValueCountbyQueryId(queryId)
        return({queryData: queryData,queryId: queryId,nonce: nonce})
  }

tellorPush()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
