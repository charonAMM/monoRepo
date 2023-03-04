# charon monorepo

this repo pulls in all other repos in the system for unified testing / deployment

## setting up and testing

```sh
npm i
npx hardhat compile
npx hardhat test
```

## running scripts

deploying: npx hardhat run scripts/deploySystem.js --network networkName

finalizing: npx hardhat run scripts/finalizePools.js --network networkName

checks: npx hardhat run scripts/manualChecks.js --network networkName


## deployed contracts (current version)

deploy date - 2/14/2023

goerli
    
    - verifier2 = 0xCcC741ba014d1D3077473B491EB8C909ebAcBa9D
    - veriifer16 = 0x5243781910cf05C0C6Bd83a6525E722b0FeEFdbb
    - hahser = 0x07f30eF4E57749cA2b52c04A1EBefab33a3AfeAb
    - baseToken = 0x9Ad8F4F37283D680ED9Cc9081A7b3a8bD7a31823
    - charon = 0xE7bDdDF09DDCCB4b16846DFFC899d5422e4e9244
    - cfc = 0x7e7b08D01C8aA22FEdF0aA5E76ed4F2383B192c2
    - chd = 0x1a11537903308545c4F2964F98314A54c200AA83
    - ETHtoPOLBridge = 0x7983F3c9c7BbF1cB0Fb5D00D810678774D539100
    - GnosisAMB = 0x8dbC94CfcFd867C39F378D4CdaE79EB97EB7C40b
    - cit = 0xa080483eCBc69c63f3348eD224C47F52410fD894

mumbai
    
    - verifier2 = 0x1a11537903308545c4F2964F98314A54c200AA83
    - veriifer16 = 0x7e7b08D01C8aA22FEdF0aA5E76ed4F2383B192c2
    - hahser = 0xa080483eCBc69c63f3348eD224C47F52410fD894
    - baseToken = 0x97034B86C2368938e2620Ee9083Fc34c9c5b555f
    - charon = 0x0a760F47a81431472e55422c5b7E222Ef0b3D178
    - cfc = 0x4AC8541598a95A9315b415d1C0A14541cF66BBBD
    - chd = 0x2be74684052063FB424D623461952fA52443D62A
    - POLtoETHBridge = 0xE7bDdDF09DDCCB4b16846DFFC899d5422e4e9244

chiado

    - verifier2 = 0xa275DF337570edB4B58b43E8251d50886b0C86b5
    - veriifer16 = 0x7983F3c9c7BbF1cB0Fb5D00D810678774D539100
    - hahser = 0x8dbC94CfcFd867C39F378D4CdaE79EB97EB7C40b
    - baseToken = 0xCcC741ba014d1D3077473B491EB8C909ebAcBa9D
    - charon = 0x5243781910cf05C0C6Bd83a6525E722b0FeEFdbb
    - cfc = 0x9Ad8F4F37283D680ED9Cc9081A7b3a8bD7a31823
    - chd = 0x07f30eF4E57749cA2b52c04A1EBefab33a3AfeAb
    - GnosisAMB = 0xB2501D56Dd68c4800e8970C8A47a766053F5dbC7

## donations

evm chains - 0x92683a09B64148369b09f96350B6323D37Af6AE3