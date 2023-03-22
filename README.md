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
    
    - verifier2 = 0x5dbb7D7A395c99675ac3e39B457eB9920a686e5B
    - veriifer16 = 0xa062F7E9d43872Ed534a06e4E7b048759e5d9Af2
    - hahser = 0x511548e6F2B59FfAe590dFc079878Ca62A344C13
    - baseToken = 0xf45412AE42B77f5C2547adDad4B69197f61C32F6
    - charon = 0x6E2eCf3adec22D80AC3f96479C734e6eB4DFD090
    - cfc = 0xD3f676ED12E83a8f627F2B18Ede76F16704904A0
    - chd = 0xf55b9BF28107d65EC2D2b72f31Aae33f6A548EE7
    - cit = 0x826c1A89F9A504631d81E41488B050C8B2Df56E7
    - ETHtoPOLBridge = 0x2A51B6F68c38625fa0404b2a7ebA8B773e1220A6
    - tellorBridge = 0xBeD7029aF194cddc88eF2062Cf6A857349d7ebf2

mumbai
    
    - verifier2 = 0x9df2325EE7341D0a30d65FDfD5EE4Aae87f972fe
    - veriifer16 = 0x732aFAdE3D059349673c31d0D902A6a37bFba916
    - hahser = 0x96687ec01eB356EAA002b2c47B9a7a9F416C58a4
    - baseToken = 0xDB08ef3B408e2Ba6Cc107dc69dE5EBcb168EFcfc
    - charon = 0x2157EE35E7ecc7B66Ad61B82A79d522a44B1aa84
    - cfc = 0x2A51B6F68c38625fa0404b2a7ebA8B773e1220A6
    - chd = 0x5CB6D2cCdAafFa1e82A0Dc12159Dbf8421d5bdeB
    - POLToETHBridge = 0xFfED80cF5c45e7463AFd9e0fc664B5C6583B4363

chiado

    - verifier2 = 0x7ff0A9F8ec9Ba82f9340DA55A846a12F220D1e41
    - veriifer16 = 0x9EDe7FDe2E135801012D019BAB586C342440dadF
    - hahser = 0x9edAef26cB70A187926A2962A77c86522564A955
    - baseToken = 0x21d20B4c7dCb5521225F5036E0b27c4dF3F42aa3
    - charon = 0x20301cC7f8d4c734Fd3EAa6038ee3693e0fe8443
    - cfc = 0xbC2e8d236EaFd82496A38d729Bd182b71df31C8E
    - chd = 0xdB7d72AE7f59e25f16472e5ED210Ef4809F68a2c
    - tellorBridge = 0x52Ed24159ced5Cfa64b115566215b5aBd4103A6F

## donations

evm chains - 0x92683a09B64148369b09f96350B6323D37Af6AE3