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
    tellor = await hre.ethers.getContractAt(abi, tellorAddress,hre.provider);
    goerliCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", goerliAddress)
    chiadoCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", chiadoAddress)
    mumbaiCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", mumbaiAddress)
    p2e = await hre.ethers.getContractAt("charonAMM/contracts/bridges/POLtoETHBridge.sol:POLtoETHBridge", p2e)
    e2p = await hre.ethers.getContractAt("charonAMM/contracts/bridges/ETHtoPOLBridge.sol:ETHtoPOLBridge",e2p)

    if(_networkName == "chiado"){
        let gnoNode = process.env.NODE_URL_GOERLI;
        const provider = new ethers.providers.JsonRpcProvider(gnoNode);
        const wallet = new ethers.Wallet(process.env.PK, provider);
        const signer = wallet.provider.getSigner(wallet.address)
        
        //goerliCharon = new ethers.Contract(goerliCharon,"charonAMM/contracts/Charon.sol:Charon", provider)
        goerliCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", goerliAddress, signer)
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
            console.log("submitting for Id's: ", toSubmit)
        }
        let _query,_value, _tx, _ts
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
                _tx = await tellor.submitValue(_query.queryId, _value,_query.nonce, _query.queryData);
                console.log("submitting for id :", toSubmit[i])
            }
        }

    }
    else if(_networkName == "goerli"){
        let chiNode = process.env.NODE_URL_CHIADO;
        const provider = new ethers.providers.JsonRpcProvider(chiNode);
        const wallet = new ethers.Wallet(process.env.PK, provider);
        const signer = wallet.provider.getSigner(wallet.address)
        
        //goerliCharon = new ethers.Contract(goerliCharon,"charonAMM/contracts/Charon.sol:Charon", provider)
        chiadoCharon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", chiadoAddress, signer)
        toSubmit = []
        inputIds = []
        let filter = chiadoCharon.filters.DepositToOtherChain()
        let events = await chiadoCharon.queryFilter(filter, startTime , "latest")
        filter = goerliCharon.filters.OracleDeposit()
        let  oracleEvents = await goerliCharon.queryFilter(filter, startTime , "latest")
        for(i = 0; i< oracleEvents.length; i++){
            thisId = oracleEvents[i]._inputData;
            inputIds.push(thisId);
        }
        for(i = 0; i< events.length; i++){
            if(inputIds.indexOf(events[i].args._depositId) == -1){
                    toSubmit.push(events[i].args._depositId)
            }
            console.log("need push for Id's: ", toSubmit)
        }
        let _query,_value, _tx, _ts
        for(i=0;i<toSubmit.length;i++){
            _query = await getTellorData(tellor,chiadoAddress,10200,toSubmit[i]);
            _value = await chiadoCharon.getOracleSubmission(toSubmit[i]);
            if(_query.nonce > 0){
                //check if 12 hours old
                _ts = await tellor.getTimestampbyQueryIdandIndex(_query.queryId,0)
                //if yes do oracle deposit
                if(Date.now()/1000 - _ts > 86400/2){
                    _encoded = await ethers.utils.AbiCoder.prototype.encode(['uint256'],[toSubmit[i]]);
                    await goerliCharon.oracleDeposit([0],_encoded);
                    console.log("oracleDeposit for id :", toSubmit[i])
                }
                else{
                    console.log("need more time for Id: ",toSubmit[i])
                }
            }
            else{
                _tx = await tellor.submitValue(_query.queryId, _value,_query.nonce, _query.queryData);
                console.log("submitting value for id :", toSubmit[i])
            }
        }
    }
    else if(_networkName == "mumbai"){
        //to do, loop through all stateId's and check if they've been submitted, start at oldest
        let stateIds = await p2e.getStateIds()
        console.log("stateIds", stateIds);
        let toSubmit = []
        let inputIds = []
        filter = mumbaiCharon.filters.OracleDeposit()
        let  oracleEvents = await goerliCharon.queryFilter(filter, startTime , "latest")
        for(i = 0; i< oracleEvents.length; i++){
            thisId = oracleEvents[i]._inputData;
            inputIds.push(thisId);
        }
        console.log("oracle pushes happened ", inputIds)
        for(i = 0; i < stateIds.length; i++){
            //see if stateID pushed already
            if(inputIds.indexOf(stateIds[i]) == -1){
                console.log("need to push ", stateIds[i])
                toSubmit.push(stateIds[i])
            }
        }
        for(i = 0; i < toSubmit.length; i++){
            let _id = await ethers.utils.AbiCoder.prototype.encode(['uint256'],[toSubmit[i]]);
            await mumbaiCharon.oracleDeposit([0],_id)
            console.log("oracle deposit synced on mumbai!", toSubmit[i])
        }
        console.log("oracle deposit synced on mumbai done")
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
