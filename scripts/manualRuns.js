require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
require("dotenv").config();
const { verify } = require("crypto");
const web3 = require('web3');
const HASH = require("../build/Hasher.json");
const { utils } = ethers
const Utxo = require('../src/utxo')
const { buildPoseidon } = require("circomlibjs");
const { BigNumber } = require("ethers")
const { prepareTransaction } = require('../src/index');
const { Keypair } = require("../src/keypair");
const { poseidonHash } = require("../src/utils");
//npx hardhat run scripts/manualRuns.js --network mumbai
let tellor,base,baseToken,charon,chd,cit,cfc,builtPoseidon;
var fee = web3.utils.toWei(".006");//.6
var HEIGHT = 23;
var myAddress = "0xD109A7BD41F2bECE58885f1B04b607B5034FfbeD"
var b = "0x2a4eA8464bd2DaC1Ad4f841Dcc7A8EFB4d84A27d"

function poseidon(inputs){
    let val = builtPoseidon(inputs)
    return builtPoseidon.F.toString(val)
}

function poseidon2(a,b){
return poseidon([a,b])
}

let chdMint = web3.utils.toWei("10000")
let gnoAmount = web3.utils.toWei("10000")
let ethAmount = web3.utils.toWei("5.54")
let polAmount = web3.utils.toWei("8695.65")

async function runChecks() {
    let _networkName = hre.network.name
    cit =  "0x826c1A89F9A504631d81E41488B050C8B2Df56E7"
    e2p =  "0x2A51B6F68c38625fa0404b2a7ebA8B773e1220A6"
    p2e =  "0xFfED80cF5c45e7463AFd9e0fc664B5C6583B4363"
    let _amount,tellor, base, baseToken, charon, chd, cfc, cChainIDs, cAddys;

    if(_networkName == "mumbai"){
        tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
        base = "https://mumbai.polygonscan.com/address/"

        baseToken =  "0xDB08ef3B408e2Ba6Cc107dc69dE5EBcb168EFcfc"
        charon =  "0x2157EE35E7ecc7B66Ad61B82A79d522a44B1aa84"
        chd =  "0x5CB6D2cCdAafFa1e82A0Dc12159Dbf8421d5bdeB"
        cfc =  "0x2A51B6F68c38625fa0404b2a7ebA8B773e1220A6"

        cChainIDs = [5]
        cAddys = ["0x6E2eCf3adec22D80AC3f96479C734e6eB4DFD090"]
        _amount = polAmount
    }
    else if(_networkName == "goerli"){
        tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
        base = "https://goerli.etherscan.io/address/"

        baseToken =  "0xf45412AE42B77f5C2547adDad4B69197f61C32F6"
        charon =  "0x6E2eCf3adec22D80AC3f96479C734e6eB4DFD090"
        chd =  "0xf55b9BF28107d65EC2D2b72f31Aae33f6A548EE7"
        cfc =  "0xD3f676ED12E83a8f627F2B18Ede76F16704904A0"
        tellorBridge =  "0xBeD7029aF194cddc88eF2062Cf6A857349d7ebf2"

        cChainIDs = [80001,10200]
        cAddys = ["0x2157EE35E7ecc7B66Ad61B82A79d522a44B1aa84","0x20301cC7f8d4c734Fd3EAa6038ee3693e0fe8443"]
        _amount = ethAmount
    }
    else if(_networkName == "chiado"){
        tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
        base = "https://blockscout.chiadochain.net/address/"

        baseToken =  "0x21d20B4c7dCb5521225F5036E0b27c4dF3F42aa3"
        charon =  "0x20301cC7f8d4c734Fd3EAa6038ee3693e0fe8443"
        chd =  "0xdB7d72AE7f59e25f16472e5ED210Ef4809F68a2c"
        cfc =  "0xbC2e8d236EaFd82496A38d729Bd182b71df31C8E"
        tellorBridge =  "0x52Ed24159ced5Cfa64b115566215b5aBd4103A6F"

        cChainIDs = [5]
        cAddys = ["0x6E2eCf3adec22D80AC3f96479C734e6eB4DFD090"]
        _amount = gnoAmount
    }
    else{
        console.log("No network name ", _networkName, " found")
        process.exit(1)
    }

    await run("compile")
    console.log("running manual checks on :  ", _networkName)

    charon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon", charon)
    cfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", cfc)
    cit = await hre.ethers.getContractAt("incentiveToken/contracts/Auction.sol:Auction", cit)
    baseToken = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", baseToken)
    chd = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", chd)
    builtPoseidon = await buildPoseidon()
    if(_networkName == "goerli"){
        // await cit.transfer(b, web3.utils.toWei("1"))
        // console.log("cit transfer done")

        await baseToken.approve(cit.address,web3.utils.toWei("100"))
        await cit.bid(web3.utils.toWei("100"))
        console.log("bid successful")
    }

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

    _adjAmount = BigNumber.from(_amount).div(50)
    await baseToken.approve(charon.address,_adjAmount)
    console.log("approved for swap : ", _adjAmount)
    await charon.swap(false,_adjAmount,0,web3.utils.toWei("999999"))
    console.log("swap succesfully performed")

    await chd.approve(charon.address,web3.utils.toWei("5000"))
    await baseToken.approve(charon.address,web3.utils.toWei("1000"))
    await charon.lpDeposit(web3.utils.toWei("0.5"),web3.utils.toWei("5000"),web3.utils.toWei("1000"))
    console.log("successfully LPDeposit")

    await chd.transfer(b,web3.utils.toWei("1"))
    console.log("chd transfer done")

    await baseToken.mint(myAddress, web3.utils.toWei("200"))
    console.log("minted again")
    await baseToken.approve(cfc.address,web3.utils.toWei("100"))
    console.log("baseToken approved again")
    await cfc.addFees(web3.utils.toWei("100"),false);
    console.log("fee added")
}

runChecks()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
