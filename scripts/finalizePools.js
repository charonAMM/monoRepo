require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
const hre = require("hardhat");
require("dotenv").config();
const web3 = require('web3');

let tellor,base,myContract,baseToken,charon,oracle;
var myAddress = "0xD109A7BD41F2bECE58885f1B04b607B5034FfbeD"
//npx hardhat run scripts/finalizePools.js --network goerli

let chdMint = web3.utils.toWei("10000")
let gnoAmount = web3.utils.toWei("10000")
let ethAmount = web3.utils.toWei("6.02")
let polAmount = web3.utils.toWei("8771.93")

async function finalizePools() {
    let _amount, tellorBridge;
    let _networkName = hre.network.name
    await run("compile")
    console.log("initializing and finalizing charon system to: ", _networkName)

    cit =  "0x20301cC7f8d4c734Fd3EAa6038ee3693e0fe8443"
    e2p =  "0xf86a96A941Ae86506F0D9a34a0d40dBBb17B5123"
    p2e = "0x7022cc1F7eD50DeB4fC89fBe4248E431e3d47694"

    if(_networkName == "mumbai"){
        tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
        base = "https://mumbai.polygonscan.com/address/"
        baseToken =  "0x9edAef26cB70A187926A2962A77c86522564A955"
        charon =  "0x21d20B4c7dCb5521225F5036E0b27c4dF3F42aa3"
        chd =  "0x20301cC7f8d4c734Fd3EAa6038ee3693e0fe8443"
        cfc =  "0xdB7d72AE7f59e25f16472e5ED210Ef4809F68a2c"
        cChainIDs = [5]
        cAddys = ["0x9EDe7FDe2E135801012D019BAB586C342440dadF"]

        myContract = await hre.ethers.getContractAt("charonAMM/contracts/bridges/POLtoETHBridge.sol:POLtoETHBridge", p2e)
        await myContract.setCharon(charon);
        console.log("p2e charon address set")
        await myContract.setFxRootTunnel(e2p)
        console.log("p2e fxRootTunnel set")
        _amount = polAmount;
    }
    else if(_networkName == "goerli"){
        tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
        base = "https://goerli.etherscan.io/address/"
        baseToken =  "0x7ff0A9F8ec9Ba82f9340DA55A846a12F220D1e41"
        charon =  "0x9EDe7FDe2E135801012D019BAB586C342440dadF"
        chd =  "0x9edAef26cB70A187926A2962A77c86522564A955"
        cfc =  "0x21d20B4c7dCb5521225F5036E0b27c4dF3F42aa3"
        gnosisAMB =  "0x8dbC94CfcFd867C39F378D4CdaE79EB97EB7C40b"
        cChainIDs = [80001,10200]
        cAddys = ["0x21d20B4c7dCb5521225F5036E0b27c4dF3F42aa3","0xA9F3BEe4de793Ebc2a6A34E6d49951Cb80003eFF"]

        myContract = await hre.ethers.getContractAt("charonAMM/contracts/bridges/ETHtoPOLBridge.sol:ETHtoPOLBridge",e2p)
        await myContract.setCharon(charon);
        console.log("e2p charon address set")
        await myContract.setFxChildTunnel(p2e)
        console.log("e2p fxChildTunnel set")
        tellorBridge = "0x38810dd60cDD61ab8a50Fd2B98BceB9690114a82"
        myContract = await hre.ethers.getContractAt("charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge", tellorBridge)
        await myContract.setPartnerInfo(cAddys[1],10200);
        console.log("tellorBridge partner info set")
        _amount = ethAmount
    }
    else if(_networkName == "chiado"){
        tellor = "0xD9157453E2668B2fc45b7A803D3FEF3642430cC0"
        base = "https://blockscout.chiadochain.net/address/"
        baseToken =  "0x5A3A09dBCFA2B901e7742725ef760bB859a4682D"
        charon =  "0xA9F3BEe4de793Ebc2a6A34E6d49951Cb80003eFF"
        chd =  "0xDb7469f18f3f47Bc76f6D47cEA27C481dc4cfDFd"
        cfc =  "0xB3d9FDD711DfbcF037230cb24b9eba185f907b2b"
        gnosisAMB = "0xB2501D56Dd68c4800e8970C8A47a766053F5dbC7"
        cChainIDs = [5]
        cAddys = ["0x9EDe7FDe2E135801012D019BAB586C342440dadF"]

        _amount = gnoAmount
        tellorBridge = "0x3f4B13FE055Cb0F67b90b90147bEb4DdbeB7Fb3E"

        myContract = await hre.ethers.getContractAt("charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge", tellorBridge)
        await myContract.setPartnerInfo(cAddys[0],5);
        console.log("tellorBridge partner info set")
    }
    else{
        console.log("No network name ", _networkName, " found")
        process.exit(1)
    }
    myContract = await hre.ethers.getContractAt("feeContract/contracts/CFC.sol:CFC", cfc)
    await myContract.setCit(cit, 5, chd);
    console.log("cit address set")

    myContract = await hre.ethers.getContractAt("charonAMM/contracts/mocks/MockERC20.sol:MockERC20", baseToken)
    await myContract.mint(myAddress, _amount)
    console.log("token minted")

    await myContract.approve(charon, _amount)//100
    console.log("base token approved")

    myContract = await hre.ethers.getContractAt("charonAMM/contracts/Charon.sol:Charon",charon)
    await myContract.finalize(cChainIDs,cAddys,_amount,chdMint,chd,cfc);
    console.log("charon finalized")
}

finalizePools()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
