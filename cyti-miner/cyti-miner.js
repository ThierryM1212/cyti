import { CYTI_MINT_REQUEST_SCRIPT_ADDRESS, NANOERG_TO_ERG } from "./src/constants.js";
import { processMintRequestParallel, processMintResults } from './src/bot_wasm.js';
import { convertMsToTime, formatERGAmount, formatLongString, getConfigUpdated, shuffleArray, sleep } from './src/utils.js';
import { getUnspentBoxesForAddressUpdated } from "./src/explorer.js";
import Table from 'cli-table';
import { config as configFile } from "./config.js";
import express from 'express';
import path from 'path';
import { addressToSigmaPropHex, getUtxosListValue, toHexString } from "./src/wasm.js";


// update configuration with env variables
const config = getConfigUpdated(configFile);

// Prepare state and display variables
const startupDate = new Date();
var processedCYTIRequest = [];
var processedMintResults = [];
var recentLog = [];
var currentMinedBoxId = '';
var currentHashRate = 0;
var totalValueProcessed = 0;
var CYTIContratBalance = 0;
var nbCYTIContracts = 0;
const generalInfoTableHeader = ["Running since", "Miner address", "Processes", "Contracts", "Total amount"];
const processInfoHeader = ["", "Processed", "Earnings", "Hashrate", "boxId"];

function printStatus() {
    var generalInfoTable = new Table({ head: generalInfoTableHeader, style: { head: [config.COLOR_HEADER_1] } });
    var displayedMinerAddress = config.MINER_ADDRESS;
    if (process.stdout.columns <= 78) {
        displayedMinerAddress = formatLongString(displayedMinerAddress, 4);
    } else if (process.stdout.columns > 78 && process.stdout.columns < 110) {
        displayedMinerAddress = formatLongString(displayedMinerAddress, 4 + Math.round((process.stdout.columns - 71) / 2));
    }
    generalInfoTable.push([
        convertMsToTime(new Date() - startupDate),
        displayedMinerAddress,
        config.PARALLEL_DEGREE,
        nbCYTIContracts,
        formatERGAmount(CYTIContratBalance)]);
    var processInfoTable = new Table({ head: processInfoHeader, style: { head: [config.COLOR_HEADER_2] }, });
    if (processedCYTIRequest.length > 0) {
        totalValueProcessed = processedCYTIRequest.map(box => box.value).reduce((a, b) => a + b);
    }
    var displayedMinedBoxid = currentMinedBoxId;
    if (process.stdout.columns <= 78) {
        displayedMinedBoxid = formatLongString(currentMinedBoxId, 4);
    } else if (process.stdout.columns > 78 && process.stdout.columns < 130) {
        displayedMinedBoxid = formatLongString(currentMinedBoxId, 4 + Math.round((process.stdout.columns - 81) / 2));
    }
    processInfoTable.push({
        'CYTI miner': [processedCYTIRequest.length, formatERGAmount(totalValueProcessed) + " ERG",
        (parseInt(currentHashRate) / 1000000).toFixed(3) + " MH/s", displayedMinedBoxid,]
    },
        { 'CYTI results': [processedMintResults.length, '-', '-', '-',] });

    if (config.DEBUG === 0) {
        console.clear();
    }
    // print console
    console.log(generalInfoTable.toString());
    console.log(processInfoTable.toString());
    for (const msg of recentLog) {
        console.log(msg)
    }
}
function setCurrentHashRate(hr) {
    currentHashRate = hr;
}
function addToLog(msg) {
    var currentdate = new Date();
    var datetime = currentdate.getFullYear() + "/" + currentdate.getMonth().toString().padStart(2, '0') + "/" + currentdate.getDate().toString().padStart(2, '0')
        + " " + currentdate.getHours().toString().padStart(2, '0') + ":" + currentdate.getMinutes().toString().padStart(2, '0')
        + ":" + currentdate.getSeconds().toString().padStart(2, '0');
    const timedMessage = datetime + " - " + msg;
    console.log(timedMessage);
    recentLog.push(timedMessage);
    recentLog = recentLog.slice(-1 * config.LOG_LENGTH);
}

