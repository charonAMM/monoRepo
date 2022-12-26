const { ethers } = require("hardhat");
const web3 = require('web3');
const { expect, assert } = require("chai");
const h = require("usingtellor/test/helpers/helpers.js");
const HASH = require("../build/Hasher.json")
const { buildPoseidon } = require("circomlibjs");
const { abi, bytecode } = require("usingtellor/artifacts/contracts/TellorPlayground.sol/TellorPlayground.json")

describe("full system tests", function() {
    let incentiveToken,token,accounts,cfc;

    async function deploy(contractName, ...args) {
        const Factory = await ethers.getContractFactory(contractName)
        const instance = await Factory.deploy(...args)
        return instance.deployed()
      }

    async function getTellorData(tInstance, chain,depositID){
        queryData = abiCoder.encode(
            ['string', 'bytes'],
            ['Charon', abiCoder.encode(
                ['uint256','uint256'],
                [chain,depositID]
            )]
            );
            queryId = h.hash(queryData)
            nonce = await tInstance.getNewValueCountbyQueryId(queryId)
            return({queryData: queryData,queryId: queryId,nonce: nonce})
    }
    
    async function getTellorSubmission(args,extData){
        const dataEncoded = abiCoder.encode(
          ['bytes32','bytes32','bytes32','bytes32','bytes'],
          [
            args.inputNullifiers[0],
            args.inputNullifiers[1],
            args.outputCommitments[0],
            args.outputCommitments[1],
            args.proof
          ]
        );
        return dataEncoded;
      }

    beforeEach(async function () {
            let accounts;
            let verifier2,verifier16,token,charon,hasher,token2,charon2,oracle, oracle2;
            let fee = 0;
            let HEIGHT = 5;
            let builtPoseidon;
            builtPoseidon = await buildPoseidon()
            accounts = await ethers.getSigners();
            verifier2 = await deploy('Verifier2')
            verifier16 = await deploy('Verifier16')
            let Hasher = await ethers.getContractFactory(HASH.abi, HASH.bytecode);
            hasher = await Hasher.deploy();
            await hasher.deployed()
            token = await deploy("MockERC20",accounts[1].address,"Dissapearing Space Monkey","DSM")
            await token.mint(accounts[0].address,web3.utils.toWei("1000000"))//1M
            //deploy tellor
            let TellorOracle = await ethers.getContractFactory(abi, bytecode);
            tellor = await TellorOracle.deploy();
            tellor2 = await TellorOracle.deploy();
            await tellor2.deployed();
            await tellor.deployed();
            oracle = await deploy('Oracle',tellor.address)
            oracle2 = await deploy('Oracle',tellor2.address)
            charon = await deploy("Charon",verifier2.address,verifier16.address,hasher.address,token.address,fee,oracle.address,HEIGHT,1,"Charon Pool Token","CPT")
            //now deploy on other chain (same chain, but we pretend w/ oracles)
            token2 = await deploy("MockERC20",accounts[1].address,"Dissapearing Space Monkey2","DSM2")
            await token2.mint(accounts[0].address,web3.utils.toWei("1000000"))//1M
            charon2 = await deploy("Charon",verifier2.address,verifier16.address,hasher.address,token2.address,fee,oracle2.address,HEIGHT,2,"Charon Pool Token2","CPT2");
            chd = await deploy("MockERC20",charon.address,"charon dollar","chd")
            chd2 = await deploy("MockERC20",charon2.address,"charon dollar2","chd2")
            //now set both of them. 
            await token.approve(charon.address,web3.utils.toWei("100"))//100
            await token2.approve(charon2.address,web3.utils.toWei("100"))//100
            await charon.finalize([2],[charon2.address],web3.utils.toWei("100"),web3.utils.toWei("1000"),chd.address);
            await charon2.finalize([1],[charon.address],web3.utils.toWei("100"),web3.utils.toWei("1000"),chd2.address);
            fac = await ethers.getContractFactory("Oracle")
            oracle = await fac.deploy(tellor.address)
            await oracle.deployed()
            fac = await ethers.getContractFactory("MockCharon")
            charon = await fac.deploy(chd.address,baseToken.address);
            await charon.deployed()
            oraclePayment = accounts[2]
            fac = await ethers.getContractFactory("CFC");
            cfc = await fac.deploy(cit.address,charon.address,oracle.address,oraclePayment.address,web3.utils.toWei("10"),web3.utils.toWei("20"),web3.utils.toWei("50"),web3.utils.toWei("20"));
            await cfc.deployed();
            incentiveToken = await fac.deploy(token.address,web3.utils.toWei("2000"),86400*7,cfc.address,"Charon Incentive Token","CIT",web3.utils.toWei("100000"));
            await incentiveToken.deployed();
    });
    it("test whole system deployment, constructors and initialization", async function() {
        //charonAMM
        assert(await charon.oracle() == oracle.address, "oracle  address should be set")
        assert(await charon.levels() == HEIGHT, "merkle Tree height should be set")
        assert(await charon.hasher() == hasher.address, "hasher should be set")
        assert(await charon.verifier2() == verifier2.address, "verifier2 should be set")
        assert(await charon.verifier16() == verifier16.address, "verifier16 should be set")
        assert(await charon.token() == token.address, "token should be set")
        assert(await charon.fee() == fee, "fee should be set")
        assert(await charon.controller() == accounts[0].address, "controller should be set")
        assert(await charon.chainID() == 1, "chainID should be correct")
        //finalize
        let testCharon = await deploy("Charon",verifier2.address,verifier16.address,hasher.address,token2.address,fee,tellor2.address,HEIGHT,2,"Charon Pool Token2","CPT2");
        let chd3 = await deploy("MockERC20",testCharon.address,"charon dollar3","chd3")
        await h.expectThrow(testCharon.finalize([1],[charon.address],web3.utils.toWei("100"),web3.utils.toWei("1000"),chd3.address));//must transfer token
        await token2.approve(testCharon.address,web3.utils.toWei("100"))//100
        await h.expectThrow(testCharon.connect(accounts[1]).finalize([1],[charon.address],web3.utils.toWei("100"),web3.utils.toWei("1000"),chd3.address))//must be controller
        await h.expectThrow(testCharon.finalize([1,2],[charon.address],web3.utils.toWei("100"),web3.utils.toWei("1000"),chd3.address))//length should be same
        await testCharon.finalize([1],[charon.address],web3.utils.toWei("100"),web3.utils.toWei("1000"),chd3.address);
        await h.expectThrow(testCharon.finalize([1],[charon.address],web3.utils.toWei("100"),web3.utils.toWei("1000"),chd3.address))//already finalized
        assert(await testCharon.finalized(), "should be finalized")
        assert(await testCharon.balanceOf(accounts[0].address) - web3.utils.toWei("100") == 0, "should have full balance")
        assert(await testCharon.recordBalance() == web3.utils.toWei("100"), "record Balance should be set")
        assert(await testCharon.recordBalanceSynth() == web3.utils.toWei("1000"), "record Balance synth should be set")
        assert(await testCharon.chd() == chd3.address, "chd should be set")
        let pC = await testCharon.getPartnerContracts();
        assert(pC[0][0] == 1, "partner chain should be correct")
        assert(pC[0][1] == charon.address, "partner address should be correct")

        //cfc 
        assert(await cfc.CIT() == cit.address, "cit should be set")
        assert(await cfc.charon() == charon.address, "charon should be set")
        assert(await cfc.oracle() == oracle.address, "tellor should be set")
        assert(await cfc.oraclePayment() == oraclePayment.address, "oracle payment addrss should be set")
        assert(await cfc.toOracle() == web3.utils.toWei("10"), "toOracle should be set")
        assert(await cfc.toLPs() == web3.utils.toWei("20"), "toLPs should be set")
        assert(await cfc.toHolders() == web3.utils.toWei("50"), "toHolders should be set")
        assert(await cfc.toUsers() == web3.utils.toWei("20"), "toUsers should be set")
        let feePeriod = await cfc.feePeriods(0)
        assert(feePeriod > 0, "first fee period shoud be set")
        let thisPeriod = await cfc.getFeePeriodByTimestamp(feePeriod)
        console.log(thisPeriod.endDate, feePeriod )
        assert(thisPeriod.endDate - feePeriod == 0, "end date should be set")
        assert(await cfc.token() == baseToken.address, "base token should be set")
        assert(await cfc.chd() ==chd.address, "chd should be set")

        //cit
        assert(await incentiveToken.bidToken() == token.address, "token should be set")
        assert(await incentiveToken.mintAmount() == web3.utils.toWei("2000"), "mint amount should be set")
        assert(await incentiveToken.auctionFrequency() == 86400*7, "auction frequency should be set")
        assert(await incentiveToken.charonFeeContract() == cfc.address, "cfc should be set")
        assert(await incentiveToken.endDate() > 0 , "first end date should be set")
        assert(await incentiveToken.balanceOf(accounts[0].address) == web3.utils.toWei("100000"), "init supply should be minted")
        assert(await incentiveToken.name() == "Charon Incentive Token", "name should be set")
        assert(await incentiveToken.symbol() == "CIT", "symbol should be set")
    });
    it("test multiple deposits on each AMM, multiple auctions, and proper payments/CFC distribution", async function() {
        //change owner to cfc
            //transact 1

            //send chd

            //withdraw and trade chd

            //auction

            //random add fee

            //cfc monthly distribution

            //more transact

            //chd verify 16

            //random swaps

            //cit transfers 

            //cfc month distribution
    });
    it("test everyone withdraws and token holds zero value", async function() {
        //change owner to cfc
        //multiple people transact and add funds to pools

        //one auction w/ value then none

        //everyone in AMM withdraws and no more bids
    });
});