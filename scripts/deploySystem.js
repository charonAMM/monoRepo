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
let tellor,base,myContract,baseToken,charon,oracle;
var fee = web3.utils.toWei(".02");//2%
var HEIGHT = 5;
var myAddress = "0xD109A7BD41F2bECE58885f1B04b607B5034FfbeD"

async function deploySystem() {
    let _networkName = hre.network.name
    let chainID = hre.network.config.chainId

    if(_networkName == "mumbai"){
        tellor = "0x8f55D884CAD66B79e1a131f6bCB0e66f4fD84d5B"
        base = "https://mumbai.polygonscan.com/address/"
        // baseToken = "0x23D57956cE5a07D60CbCA5CeceA8afC506DE013D"
        // charon = "0x28af28Bb3C63Be91751cf64ac16E5b0f73A8aB10"
        // oracle = "0x3b94C0a8ba635d4356b66bedE55C82115d9CaFEF"
    }
    else if(_networkName == "goerli"){
        tellor = "0xB3B662644F8d3138df63D2F43068ea621e2981f9"
        base = "https://goerli.etherscan.io/address/"
        // baseToken = "0x524547A8f3188f8Be5c5699e5eC93E0693EA84b9"
        // charon = "0xdF76f7D5C15689ee175b1b73eF12855565bd07D3"
        // oracle = "0xbBB4148Cc9bde1c9b938AF6b225E8b5260D9078C"
    }
    else if(_networkName == "chiado"){
        tellor = "0xd71F72C18767083e4e3FE84F9c62b8038C1Ef4f6"
        base = "https://blockscout.chiadochain.net/address/"
        // baseToken = "0xAda4924b1B5803980CF3F45C2dE1c8DcafF9FBd5"
        // charon = "0xD3e83D65a08220D9eEF8c8E1167A5E0881Df7550"
        // oracle = "0xa643c48A80FFEeF6Eb5868bc786aC81Eb132799d"
    }
    else{
        console.log("No network name ", _networkName, " found")
        process.exit(1)
    }
    await run("compile")
    console.log("deploying charon system to: ", _networkName)
    //deploying Verifier Contracts
    let myContract = await hre.ethers.getContractFactory("Verifier2")
    let verifier2 = await myContract.deploy()
    await verifier2.deployed()
    console.log("verifier 2 contract deployed to: ", base + verifier2.address);
    myContract = await hre.ethers.getContractFactory("Verifier16")
    let verifier16 = await myContract.deploy()
    await verifier16.deployed()
    console.log("verifier16 contract deployed to:", base+ verifier16.address);
    //deploy Hasher
    let Hasher = await hre.ethers.getContractFactory(HASH.abi, HASH.bytecode);
    let hasher = await Hasher.deploy();
    await hasher.deployed()
    console.log("hasher contract deployed to: ", base + hasher.address);
    //deploying a mock baseToken (use wrapped native for main deployment)
    myContract = await hre.ethers.getContractFactory("charonAMM/contracts/mocks/MockERC20.sol:MockERC20")
    let baseToken = await myContract.deploy(myAddress,"baseToken","CBT")
    await baseToken.deployed()
    console.log("baseToken contract deployed to: ", base + baseToken.address);
    //deploying the oracle contract
    myContract = await hre.ethers.getContractFactory("charonAMM/contracts/helpers/Oracle.sol:Oracle")
    let oracle = await myContract.deploy(tellor)
    await oracle.deployed()
    console.log("oracle contract deployed to: ", base + oracle.address);
    //deploying Chaorn
    myContract = await hre.ethers.getContractFactory("charonAMM/contracts/Charon.sol:Charon")
    let charon = await myContract.deploy(verifier2.address,verifier16.address,hasher.address,baseToken.address,fee,oracle.address,HEIGHT,chainID,"Charon Pool Token","CPT")
    await charon.deployed()
    console.log("charonAMM contract deployed to: ", base + charon.address);

    //deploy CHD
    myContract = await hre.ethers.getContractFactory("charonAMM/contracts/mocks/MockERC20.sol:MockERC20")
    let chd = await myContract.deploy(charon.address,"charon dollar","chd")
    console.log("chd deployed to ", base + chd.address)


    myContract = await hre.ethers.getContractFactory("feeContract/contracts/CFC.sol:CFC")
    let cfc = await myContract.deploy(charon.address,oracle.address,web3.utils.toWei("10"),web3.utils.toWei("20"),web3.utils.toWei("50"),web3.utils.toWei("20"))
    await cfc.deployed()
    console.log("cfc deployed to ", base + cfc.address)
    myContract = await hre.ethers.getContractFactory("incentiveToken/contracts/Auction.sol:Auction")
    let cit = await myContract.deploy(baseToken.address,web3.utils.toWei("10000"),86400 * 30,cfc.address,"Charon Incentive Token", "CIT",web3.utils.toWei("100000"))
    await cit.deployed()
    console.log("CIT deployed to ", base + cit.address)
    await cfc.setCIT(cit.address, 5, chd.address);
    console.log("cit address set")


    tellor = "0xd71F72C18767083e4e3FE84F9c62b8038C1Ef4f6"
    base = "https://blockscout.chiadochain.net/address/"
    // baseToken = "0xAda4924b1B5803980CF3F45C2dE1c8DcafF9FBd5"
    // charon = "0xD3e83D65a08220D9eEF8c8E1167A5E0881Df7550"
    // oracle = "0xa643c48A80FFEeF6Eb5868bc786aC81Eb132799d"

    console.log("baseToken = ", '"'+ baseToken.address + '"')
    console.log("charon = ", '"'+ charon.address + '"')
    console.log("oracle = ", '"'+ oracle.address + '"')
    console.log("chd = ", '"'+ chd.address + '"')
    console.log("cit = ", '"'+ cit.address + '"')
    console.log("cfc = ", '"'+ cfc.address + '"')

    console.log("verifier2")
    console.log("veriifer16")
    console.log("hahser")
    console.log("oracle")
    console.log("baseToken")
    console.log("charon")
    console.log("cfc")
    console.log("chd")
    console.log("cit")

    console.log(verifier2.address)
    console.log(verifier16.address)
    console.log(hasher.address)
    console.log(oracle.address)
    console.log(baseToken.address)
    console.log(charon.address)
    console.log(cfc.address)
    console.log(chd.address)
    console.log(cit.address)

    //now verify
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
        constructorArguments: []
    })
    console.log("baseToken verified")
    await run("verify:verify",{
        address: oracle.address,
        contract: "charonAMM/contracts/helpers/Oracle.sol:Oracle",
        constructorArguments: [tellor]
    })
    console.log("oracle verified")
    await run("verify:verify",{
        address: charon.address,
        contract: "charonAMM/contracts/Charon.sol:Charon",
        constructorArguments: [verifier2.address,verifier16.address,hasher.address,baseToken.address,fee,oracle.address,HEIGHT,chainID,"Charon Pool Token","CPT"]
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
        constructorArguments: [charon.address,oracle.address,web3.utils.toWei("10"),web3.utils.toWei("20"),web3.utils.toWei("50"),web3.utils.toWei("20")]
    })
    console.log("cfc verified")
    await run("verify:verify",{
        address: cit.address,
        contract: "incentiveToken/contracts/Auction.sol:Auction",
        constructorArguments: [baseToken.address,web3.utils.toWei("10000"),86400 * 30,cfc.address,"Charon Incentive Token", "CIT",web3.utils.toWei("100000")]
    })
    console.log("cit verified")
}

deploySystem()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
