require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
const abiCoder = new ethers.utils.AbiCoder()
const h = require("usingtellor/test/helpers/helpers.js");
require("dotenv").config();
const { abi } = require("usingtellor/artifacts/contracts/TellorPlayground.sol/TellorPlayground.json")
const c = require("./contractAddys.js")

//npx hardhat run scripts/tellorPush.js --network chiado

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
let submits = 0;
async function tellorSubmits(_charon1, _charon2, _tellor, _chain2, _index){ //e.g. chi, sep, t on chi
    let _feeData = await hre.ethers.provider.getFeeData();
    delete _feeData.lastBaseFeePerGas
    delete _feeData.gasPrice
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
        if(inputIds.indexOf(events[i].args._depositId * 1) == -1 && events[i].args._depositId * 1 > 2){
                toSubmit.push(events[i].args._depositId)
        }
    }
    let _query,_value, _tx, _ts;
    for(i=0;i<toSubmit.length;i++){
        _query = await getTellorData(_tellor,_charon2.address,_chain2,toSubmit[i]);
        _value = await _charon2.getOracleSubmission(toSubmit[i]);
        _ts = await hre.ethers.provider.getBlock()
        _value = abiCoder.encode(['bytes', 'uint256'],[_value,_ts.timestamp]);
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
    startTime = 0;
    if(_networkName == "sepolia"){
        tellorAddress = "0x199839a4907ABeC8240D119B606C98c405Bb0B33"
    }
    //charonAMM
    let sepChain = 11155111
    let mumChain = 80001
    let chiChain = 10200
    tellor = await hre.ethers.getContractAt(abi, tellorAddress,hre.provider);
    let ethNode = process.env.NODE_URL_SEPOLIA;
    let polNode = process.env.NODE_URL_MUMBAI;
    let chiNode = process.env.NODE_URL_CHIADO;
    let eprovider = new ethers.providers.JsonRpcProvider(ethNode);
    let ewallet = new ethers.Wallet(process.env.PK, eprovider);
    let ethSigner = ewallet.provider.getSigner(ewallet.address)
    sepCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.ETHEREUM_CHARON, ethSigner)
    cprovider = new ethers.providers.JsonRpcProvider(chiNode);
    cwallet = new ethers.Wallet(process.env.PK, cprovider);
    let chiSigner = cwallet.provider.getSigner(cwallet.address)
    chiadoCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.GNOSIS_CHARON, chiSigner)
    mprovider = new ethers.providers.JsonRpcProvider(polNode);
    mwallet = new ethers.Wallet(process.env.PK, mprovider);
    let mumSigner = mwallet.provider.getSigner(mwallet.address)
    mumbaiCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.POLYGON_CHARON,mumSigner)

    if(_networkName == "chiado"){
        charon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.GNOSIS_CHARON)
        await tellorSubmits(charon,sepCharon,tellor,sepChain,0);
        await tellorSubmits(charon,mumbaiCharon,tellor, mumChain,1);
        console.log("tellorPush finished on chiado")
    }else if(_networkName == "sepolia"){
        charon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.ETHEREUM_CHARON)
        await tellorSubmits(charon,chiadoCharon,tellor, chiChain,1);
        await tellorSubmits(charon,mumbaiCharon,tellor, mumChain,0);
        console.log("tellorPush finished on sepolia")
    }else if(_networkName == "mumbai"){
        charon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.POLYGON_CHARON)
        await tellorSubmits(charon,sepCharon,tellor, sepChain,0);
        await tellorSubmits(charon,chiadoCharon,tellor, chiChain,1);
        console.log("tellorPush finished on mumbai")
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