async function processCYTIRequest() {
    try {
        var unspentCYTIRequest = (shuffleArray(await getUnspentBoxesForAddressUpdated(CYTI_MINT_REQUEST_SCRIPT_ADDRESS)))
            .filter( // remove resolved
                box => box.boxId.substring(0, box.additionalRegisters["R7"].renderedValue.length) !== box.additionalRegisters["R7"].renderedValue
            )
            .filter( // remove already processed
                box => !processedCYTIRequest.map(box2 => box2.boxId).includes(box.boxId)
            );
        nbCYTIContracts = unspentCYTIRequest.length;
        CYTIContratBalance = getUtxosListValue(unspentCYTIRequest);
        if (nbCYTIContracts === 0) {
            addToLog("CYTI miner: No CYTI request box found");
            await sleep(config.MINER_COLD_DOWN * 1000);
            return;
        } else {
            addToLog("CYTI miner: " + nbCYTIContracts + " request boxes found")
        }
        const minerAddressSigmaPropHex = await addressToSigmaPropHex(config.MINER_ADDRESS);
        // Filter the requests with too low price from the config
        unspentCYTIRequest = unspentCYTIRequest.filter(
            box => (box.additionalRegisters["R7"].renderedValue.length === 2 && box.value >= config.MIN_ERG_PRICE_2_CHAR * NANOERG_TO_ERG) ||
                (box.additionalRegisters["R7"].renderedValue.length === 4 && box.value >= config.MIN_ERG_PRICE_4_CHAR * NANOERG_TO_ERG)    ||
                (box.additionalRegisters["R7"].renderedValue.length === 6 && box.value >= config.MIN_ERG_PRICE_6_CHAR * NANOERG_TO_ERG)    ||
                (box.additionalRegisters["R7"].renderedValue.length === 8 && box.value >= config.MIN_ERG_PRICE_8_CHAR * NANOERG_TO_ERG)    ||
                (box.additionalRegisters["R7"].renderedValue.length === 10 && box.value >= config.MIN_ERG_PRICE_10_CHAR * NANOERG_TO_ERG)  ||
                // no price limit for own requests
                (toHexString(Buffer.from(box.additionalRegisters.R6.serializedValue, 'hex')) === minerAddressSigmaPropHex)
        )
        if (unspentCYTIRequest.length === 0) {
            addToLog("CYTI miner: No CYTI request box found with suffisant price");
            await sleep(config.MINER_COLD_DOWN * 1000);
            return;
        }
        currentMinedBoxId = unspentCYTIRequest[0].boxId;
        const requiredStartSequence = unspentCYTIRequest[0].additionalRegisters["R7"].renderedValue;
        addToLog("CYTI miner: start mining " + currentMinedBoxId + " for " + formatERGAmount(unspentCYTIRequest[0].value)
            + " ERG with starting pattern '" + requiredStartSequence + "'");

        const miningSuccess = await processMintRequestParallel(unspentCYTIRequest[0], setCurrentHashRate);
        addToLog("CYTI miner success: " + miningSuccess.toString());

        if (miningSuccess && !processedCYTIRequest.map(box => box.boxId).includes(unspentCYTIRequest[0].boxId)) {
            currentMinedBoxId = '';
            setCurrentHashRate(0);
            processedCYTIRequest.push(unspentCYTIRequest[0]);
        }
        return miningSuccess;
    } catch (e) {
        addToLog("CYTI miner global: " + e.toString())
    }
}

async function processCYTIResults() {
    try {
        const unspentCYTIRequest = (await getUnspentBoxesForAddressUpdated(CYTI_MINT_REQUEST_SCRIPT_ADDRESS))
            .filter(
                box => box.boxId.substring(0, box.additionalRegisters["R7"].renderedValue.length) === box.additionalRegisters["R7"].renderedValue &&
                    !processedMintResults.includes(box.boxId)
            );
        if (unspentCYTIRequest.length === 0) {
            addToLog("CYTI results: No CYTI resolved box found")
            return;
        }
        for (const boxResolved of unspentCYTIRequest) {
            const txId = await processMintResults(boxResolved);
            if (txId) {
                addToLog("CYTI results tx sent:", txId)
                processedMintResults.push(boxResolved.boxId);
            }
        }
    } catch (e) {
        addToLog("CYTI results global: " + e.toString())
    }
}

// Start web UI
const app = express();
app.set('view engine', 'ejs');
app.use('/images', express.static(path.resolve() + '/images'));
app.get('/', function (req, res) {
    res.render('pages/index', {
        processedCYTIRequest: processedCYTIRequest,
        processedMintResults: processedMintResults,
        recentLog: recentLog.map(line => line.trim()),
        currentMinedBoxId: currentMinedBoxId,
        currentHashRate: (parseInt(currentHashRate) / 1000000).toFixed(3) + " MH/s",
        totalValueProcessed: formatERGAmount(totalValueProcessed) + " ERG",
        generalInfoTableHeader: generalInfoTableHeader,
        processInfoHeader: processInfoHeader,
        generalInfoHeaderColor: config.COLOR_HEADER_1,
        processInfoHeaderColor: config.COLOR_HEADER_2,
        runningSince: convertMsToTime(new Date() - startupDate),
        minerAddress: config.MINER_ADDRESS,
        parallelProcesses: config.PARALLEL_DEGREE,
        nbCYTIContracts: nbCYTIContracts,
        CYTIContratBalance: formatERGAmount(CYTIContratBalance) + " ERG",
    });
});
app.listen(config.MINER_PORT);

// Start mining
printStatus();
addToLog("CYTI web UI running on port " + config.MINER_PORT);
setInterval(printStatus, 10000);
setInterval(processCYTIResults, config.RESULTS_INTERVAL * 1000);
while (0 === 0) {
    await processCYTIRequest();
    await sleep(100);
}

