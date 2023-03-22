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

    cit =  "0x826c1A89F9A504631d81E41488B050C8B2Df56E7"
    e2p =  "0x2A51B6F68c38625fa0404b2a7ebA8B773e1220A6"
    p2e =  "0xFfED80cF5c45e7463AFd9e0fc664B5C6583B4363"

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

        baseToken =  "0xf45412AE42B77f5C2547adDad4B69197f61C32F6"
        charon =  "0x6E2eCf3adec22D80AC3f96479C734e6eB4DFD090"
        chd =  "0xf55b9BF28107d65EC2D2b72f31Aae33f6A548EE7"
        cfc =  "0xD3f676ED12E83a8f627F2B18Ede76F16704904A0"
        tellorBridge =  "0xBeD7029aF194cddc88eF2062Cf6A857349d7ebf2"

        cChainIDs = [80001,10200]
        cAddys = ["0x21d20B4c7dCb5521225F5036E0b27c4dF3F42aa3","0xA9F3BEe4de793Ebc2a6A34E6d49951Cb80003eFF"]
        _amount = ethAmount
        myContract = await hre.ethers.getContractAt("charonAMM/contracts/bridges/ETHtoPOLBridge.sol:ETHtoPOLBridge",e2p)
        await myContract.setCharon(charon);
        console.log("e2p charon address set")
        await myContract.setFxChildTunnel(p2e)
        console.log("e2p fxChildTunnel set")
        myContract = await hre.ethers.getContractAt("charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge", tellorBridge)
        await myContract.setPartnerInfo(cAddys[1],10200);
        console.log("tellorBridge partner info set")
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
        cAddys = ["0x9EDe7FDe2E135801012D019BAB586C342440dadF"]
        myContract = await hre.ethers.getContractAt("charonAMM/contracts/bridges/TellorBridge.sol:TellorBridge", tellorBridge)
        await myContract.setPartnerInfo(cAddys[0],5);
        _amount = gnoAmount
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
