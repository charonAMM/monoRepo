require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
require("dotenv").config();
const web3 = require('web3');
const HASH = require("../build/Hasher.json");

//npx hardhat run scripts/deploySystem.js --network polygon
var fee = web3.utils.toWei(".006");//.6
var HEIGHT = 23;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function deploy(contractName, ...args) {
    let _feeData = await hre.ethers.provider.getFeeData();
    delete _feeData.lastBaseFeePerGas
    delete _feeData.gasPrice
    const Factory = await ethers.getContractFactory(contractName)
    const instance = await Factory.deploy(...args,{gasPrice:175000000000})
    await sleep(50000)
    return instance.deployed()
}

async function deploySystem() {
    let  tellorBridge1,tellorBridge2,oracles,base, baseToken
    let _networkName = hre.network.name
    let chainID = hre.network.config.chainId

    let tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
    await run("compile")
    console.log("deploying charon system to: ", _networkName)

    if(_networkName == "polygon"){
        base = "https://polygonscan.com/address/"
        baseToken = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"
    }
    else if(_networkName == "optimism"){
        base = "https://optimistic.etherscan.io/address/"
        baseToken = "0x4200000000000000000000000000000000000006"
    }
    else if(_networkName == "gnosis"){
        base = "https://blockscout.com/xdai/mainnet/address/"
        baseToken = "0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d"
    }
    else{
        console.log("No network name ", _networkName, " found")
        process.exit(1)
    }

    tellorBridge1 = await hre.ethers.getContractAt("charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge","0xf18Ba320e716d829521CCB75C28323FEf4BD61f4")
    // tellorBridge1 = await deploy("charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge", tellor)
    // console.log("TellorBridge1 deployed to: ", tellorBridge1.address);
    // await run("verify:verify",{
    //     address: tellorBridge1.address,
    //     contract: "charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge",
    //     constructorArguments: [tellor]
    // })
    // console.log("tellorBridge1 verified")

    tellorBridge2 = await hre.ethers.getContractAt("charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge","0x3D76e5C46CC8e7e44458DDeD339371F1AA231aC8")
    // tellorBridge2 = await deploy("charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge", tellor)
    // console.log("TellorBridge2 deployed to: ", tellorBridge2.address);
    oracles = [tellorBridge1.address, tellorBridge2.address]
    // await run("verify:verify",{
    //     address: tellorBridge2.address,
    //     contract: "charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge",
    //     constructorArguments: [tellor]
    // })
    // console.log("tellorBridge2 verified")

    //deploying Verifier Contracts
    let verifier2 = await hre.ethers.getContractAt("Verifier2","0xe2518473f4429202827a8269706301034fD887Ec")
    // let verifier2 = await deploy("Verifier2")
    // console.log("verifier 2 contract deployed to: ", base + verifier2.address);
    // await run("verify:verify",{
    //     address: verifier2.address,
    // })
    // console.log("verifier2 verified")

    let verifier16 = await hre.ethers.getContractAt("Verifier16","0x9d386d3456Ea99F0A60BA0d49d3b03f1017321c1")
    // let verifier16 = await deploy("Verifier16")
    // console.log("verifier16 contract deployed to:", base+ verifier16.address);
    // await run("verify:verify",{
    //     address: verifier16.address,
    // })
    // console.log("verifier16 verified")

    //deploy Hasher
    let hasher = {"address": "0xF0bBB6F422af1c97A7E3203163763db24399d1c7"}
    console.log("H",hasher.address)
    // let Hasher = await hre.ethers.getContractFactory(HASH.abi, HASH.bytecode);
    // let hasher = await Hasher.deploy();
    // await hasher.deployed()
    // console.log("hasher contract deployed to: ", base + hasher.address);
    //deploying Charon
    //let charon = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon","0xAE174a7563bFE71b804273A4C7e4e47843E199e3")
    let charon = await deploy("charonAMM/contracts/Charon.sol:Charon",verifier2.address,verifier16.address,hasher.address,baseToken,fee,oracles,HEIGHT,chainID,"Charon Pool Token","CPT")
    console.log("charonAMM contract deployed to: ", base + charon.address);
    await run("verify:verify",{
        address: charon.address,
        contract: "charonAMM/contracts/Charon.sol:Charon",
        constructorArguments: [verifier2.address,verifier16.address,hasher.address,baseToken,fee,oracles,HEIGHT,chainID,"Charon Pool Token","CPT"]
    })
    console.log("charon verified")

    let chd = await deploy("charonAMM/contracts/CHD.sol:CHD",charon.address,"charon dollar","chd")
    //let chd = await hre.ethers.getContractAt("charonAMM/contracts/CHD.sol:CHD","0x83932ED462351c7e2eB1641654a6b56EBa7CB991")
    console.log("chd deployed to ", base + chd.address)
    await run("verify:verify",{
        address: chd.address,
        contract: "charonAMM/contracts/CHD.sol:CHD",
        constructorArguments: [charon.address,"charon dollar","chd"]
    })
    console.log("chd verified")

    //let cfc = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC","0xDb1c1475E6D4A1d575958074E552A31fF7CAC4b7")
    let cfc = await deploy("feeContract/contracts/CFC.sol:CFC",charon.address,oracles[0],web3.utils.toWei("10"),web3.utils.toWei("20"),web3.utils.toWei("50"),web3.utils.toWei("20"))
    console.log("cfc deployed to ", base + cfc.address)
    await run("verify:verify",{
        address: cfc.address,
        contract:"feeContract/contracts/CFC.sol:CFC",
        constructorArguments: [charon.address,oracles[0],web3.utils.toWei("10"),web3.utils.toWei("20"),web3.utils.toWei("50"),web3.utils.toWei("20")]
    })
    console.log("cfc verified")

    let cit;
    if(_networkName == "gnosis"){
        cit = await deploy("incentiveToken/contracts/Auction.sol:Auction",baseToken,web3.utils.toWei("10000"),86400 * 7,cfc.address,"Charon Incentive Token", "CIT")
        console.log("CIT deployed to ", base + cit.address)
        console.log(cit.address) 
        await run("verify:verify",{
            address: cit.address,
            contract: "incentiveToken/contracts/Auction.sol:Auction",
            constructorArguments: [baseToken,web3.utils.toWei("10000"),86400 * 7,cfc.address,"Charon Incentive Token", "CIT"]
        })
        console.log("cit verified") 
    }
    else{
        console.log("no CIT on this network")
    }

    console.log("verifier2")
    console.log("veriifer16")
    console.log("hahser")
    console.log("charon")
    console.log("cfc")
    console.log("chd")
    console.log("tellorBridge1")
    console.log("tellorBridge2")
    console.log("baseToken")

    console.log(verifier2.address)
    console.log(verifier16.address)
    console.log(hasher.address)
    console.log(charon.address)
    console.log(cfc.address)
    console.log(chd.address)
    console.log(tellorBridge1.address)
    console.log(tellorBridge2.address)
    console.log(baseToken)
}

deploySystem()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
