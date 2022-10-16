# CYTI - Choose your token ID
## Overview
Front end to mint simple tokens or CYTI contracts, with mass minting feature.<br />
CYTI contracts allows to choose the begining of the tokenID minted.<br />
They are mined to compute the proper transaction to generates the token as per your requirement miners will handle them if the fee is high enough for the token length required.<br />

The dApp is running on FLUX: https://cytiminter.app.runonflux.io/<br />
The dApp is also deployed at: https://thierrym1212.github.io/cyti/index.html

## Supported wallets
|Platform            |Compatible wallet                                 |
|--------------------|--------------------------------------------------|
|Desktop browser     | Nautilus                                         |
|Desktop browser     | SAFEW                                            |
|Desktop browser     | Mosaic (ergopay)                                 |
|Android             | Ergo wallet (ergopay)                            |
|iOS                 | Terminus wallet (ergopay)                        |

## Choose the mining fee
The miners can configure a minimal mining fee for each pattern length and will start mining the mint request only if the limit is reached.<br />
The fee limit is removed when the miner address is the same than the address of the token mint request.

|Number of characters|Difficulty         |Minting time with 3kH/s|Suggested mint fee per token|
|--------------------|-------------------|-----------------------|----------------------------|
|0                   | No mining required| 0s                    | 0.0031 ERG                 |
|1 or 2              | Extremly easy     | 0.1s                  | 0.005 ERG                  |
|3 or 4              | Easy              | 25s                   | 0.01 ERG                   |
|5 or 6              | Hard              | 1h30mn                | 0.1 ERG                    |
|7 or 8              | Very Hard         | 17 days               | 1 ERG                      |

## Run the front-end

### Install
Install node module dependecies

    npm install

### Run
Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

    npm start

### Build
Build the production version in the build directory.

    npm run build

## Dockerize
### Run the docker image
    docker pull haileypdll/cyti-minter
    docker run -d -p 8080:80 haileypdll/cyti-minter:latest

### Generate the docker image
Once build the dApp can be dokerized as a static webpage distributed by nginx docker image

    docker build -t haileypdll/cyti-minter .


