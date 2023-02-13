const { ethers } = require("hardhat");
const Web3 = require('web3');
const web3 = new Web3(hre.network.provider)
const { expect, assert } = require("chai");
const h = require("usingtellor/test/helpers/helpers.js");
const HASH = require("../build/Hasher.json")
const { buildPoseidon } = require("circomlibjs");
const { utils } = ethers
const abiCoder = new ethers.utils.AbiCoder()
const { abi, bytecode } = require("usingtellor/artifacts/contracts/TellorPlayground.sol/TellorPlayground.json")
const Utxo = require('../src/utxo')
const { prepareTransaction } = require('../src/index')
const { Keypair } = require('../src/keypair')
const Snapshot = require("../src/Snapshot")

describe("full system tests", function() {
    let verifier2,verifier16,token,hasher,token2, builtPoseidon;
    let charon, charon2,mockNative ,mockNative2,gnosisAMB, gnosisAMB2, e2p, p2e, accounts,cfc,cfc2,cit,Snap;
    let fee = 0;
    let HEIGHT = 5;
    
    async function deploy(contractName, ...args) {
        const Factory = await ethers.getContractFactory(contractName)
        const instance = await Factory.deploy(...args)
        return instance.deployed()
    }
    function poseidon(inputs){
      let val = builtPoseidon(inputs)
      return builtPoseidon.F.toString(val)
    }

    function poseidon2(a,b){
      return poseidon([a,b])
    }

    async function getTellorData(tInstance,cAddress,chain,depositID){
      let ABI = ["function getOracleSubmission(uint256 _depositId)"];
      let iface = new ethers.utils.Interface(ABI);
      let funcSelector = iface.encodeFunctionData("getOracleSubmission", [depositID])
  
      queryData = abiCoder.encode(
          ['string', 'bytes'],
          ['EVMCall', abiCoder.encode(
              ['uint256','address','bytes'],
              [chain,cAddress,funcSelector]
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
          builtPoseidon = await buildPoseidon()
            accounts = await ethers.getSigners();
            verifier2 = await deploy('Verifier2')
            verifier16 = await deploy('Verifier16')
            let Hasher = await ethers.getContractFactory(HASH.abi, HASH.bytecode);
            hasher = await Hasher.deploy();
            await hasher.deployed()
            token = await deploy("charonAMM/contracts/mocks/MockERC20.sol:MockERC20",accounts[1].address,"Dissapearing Space Monkey","DSM")
            await token.mint(accounts[0].address,web3.utils.toWei("1000000"))//1M
            //deploy tellor
            let TellorOracle = await ethers.getContractFactory(abi, bytecode);
            tellor = await TellorOracle.deploy();
            tellor2 = await TellorOracle.deploy();
            await tellor2.deployed();
            await tellor.deployed();
            mockNative = await deploy("MockNativeBridge")
            mockNative2 = await deploy("MockNativeBridge")
            gnosisAMB = await deploy("GnosisAMB", mockNative.address, tellor.address)
            gnosisAMB2 = await deploy("GnosisAMB", mockNative2.address, tellor2.address)
            p2e = await deploy("MockPOLtoETHBridge", tellor2.address, mockNative2.address)
            e2p = await deploy("MockETHtoPOLBridge", tellor.address,mockNative.address, mockNative.address,mockNative.address)
            await mockNative.setUsers(gnosisAMB.address, p2e.address, e2p.address)
            await mockNative2.setUsers(gnosisAMB2.address, p2e.address, e2p.address)
            charon = await deploy("charonAMM/contracts/Charon.sol:Charon",verifier2.address,verifier16.address,hasher.address,token.address,fee,[e2p.address,gnosisAMB.address],HEIGHT,1,"Charon Pool Token","CPT")
            //now deploy on other chain (same chain, but we pretend w/ oracles)
            token2 = await deploy("charonAMM/contracts/mocks/MockERC20.sol:MockERC20",accounts[1].address,"Dissapearing Space Monkey2","DSM2")
            await token2.mint(accounts[0].address,web3.utils.toWei("1000000"))//1M
            charon2 = await deploy("charonAMM/contracts/Charon.sol:Charon",verifier2.address,verifier16.address,hasher.address,token2.address,fee,[p2e.address],HEIGHT,2,"Charon Pool Token2","CPT2");
            chd = await deploy("charonAMM/contracts/mocks/MockERC20.sol:MockERC20",charon.address,"charon dollar","chd")
            chd2 = await deploy("charonAMM/contracts/mocks/MockERC20.sol:MockERC20",charon2.address,"charon dollar2","chd2")
            cfc = await deploy("feeContract/contracts/CFC.sol:CFC",charon.address,e2p.address,web3.utils.toWei("10"),web3.utils.toWei("20"),web3.utils.toWei("50"),web3.utils.toWei("20"));
            cfc2 = await deploy("feeContract/contracts/CFC.sol:CFC",charon2.address,p2e.address,web3.utils.toWei("10"),web3.utils.toWei("20"),web3.utils.toWei("50"),web3.utils.toWei("20"))
            cit = await deploy("incentiveToken/contracts/Auction.sol:Auction",token.address,web3.utils.toWei("2000"),86400*7,cfc.address,"Charon Incentive Token","CIT",web3.utils.toWei("100000"));
            await p2e.setCharon(charon2.address);
            await e2p.setCharon(charon.address);
            await token.approve(charon.address,web3.utils.toWei("100"))//100
            await token2.approve(charon2.address,web3.utils.toWei("100"))//100
            await charon.finalize([2],[charon2.address],web3.utils.toWei("100"),web3.utils.toWei("1000"),chd.address,cfc.address);
            await charon2.finalize([1],[charon.address],web3.utils.toWei("100"),web3.utils.toWei("1000"),chd2.address, cfc2.address);
            await cfc.setCIT(cit.address, 1,chd.address)
            await cfc2.setCIT(cit.address, 1,chd2.address)
            const initBlock = await hre.ethers.provider.getBlock("latest")
            Snap = new Snapshot(cit.address, initBlock, web3)
    });
    it("test whole system deployment, constructors and initialization", async function() {
        //charonAMM
        let _v = await charon.getOracles();
        assert(_v[1] == gnosisAMB.address, "oracle  address should be set")
        assert(await charon.levels() == HEIGHT, "merkle Tree height should be set")
        assert(await charon.hasher() == hasher.address, "hasher should be set")
        assert(await charon.verifier2() == verifier2.address, "verifier2 should be set")
        assert(await charon.verifier16() == verifier16.address, "verifier16 should be set")
        assert(await charon.token() == token.address, "token should be set")
        assert(await charon.fee() == fee, "fee should be set")
        assert(await charon.controller() == cfc.address, "controller should be set")
        assert(await charon.chainID() == 1, "chainID should be correct")
        //finalize
        let mockNative3 = await deploy("MockNativeBridge")
        await mockNative3.setUsers(gnosisAMB2.address, p2e.address, e2p.address)
        let token3 = await deploy("charonAMM/contracts/mocks/MockERC20.sol:MockERC20",accounts[1].address,"Dissapearing Space Monkey2","DSM2")
        await token3.mint(accounts[0].address,web3.utils.toWei("1000000"))//1M
        let testCharon = await deploy("charonAMM/contracts/Charon.sol:Charon",verifier2.address,verifier16.address,hasher.address,token3.address,fee,[gnosisAMB2.address],HEIGHT,3,"Charon Pool Token2","CPT2");
        let chd3 = await deploy("charonAMM/contracts/mocks/MockERC20.sol:MockERC20",testCharon.address,"charon dollar3","chd3") 
        await chd3.deployed();
        cfc3 = await deploy("feeContract/contracts/CFC.sol:CFC",testCharon.address,gnosisAMB2.address,web3.utils.toWei("10"),web3.utils.toWei("20"),web3.utils.toWei("50"),web3.utils.toWei("20"))
        await cfc3.deployed();
        await h.expectThrow(testCharon.finalize([1],[charon.address],web3.utils.toWei("100"),web3.utils.toWei("1000"),chd3.address,cfc3.address));//must transfer token
        await token3.approve(testCharon.address,web3.utils.toWei("100"))
        await h.expectThrow(testCharon.connect(accounts[1]).finalize([1],[charon.address,charon2.address],web3.utils.toWei("100"),web3.utils.toWei("1000"),chd3.address,cfc3.address))//must be controller
        await h.expectThrow(testCharon.finalize([1,2],[charon.address],web3.utils.toWei("100"),web3.utils.toWei("1000"),chd3.address,cfc3.address))//length should be same
        await testCharon.finalize([1,2],[charon.address,charon2.address],web3.utils.toWei("100"),web3.utils.toWei("1000"),chd3.address, cfc3.address);
        await h.expectThrow(testCharon.finalize([1],[charon.address],web3.utils.toWei("100"),web3.utils.toWei("1000"),chd3.address,cfc3.address))//already finalized
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
        assert(await cfc.oracle() == e2p.address, "tellor should be set")
        assert(await cfc.toOracle() == web3.utils.toWei("10"), "toOracle should be set")
        assert(await cfc.toLPs() == web3.utils.toWei("20"), "toLPs should be set")
        assert(await cfc.toHolders() == web3.utils.toWei("50"), "toHolders should be set")
        assert(await cfc.toUsers() == web3.utils.toWei("20"), "toUsers should be set")
        let feePeriod = await cfc.feePeriods(0)
        assert(feePeriod > 0, "first fee period shoud be set")
        let thisPeriod = await cfc.getFeePeriodByTimestamp(feePeriod)
        assert(thisPeriod.endDate - feePeriod == 0, "end date should be set")
        assert(await cfc.token() == token.address, "base token should be set")
        assert(await cfc.chd() ==chd.address, "chd should be set")
        //cit
        assert(await cit.bidToken() == token.address, "token should be set")
        assert(await cit.mintAmount() == web3.utils.toWei("2000"), "mint amount should be set")
        assert(await cit.auctionFrequency() == 86400*7, "auction frequency should be set")
        assert(await cit.charonFeeContract() == cfc.address, "cfc should be set")
        assert(await cit.endDate() > 0 , "first end date should be set")
        assert(await cit.balanceOf(accounts[0].address) == web3.utils.toWei("100000"), "init supply should be minted")
        assert(await cit.name() == "Charon Incentive Token", "name should be set")
        assert(await cit.symbol() == "CIT", "symbol should be set")
    });
    it("test multiple deposits on each AMM, multiple auctions, and proper payments/CFC distribution", async function() {
            //transact 1
            let _depositAmount = utils.parseEther('10');
            await token.mint(accounts[1].address,web3.utils.toWei("100"))
            let _amount = await charon.calcInGivenOut(web3.utils.toWei("100"),
                                                      web3.utils.toWei("1000"),
                                                      _depositAmount,
                                                      0)
            
            await token.connect(accounts[1]).approve(charon.address,_amount)
            let aliceDepositUtxo = new Utxo({ amount: _depositAmount, myHashFunc: poseidon, chainID: 2 })
            let inputData = await prepareTransaction({
              charon,
              inputs:[],
              outputs: [aliceDepositUtxo],
              account: {
                owner: accounts[0].address,
                publicKey: aliceDepositUtxo.keypair.address(),
              },
              privateChainID: 2,
              myHasherFunc: poseidon,
              myHasherFunc2: poseidon2
            })
            let args = inputData.args
            let extData = inputData.extData
            await charon.connect(accounts[1]).depositToOtherChain(args,extData,false);
            let dataEncoded = await ethers.utils.AbiCoder.prototype.encode(
            ['bytes','uint256','bytes32'],
            [args.proof,args.publicAmount,args.root]
            );
            let depositId = await charon.getDepositIdByCommitmentHash(h.hash(dataEncoded))
            let stateId = await p2e.latestStateId();
            let _id = await ethers.utils.AbiCoder.prototype.encode(['uint256'],[stateId]);
            await charon2.oracleDeposit([0],_id);
            // Alice sends some funds to withdraw (ignore bob)
            let bobSendAmount = utils.parseEther('4')
            let bobKeypair = new Keypair({myHashFunc:poseidon}) // contains private and public keys
 // contains private and public keys
            let bobAddress = await bobKeypair.address() // contains only public key
            let bobSendUtxo = new Utxo({ amount: bobSendAmount,myHashFunc: poseidon, keypair: Keypair.fromString(bobAddress,poseidon), chainID: 2 })
            let aliceChangeUtxo = new Utxo({
                amount: _depositAmount.sub(bobSendAmount),
                myHashFunc: poseidon,
                keypair: aliceDepositUtxo.keypair,
                chainID: 2
            })
            inputData = await prepareTransaction({
                charon: charon2,
                inputs:[aliceDepositUtxo],
                outputs: [bobSendUtxo, aliceChangeUtxo],
                privateChainID: 2,
                myHasherFunc: poseidon,
                myHasherFunc2: poseidon2
              })
            args = inputData.args
            extData = inputData.extData
            let badArg1,badExtData,badArg2,badExtData2
            badArg1 = Object.assign({},args);
            badArg1.root = h.hash("badroot")
            badExtData = Object.assign({},extData)
            badExtData.extAmount = '0x00000000055000000000000000000000000000000000000000000000000000000'
            badArg2 = Object.assign({},args);
            badArg2.proof = h.hash("badproof")
            badExtData2 = Object.assign({},extData)
            badExtData2.recipient = accounts[2].address
            await h.expectThrow(charon2.transact(badArg1,extData))//bad root
            await h.expectThrow(charon2.transact(badArg2,extData))//bad proof
            await h.expectThrow(charon2.transact(args,badExtData))//bad public amount
            await h.expectThrow(charon2.transact(args,badExtData2))// bad extData hash (changed recipient)
            assert(await charon2.isKnownRoot(inputData.args.root));
            await charon2.transact(args,extData)
                // Bob parses chain to detect incoming funds
            let filter = charon2.filters.NewCommitment()
            let fromBlock = await ethers.provider.getBlock()
            let events = await charon2.queryFilter(filter, fromBlock.number)
            let bobReceiveUtxo
            try {
                bobReceiveUtxo = Utxo.decrypt(bobKeypair, events[0].args._encryptedOutput, events[0].args._index)
            } catch (e) {
            // we try to decrypt another output here because it shuffles outputs before sending to blockchain
                bobReceiveUtxo = Utxo.decrypt(bobKeypair, events[1].args._encryptedOutput, events[1].args._index)
            }
            expect(bobReceiveUtxo.amount).to.be.equal(bobSendAmount)
            //send chd
            inputData = await prepareTransaction({
              charon: charon2,
              inputs: [aliceChangeUtxo],
              outputs: [],
              recipient: accounts[5].address,
              privateChainID: 2,
              myHasherFunc: poseidon,
              myHasherFunc2: poseidon2
            })
            await charon2.transact(inputData.args,inputData.extData)
            assert(await chd2.balanceOf(accounts[5].address) - _depositAmount.sub(bobSendAmount) == 0, "should mint CHD");
            chd2.connect(accounts[5]).transfer(accounts[4].address, web3.utils.toWei("2"))
            await chd2.connect(accounts[5]).approve(charon2.address,web3.utils.toWei("1"))
            let _minOut = await charon.calcOutGivenIn(web3.utils.toWei("1000"),web3.utils.toWei("100"),web3.utils.toWei("1"),0)
            _maxPrice = await charon.calcSpotPrice(web3.utils.toWei("1003"),web3.utils.toWei("99"),0)
            await charon2.connect(accounts[5]).swap(true,web3.utils.toWei("1"), _minOut,_maxPrice)
            //auction
            await token.mint(accounts[5].address,web3.utils.toWei("300"))
            await token.connect(accounts[5]).approve(cit.address,web3.utils.toWei("300"))
            await cit.connect(accounts[5]).bid(web3.utils.toWei("100"))
            await expect(cit.startNewAuction()).to.be.reverted;//auction must be over
            await h.advanceTime(86400*7)//7 days
            let ed1 = await cit.endDate()
            await cit.startNewAuction()
            assert(await cit.balanceOf(accounts[5].address) - await cit.mintAmount() == 0, "CIT should be minted")
            assert(await token.balanceOf(cfc.address) == web3.utils.toWei("50"), "CFC should get top bid")
            assert(await cit.endDate() >= ed1 + 86400 * 7, "endDate should add another week")
            assert(await cit.topBidder() == accounts[0].address, "msg.sender should be top bidder")
            assert(await cit.currentTopBid() == 0, "Top bid should be zero")
            await expect(cit.startNewAuction()).to.be.reverted;//auction must be over
            //random add fee
            //claim rewards, can't claim a bad reward
            await cit.transfer(accounts[1].address,web3.utils.toWei("1000"))
            await cit.transfer(accounts[2].address,web3.utils.toWei("2000"))
            await cit.transfer(accounts[3].address,web3.utils.toWei("3000"))
            await cit.transfer(accounts[4].address,web3.utils.toWei("4000"))
            await token.mint(accounts[2].address, web3.utils.toWei("1000"))
            await token.connect(accounts[2]).approve(cfc.address,web3.utils.toWei("1000"))
            await cfc.connect(accounts[2]).addFees(web3.utils.toWei("1000"),false);
            await h.advanceTime(86400 * 31)
            let _f= await cfc.feePeriods(0)
            let _queryData = abiCoder.encode(
                ['string', 'bytes'],
                ['CrossChainBalance', abiCoder.encode(
                    ['uint256','address','uint256'],
                    [1,cit.address,_f]
                )]
                );
            _queryId = h.hash(_queryData)
            let blockN = await ethers.provider.getBlockNumber()
            let root = await Snap.getRootHash(blockN)
            let ts = await cit.totalSupply()
            let v =  await cfc.getFeePeriodByTimestamp(_f)
            let _value = abiCoder.encode(['bytes32','uint256'],[root,ts])
            await tellor.submitValue(_queryId, _value,0, _queryData);
            await h.advanceTime(86400/2)
            assert(await token.balanceOf(accounts[2].address) == 0, "token balance of 2 should be nil")
            await cfc.endFeeRound()
            v =  await cfc.getFeePeriodByTimestamp(_f)
            //Take snapshop
            let data = Snap.data[blockN]
            //bad tries1100
            let i = 1
            for (key in data.sortedAccountList) {
                let account = data.sortedAccountList[key]
                let tx = await Snap.getClaimTX(blockN, account)
                assert(await cfc.getDidClaim(_f,accounts[i].address)== false, "didn't claim already")
                await h.expectThrow(cfc.claimRewards(_f,account,web3.utils.toWei("10000")*i,tx.hashes, tx.hashRight))//bad balance
                tx.hashes[0] = h.hash("badHash")
                await h.expectThrow(cfc.claimRewards(_f,account,web3.utils.toWei("1000")*i,tx.hashes, tx.hashRight))//bad tx.hashes
                tx = await Snap.getClaimTX(blockN, account)
                for(j=0;j < tx.hashRight.length; j++){
                    tx.hashRight[j] = true
                }
                await h.expectThrow(cfc.claimRewards(_f,account,web3.utils.toWei("1000")*i,tx.hashes, tx.hashRight))//bad tx.hashRight
                for(j=0;j < tx.hashRight.length; j++){
                    tx.hashRight[j] = false
                }
                await h.expectThrow(cfc.claimRewards(_f,account,web3.utils.toWei("1000")*i,tx.hashes, tx.hashRight))//bad tx.hashRight
                i++
            }
            i = 4
            data = Snap.data[blockN]
            for (key in data.sortedAccountList) {
                let account = data.sortedAccountList[key]
                for(j=0;j<5;j++){
                    if(account == accounts[j].address){
                        i = j
                    }
                }
                let tx = await Snap.getClaimTX(blockN, account)
                assert(await cfc.getDidClaim(_f,account)== false, "didn't claim already")
                let myBal = i * 1000
                if(i != 1 && i == j){
                  assert(data.balanceMap[account] - web3.utils.toWei(myBal.toString()) == 0, "balance should be correct")
                  await cfc.claimRewards(_f,account,data.balanceMap[account],tx.hashes, tx.hashRight)
                  assert(await cfc.getDidClaim(_f,account)== true, "did claim already")
                  await h.expectThrow(cfc.claimRewards(_f,account,web3.utils.toWei("1000")*i,tx.hashes, tx.hashRight))
                  assert(await token.balanceOf(account)*1 - (5392156862745098 * 1000*i) == 0, "token balance should be claimed")
                  assert(await chd.balanceOf(account) == 0, "chd balance should be claimed")
                }
                i--
            }
            await token.mint(accounts[1].address,web3.utils.toWei("100"))
            _amount = await charon.calcInGivenOut(web3.utils.toWei("322"),
                                                      web3.utils.toWei("1000"),
                                                      _depositAmount,
                                                      0)
            
            await token.connect(accounts[1]).approve(charon.address,_amount)
            aliceDepositUtxo = new Utxo({ amount: _depositAmount, myHashFunc: poseidon, chainID: 2 })
            inputData = await prepareTransaction({
              charon,
              inputs:[],
              outputs: [aliceDepositUtxo],
              account: {
                owner: accounts[0].address,
                publicKey: aliceDepositUtxo.keypair.address(),
              },
              privateChainID: 2,
              myHasherFunc: poseidon,
              myHasherFunc2: poseidon2
            })
            args = inputData.args
            extData = inputData.extData
            await charon.connect(accounts[1]).depositToOtherChain(args,extData,false);
            dataEncoded = await ethers.utils.AbiCoder.prototype.encode(
            ['bytes','uint256','bytes32'],
            [args.proof,args.publicAmount,args.root]
            );
            depositId = await charon.getDepositIdByCommitmentHash(h.hash(dataEncoded))
            stateId = await p2e.latestStateId();
            _id = await ethers.utils.AbiCoder.prototype.encode(['uint256'],[stateId]);
            await charon2.oracleDeposit([0],_id);
            // Alice sends some funds to withdraw (ignore bob)
            bobSendAmount = utils.parseEther('4')
            bobKeypair = new Keypair({myHashFunc:poseidon}) // contains private and public keys
 // contains private and public keys
            bobAddress = await bobKeypair.address() // contains only public key
            bobSendUtxo = new Utxo({ amount: bobSendAmount,myHashFunc: poseidon, keypair: bobKeypair, chainID: 2 })
            aliceChangeUtxo = new Utxo({
                amount: _depositAmount.sub(bobSendAmount),
                myHashFunc: poseidon,
                keypair: aliceDepositUtxo.keypair,
                chainID: 2
            })
            inputData = await prepareTransaction({
                charon: charon2,
                inputs:[aliceDepositUtxo],
                outputs: [bobSendUtxo, aliceChangeUtxo],
                privateChainID: 2,
                myHasherFunc: poseidon,
                myHasherFunc2: poseidon2
              })
            args = inputData.args
            extData = inputData.extData
            await charon2.transact(args,extData)
            //add transact16
            bobSendUtxo2 = new Utxo({ amount: bobSendAmount,myHashFunc: poseidon, keypair: bobKeypair , chainID: 2})
            let aliceChangeUtxo2 = new Utxo({
                amount: _depositAmount.sub(bobSendAmount),
                myHashFunc: poseidon,
                keypair: aliceChangeUtxo.keypair,
                chainID: 2
            })
            inputData = await prepareTransaction({
                charon: charon2,
                inputs:[aliceChangeUtxo],
                outputs: [bobSendUtxo2, aliceChangeUtxo2],
                privateChainID: 2,
                myHasherFunc: poseidon,
                myHasherFunc2: poseidon2
              })
            await charon2.transact(inputData.args,inputData.extData)
            //second w/ more
            let charlieSendAmount = utils.parseEther('7')
            let charlieKeypair = new Keypair({myHashFunc:poseidon}) // contains private and public keys
            let charlieAddress = await charlieKeypair.address() // contains only public key
            let charlieSendUtxo = new Utxo({ amount: charlieSendAmount,myHashFunc: poseidon, keypair: Keypair.fromString(charlieAddress,poseidon),chainID: 2 })
            let bobChangeUtxo = new Utxo({
                amount: utils.parseEther('1'),
                myHashFunc: poseidon,
                keypair: bobSendUtxo.keypair,
                chainID: 2
            })
            inputData = await prepareTransaction({
                charon: charon2,
                inputs:[bobSendUtxo, bobSendUtxo2],
                outputs: [bobChangeUtxo,charlieSendUtxo],
                privateChainID: 2,
                myHasherFunc: poseidon,
                myHasherFunc2: poseidon2
              })
            args = inputData.args
            extData = inputData.extData
            await charon2.transact(args,extData)
            //random swaps
            await token.mint(accounts[1].address,web3.utils.toWei("100"))
            _minOut = await charon.calcOutGivenIn(web3.utils.toWei("335"),web3.utils.toWei("950"),web3.utils.toWei("10"),0)
            _maxPrice = await charon.calcSpotPrice(web3.utils.toWei("335"),web3.utils.toWei("950"),0)
            await token.connect(accounts[1]).approve(charon.address,web3.utils.toWei("10"))
            await charon.connect(accounts[1]).swap(false,web3.utils.toWei("10"), _minOut,_maxPrice)
           _minOut = await charon2.calcOutGivenIn(web3.utils.toWei("1010"),web3.utils.toWei("95"),web3.utils.toWei("1"),0)
            _maxPrice = await charon2.calcSpotPrice(web3.utils.toWei("1010"),web3.utils.toWei("95"),0)
            await chd2.connect(accounts[5]).approve(charon2.address,web3.utils.toWei("1"))
            await charon2.connect(accounts[5]).swap(true,web3.utils.toWei("1"), _minOut,_maxPrice)
            //cit transfers 
            await cit.transfer(accounts[6].address, web3.utils.toWei("50"))
            assert(await cit.balanceOf(accounts[6].address) == web3.utils.toWei("50"), "should transfer 50 cit")

            //cfc month distribution
            await token.mint(accounts[2].address, web3.utils.toWei("1000"))
            await token.connect(accounts[2]).approve(cfc.address,web3.utils.toWei("1000"))
            await cfc.connect(accounts[2]).addFees(web3.utils.toWei("1000"),false);
            await chd.connect(accounts[1]).approve(cfc.address,web3.utils.toWei("1000"))
            await cfc.connect(accounts[1]).addFees(web3.utils.toWei("3"),true);
            await h.advanceTime(86400 * 31)
            _f= await cfc.feePeriods(1)
            _queryData = abiCoder.encode(
                ['string', 'bytes'],
                ['CrossChainBalance', abiCoder.encode(
                    ['uint256','address','uint256'],
                    [1,cit.address,_f]
                )]
                );
            _queryId = h.hash(_queryData)
            blockN = await ethers.provider.getBlockNumber()
            root = await Snap.getRootHash(blockN)
            ts = await cit.totalSupply()
             _value = abiCoder.encode(['bytes32','uint256'],[root,ts])
            await tellor.submitValue(_queryId, _value,0, _queryData);
            await h.advanceTime(86400/2)
            await cfc.endFeeRound()
            //Take snapshop
            data = Snap.data[blockN]
            //bad tries
            i = 1
            for (key in data.sortedAccountList) {
                let account = data.sortedAccountList[key]
                let tx = await Snap.getClaimTX(blockN, account)
                assert(await cfc.getDidClaim(_f,accounts[i].address)== false, "didn't claim already")
                await h.expectThrow(cfc.claimRewards(_f,account,web3.utils.toWei("1000")*i,tx.hashes, tx.hashRight))//bad balance
                tx.hashes[0] = h.hash("badHash")
                await h.expectThrow(cfc.claimRewards(_f,account,web3.utils.toWei("100")*i,tx.hashes, tx.hashRight))//bad tx.hashes
                tx = await Snap.getClaimTX(blockN, account)
                for(j=0;j < tx.hashRight.length; j++){
                    tx.hashRight[j] = true
                }
                await h.expectThrow(cfc.claimRewards(_f,account,web3.utils.toWei("100")*i,tx.hashes, tx.hashRight))//bad tx.hashRight
                for(j=0;j < tx.hashRight.length; j++){
                    tx.hashRight[j] = false
                }
                await h.expectThrow(cfc.claimRewards(_f,account,web3.utils.toWei("100")*i,tx.hashes, tx.hashRight))//bad tx.hashRight
                i++
            }
            i = 4
            data = Snap.data[blockN]
            for (key in data.sortedAccountList) {
                let account = data.sortedAccountList[key]
                for(j=0;j<5;j++){
                    if(account == accounts[j].address){
                        i = j
                    }
                }
                if(i == j){
                  let tx = await Snap.getClaimTX(blockN, account)
                  assert(await cfc.getDidClaim(_f,account)== false, "didn't claim already")
                  let myBal = i * 100
                  assert(data.balanceMap[account] - web3.utils.toWei(myBal.toString()) == 0, "balance should be correct")
                  await cfc.claimRewards(_f,account,data.balanceMap[account],tx.hashes, tx.hashRight)
                  assert(await cfc.getDidClaim(_f,account)== true, "did claim already")
                  await h.expectThrow(cfc.claimRewards(_f,account,web3.utils.toWei("100")*i,tx.hashes, tx.hashRight))
                  assert(await token.balanceOf(account) - web3.utils.toWei("100")*i/2 == 0, "token balance should be claimed")
                  assert(await chd.balanceOf(account) - web3.utils.toWei("100")*i/2 == 0, "chd balance should be claimed")
                }
                i--
            }
    });
    it("test everyone withdraws and token holds zero value", async function() {
        //multiple people transact and add funds to pools

        console.log("starting long e2e test....")
        //start 3 systems
        let TellorOracle = await ethers.getContractFactory(abi, bytecode);
        let tellor3 = await TellorOracle.deploy();
        await tellor3.deployed();
        p2e = await deploy("MockPOLtoETHBridge", tellor2.address, mockNative2.address)
        e2p = await deploy("MockETHtoPOLBridge", tellor.address,mockNative.address, mockNative.address,mockNative.address)
        let mockNative3 = await deploy("MockNativeBridge")
        await mockNative3.setUsers(gnosisAMB2.address, p2e.address, e2p.address)
        charon = await deploy("charonAMM/contracts/Charon.sol:Charon",verifier2.address,verifier16.address,hasher.address,token.address,fee,[e2p.address,gnosisAMB.address],HEIGHT,1,"Charon Pool Token","CPT")
        let token3 = await deploy("charonAMM/contracts/mocks/MockERC20.sol:MockERC20",accounts[1].address,"Dissapearing Space Monkey2","DSM2")
        await token3.mint(accounts[0].address,web3.utils.toWei("1000000"))//1M
        charon2 = await deploy("charonAMM/contracts/Charon.sol:Charon",verifier2.address,verifier16.address,hasher.address,token2.address,fee,[p2e.address],HEIGHT,2,"Charon Pool Token2","CPT2");
        let charon3 = await deploy("charonAMM/contracts/Charon.sol:Charon",verifier2.address,verifier16.address,hasher.address,token3.address,fee,[gnosisAMB2.address],HEIGHT,3,"Charon Pool Token2","CPT2");
        chd = await deploy("charonAMM/contracts/mocks/MockERC20.sol:MockERC20",charon.address,"charon dollar","chd")
        chd2 = await deploy("charonAMM/contracts/mocks/MockERC20.sol:MockERC20",charon2.address,"charon dollar2","chd2")
        let chd3 = await deploy("charonAMM/contracts/mocks/MockERC20.sol:MockERC20",charon3.address,"charon dollar3","chd3") 
        await token.approve(charon.address,web3.utils.toWei("100"))//100
        await token2.approve(charon2.address,web3.utils.toWei("100"))//100
        await token3.approve(charon3.address,web3.utils.toWei("100"))
        await mockNative.setUsers(gnosisAMB.address, p2e.address, e2p.address)
        await mockNative2.setUsers(gnosisAMB2.address, p2e.address, e2p.address)
        await p2e.setCharon(charon2.address);
        await e2p.setCharon(charon.address);
        cfc = await deploy("feeContract/contracts/CFC.sol:CFC",charon.address,e2p.address,web3.utils.toWei("10"),web3.utils.toWei("20"),web3.utils.toWei("50"),web3.utils.toWei("20"));
        cfc2 = await deploy("feeContract/contracts/CFC.sol:CFC",charon.address,p2e.address,web3.utils.toWei("10"),web3.utils.toWei("20"),web3.utils.toWei("50"),web3.utils.toWei("20"));
        cfc3 = await deploy("feeContract/contracts/CFC.sol:CFC",charon.address,gnosisAMB2.address,web3.utils.toWei("10"),web3.utils.toWei("20"),web3.utils.toWei("50"),web3.utils.toWei("20"));
        cit = await deploy("incentiveToken/contracts/Auction.sol:Auction",token.address,web3.utils.toWei("2000"),86400*7,cfc.address,"Charon Incentive Token","CIT",web3.utils.toWei("100000"));
        await charon.finalize([2,3],[charon2.address, charon3.address],web3.utils.toWei("100"),web3.utils.toWei("1000"),chd.address,cfc.address);
        await charon2.finalize([1,3],[charon.address,charon3.address],web3.utils.toWei("100"),web3.utils.toWei("1000"),chd2.address, cfc2.address);
        await charon3.finalize([1,2],[charon.address,charon2.address],web3.utils.toWei("100"),web3.utils.toWei("1000"),chd3.address, cfc3.address);
        await cfc.setCIT(cit.address, 1,chd.address)
        await cfc2.setCIT(cit.address, 1,chd2.address)
        await cfc3.setCIT(cit.address, 1,chd.address)
        //deposit from 1 to 2
        let _depositAmount = utils.parseEther('10');
        await token.mint(accounts[1].address,web3.utils.toWei("100"))
        let _amount = await charon.calcInGivenOut(web3.utils.toWei("100"),
                                                  web3.utils.toWei("1000"),
                                                  _depositAmount,
                                                  0)
        await token.connect(accounts[1]).approve(charon.address,_amount)
        let aliceDepositUtxo12 = new Utxo({ amount: _depositAmount,myHashFunc: poseidon, chainID: 2 })
        let inputData = await prepareTransaction({
          charon: charon,
          inputs:[],
          outputs: [aliceDepositUtxo12],
          account: {
            owner: accounts[1].address,
            publicKey: aliceDepositUtxo12.keypair.address(),
          },
          privateChainID: 2,
          myHasherFunc: poseidon,
          myHasherFunc2: poseidon2
        })
        let args = inputData.args
        let extData = inputData.extData
        await charon.connect(accounts[1]).depositToOtherChain(inputData.args,extData,false);
        let stateId = await p2e.latestStateId();
        let _id = await ethers.utils.AbiCoder.prototype.encode(['uint256'],[stateId]);
        await charon2.oracleDeposit([0],_id);
        //deposit from 1 to 3
        await token.mint(accounts[1].address,web3.utils.toWei("100"))
        _amount = await charon.calcInGivenOut(web3.utils.toWei("110"),
                                                  web3.utils.toWei("1000"),
                                                  _depositAmount,
                                                  0)
        await token.connect(accounts[1]).approve(charon.address,_amount)
        let aliceDepositUtxo13 = new Utxo({ amount: _depositAmount,myHashFunc: poseidon, chainID: 3 })
        inputData = await prepareTransaction({
          charon: charon,
          inputs:[],
          outputs: [aliceDepositUtxo13],
          account: {
            owner: accounts[0].address,
            publicKey: aliceDepositUtxo13.keypair.address(),
          },
          privateChainID: 3,
          myHasherFunc: poseidon,
          myHasherFunc2: poseidon2
        })
        args = inputData.args
        extData = inputData.extData
        await charon.connect(accounts[1]).depositToOtherChain(args,extData,false);
        dataEncoded = await ethers.utils.AbiCoder.prototype.encode(
        ['bytes','uint256','bytes32'],
        [args.proof,args.publicAmount,args.root]
        );
        depositId = await charon.getDepositIdByCommitmentHash(h.hash(dataEncoded))
        let commi = await getTellorSubmission(args,extData);
        await mockNative2.setAMBInfo(depositId, commi)
        _encoded = await ethers.utils.AbiCoder.prototype.encode(['uint256'],[depositId]);
        tx = await charon3.oracleDeposit([0],web3.utils.sha3(_encoded, {encoding: 'hex'}));
        //deposit from 2 to 1
        await token2.mint(accounts[1].address,web3.utils.toWei("100"))
        _amount = await charon2.calcInGivenOut(web3.utils.toWei("100"),
                                                  web3.utils.toWei("1000"),
                                                  _depositAmount,
                                                  0)
        await token2.connect(accounts[1]).approve(charon2.address,_amount)
        let aliceDepositUtxo21 = new Utxo({ amount: _depositAmount,myHashFunc: poseidon, chainID: 1 })
        inputData = await prepareTransaction({
          charon: charon2,
          inputs:[],
          outputs: [aliceDepositUtxo21],
          account: {
            owner: accounts[0].address,
            publicKey: aliceDepositUtxo21.keypair.address(),
          },
          privateChainID: 1,
          myHasherFunc: poseidon,
          myHasherFunc2: poseidon2
        })
        args = inputData.args
        extData = inputData.extData
        await charon2.connect(accounts[1]).depositToOtherChain(args,extData,false);
        commi = await getTellorSubmission(args,extData);
        await mockNative2.sendMessageToRoot(commi)
        stateId = await e2p.id();
        _id = await ethers.utils.AbiCoder.prototype.encode(['uint256'],[stateId]);
        await charon.oracleDeposit([0],_id);
        //deposit from 3 to 1
        await token3.mint(accounts[1].address,web3.utils.toWei("100"))
        _amount = await charon.calcInGivenOut(web3.utils.toWei("110"),
                                                  web3.utils.toWei("1000"),
                                                  _depositAmount,
                                                  0)
        await token3.connect(accounts[1]).approve(charon3.address,_amount)
        aliceDepositUtxo31 = new Utxo({ amount: _depositAmount,myHashFunc: poseidon, chainID: 1})
        inputData = await prepareTransaction({
          charon: charon3,
          inputs:[],
          outputs: [aliceDepositUtxo31],
          account: {
            owner: accounts[0].address,
            publicKey: aliceDepositUtxo31.keypair.address(),
          },
          privateChainID: 1,
          myHasherFunc: poseidon,
          myHasherFunc2: poseidon2
        })
        args = inputData.args
        extData = inputData.extData
        await charon3.connect(accounts[1]).depositToOtherChain(args,extData,false);
        dataEncoded = await ethers.utils.AbiCoder.prototype.encode(
        ['bytes','uint256','bytes32'],
        [args.proof,args.publicAmount,args.root]
        );
        depositId = await charon3.getDepositIdByCommitmentHash(h.hash(dataEncoded))
        tellorData = await getTellorData(tellor,charon3.address,3,depositId)
        commi = await getTellorSubmission(args,extData);
        await mockNative.setAMBInfo(depositId, commi)
        _encoded = await ethers.utils.AbiCoder.prototype.encode(['uint256'],[depositId]);
        await charon.oracleDeposit([1],web3.utils.sha3(_encoded, {encoding: 'hex'}));
        //do a swap
        await token.mint(accounts[2].address,web3.utils.toWei("100"))
        let _minOut = await charon.calcOutGivenIn(web3.utils.toWei("120"),web3.utils.toWei("1000"),web3.utils.toWei("10"),0)
        let _maxPrice = await charon.calcSpotPrice(web3.utils.toWei("130"),web3.utils.toWei("900"),0)
        await token.connect(accounts[2]).approve(charon.address,web3.utils.toWei("10"))
        await charon.connect(accounts[2]).swap(false,web3.utils.toWei("10"), _minOut,_maxPrice)
        await token2.mint(accounts[1].address,web3.utils.toWei("100"))
        _minOut = await charon2.calcOutGivenIn(web3.utils.toWei("120"),web3.utils.toWei("1000"),web3.utils.toWei("10"),0)
        _maxPrice = await charon2.calcSpotPrice(web3.utils.toWei("130"),web3.utils.toWei("900"),0)
        await token2.connect(accounts[1]).approve(charon2.address,web3.utils.toWei("10"))
        await charon2.connect(accounts[1]).swap(false,web3.utils.toWei("10"), _minOut,_maxPrice)
        await chd3.mint(accounts[1].address,web3.utils.toWei("100"))
        _minOut = await charon3.calcOutGivenIn(web3.utils.toWei("1010"),web3.utils.toWei("100"),web3.utils.toWei("10"),0)
        _maxPrice = await charon3.calcSpotPrice(web3.utils.toWei("1020"),web3.utils.toWei("98"),0)
        await chd3.connect(accounts[1]).approve(charon3.address,web3.utils.toWei("10"))
        await charon3.connect(accounts[1]).swap(true,web3.utils.toWei("10"), _minOut,_maxPrice)//this one with chdt
        //lp withdraw
        await charon.lpWithdraw(web3.utils.toWei("5"), 0,0)
        await charon2.lpWithdraw(web3.utils.toWei("5"), 0,0)
        await charon3.lpWithdraw(web3.utils.toWei("5"), 0,0)
        //transact on each chain
        let bobSendAmount = utils.parseEther('4')
        let  bobKeypair = new Keypair({myHashFunc:poseidon}) // contains private and public keys
        let bobAddress = await bobKeypair.address() // contains only public key
        let bobSendUtxo = new Utxo({ amount: bobSendAmount,myHashFunc: poseidon, keypair: Keypair.fromString(bobAddress,poseidon), chainID: 2 })
        let aliceChangeUtxo = new Utxo({
            amount: _depositAmount.sub(bobSendAmount),
            myHashFunc: poseidon,
            keypair: aliceDepositUtxo12.keypair,
            chainID: 2
        })
       inputData = await prepareTransaction({
        charon: charon2,
        inputs:[aliceDepositUtxo12],
        outputs: [bobSendUtxo, aliceChangeUtxo],
        privateChainID: 2,
        myHasherFunc: poseidon,
        myHasherFunc2: poseidon2
      })
      assert(await charon2.isKnownRoot(inputData.args.root));
      await charon2.transact(inputData.args,inputData.extData)
      bobKeypair = new Keypair({myHashFunc:poseidon}) // contains private and public keys
      bobAddress = await bobKeypair.address() // contains only public key
      bobSendUtxo = new Utxo({ amount: bobSendAmount,myHashFunc: poseidon, keypair: Keypair.fromString(bobAddress,poseidon), chainID: 1 })
      aliceChangeUtxo = new Utxo({
          amount: _depositAmount.sub(bobSendAmount),
          myHashFunc: poseidon,
          keypair: aliceDepositUtxo21.keypair,
          chainID: 1
      })
      inputData = await prepareTransaction({
          charon: charon,
          inputs:[aliceDepositUtxo21],
          outputs: [bobSendUtxo, aliceChangeUtxo],
          privateChainID: 1,
          myHasherFunc: poseidon,
          myHasherFunc2: poseidon2
        })
        assert(await charon.isKnownRoot(inputData.args.root));
        await charon.transact(inputData.args,inputData.extData)
        bobKeypair = new Keypair({myHashFunc:poseidon}) // contains private and public keys
        // contains private and public keys
        bobAddress = await bobKeypair.address() // contains only public key
        bobSendUtxo = new Utxo({ amount: bobSendAmount,myHashFunc: poseidon, keypair: Keypair.fromString(bobAddress,poseidon), chainID: 3 })
        aliceChangeUtxo = new Utxo({
            amount: _depositAmount.sub(bobSendAmount),
            myHashFunc: poseidon,
            keypair: aliceDepositUtxo13.keypair,
            chainID: 3
        })
       inputData = await prepareTransaction({
           charon: charon3,
           inputs:[aliceDepositUtxo13],
           outputs: [bobSendUtxo, aliceChangeUtxo],
           privateChainID: 3,
           myHasherFunc: poseidon,
           myHasherFunc2: poseidon2
         })
        assert(await charon3.isKnownRoot(inputData.args.root));
        await charon3.transact(inputData.args,inputData.extData)
        //do another swap
        await token.mint(accounts[1].address,web3.utils.toWei("100"))
        _minOut = await charon.calcOutGivenIn(web3.utils.toWei("123"),web3.utils.toWei("800"),web3.utils.toWei("10"),0)
        _maxPrice = await charon.calcSpotPrice(web3.utils.toWei("123"),web3.utils.toWei("800"),0)
        await token.connect(accounts[1]).approve(charon.address,web3.utils.toWei("10"))
        await charon.connect(accounts[1]).swap(false,web3.utils.toWei("10"), _minOut,_maxPrice)
        await chd2.mint(accounts[1].address,web3.utils.toWei("100"))
        _minOut = await charon2.calcOutGivenIn(web3.utils.toWei("876"),web3.utils.toWei("104"),web3.utils.toWei("10"),0)
        _maxPrice = await charon2.calcSpotPrice(web3.utils.toWei("876"),web3.utils.toWei("104"),0)
        await chd2.connect(accounts[1]).approve(charon2.address,web3.utils.toWei("10"))
        await charon2.connect(accounts[1]).swap(true,web3.utils.toWei("10"), _minOut,_maxPrice)
        await chd3.mint(accounts[1].address,web3.utils.toWei("100"))
        _minOut = await charon3.calcOutGivenIn(web3.utils.toWei("960"),web3.utils.toWei("93"),web3.utils.toWei("10"),0)
        _maxPrice = await charon3.calcSpotPrice(web3.utils.toWei("960"),web3.utils.toWei("93"),0)
        await chd3.connect(accounts[1]).approve(charon3.address,web3.utils.toWei("10"))
        await charon3.connect(accounts[1]).swap(true,web3.utils.toWei("10"), _minOut,_maxPrice)//this one with chd
        //withdraw on each chain/
        inputData = await prepareTransaction({
                      charon: charon,
                      inputs: [aliceDepositUtxo31],
                      outputs: [],
                      recipient: accounts[5].address,
                      privateChainID: 1,
                      myHasherFunc: poseidon,
                      myHasherFunc2: poseidon2
                  })
                  await charon.transact(inputData.args,inputData.extData)
                  assert(await chd.balanceOf(accounts[5].address) - _depositAmount == 0, "should mint CHD");
          inputData = await prepareTransaction({
            charon: charon3,
            inputs: [aliceChangeUtxo],
            outputs: [],
            recipient: accounts[5].address,
            privateChainID: 3,
            myHasherFunc: poseidon,
            myHasherFunc2: poseidon2
        })
        await charon3.transact(inputData.args,inputData.extData)
        assert(await chd3.balanceOf(accounts[5].address) - (_depositAmount - bobSendAmount) == 0, "should mint CHD");
        //LP extra on all 3
        await token.connect(accounts[1]).approve(charon.address,web3.utils.toWei("10"))
        let minOut = await charon.calcPoolOutGivenSingleIn(web3.utils.toWei("100"),//tokenBalanceIn
            web3.utils.toWei("100"),//poolSupply
            web3.utils.toWei("10")//tokenamountIn
            )
        await chd.connect(accounts[1]).approve(charon.address,web3.utils.toWei("100"))
        await charon.connect(accounts[1]).lpDeposit(minOut,web3.utils.toWei("100"),web3.utils.toWei("10"))
        await token2.connect(accounts[1]).approve(charon2.address,web3.utils.toWei("10"))
        minOut = await charon2.calcPoolOutGivenSingleIn(web3.utils.toWei("100"),//tokenBalanceIn
            web3.utils.toWei("100"),//poolSupply
            web3.utils.toWei("10")//tokenamountIn
            )
        await chd2.connect(accounts[1]).approve(charon2.address,web3.utils.toWei("100"))
        await charon2.connect(accounts[1]).lpDeposit(minOut,web3.utils.toWei("100"),web3.utils.toWei("10"))
        await token3.connect(accounts[1]).approve(charon3.address,web3.utils.toWei("10"))
        minOut = await charon3.calcPoolOutGivenSingleIn(web3.utils.toWei("100"),//tokenBalanceIn
            web3.utils.toWei("100"),//poolSupply
            web3.utils.toWei("10")//tokenamountIn
            )
        await chd3.connect(accounts[1]).approve(charon3.address,web3.utils.toWei("100"))
        await charon3.connect(accounts[1]).lpDeposit(minOut,web3.utils.toWei("100"),web3.utils.toWei("10"))
        //do another swap
        await token.mint(accounts[1].address,web3.utils.toWei("100"))
        _minOut = await charon.calcOutGivenIn(web3.utils.toWei("133"),web3.utils.toWei("760"),web3.utils.toWei("10"),0)
        _maxPrice = await charon.calcSpotPrice(web3.utils.toWei("133"),web3.utils.toWei("760"),0)
        await token.connect(accounts[1]).approve(charon.address,web3.utils.toWei("10"))
        await charon.connect(accounts[1]).swap(false,web3.utils.toWei("10"), _minOut,_maxPrice)
        await token2.mint(accounts[1].address,web3.utils.toWei("100"))
       _minOut = await charon2.calcOutGivenIn(web3.utils.toWei("121"),web3.utils.toWei("810"),web3.utils.toWei("10"),0)
        _maxPrice = await charon2.calcSpotPrice(web3.utils.toWei("121"),web3.utils.toWei("810"),0)
        await token2.connect(accounts[1]).approve(charon2.address,web3.utils.toWei("10"))
        await charon2.connect(accounts[1]).swap(false,web3.utils.toWei("10"), _minOut,_maxPrice)
        _minOut = await charon3.calcOutGivenIn(web3.utils.toWei("1000"),web3.utils.toWei("89"),web3.utils.toWei("10"),0)
        _maxPrice = await charon3.calcSpotPrice(web3.utils.toWei("1000"),web3.utils.toWei("89"),0)
        await chd3.connect(accounts[1]).approve(charon3.address,web3.utils.toWei("10"))
        await charon3.connect(accounts[1]).swap(true,web3.utils.toWei("10"), _minOut,_maxPrice)//this one with chd
        //one auction w/ value then none
        await token.mint(accounts[2].address, web3.utils.toWei("300"));
        await token.connect(accounts[2]).approve(cit.address,web3.utils.toWei("300"))
        await cit.connect(accounts[2]).bid(web3.utils.toWei("100"))
        await h.expectThrow(cit.startNewAuction());//auction must be over
        await h.advanceTime(86400*7)//7 days
        let ed1 = await cit.endDate()
        let ibal = await token.balanceOf(charon.address)
        await cit.startNewAuction()
        assert(await cit.balanceOf(accounts[2].address) - await cit.mintAmount() == 0, "CIT should be minted")
        assert(await token.balanceOf(cfc.address) == web3.utils.toWei("50"), "CFC should get top bid")
        assert(1 * await token.balanceOf(charon.address) - ibal == web3.utils.toWei("50"), "Charon should get half top bid (oracles, users, lps)")
        assert(await cit.endDate() >= ed1 + 86400 * 7, "endDate should add another week")
        assert(await cit.topBidder() == accounts[0].address, "msg.sender should be top bidder")
        assert(await cit.currentTopBid() == 0, "Top bid should be zero")
        await h.expectThrow(cit.startNewAuction());//auction must be over
        //bid 2
        await token.mint(accounts[3].address, web3.utils.toWei("300"));
        await token.connect(accounts[3]).approve(cit.address,web3.utils.toWei("300"))
        await token.mint(accounts[4].address, web3.utils.toWei("300"));
        await token.connect(accounts[4]).approve(cit.address,web3.utils.toWei("300"))
        await cit.connect(accounts[3]).bid(web3.utils.toWei("100"))
        await cit.connect(accounts[4]).bid(web3.utils.toWei("150"))
        await cit.connect(accounts[3]).bid(web3.utils.toWei("200"))
        await h.expectThrow(cit.startNewAuction());//auction must be over
        await h.advanceTime(86400*7)//7 days
        ed1 = await cit.endDate()
        await cit.connect(accounts[3]).startNewAuction()
        assert(await cit.balanceOf(accounts[3].address) - await cit.mintAmount() == 0, "CIT should be minted")
        assert(await token.balanceOf(cfc.address) == web3.utils.toWei("150"), "CFC should get another top bid")
        assert(await token.balanceOf(accounts[3].address) == web3.utils.toWei("100"), "should have 200 less tokens")
        assert(await token.balanceOf(accounts[4].address) == web3.utils.toWei("300"), "should have no less tokens")
        assert(await cit.endDate() >= ed1 + 86400 * 7, "endDate should add another week")
        assert(await cit.topBidder() == accounts[3].address, "msg.sender should be top bidder")
        assert(await cit.currentTopBid() == 0, "Top bid should be zero")
        //bid 3 - no bids
        await h.advanceTime(86400*7)//7 days
        await cit.startNewAuction()
        assert(await cit.balanceOf(accounts[3].address) - 2 * await cit.mintAmount() == 0, "CIT should be minted")
        assert(await token.balanceOf(cfc.address) == web3.utils.toWei("150"), "CFC should get top bid")
        assert(await token.balanceOf(accounts[3].address) == web3.utils.toWei("100"), "should have 200 less tokens")
        //bid 4
        await token.mint(accounts[5].address, web3.utils.toWei("300"));
        await token.connect(accounts[5]).approve(cit.address,web3.utils.toWei("300"))
        await token.mint(accounts[6].address, web3.utils.toWei("300"));
        await token.connect(accounts[6]).approve(cit.address,web3.utils.toWei("300"))
        await token.mint(accounts[7].address, web3.utils.toWei("300"));
        await token.connect(accounts[7]).approve(cit.address,web3.utils.toWei("300"))
        await cit.connect(accounts[4]).bid(web3.utils.toWei("100"))
        await cit.connect(accounts[5]).bid(web3.utils.toWei("101"))
        await cit.connect(accounts[6]).bid(web3.utils.toWei("102"))
        await cit.connect(accounts[7]).bid(web3.utils.toWei("103"))
        await cit.connect(accounts[5]).bid(web3.utils.toWei("104"))
        await cit.connect(accounts[6]).bid(web3.utils.toWei("105"))
        await cit.connect(accounts[7]).bid(web3.utils.toWei("150"))
        await h.advanceTime(86400*7)//7 days
        await cit.startNewAuction()
        assert(await cit.balanceOf(accounts[7].address) - await cit.mintAmount() == 0, "CIT should be minted")
        assert(await token.balanceOf(cfc.address) == web3.utils.toWei("225"), "CFC should get top bid")
        assert(await token.balanceOf(accounts[4].address) == web3.utils.toWei("300"), "should have not lost tokens")
        assert(await token.balanceOf(accounts[5].address) == web3.utils.toWei("300"), "should have not lost tokens")
        assert(await token.balanceOf(accounts[7].address) == web3.utils.toWei("150"), "should have 150 less tokens")
        assert(await token.balanceOf(accounts[6].address) == web3.utils.toWei("300"), "should have no less tokens")

        //everyone in AMM withdraws and no more bids
        await token.mint(accounts[1].address,web3.utils.toWei("100"))
        _amount = await charon.calcInGivenOut(web3.utils.toWei("223"),
                                                      web3.utils.toWei("76"),
                                                      _depositAmount,
                                                      0)
            
            await token.connect(accounts[1]).approve(charon.address,_amount)
            let aliceDepositUtxo2 = new Utxo({ amount: _depositAmount, myHashFunc: poseidon, chainID: 2 })
            inputData = await prepareTransaction({
              charon,
              inputs:[],
              outputs: [aliceDepositUtxo2],
              account: {
                owner: accounts[0].address,
                publicKey: aliceDepositUtxo2.keypair.address(),
              },
              privateChainID: 2,
              myHasherFunc: poseidon,
              myHasherFunc2: poseidon2
            })
            args = inputData.args
             extData = inputData.extData
            await charon.connect(accounts[1]).depositToOtherChain(args,extData,false);
            dataEncoded = await ethers.utils.AbiCoder.prototype.encode(
            ['bytes','uint256','bytes32'],
            [args.proof,args.publicAmount,args.root]
            );
            depositId = await charon.getDepositIdByCommitmentHash(h.hash(dataEncoded))
            stateId = await p2e.latestStateId();
            _id = await ethers.utils.AbiCoder.prototype.encode(['uint256'],[stateId]);
            await charon2.oracleDeposit([0],_id);
            bobSendAmount = utils.parseEther('4')
            bobKeypair = new Keypair({myHashFunc:poseidon})
            bobAddress = await bobKeypair.address() // contains only public key
            bobSendUtxo = new Utxo({ amount: bobSendAmount,myHashFunc: poseidon, keypair: Keypair.fromString(bobAddress,poseidon), chainID: 2 })
            let aliceChangeUtxo2 = new Utxo({
                amount: _depositAmount.sub(bobSendAmount),
                myHashFunc: poseidon,
                keypair: aliceDepositUtxo2.keypair,
                chainID: 2
            })
            inputData = await prepareTransaction({
                charon: charon2,
                inputs:[aliceDepositUtxo2],
                outputs: [bobSendUtxo, aliceChangeUtxo2],
                privateChainID: 2,
                myHasherFunc: poseidon,
                myHasherFunc2: poseidon2
              })
            args = inputData.args
            extData = inputData.extData
            await charon2.transact(args,extData)
            await charon2.lpWithdraw(web3.utils.toWei("94"), web3.utils.toWei("700"),web3.utils.toWei("70"))
            assert(await charon2.totalSupply() <=  web3.utils.toWei("6"), "all(most) pool tokens should be gone")
    });
});