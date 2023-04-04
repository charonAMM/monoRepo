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


//npx hardhat run scripts/tellorPush.js --network chiado
tellorAddress = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
goerliAddress =  '0x6E2eCf3adec22D80AC3f96479C734e6eB4DFD090'
chiadoAddress = "0x20301cC7f8d4c734Fd3EAa6038ee3693e0fe8443"
mumbaiAddress = "0x2157EE35E7ecc7B66Ad61B82A79d522a44B1aa84"
e2p =  "0x2A51B6F68c38625fa0404b2a7ebA8B773e1220A6"
p2e =  "0xFfED80cF5c45e7463AFd9e0fc664B5C6583B4363"
startTime = 0;


async function tellorPush() {
    let _networkName = hre.network.name
    let tellor

    await run("compile")
    console.log("running oracle deposit on :  ", _networkName)

    //charonAMM
    let gnoNode = process.env.NODE_URL_GOERLI;
    let polNode = process.env.NODE_URL_MUMBAI;
    let chiNode = process.env.NODE_URL_CHIADO;
    let provider = new ethers.providers.JsonRpcProvider(gnoNode);
    let wallet = new ethers.Wallet(process.env.PK, provider);
    let signer = wallet.provider.getSigner(wallet.address)
    goerliCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", goerliAddress, signer)
    tellor = await hre.ethers.getContractAt(abi, tellorAddress,hre.provider);
    provider = new ethers.providers.JsonRpcProvider(chiNode);
    wallet = new ethers.Wallet(process.env.PK, provider);
    signer = wallet.provider.getSigner(wallet.address)
    chiadoCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", chiadoAddress,signer)
    provider = new ethers.providers.JsonRpcProvider(polNode);
    wallet = new ethers.Wallet(process.env.PK, provider);
    signer = wallet.provider.getSigner(wallet.address)
    mumbaiCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", mumbaiAddress,signer)
    p2e = await hre.ethers.getContractAt("charonAMM/contracts/bridges/POLtoETHBridge.sol:POLtoETHBridge", p2e)
    e2p = await hre.ethers.getContractAt("charonAMM/contracts/bridges/ETHtoPOLBridge.sol:ETHtoPOLBridge",e2p)

    if(_networkName == "chiado"){
        chiadoCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", chiadoAddress)
        toSubmit = []
        inputIds = []
        let filter = goerliCharon.filters.DepositToOtherChain()
        let events = await goerliCharon.queryFilter(filter, startTime , "latest")
        filter = chiadoCharon.filters.OracleDeposit()
        let  oracleEvents = await goerliCharon.queryFilter(filter, startTime , "latest")
        for(i = 0; i< oracleEvents.length; i++){
            thisId = oracleEvents[i]._inputData;
            inputIds.push(thisId);
        }
        for(i = 0; i< events.length; i++){
            if(inputIds.indexOf(events[i].args._depositId) == -1){
                    toSubmit.push(events[i].args._depositId)
            }
        }
        let _query,_value, _tx, _ts;
        let submits = 0;
        for(i=0;i<toSubmit.length;i++){
            _query = await getTellorData(tellor,goerliAddress,5,toSubmit[i]);
            _value = await goerliCharon.getOracleSubmission(toSubmit[i]);
            if(_query.nonce > 0){
                //check if 12 hours old
                _ts = await tellor.getTimestampbyQueryIdandIndex(_query.queryId,0)
                //if yes do oracle deposit
                if(Date.now()/1000 - _ts > 86400/2){
                    _encoded = await ethers.utils.AbiCoder.prototype.encode(['uint256'],[toSubmit[i]]);
                    await chiadoCharon.oracleDeposit([0],_encoded);
                    console.log("oracleDeposit for id :", toSubmit[i])
                }
                else{
                    console.log("need more time for Id: ",toSubmit[i])
                }
            }
            else{
                if(submits == 0){
                    _tx = await tellor.submitValue(_query.queryId, _value,0, _query.queryData);
                    console.log("submitting for id :", toSubmit[i])
                }
                else{
                    console.log("reporter in lock for ID: ", toSubmit[i])
                }
                submits = 1
            }
        }

    }
    else if(_networkName == "goerli"){
        goerliCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", goerliAddress)
        toSubmit = []
        inputIds = []
        let filter = chiadoCharon.filters.DepositToOtherChain()
        let events = await chiadoCharon.queryFilter(filter, startTime , "latest")
        filter = goerliCharon.filters.OracleDeposit()
        let  oracleEvents = await goerliCharon.queryFilter(filter, startTime , "latest")
        for(i = 0; i< oracleEvents.length; i++){
            if(oracleEvents[i].args._oracleIndex == 1){
                thisId = parseInt(oracleEvents[i].args._inputData);
                inputIds.push(thisId);
            }
        }
        for(i = 0; i< events.length; i++){
            if(inputIds.indexOf(events[i].args._depositId * 1) == -1){
                    toSubmit.push(events[i].args._depositId)
            }
        }
        let _query,_value, _tx, _ts
        let submits = 0;
        for(i=0;i<toSubmit.length;i++){
            _query = await getTellorData(tellor,chiadoAddress,10200,toSubmit[i]);
            _value = await chiadoCharon.getOracleSubmission(toSubmit[i]);
            if(_query.nonce > 0){
                //check if 12 hours old
                _ts = await tellor.getTimestampbyQueryIdandIndex(_query.queryId,0)
                //if yes do oracle deposit
                if(Date.now()/1000 - _ts > 86400/2){
                    _encoded = await ethers.utils.AbiCoder.prototype.encode(['uint256'],[toSubmit[i]]);
                    //await goerliCharon.oracleDeposit([1],_encoded);
                    console.log("oracleDeposit from chiado, id :", toSubmit[i])
                }
                else{
                    console.log("need more time for Id: ",toSubmit[i])
                }
            }
            else{
                if(submits == 0){
                    _tx = await tellor.submitValue(_query.queryId, _value,0, _query.queryData);
                    console.log("submitting value for id :", toSubmit[i])
                }
                else{
                    console.log("reporter in lock for ID: ", toSubmit[i])
                }
                submits = 1;
            }
        }
        //now for mumbai
        toSubmit = []
        inputIds = []
        filter = mumbaiCharon.filters.DepositToOtherChain()
        events = await mumbaiCharon.queryFilter(filter, startTime , "latest")
        filter = goerliCharon.filters.OracleDeposit()
        oracleEvents = await goerliCharon.queryFilter(filter, startTime , "latest")
        for(i = 0; i< oracleEvents.length; i++){
            if(oracleEvents[i].args._oracleIndex == 0){
                thisId = oracleEvents[i].args._inputData;
                inputIds.push(thisId);
            }
        }
        for(i = 0; i< events.length; i++){
            toSubmit.push(events[i].transactionHash)
        }
        let _r, content
        for(i = 0; i < toSubmit.length; i++){
            //get txn from api
            _r = await fetch('https://apis.matic.network/api/v1/mumbai/exit-payload/' + toSubmit[i] +'?eventSignature=0x8c5261668696ce22758910d05bab8f186d6eb247ceac2af2e82c7dc17669b036').then(response => response.json());
            content = await _r.result
            if(inputIds.indexOf(content) == -1){
                if(content){
                    await goerliCharon.oracleDeposit([0], content)
                    console.log("oracle deposit from mumbai!", toSubmit[i])
                }
                else{
                    console.log("not ready to push content",i , content)
                }
            }
        }
        console.log("oracle deposit done on goerli from matic")
    }
    else if(_networkName == "mumbai"){
        mumbaiCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", mumbaiAddress)
        //to do, loop through all stateId's and check if they've been submitted, start at oldest
        let stateIds = await p2e.getStateIds()
        let toSubmit = []
        let inputIds = []
        filter = mumbaiCharon.filters.OracleDeposit()
        let  oracleEvents = await mumbaiCharon.queryFilter(filter, startTime , "latest")
        for(i = 0; i< oracleEvents.length; i++){
            thisId = parseInt(oracleEvents[i].args._inputData);
            inputIds.push(thisId);
        }
        for(i = 0; i < stateIds.length; i++){
            if(inputIds.indexOf(stateIds[i] * 1) == -1){
                toSubmit.push(stateIds[i])
            }
        }
        for(i = 0; i < toSubmit.length; i++){
            let _id = await ethers.utils.AbiCoder.prototype.encode(['uint256'],[toSubmit[i]]);
            await mumbaiCharon.oracleDeposit([0],_id)
            console.log("oracle deposit on mumbai!", toSubmit[i])
        }
        console.log("deposits on mumbai done")
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
