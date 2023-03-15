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
    
    - verifier2	= 0x3CB8a356214b32182f14Ee62Ceec412c2741ec06
    - veriifer16 = 0x7022cc1F7eD50DeB4fC89fBe4248E431e3d47694
    - hahser = 0x52Ed24159ced5Cfa64b115566215b5aBd4103A6F
    - baseToken	= 0x7ff0A9F8ec9Ba82f9340DA55A846a12F220D1e41
    - charon = 0x9EDe7FDe2E135801012D019BAB586C342440dadF
    - cfc = 0x21d20B4c7dCb5521225F5036E0b27c4dF3F42aa3
    - chd = 0x9edAef26cB70A187926A2962A77c86522564A955
    - cit = 0x20301cC7f8d4c734Fd3EAa6038ee3693e0fe8443
    - tellorBridge = 0x38810dd60cDD61ab8a50Fd2B98BceB9690114a82
    - ETHtoPOLBridge = 0xf86a96A941Ae86506F0D9a34a0d40dBBb17B5123

mumbai
    
    - verifier2 = 0x52Ed24159ced5Cfa64b115566215b5aBd4103A6F
    - veriifer16 = 0x7ff0A9F8ec9Ba82f9340DA55A846a12F220D1e41
    - hahser = 0x9EDe7FDe2E135801012D019BAB586C342440dadF
    - baseToken = 0x9edAef26cB70A187926A2962A77c86522564A955
    - charon = 0x21d20B4c7dCb5521225F5036E0b27c4dF3F42aa3
    - cfc = 0xdB7d72AE7f59e25f16472e5ED210Ef4809F68a2c
    - chd = 0x20301cC7f8d4c734Fd3EAa6038ee3693e0fe8443
    - POLtoETHBridge = 0x7022cc1F7eD50DeB4fC89fBe4248E431e3d47694

chiado

    - verifier2 = 0x9E1960Aa0D6fa74382BdDA3Fc5Fefe1725a99f98
    - veriifer16 = 0x4414165F6fE30eF501468730E576667Aca72eCEA
    - hahser = 0x51eB3b5bBaCD89f637653951EFFB3fa0D9EEABbb
    - baseToken = 0x5A3A09dBCFA2B901e7742725ef760bB859a4682D
    - charon = 0xA9F3BEe4de793Ebc2a6A34E6d49951Cb80003eFF
    - cfc = 0xB3d9FDD711DfbcF037230cb24b9eba185f907b2b
    - chd = 0xDb7469f18f3f47Bc76f6D47cEA27C481dc4cfDFd
    - tellorBridge = 0x3f4B13FE055Cb0F67b90b90147bEb4DdbeB7Fb3E

## donations

evm chains - 0x92683a09B64148369b09f96350B6323D37Af6AE3