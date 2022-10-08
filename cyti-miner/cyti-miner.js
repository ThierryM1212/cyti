import { CYTI_MINT_REQUEST_SCRIPT_ADDRESS, NANOERG_TO_ERG } from "./src/constants.js";
import { processMintRequestParallel, processMintResults } from './src/bot_wasm.js';
import { convertMsToTime, formatERGAmount, formatLongString, shuffleArray, sleep } from './src/utils.js';
import { getUnspentBoxesForAddressUpdated } from "./src/explorer.js";
import Table from 'cli-table';
import { config } from "./config.js";
import express from 'express';
import path from 'path';


// Prepare state and display variables
const startupDate = new Date();
var processedCYTIRequest = [];
var processedMintResults = [];
var recentLog = [];
var currentMinedBoxId = '';
var currentHashRate = 0;
var totalValueProcessed = 0;
const generalInfoTableHeader = ["Running since", "Miner address", "Processes ",];
const processInfoHeader = ["", "Processed", "Earnings", "Hashrate", "boxId"];

function printStatus() {
    var generalInfoTable = new Table({ head: generalInfoTableHeader, style: { head: [config.COLOR_HEADER_1] } });
    generalInfoTable.push([convertMsToTime(new Date() - startupDate), config.MINER_ADDRESS, config.PARALLEL_DEGREE,]);
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
        currentHashRate + " H/s", displayedMinedBoxid,]
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
            .filter( // remove unresolved
                box => box.boxId.substring(0, box.additionalRegisters["R7"].renderedValue.length) !== box.additionalRegisters["R7"].renderedValue
            )
            .filter( // remove not processed
                box => !processedCYTIRequest.map(box2 => box2.boxId).includes(box.boxId)
            )
            ;
        if (unspentCYTIRequest.length === 0) {
            addToLog("CITY miner: No CYTI request box found");
            await sleep(config.MINER_COLD_DOWN * 1000);
            return;
        } else {
            addToLog("CITY miner: " + unspentCYTIRequest.length + " request boxes found")
        }
        // Filter the requests with too low price from the config
        unspentCYTIRequest = unspentCYTIRequest.filter(
            box => (box.additionalRegisters["R7"].renderedValue.length === 2 && box.value >= config.MIN_ERG_PRICE_2_CHAR * NANOERG_TO_ERG) ||
                (box.additionalRegisters["R7"].renderedValue.length === 4 && box.value >= config.MIN_ERG_PRICE_4_CHAR * NANOERG_TO_ERG) ||
                (box.additionalRegisters["R7"].renderedValue.length === 6 && box.value >= config.MIN_ERG_PRICE_6_CHAR * NANOERG_TO_ERG) ||
                (box.additionalRegisters["R7"].renderedValue.length === 8 && box.value >= config.MIN_ERG_PRICE_8_CHAR * NANOERG_TO_ERG)
        )
        if (unspentCYTIRequest.length === 0) {
            addToLog("CITY miner: No CYTI request box found with suffisant price");
            await sleep(config.MINER_COLD_DOWN * 1000);
            return;
        }
        currentMinedBoxId = unspentCYTIRequest[0].boxId;
        addToLog("CITY miner: start mining " + currentMinedBoxId + " for " + formatERGAmount(unspentCYTIRequest[0].value)
            + " ERG with starting pattern '" + unspentCYTIRequest[0].additionalRegisters["R7"].renderedValue + "'");

        const miningSuccess = await processMintRequestParallel(unspentCYTIRequest[0], setCurrentHashRate);
        addToLog("CITY miner success: " + miningSuccess.toString());
        currentMinedBoxId = '';
        setCurrentHashRate(0);
        if (miningSuccess && !processedCYTIRequest.map(box => box.boxId).includes(unspentCYTIRequest[0].boxId)) {
            processedCYTIRequest.push(unspentCYTIRequest[0]);
        }
        return miningSuccess;
    } catch (e) {
        addToLog("CITY miner global: " + e.toString())
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
        currentHashRate: currentHashRate + " H/s",
        totalValueProcessed: formatERGAmount(totalValueProcessed) + " ERG",
        generalInfoTableHeader: generalInfoTableHeader,
        processInfoHeader: processInfoHeader,
        generalInfoHeaderColor: config.COLOR_HEADER_1,
        processInfoHeaderColor: config.COLOR_HEADER_2,
        runningSince: convertMsToTime(new Date() - startupDate),
        minerAddress: config.MINER_ADDRESS,
        parallelProcesses: config.PARALLEL_DEGREE,
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

