require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
const abiCoder = new ethers.utils.AbiCoder()
const h = require("usingtellor/test/helpers/helpers.js");
require("dotenv").config();
const web3 = require('web3');
const { abi, bytecode } = require("usingtellor/artifacts/contracts/TellorPlayground.sol/TellorPlayground.json")
const fetch = require('node-fetch')
const c = require("./contractAddys.js")

//npx hardhat run scripts/tellorPush.js --network chiado

async function tellorSubmits(_charon1, _charon2, _tellor){ //e.g. chi, sep, t on chi
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
    let submits = 0;
    for(i=0;i<toSubmit.length;i++){
        _query = await getTellorData(_tellor,_charon2.address,5,toSubmit[i]);
        _value = await goerliCharon.getOracleSubmission(toSubmit[i]);
        if(_query.nonce > 0){
            //check if 12 hours old
            _ts = await _tellor.getTimestampbyQueryIdandIndex(_query.queryId,0)
            //if yes do oracle deposit
            if(Date.now()/1000 - _ts > 86400/2){
                _encoded = await ethers.utils.AbiCoder.prototype.encode(['uint256'],[toSubmit[i]]);
                //await chiadoCharon.oracleDeposit([0],_encoded);
                console.log("oracleDeposit for id :", toSubmit[i])
            }
            else{
                console.log("need more time for Id: ",toSubmit[i])
            }
        }
        else{
            if(submits == 0){
                _tx = await _tellor.submitValue(_query.queryId, _value,0, _query.queryData);
                console.log("submitting for id :", toSubmit[i])
            }
            else{
                console.log("reporter in lock for ID: ", toSubmit[i])
            }
            submits = 1
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
    let gnoNode = process.env.NODE_URL_SEPOLIA;
    let polNode = process.env.NODE_URL_MUMBAI;
    let chiNode = process.env.NODE_URL_CHIADO;
    let provider = new ethers.providers.JsonRpcProvider(gnoNode);
    let wallet = new ethers.Wallet(process.env.PK, provider);
    let signer = wallet.provider.getSigner(wallet.address)
    sepCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.ETHEREUM_CHARON, signer)
    tellor = await hre.ethers.getContractAt(abi, tellorAddress,hre.provider);
    provider = new ethers.providers.JsonRpcProvider(chiNode);
    wallet = new ethers.Wallet(process.env.PK, provider);
    signer = wallet.provider.getSigner(wallet.address)
    chiadoCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.GNOSIS_CHARON,signer)
    provider = new ethers.providers.JsonRpcProvider(polNode);
    wallet = new ethers.Wallet(process.env.PK, provider);
    signer = wallet.provider.getSigner(wallet.address)
    mumbaiCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", c.POLYGON_CHARON,signer)


    if(_networkName == "chiado"){
        await tellorSubmits(chiadoCharon,sepCharon,tellor);
        await tellorSubmits(chiadoCharon,mumbaiCharon,tellor);
        console.log("tellorPush finished on chiado")
    }
    else if(_networkName == "sepolia"){
        await tellorSubmits(sepCharon,chiadoCharon,tellor);
        await tellorSubmits(sepCharon,mumbaiCharon,tellor);
        console.log("tellorPush finished on sepolia")
    }
    else if(_networkName == "mumbai"){
        await tellorSubmits(mumbaiCharon,sepCharon,tellor);
        await tellorSubmits(mumbaiCharon,chiadoCharon,tellor);
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
