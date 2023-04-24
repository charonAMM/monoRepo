require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
require("dotenv").config();
const web3 = require('web3');
const HASH = require("../build/Hasher.json");

//npx hardhat run scripts/testDeploy.js --network sepolia
//FOR MAINNET, turn tree variables private!!
//charonAMM Variables
var fee = web3.utils.toWei(".006");//.6
var HEIGHT = 23;
var myAddress = "0xACE235Da5C594C3DdE316393Ad59a6f55F930be8"

async function deploy(contractName, ...args) {
    const Factory = await ethers.getContractFactory(contractName)
    const instance = await Factory.deploy(...args)
    return instance.deployed()
}

async function deploySystem() {
    let  tellorBridge1,tellorBridge2,oracles,base
    let _networkName = hre.network.name
    let chainID = hre.network.config.chainId

    let tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
    await run("compile")
    console.log("deploying charon system to: ", _networkName)

    if(_networkName == "mumbai"){
        base = "https://mumbai.polygonscan.com/address/"
    }
    else if(_networkName == "sepolia"){
        base = "https://sepolia.etherscan.io/address/"
        tellor = "0x199839a4907ABeC8240D119B606C98c405Bb0B33"
    }
    else if(_networkName == "chiado"){
        base = "https://blockscout.chiadochain.net/address/"
    }
    else{
        console.log("No network name ", _networkName, " found")
        process.exit(1)
    }

    tellorBridge1 = await deploy("charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge", tellor)
    console.log("TellorBridge1 deployed to: ", tellorBridge1.address);
    tellorBridge2 = await deploy("charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge", tellor)
    console.log("TellorBridge2 deployed to: ", tellorBridge2.address);
    oracles = [tellorBridge1.address, tellorBridge2.address]

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
    if(_networkName == "sepolia"){
        cfc = "0x5eE7f2C6EF0419036aadCD82cEd424bB1b098d1C"
        b = "0x4708CB6E65215AFfa61790C8241B3f313C829f99"
        cit = await deploy("incentiveToken/contracts/Auction.sol:Auction",b,web3.utils.toWei("10000"),86400 * 7,cfc,"Charon Incentive Token", "CIT")
        console.log("CIT deployed to ", base + cit.address)
        console.log(cit.address)

        await run("verify:verify",{
            address: cit.address,
            contract: "incentiveToken/contracts/Auction.sol:Auction",
            constructorArguments: [b,web3.utils.toWei("10000"),86400 * 7,cfc,"Charon Incentive Token", "CIT"]
        })
        console.log("cit verified")    

    }
    else{
        console.log("no CIT on this network")
    }

    console.log("verifier2")
    console.log("veriifer16")
    console.log("hahser")
    console.log("baseToken")
    console.log("charon")
    console.log("cfc")
    console.log("chd")
    if(_networkName == "sepolia"){
        console.log("cit")
    }
    console.log("tellorBridge1")
    console.log("tellorBridge2")

    console.log(verifier2.address)
    console.log(verifier16.address)
    console.log(hasher.address)
    console.log(baseToken.address)
    console.log(charon.address)
    console.log(cfc.address)
    console.log(chd.address)
    console.log(tellorBridge1.address)
    console.log(tellorBridge2.address)
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

        await run("verify:verify",{
            address: tellorBridge1.address,
            contract: "charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge",
            constructorArguments: [tellor]
        })
        console.log("tellorBridge1 verified")

        await run("verify:verify",{
            address: tellorBridge2.address,
            contract: "charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge",
            constructorArguments: [tellor]
        })
        console.log("tellorBridge2 verified")

        if(_networkName == "sepolia"){
            try{
                await run("verify:verify",{
                    address: cit.address,
                    contract: "incentiveToken/contracts/Auction.sol:Auction",
                    constructorArguments: [baseToken.address,web3.utils.toWei("10000"),86400 * 7,cfc.address,"Charon Incentive Token", "CIT"]
                })
                console.log("cit verified")    
            }
            catch{
                console.log("WARNING: may need to manually verify CIT")
            }
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
