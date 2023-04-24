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

deploy date - 4/24/2023

sepolia
    
    - verifier2 = 0x4fEC00B75569F8D70A1435978aeb9a535c7EF5b7
    - veriifer16 = 0x5874e6b16fd88f600C12964a93Fe11eA931614FB
    - hahser = 0xE446Be46Fd3F64Fe9d37C1e328B39AFe47F74766
    - baseToken = 0x4708CB6E65215AFfa61790C8241B3f313C829f99
    - charon = 0x1D95Fbf9cF4acF6f6200169c7b66041CEBFBE38C
    - cfc = 0x5eE7f2C6EF0419036aadCD82cEd424bB1b098d1C
    - chd = 0x4C35BD2a42D67d9a53C9920880aA66D3EE54fF53
    - tellorBridge1 = 0x0f12A1a31fE99854A4020b9c14f53d5B61732775
    - tellorBridge2 = 0x092b98E53a8C60A8Bc3f958eD28dEF799306aA29
    - cit = 0xb38275dD276d65AebE119F3F878c2C34c0B564D8

mumbai
    
    - verifier2 = 0x00f54160938B47812aF9e99953C0625b6d78Db72
    - veriifer16 = 0x6Eea62a477d44b8b7DEc0C8757993495a8f05679
    - hahser = 0x458bBf47Dc6D616c44A8205e89550f498DADB3bb
    - baseToken = 0x6569Ec9d1fEF71F1b691DeF59947993429BAA220
    - charon = 0x73Ec740FfB36Bca48dfbc4a1Aab435366c75c636
    - cfc = 0x05855B1a917c66d351aCDB26d8Ce67E318aC57c9
    - chd = 0x722c98bE10Cc974Fa9e4CD55a3fdC2b95c491A3B
    - tellorBridge1 = 0x8D3ECee398d1495269A62Ceeaaec379c42683Fb9
    - tellorBridge2 = 0x1d5c9d16d37f954f6C790056963ccc596BFD73DA

chiado

    - verifier2 = 0x00f54160938B47812aF9e99953C0625b6d78Db72
    - veriifer16 = 0x6Eea62a477d44b8b7DEc0C8757993495a8f05679
    - hahser = 0x458bBf47Dc6D616c44A8205e89550f498DADB3bb
    - baseToken = 0x6569Ec9d1fEF71F1b691DeF59947993429BAA220
    - charon = 0x73Ec740FfB36Bca48dfbc4a1Aab435366c75c636
    - cfc = 0x05855B1a917c66d351aCDB26d8Ce67E318aC57c9
    - chd = 0x722c98bE10Cc974Fa9e4CD55a3fdC2b95c491A3B
    - tellorBridge1 = 0x8D3ECee398d1495269A62Ceeaaec379c42683Fb9
    - tellorBridge2 = 0x1d5c9d16d37f954f6C790056963ccc596BFD73DA

## donations

evm chains - 0x92683a09B64148369b09f96350B6323D37Af6AE3




