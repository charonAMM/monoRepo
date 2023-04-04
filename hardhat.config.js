/* eslint-disable indent, no-undef */
require('@nomiclabs/hardhat-ethers')
require('@nomiclabs/hardhat-waffle')
require('@nomiclabs/hardhat-etherscan')
require('dotenv').config()

task('hasher', 'Compile Poseidon hasher', () => {
  require('./scripts/compilePoseidon')
})

const config = {
  solidity: {
    compilers: [
      {
        version: '0.6.12',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.8.4',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 2,
          },
        },
      },
    ],
    overrides: {
      "charonAMM/contracts/Charon.sol:Charon": {
        version: "0.8.17",
        settings: { 
          optimizer: {
            enabled: true,
            runs: 2,
          }
        }
      },
      "contracts/FlatCharon.sol:FlatCharon": {
        version: "0.8.17",
        settings: { 
          optimizer: {
            enabled: true,
            runs: 2,
          }
        }
      },
    }
  },
  networks: {
    hardhat: {
      chainId: 1,
      initialBaseFeePerGas: 5,
      //allowUnlimitedContractSize: true
    },
    goerli: {
           url: `${process.env.NODE_URL_GOERLI}`,
           accounts: [process.env.PK],
           gas: 4000000,
           chainId:5,
           //gasPrice: 150000000000
      } ,
    mumbai: {
        url: `${process.env.NODE_URL_MUMBAI}`,
        accounts: [process.env.PK],
        gas: 9000000,
        chainId: 80001,
        //gasPrice: 35000000000
    } ,
    chiado: {
        url: `${process.env.NODE_URL_CHIADO}`,
        accounts: [process.env.PK],
        gas: 9000000,
        chainId: 10200,
       //gasPrice: 3000000000
    } ,
  },
  etherscan: {
    apiKey: {
      goerli: process.env.ETHERSCAN_KEY,
      polygonMumbai: process.env.POLYGONSCAN_KEY,
      chiado: process.env.BLOCKSCOUT_KEY,
    },
    customChains: [
      {
        network: "chiado",
        chainId: 10200,
        urls: {
          apiURL: "https://api-goerli.etherscan.io/api",
          browserURL: "https://blockscout.chiadochain.net"
        }
      }
    ]
  },
  mocha: {
    timeout: 600000000,
  }
}

module.exports = config
