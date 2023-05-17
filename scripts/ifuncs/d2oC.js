require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
require("dotenv").config();
const c = require("../contractAddys.js")
const { utils } = ethers
const Utxo = require('../../src/utxo.js')
const { buildPoseidon } = require("circomlibjs");
const { prepareTransaction } = require('../../src/index');
const { Keypair } = require("../../src/keypair");
//npx hardhat run scripts/ifuncs/d2oC.js --network sepolia
let cit,builtPoseidon;
var myAddress = process.env.PUBLICKEY

//vars to change!!
let _depositAmount = utils.parseEther('10'); //chd to mint
let _oracleIndex = 0 //index in oracle array


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

async function d2oC() {
    let _feeData = await hre.ethers.provider.getFeeData();
    delete _feeData.lastBaseFeePerGas
    delete _feeData.gasPrice
    let _networkName = hre.network.name
    cit =  c.ETHEREUM_CIT
    let  baseToken, charon, chd, cChainIDs;
    tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
    if(_networkName == "mumbai"){
        tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
        base = "https://mumbai.polygonscan.com/address/"
        baseToken =  c.POLYGON_BASETOKEN
        charon =  c.POLYGON_CHARON
        chd =  c.POLYGON_CHD
        cChainIDs = [11155111,10200]
        cAddys = [c.ETHEREUM_CHARON,c.GNOSIS_CHARON]
    }
    else if(_networkName == "sepolia"){
        tellor = "0x199839a4907ABeC8240D119B606C98c405Bb0B33"
        base = "https://sepolia.etherscan.io/address/"
        baseToken =  c.ETHEREUM_BASETOKEN
        charon =  c.ETHEREUM_CHARON
        chd =  c.ETHEREUM_CHD
        cChainIDs = [80001,10200]
        cAddys = [c.POLYGON_CHARON,c.GNOSIS_CHARON]
    }
    else if(_networkName == "chiado"){
        tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
        base = "https://blockscout.chiadochain.net/address/"
        baseToken =  c.GNOSIS_BASETOKEN
        charon =  c.GNOSIS_CHARON
        chd =  c.GNOSIS_CHD
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
    baseToken = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", baseToken)
    chd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", chd)
    builtPoseidon = await buildPoseidon()

    let charon2 = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", cAddys[_oracleIndex])
    let recBal = await charon.recordBalance();
    let recSynthBal = await charon.recordBalanceSynth();
    _Camount = await charon.calcInGivenOut(recBal,
                                            recSynthBal,
                                            _depositAmount,
                                            0)

    await baseToken.mint(myAddress,_Camount,_feeData);
    await sleep(5000)
    console.log("tokens minted")
    await baseToken.approve(charon.address,_Camount,_feeData)
    await sleep(5000)
    console.log("tokens approved")
    let myKey = new Keypair({ privkey: process.env.PK, myHashFunc: poseidon })
    let aliceDepositUtxo = new Utxo({ amount: _depositAmount,keypair:myKey, myHashFunc: poseidon, chainID:cChainIDs[_oracleIndex] })
    let inputData = await prepareTransaction({
        charon:charon2,
        inputs:[],
        outputs: [aliceDepositUtxo],
        privateChainID: cChainIDs[_oracleIndex],
        myHasherFunc: poseidon,
        myHasherFunc2: poseidon2
    })
    let args = inputData.args
    let extData = inputData.extData
    await charon.depositToOtherChain(args,extData,false,_Camount,_feeData);
    await sleep(5000)
    console.log("deposited to other chain succesfully ")
}

d2oC()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
