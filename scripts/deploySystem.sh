#!/bin/bash -e
npx hardhat run scripts/deploySystem.js --network chiado
npx hardhat run scripts/deploySystem.js --network goerli
npx hardhat run scripts/deploySystem.js --network mumbai

echo "done deploying on all networks"