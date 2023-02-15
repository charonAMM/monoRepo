require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
require("dotenv").config();
const { verify } = require("crypto");
const web3 = require('web3');
const HASH = require("../build/Hasher.json");
const { exit } = require("process");

//npx hardhat run scripts/deploySystem.js --network goerli
//FOR MAINNET, turn tree variables private!!
//charonAMM Variables
var fee = web3.utils.toWei(".006");//.6
var HEIGHT = 5;
var myAddress = "0xD109A7BD41F2bECE58885f1B04b607B5034FfbeD"

async function deploy(contractName, ...args) {
    const Factory = await ethers.getContractFactory(contractName)
    const instance = await Factory.deploy(...args)
    return instance.deployed()
}

async function deploySystem() {
    let  p2e, e2p, gnosisAMB,oracles,base;
    let _networkName = hre.network.name
    let chainID = hre.network.config.chainId

    let tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
    await run("compile")
    console.log("deploying charon system to: ", _networkName)

    if(_networkName == "mumbai"){
        base = "https://mumbai.polygonscan.com/address/"
        fxchild = "0xCf73231F28B7331BBe3124B907840A94851f9f11"  //https://wiki.polygon.technology/docs/develop/l1-l2-communication/state-transfer/
        // baseToken = "0x23D57956cE5a07D60CbCA5CeceA8afC506DE013D"
        // charon = "0x28af28Bb3C63Be91751cf64ac16E5b0f73A8aB10"
        // oracle = "0x3b94C0a8ba635d4356b66bedE55C82115d9CaFEF"
        
        p2e = await deploy("POLtoETHBridge", tellor,fxchild)
        console.log("POLtoETHBridge deployed to: ", p2e.address);
        oracles = [p2e.address]
    }
    else if(_networkName == "goerli"){
        base = "https://goerli.etherscan.io/address/"
        checkpointManager = "0x2890bA17EfE978480615e330ecB65333b880928e"
        fxRoot = "0x3d1d3E34f7fB6D26245E6640E1c50710eFFf15bA"
        amb = "0x87A19d769D875964E9Cd41dDBfc397B2543764E6"
        // baseToken = "0x524547A8f3188f8Be5c5699e5eC93E0693EA84b9"
        // charon = "0xdF76f7D5C15689ee175b1b73eF12855565bd07D3"
        // oracle = "0xbBB4148Cc9bde1c9b938AF6b225E8b5260D9078C"

        //deploy e2p / gnosisAMB
        e2p = await deploy("ETHtoPOLBridge", tellor,checkpointManager,fxRoot)
        console.log("ETHtoPOLBridge deployed to: ", e2p.address);
        gnosisAMB = await deploy("GnosisAMB", amb, tellor)
        console.log("GnosisAMB deployed to: ", gnosisAMB.address);
        oracles = [e2p.address, gnosisAMB.address]
    }
    else if(_networkName == "chiado"){
        base = "https://blockscout.chiadochain.net/address/"
        amb = "0x99Ca51a3534785ED619f46A79C7Ad65Fa8d85e7a"
        gnosisAMB = await deploy("GnosisAMB", amb, tellor)
        // baseToken = "0xAda4924b1B5803980CF3F45C2dE1c8DcafF9FBd5"
        // charon = "0xD3e83D65a08220D9eEF8c8E1167A5E0881Df7550"
        // oracle = "0xa643c48A80FFEeF6Eb5868bc786aC81Eb132799d"
        gnosisAMB = await deploy("GnosisAMB", amb, tellor)
        console.log("GnosisAMB deployed to: ", gnosisAMB.address);
        //deploy gnosisAMB
        oracles = [gnosisAMB.address]
    }
    else{
        console.log("No network name ", _networkName, " found")
        process.exit(1)
    }
    //deploying Verifier Contracts
    let verifier2 = await deploy("Verifier2")
    console.log("verifier 2 contract deployed to: ", base + verifier2.address);

    let verifier16 = await deploy("Verifier16")
    console.log("verifier16 contract deployed to:", base+ verifier16.address);
    //deploy Hasher
    let Hasher = await hre.ethers.getContractFactory(HASH.abi, HASH.bytecode);
    let hasher = await Hasher.deploy();
    await hasher.deployed()
    console.log("hasher contract deployed to: ", base + hasher.address);
    //deploying a mock baseToken (use wrapped native for main deployment)

    let baseToken = await deploy("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", myAddress,"baseToken","CBT")
    console.log("baseToken contract deployed to: ", base + baseToken.address);
    //deploying Chaorn
    let charon = await deploy("charonAMM/contracts/Charon.sol:Charon",verifier2.address,verifier16.address,hasher.address,baseToken.address,fee,oracles,HEIGHT,chainID,"Charon Pool Token","CPT")
    console.log("charonAMM contract deployed to: ", base + charon.address);

    //deploy CHD
    let chd = await deploy("charonAMM/contracts/mocks/MockERC20.sol:MockERC20",charon.address,"charon dollar","chd")
    console.log("chd deployed to ", base + chd.address)

    let cfc = await deploy("feeContract/contracts/CFC.sol:CFC",charon.address,oracles[0],web3.utils.toWei("10"),web3.utils.toWei("20"),web3.utils.toWei("50"),web3.utils.toWei("20"))
    console.log("cfc deployed to ", base + cfc.address)

    let cit;
    if(_networkName == "goerli"){
        cit = await deploy("incentiveToken/contracts/Auction.sol:Auction",baseToken.address,web3.utils.toWei("10000"),86400 * 7,cfc.address,"Charon Incentive Token", "CIT",web3.utils.toWei("100000"))
        console.log("CIT deployed to ", base + cit.address)
    }
    else{
        console.log("no CIT on this network")
    }

    console.log("baseToken = ", '"'+ baseToken.address + '"')
    console.log("charon = ", '"'+ charon.address + '"')
    console.log("chd = ", '"'+ chd.address + '"')
    console.log("cfc = ", '"'+ cfc.address + '"')

    console.log("verifier2")
    console.log("veriifer16")
    console.log("hahser")
    console.log("baseToken")
    console.log("charon")
    console.log("cfc")
    console.log("chd")

    console.log(verifier2.address)
    console.log(verifier16.address)
    console.log(hasher.address)
    console.log(baseToken.address)
    console.log(charon.address)
    console.log(cfc.address)
    console.log(chd.address)

    console.log("oracles = ", oracles)

    if(_networkName == "goerli"){
        console.log("cit = ", '"'+ cit.address + '"')
        console.log("cit")
        console.log(cit.address)
    }

    //now verify
    try{
        await run("verify:verify",{
            address: verifier2.address,
        })
        console.log("verifier2 verified")
        await run("verify:verify",{
            address: verifier16.address,
        })
        console.log("verifier16 verified")
        await run("verify:verify",{
            address: baseToken.address,
            contract: "charonAMM/contracts/mocks/MockERC20.sol:MockERC20",
            constructorArguments: [myAddress,"baseToken","CBT"]
        })
        console.log("baseToken verified")
        await run("verify:verify",{
            address: charon.address,
            contract: "charonAMM/contracts/Charon.sol:Charon",
            constructorArguments: [verifier2.address,verifier16.address,hasher.address,baseToken.address,fee,oracles,HEIGHT,chainID,"Charon Pool Token","CPT"]
        })
        console.log("charon verified")
        await run("verify:verify",{
            address: chd.address,
            contract: "charonAMM/contracts/mocks/MockERC20.sol:MockERC20",
            constructorArguments: [charon.address,"charon dollar","chd"]
        })
        console.log("chd verified")
        await run("verify:verify",{
            address: cfc.address,
            contract:"feeContract/contracts/CFC.sol:CFC",
            constructorArguments: [charon.address,oracles[0],web3.utils.toWei("10"),web3.utils.toWei("20"),web3.utils.toWei("50"),web3.utils.toWei("20")]
        })
        console.log("cfc verified")

        if(_networkName == "goerli"){
            await run("verify:verify",{
                address: cit.address,
                contract: "incentiveToken/contracts/Auction.sol:Auction",
                constructorArguments: [baseToken.address,web3.utils.toWei("10000"),86400 * 30,cfc.address,"Charon Incentive Token", "CIT",web3.utils.toWei("100000")]
            })
            console.log("cit verified")

            await run("verify:verify",{
                address: e2p.address,
                contract: "ETHtoPOLBridge",
                constructorArguments: [tellor,checkpointManager,fxRoot]
            })
            console.log("e2p verified")
        
            await run("verify:verify",{
                address: gnosisAMB.address,
                contract: "GnosisAMB",
                constructorArguments: [amb,tellor]
            })
            console.log("gnosisAMB verified")
        }
        else if(_networkName == "chiado"){
            await run("verify:verify",{
                address: gnosisAMB.address,
                contract: "GnosisAMB",
                constructorArguments: [amb,tellor]
            })
            console.log("gnosisAMB verified")
        }
        else if(_networkName == "mumbai"){
            await run("verify:verify",{
                address: p2e.address,
                contract: "POLtoETHBridge",
                constructorArguments: [tellor,fxchild]
            })
            console.log("p2e verified")
        }
    }catch(err){
        console.log("error verifying : ", err);
    }
}

deploySystem()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
