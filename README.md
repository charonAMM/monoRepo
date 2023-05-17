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

deploy data - 5/17/2023

gnosis
    - verifier2 = 0xd2B162ea6Ace4c66E28e0110ec48B82a533091F7
    - veriifer16 = 0xCDaba71A7f6E27a40b4323E26d63Ab675f77Ac95
    - hahser = 0x515F87D08229917cAD8902e8d3D3c5C8de82b52f
    - charon = 0xAE174a7563bFE71b804273A4C7e4e47843E199e3
    - cfc = 0xDb1c1475E6D4A1d575958074E552A31fF7CAC4b7
    - chd = 0x83932ED462351c7e2eB1641654a6b56EBa7CB991
    - tellorBridge1 = 0x3Ed6b16CCAC5Bb2162909301B4099eBaD05aDD02
    - tellorBridge2 = 0x7e695f3EbdC726D597F676B5B563b2D876942cf4
    - baseToken = 0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d
    - cit = 0xA236e0a9fCCBd3BFcbb9Ed8aB4EEFEEBcbE58458

polygon

    - verifier2 = 0xe2518473f4429202827a8269706301034fD887Ec
    - veriifer16 = 0x9d386d3456Ea99F0A60BA0d49d3b03f1017321c1
    - hahser = 0xF0bBB6F422af1c97A7E3203163763db24399d1c7
    - charon = 0xDa2388E64452a8fAa2e205a6BA6067eE48f44f60
    - cfc = 0x70D503cc3E15bc408047166F5a11A6E3e4Fb5D90
    - chd = 0x50eA43fC31441754a319C6c0Ad33440f1222f0b9
    - tellorBridge1 = 0xf18Ba320e716d829521CCB75C28323FEf4BD61f4
    - tellorBridge2 = 0x3D76e5C46CC8e7e44458DDeD339371F1AA231aC8
    - baseToken = 0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270

optimism

    - verifier2 = 0xCDaba71A7f6E27a40b4323E26d63Ab675f77Ac95
    - veriifer16 = 0x515F87D08229917cAD8902e8d3D3c5C8de82b52f
    - hahser = 0xAE174a7563bFE71b804273A4C7e4e47843E199e3
    - charon = 0x83932ED462351c7e2eB1641654a6b56EBa7CB991
    - cfc = 0xA236e0a9fCCBd3BFcbb9Ed8aB4EEFEEBcbE58458
    - chd = 0xDb1c1475E6D4A1d575958074E552A31fF7CAC4b7
    - tellorBridge1 = 0x7e695f3EbdC726D597F676B5B563b2D876942cf4
    - tellorBridge2 = 0xd2B162ea6Ace4c66E28e0110ec48B82a533091F7
    - baseToken = 0x4200000000000000000000000000000000000006



testnets - deploy date - 4/24/2023

sepolia
    
    - verifier2 = 0x82e3DdF57c9BD4b4b8E6c2BeEDB37f63C5247324
    - veriifer16 = 0x7F2544D2A5b5483e6B762fcFe2A0f8FD14CE126a
    - hahser = 0xf4e4b0b0CE45970e0cf952f60f8823c37C074A8a
    - baseToken = 0x1F8D8C2D7Ab81BEC75f975e7218a9b80EF7CAfBF
    - charon = 0x81b0C3f159fBF85b79B6c09656949419FB9D0C34
    - cfc = 0x3beA65D139c47715695376324B9e22CbAb6460d8
    - chd = 0xC9a26A17CD67cD39fB917869501eaD0dc7167A35
    - cit = 0x23a363e59d915216a4a3fa751ade8dEAEa7A66BD
    - tellorBridge1 = 0x5D8b7387bB86A0D6ab483b0D169Cd95503126F44
    - tellorBridge2 = 0xc60566C1748988adDAfCC5dD2359Dfc20aF58b65

mumbai
    
    - verifier2 = 0xd6e6d1a25436d5DBceA85dEe07dAf1aAc5CDebfc
    - veriifer16 = 0xa710396c752b7cf294c6Aa5c6B2A7022Ba68c40C
    - hahser = 0x17658c349ab54C77F83c607F428e634CCc9a4C13
    - baseToken = 0x9895a842fd92cf8B1081204bDf5bD4e803e666dF
    - charon = 0x5AC7c302039D52fFDAD061181032eaF0a7785643
    - cfc = 0x3237cAF25CF3ee5aCf491Bc824E59923DCdEBd86
    - chd = 0xd0670D32568BB6eEC8c4783Cf6DC9aC858102c96
    - tellorBridge1 = 0x6fFC87D8b1C68635Ff0D9896B95A8704DD034556
    - tellorBridge2 = 0x124D64c8bA315C440198D3861F74CC978daaA7F6

chiado

    - verifier2 = 0xb72D0D4C8DA3fDeEe8F95f2afdDb66118e92c78e
    - veriifer16 = 0x6eb037F5Ac48D87B482F98F16f11e5DBCEf01b1B
    - hahser = 0x9659BB8780ac84218e2Ce647D604C1d3307480F2
    - baseToken = 0xE3A1174c69e0FBaf1E8DD334fFF7F512636A4B7F
    - charon = 0x18b1EF15a105D6E7A74E75Cb0BF060362d51C58f
    - cfc = 0x849aBD73C1Afc8571B2571074653e9225B4Ec79E
    - chd = 0x997444Dbbc20401F6935f034075f4a3Ce80e7f54
    - tellorBridge1 = 0xbefe01b1c09a9d4C7b9cabd9E9eAe75E97018300
    - tellorBridge2 = 0xc22d1Dad24181e01C5F60294179aB24cABdd799c

## donations

evm chains - 0x92683a09B64148369b09f96350B6323D37Af6AE3




