import workerpool from 'workerpool';
import { encodeHex, getErgoStateContext } from './wasm.js';
import JSONBigInt from 'json-bigint';
import { sendTx } from './explorer.js';
let ergolib = import('ergo-lib-wasm-nodejs');


async function signWithNonce(unsignedTx, mintRequestJSON, requiredStartSequence, NUM_ITERATIONS, workerId) {
    const unsignedTxStr = JSONBigInt.stringify(unsignedTx);
    const wallet = (await ergolib).Wallet.from_mnemonic("", "");
    const inputsWASM = (await ergolib).ErgoBoxes.from_boxes_json([mintRequestJSON]);
    const dataInputsBoxes = (await ergolib).ErgoBoxes.from_boxes_json([]);
    var ctx = await getErgoStateContext();
    const start = Math.round(Math.random() * 10000000000);
    var startDate = new Date(), hashRate = 0;
    var output0JSON = unsignedTx.outputs[0];
    output0JSON["index"] = 0;
    for (let i = start; i < start + parseInt(NUM_ITERATIONS); i++) {
        if (i > start + 500 && i % 1000 === 0) {
            hashRate = Math.round(1000 * 1000 / ((new Date()) - startDate), 2);
            workerpool.workerEmit({
                hashRate: hashRate,
                workerId: workerId,
            });
            startDate = new Date();
        }
        try {
            const encodedNonce = await encodeHex(i.toString());
            const unsignedTxWithNonce = unsignedTxStr.replace("#NONCE#", encodedNonce);
            const unsignedTransaction = (await ergolib).UnsignedTransaction.from_json(unsignedTxWithNonce);
            output0JSON.additionalRegisters["R9"] = encodedNonce;
            const txIdWASM = unsignedTransaction.id();
            output0JSON["transactionId"] = txIdWASM.to_str();
            const ergoBox = (await ergolib).ErgoBox.from_json(JSON.stringify(output0JSON));
            const boxIdWASM = ergoBox.box_id()
            const boxId = boxIdWASM.to_str();
            if (boxId.startsWith(requiredStartSequence)) {
                const signedTx = wallet.sign_transaction(ctx, unsignedTransaction, inputsWASM, dataInputsBoxes).to_json();
                //console.log("signedTx: ", signedTx)
                const txId = await sendTx(JSONBigInt.parse(signedTx));
                console.log("######################################");
                console.log("CYTI miner txId", txId);
                console.log("######################################");
                return Promise.resolve(true);
            }
            unsignedTransaction.free();
            ergoBox.free();
            txIdWASM.free();
            boxIdWASM.free();
        } catch (e) {
            //console.log(e)
            unsignedTransaction.free();
            ergoBox.free();
            txIdWASM.free();
            boxIdWASM.free();
        }
    }
    wallet.free();
    inputsWASM.free();
    dataInputsBoxes.free();
    return Promise.reject(false);
}

// create a worker and register public functions
workerpool.worker({
    signWithNonce: signWithNonce
});
