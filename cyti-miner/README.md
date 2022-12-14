# CYTI miner

Miner software to mint CYTI contracts and generate the token ID following the requested pattern.
When a CYTI contract is created, the miners try to find the right token ID. The first miner to find it gets the fee (ERG).

The cyti-miner executable is available for Windows and Linux:<br />
https://github.com/ThierryM1212/cyti/releases

cyti-miner is open source and without developer fee.

# Usage
Before using the cyti miner you will need to configure the mining address (to receive the fees) in the config.js file.<br />
Other configurations are available to choose the amount of processes used or the minimal fee to start mining.<br />
The miner mines and consumes CPU resources only when CYTI contracts are waiting to be solved.

## Windows - cyti-miner.exe
    - Unzip the provided package.
    Double click the exe or execute it using cmd.

## Linux (x64 built on Ubuntu 20.04) - cyti-miner
    - Untar the provided package
    $> tar xvf cyti-miner_v1.2.0.tar.gz
    $> cd cyti-miner
    $> ./cyti-miner

## cyti-miner.js (All platform)
### Pre-requisites
    CYTI miner is tested and delivered with Nodejs 16.15.0
    It requires Nodejs >= 15 to run.

### Install
    npm i

### Run
    node cyti-miner.js

## Build executable
    This requires to install nexe, python 3, NASM and Visual Studio (Windows) or build-essentials (linux)
    npm run buildexe

## Build docker image
    - Update the configuration file
    - docker run -p 4000:4000 cyti-miner

## Run haileypdll/cyti-miner docker image
    - docker pull haileypdll/cyti-miner:latest
    Provide the config parameter in the docker environment
    - docker run -e MINER_ADDRESS=9ezcf4GFUNVreCRyuPL99ihyumrM4JNsX4Cz9w7f3YBaPQC1pt1 -e PARALLEL_DEGREE=4 -p 4000:4000 haileypdll/cyti-miner:latest

## Configuration
config.js
|Configuration parameter|Comment                                           |
|-----------------------|--------------------------------------------------|
|MINER_ADDRESS          | Address to receive fee for mining token ID       |
|PARALLEL_DEGREE        | Number of worker processes                       |
|MINER_PORT             | port for the web monitoring UI (default 4000)    |
|MIN_ERG_PRICE_2_CHAR   | Minimal prices to mint token ID with 2 characters|
|MIN_ERG_PRICE_4_CHAR   | Minimal prices to mint token ID with 4 characters|
|MIN_ERG_PRICE_6_CHAR   | Minimal prices to mint token ID with 6 characters|
|MIN_ERG_PRICE_8_CHAR   | Minimal prices to mint token ID with 8 characters|
|MINER_COLD_DOWN        | Miner wait time when nothing to process (s)      |
|RESULTS_INTERVAL       | Interval to process CYTI results transactions (s)|
|EXPLORER_API_URL       | Ergo explorer URL                                |
|NUM_ITERATIONS         | Number of tries per process per try              |
|COLOR_HEADER_1         | Headers color for the first table                |
|COLOR_HEADER_2         | Headers color for the second table               |
|LOG_LENGTH             | Number of log line to display                    |
|DEBUG                  | Enable debug mode if > 0                         |

The configuration of any value can be overidden by an enviroment variable with the same name.

### Colors
The colors can adjusted using the color names:
    black, red, green, yellow, blue, magenta, cyan, white
In the console only some other modifier are available:
    bold, italic, underline, inverse, strikethrough
    bgBlack, bgRed, bgGreen, bgYellow, bgBlue, bgMagenta, bgCyan, bgWhite
    rainbow, zebra, america, trap, random


# Overview
## Web UI
![CYTI miner web UI](./miner_web_UI.png)

## Console UI
![CYTI miner console UI](./miner_console_UI.png)
