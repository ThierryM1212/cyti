import workerpool from 'workerpool';
import { getErgoStateContext } from './wasm.js';
import JSONBigInt from 'json-bigint';
import { sendTx } from './explorer.js';
import { try_calculate_tx, ErgoBox, Address } from 'ergo_cyti_wasm';
let ergolib = import('ergo-lib-wasm-nodejs');

async function signWithNonce(mintRequestJSON, minerAddressStr, NUM_ITERATIONS, workerId) {
    try {
        const wallet = (await ergolib).Wallet.from_mnemonic("", "");
        const inputsWASM = (await ergolib).ErgoBoxes.from_boxes_json([mintRequestJSON]);
        const dataInputsBoxes = (await ergolib).ErgoBoxes.from_boxes_json([]);
        var ctx = await getErgoStateContext();
        var start = BigInt(Math.round(Math.random() * 1000000000000));
        const minerAddress = Address.from_mainnet_str(minerAddressStr)
        const box = ErgoBox.from_json(JSONBigInt.stringify(mintRequestJSON))
        const number_of_try_per_round = BigInt(5000000);
        
        var rangeTable = [start, start + BigInt(500000)];
        while (rangeTable[rangeTable.length - 1] < start + BigInt(NUM_ITERATIONS)) {
            rangeTable.push(rangeTable[rangeTable.length - 1] + number_of_try_per_round);
        }

        for (var i = 0; i < rangeTable.length - 1; i++) {
            var now = process.hrtime.bigint();
            var solved = try_calculate_tx(box, 0, minerAddress, rangeTable[i], rangeTable[i+1]);
            var elapsedSeconds = Number((process.hrtime.bigint() - now)) / 1000000000.0;
            var hashRate = Math.round(Number(rangeTable[i+1] - rangeTable[i]) / elapsedSeconds, 2);
            //console.log(workerId, hashRate, start, start + number_of_try_per_round)
            workerpool.workerEmit({
                hashRate: hashRate,
                workerId: workerId,
            });
            start = start + number_of_try_per_round + BigInt(1);
            try {
                const unsignedTransaction = (await ergolib).UnsignedTransaction.from_json(solved.get_calculated_tx().to_json());
                const signedTx = wallet.sign_transaction(ctx, unsignedTransaction, inputsWASM, dataInputsBoxes).to_json();
                //console.log("signedTx: ", signedTx)
                const txId = await sendTx(JSONBigInt.parse(signedTx));
                console.log("######################################");
                console.log("CYTI miner txId", txId);
                console.log("######################################");
                return Promise.resolve(true);
            } catch (e) {
                //console.log(e)
            }
        }
        return Promise.reject(false);
    } catch (e) {
        console.log(e)
        return Promise.reject(false);
    }
}

// create a worker and register public functions
workerpool.worker({
    signWithNonce: signWithNonce
});
