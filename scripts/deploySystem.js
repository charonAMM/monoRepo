require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
require("dotenv").config();
const { verify } = require("crypto");
const web3 = require('web3');
const HASH = require("../build/Hasher.json")

//FOR MAINNET, turn tree variables private!!


//charonAMM Variables
//chiado
// let tellor = "0xd71F72C18767083e4e3FE84F9c62b8038C1Ef4f6"
// let chainID = 10200
//mumbai
let tellor = "0x8f55D884CAD66B79e1a131f6bCB0e66f4fD84d5B"
let chainID = 80001
let myGas = 3000000;
let myGasPrice = 50000000000;
var fee = web3.utils.toWei(".02");//2%
var HEIGHT = 5;
//feeContract Variables
var myAddress = "0xD109A7BD41F2bECE58885f1B04b607B5034FfbeD"

async function deploySystem(_networkName, _pk,_node) {
    console.log("deploying charon system")
    await run("compile")
    console.log("deploying ", _networkName)
    ///////////////Deploying Goerli first
    let privateKey = _pk;
    var provider = await new ethers.providers.JsonRpcProvider(_node)
    let wallet = await new ethers.Wallet(privateKey, provider)
    let myContract;
    //deploying Verifier Contracts
    myContract = await ethers.getContractFactory("Verifier2", wallet)
    await myContract.connect(wallet)
    let verifier2 = await myContract.deploy({gasPrice: myGasPrice, gasLimit:myGas})
    await verifier2.deployed()
    //run("verify:verify",{address: verifier2.address})
    myContract = await ethers.getContractFactory("Verifier16", wallet)
    await myContract.connect(wallet)
    let verifier16 = await myContract.deploy({gasPrice: myGasPrice, gasLimit:myGas})
    await verifier16.deployed()
    //run("verify:verify",{address: verifier16.address})
    // v2 = "0x77Fe9288B74C673CaDCAeB8804976d16cbba4F9C"
    // v16 = "0xEb77c392d104a725C51DaA89626945e6d6722B02"
    //deploy Hasher
    let Hasher = await hre.ethers.getContractFactory(HASH.abi, HASH.bytecode);
    await Hasher.connect(wallet)
    let hasher = await Hasher.deploy({gasPrice: myGasPrice, gasLimit:myGas});
    await hasher.deployed()
    //haddy = "0x81eA9b7Cc61cE8ad49612CF3479F970c980Da2b7"
    //mockToken
    myContract = await ethers.getContractFactory("MockERC20", wallet)
    await myContract.connect(wallet)
    let baseToken = await myContract.deploy(myAddress,"goerliBaseToken","GBT",{gasPrice: myGasPrice, gasLimit:myGas})
    await baseToken.deployed()
    //run("verify:verify",{address: baseToken.address, constructorArguments:[myAddress,"goerliBaseToken","GBT"]})
    //bToken = "0xC84E78A427b6895B608D27E7577290bad756baba"
    //deploy charon
    myContract = await ethers.getContractFactory("charonAMM/contracts/helpers/Oracle.sol:Oracle", wallet)
    await myContract.connect(wallet)
    let oracle = await myContract.deploy(tellor,{gasPrice: myGasPrice, gasLimit:myGas})
    await oracle.deployed()
    //run("verify:verify",{address: oracle.address, constructorArguments:[tellor]})
    //oaddy = "0xa288fa5cA1877446Ad0af3c74ec3a234543EC766"
    // oracle = await deploy('Oracle',wallet,myGas,myGasPrice,tellor)
    myContract = await ethers.getContractFactory("Charon", wallet)
    await myContract.connect(wallet)
    let charon = await myContract.deploy(verifier2.address,verifier16.address,hasher.address,baseToken.address,fee,oracle.address,HEIGHT,chainID,"Charon Pool Token","CPT",{gasPrice: myGasPrice, gasLimit:9000000})
    await charon.deployed()
    //run("verify:verify",{address: charon.address, constructorArguments:[verifier2.address,verifier16.address,hasher.address,baseToken.address,fee,oracle.address,HEIGHT,chainID,"Charon Pool Token","CPT"]})
    //cAddy = "0xCE1B4A0d9d9a64afECC7B0d4996D1EA7C9508da3"
    //charon = await deploy("Charon",wallet,myGas,myGasPrice,v2,v16,haddy,bToken,fee,oracle.address,HEIGHT,chainID,"Charon Pool Token","CPT")
  
    let base = "https://blockscout.chiadochain.net/address/"
        console.log("verifier 2 contract deployed to:", base + verifier2.address);
        console.log("verifier16 contract deployed to:", base+ verifier16.address);
        console.log("hasher contract deployed to:", base + hasher.address);
        console.log("baseToken contract deployed to:", base + baseToken.address);
        console.log("oracle contract deployed to:", base + oracle.address);
        console.log("charonAMM contract deployed to:", base + charon.address);
}


deploySystem("mumbai",process.env.PK, process.env.NODE_URL_MUMBAI)
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
