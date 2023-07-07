require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
require("dotenv").config();
const c = require("../testnet/testAddys.js")
const a = require("../contractAddys.js")
const { utils } = ethers
const Utxo = require('../../src/utxo.js')
const { buildPoseidon } = require("circomlibjs");
const { prepareTransaction } = require('../../src/index');
const { Keypair } = require("../../src/keypair");
const { toFixedHex } = require('../../src/utils.js');
const fetch = require('node-fetch');
//npx hardhat run scripts/ifuncs/transact.js --network chiado
let cit,builtPoseidon;
//vars to change!!
let _transferAmount = utils.parseEther('1'); //chd to transfer
let _toAddress = "0x08e258cdac17d993e71b64a7245bf066894796fb2b6a01b55f95f254d1946b207173b8b017ba393efe72a843211ac945464501ff0ac18d3866fa2cb61c68e737" //publicAddress you're sending too


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

async function transact() {
    let myChainId = hre.network.config.chainId
    let _feeData = await hre.ethers.provider.getFeeData();
    delete _feeData.lastBaseFeePerGas
    delete _feeData.gasPrice
    let _networkName = hre.network.name
    cit =  c.ETHEREUM_CIT
    let  baseToken, charon;
    builtPoseidon = await buildPoseidon()
    let myKeypair = new Keypair({ privkey: process.env.PK, myHashFunc: poseidon })
    if(_networkName == "mumbai"){
        base = "https://mumbai.polygonscan.com/address/"
        charon =  c.POLYGON_CHARON
    }
    else if(_networkName == "sepolia"){
        base = "https://sepolia.etherscan.io/address/"
        charon =  c.ETHEREUM_CHARON
    }
    else if(_networkName == "chiado"){
        tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
        base = "https://blockscout.chiadochain.net/address/"
        charon =  c.GNOSIS_CHARON
    } else if(_networkName == "polygon"){
        //let myKeypair = new Keypair({ privkey: process.env.MAINPK, myHashFunc: poseidon })
        _feeData = {"gasPrice":200000000000}
        const key = process.env.OWLKEY; // fill your api key here
        const res = await fetch(`https://api.owlracle.info/v4/poly/gas?apikey=${ key }`);
        const data = await res.json();
        console.log(data.speeds[1].maxFeePerGas)
        if(data.avgGas > 10){
            _feeData = {"gasPrice": Math.floor(1000000000 * data.speeds[1].maxFeePerGas)}
            console.log("Polygon gas price", Math.floor(1000000000 * data.speeds[1].maxFeePerGas));
        }else{
            console.log("using manual gas price")
        }
        myKeypair = new Keypair({ privkey: process.env.MAINPK, myHashFunc: poseidon })
        base = "https://polygonscan.com/address/"
        charon =  a.POLYGON_CHARON
    }
    else if(_networkName == "optimism"){
        myKeypair = new Keypair({ privkey: process.env.MAINPK, myHashFunc: poseidon })
        base = "https://optimistic.etherscan.io/address/"
        charon =  a.ETHEREUM_CHARON
    }
    else if(_networkName == "gnosis"){
        myKeypair = new Keypair({ privkey: process.env.MAINPK, myHashFunc: poseidon })
        base = "https://blockscout.com/xdai/mainnet/address/"
        charon =  a.GNOSIS_CHARON
    }
    else{
        console.log("No network name ", _networkName, " found")
        process.exit(1)
    }

    await run("compile")
    console.log("running transact on :  ", _networkName)

    charon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", charon)
    let myUTXOs =[]
    let filter = charon.filters.NewCommitment()
    let events = await charon.queryFilter(filter,0,"latest")
    let thisUTXO
    let myAmount = 0
    let myNullifier;
    for(i = 0; i< events.length; i++){
        try {
            thisUTXO = Utxo.decrypt(myKeypair, events[i].args._encryptedOutput, events[i].args._index)
            thisUTXO.chainID = myChainId;
            //nowCreate nullifier
            if(thisUTXO.amount > 0 && toFixedHex(events[i].args._commitment) == toFixedHex(thisUTXO.getCommitment(poseidon))){
                try{
                    myNullifier = thisUTXO.getNullifier(poseidon)
                    myNullifier = toFixedHex(myNullifier)
                    if(!await charon.isSpent(myNullifier)){
                        myAmount += parseInt(thisUTXO.amount);
                        myUTXOs.push(thisUTXO)
                    }
                }catch{
                    console.log("nullifier error", i)
                }
            }
        } catch{
            // console.log("not here")
        }
        if(myAmount >= _transferAmount){
            break
        }
    }
    let outUTXOs = []
    if(myAmount > _transferAmount){
        let _changeAmount = myAmount - _transferAmount;
        let aliceChangeUtxo = new Utxo({ amount: String(_changeAmount),keypair:myKeypair, myHashFunc: poseidon, chainID:myChainId })
        outUTXOs.push(aliceChangeUtxo);
    }
    outUTXOs.push(new Utxo({ amount: String(_transferAmount),myHashFunc: poseidon, keypair: Keypair.fromString(_toAddress,poseidon), chainID: myChainId }))
    if(myUTXOs.length > 0){
        let inputData = await prepareTransaction({
            charon: charon,
            inputs: myUTXOs,
            outputs: outUTXOs,
            privateChainID: myChainId,
            myHasherFunc: poseidon,
            myHasherFunc2: poseidon2
        })
        await charon.transact(inputData.args,inputData.extData,_feeData);
        await sleep(5000)
        console.log("transacted succesfully ")
    }
    else{
        console.log("no UTXO's!")
    }
}

transact()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
