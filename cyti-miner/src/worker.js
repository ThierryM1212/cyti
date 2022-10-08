import workerpool from 'workerpool';
import { encodeHex, getErgoStateContext } from './wasm.js';
import JSONBigInt from 'json-bigint';
import { sendTx } from './explorer.js';
let ergolib = import('ergo-lib-wasm-nodejs');


async function signWithNonce(unsignedTxStr, mintRequestJSON, NUM_ITERATIONS, workerId) {
    const wallet = (await ergolib).Wallet.from_mnemonic("", "");
    const inputsWASM = (await ergolib).ErgoBoxes.from_boxes_json([mintRequestJSON]);
    const dataInputsBoxes = (await ergolib).ErgoBoxes.from_boxes_json([]);
    var ctx = await getErgoStateContext();
    //console.log("Start computation ", (new Date()).toISOString());
    //const unsignedTxStr = JSONBigInt.stringify(unsignedTx);
    var unsignedTransaction = (await ergolib).UnsignedTransaction.from_json(unsignedTxStr.replace("#NONCE#", await encodeHex('10')));
    const start = Math.round(Math.random() * 10000000000);
    var startDate = new Date();
    var hashRate = 0;
    for (let i = start; i < start + parseInt(NUM_ITERATIONS); i++) {
        if (i === start + 1000) {
            hashRate = Math.round(1000 * 1000 / ((new Date()) - startDate), 2);
            workerpool.workerEmit({
                hashRate: hashRate,
                workerId: workerId,
            });
            startDate = new Date();
        }
        if (i % 10000 === 0) {
            if (i > start + 10000) {
                const hashRate = Math.round(10000 * 1000 / ((new Date()) - startDate), 2);
                workerpool.workerEmit({
                    hashRate: hashRate,
                    workerId: workerId,
                });
            }
            startDate = new Date();
        }
        try {
            const unsignedTxWithNonce = unsignedTxStr.replace("#NONCE#", await encodeHex(i.toString()))
            unsignedTransaction = (await ergolib).UnsignedTransaction.from_json(unsignedTxWithNonce);
            //unsignedTransaction.output_candidates().get(0).set_register_value(9, await encodeHex(i.toString()));
            const signedTx = wallet.sign_transaction(ctx, unsignedTransaction, inputsWASM, dataInputsBoxes).to_json();
            //console.log("Hashrate: "+ parseInt(NUM_ITERATIONS) * 1000 / ((new Date()) - startDate) + " H/s")
            //console.log("End computation SUCCESS", signedTx, (new Date()).toISOString())
            const txId = await sendTx(JSONBigInt.parse(signedTx));
            console.log("######################################");
            console.log("######################################");
            console.log("CYTI miner txId", txId);
            console.log("######################################");
            console.log("######################################");
            return Promise.resolve(true);
        } catch (e) {
            //console.log(e)
            unsignedTransaction.free();
        }
    }
    //console.log("Hashrate: "+ Math.round(parseInt(NUM_ITERATIONS) * 1000 / ((new Date()) - startDate), 2) + " H/s")
    //console.log("End computation FAILED " + (new Date()).toISOString())
    unsignedTransaction.free();
    wallet.free();
    inputsWASM.free();
    dataInputsBoxes.free();
    return Promise.reject(false);
}

// create a worker and register public functions
workerpool.worker({
    signWithNonce: signWithNonce
});
