import { waitingAlert } from "../utils/Alerts";
import { encodeHexConst, encodeLong, encodeStrConst } from "./serializer";
import { CYTI_MINT_REQUEST_SCRIPT_ADDRESS, MIN_NANOERG_BOX_VALUE, NFT_TYPES, TX_FEE } from "../utils/constants";
import { getUtxos, walletSignTx } from "./wallet";
import { Serializer } from "@coinbarn/ergo-ts";
import { currentHeight } from "./explorer";
import { createTransaction, getUtxosListValue } from "./wasm";
let ergolib = import('ergo-lib-wasm-browser');

/* global BigInt */

export async function mintSimpleToken(tokName, tokDesc, tokAmount, tokDecimals, tokType, tokURL, tokHash, txFeeNano) {
    const alert = waitingAlert("Preparing the transaction...");
    const address = localStorage.getItem('address');
    var txAmount = txFeeNano;
    if (txFeeNano < TX_FEE + MIN_NANOERG_BOX_VALUE) {
        txAmount = TX_FEE + MIN_NANOERG_BOX_VALUE;
    }
    const utxos = await getUtxos(txAmount);
    const inputsWASM = (await ergolib).ErgoBoxes.from_boxes_json(utxos);
    const dataListWASM = new (await ergolib).ErgoBoxAssetsDataList();
    const boxSelection = new (await ergolib).BoxSelection(inputsWASM, dataListWASM);
    const creationHeight = await currentHeight();
    const outputCandidates = (await ergolib).ErgoBoxCandidates.empty();
    const tokenAmountAdjusted = BigInt(tokAmount * Math.pow(10, tokDecimals)).toString();
    const mintBoxValue = (await ergolib).BoxValue.from_i64((await ergolib).I64.from_str(MIN_NANOERG_BOX_VALUE.toString()));
    const mintBoxBuilder = new (await ergolib).ErgoBoxCandidateBuilder(
        mintBoxValue,
        (await ergolib).Contract.pay_to_address((await ergolib).Address.from_base58(address)),
        creationHeight);
    const token = new (await ergolib).Token(
        (await ergolib).TokenId.from_box_id((await ergolib).BoxId.from_str(utxos[0].boxId)),
        (await ergolib).TokenAmount.from_i64((await ergolib).I64.from_str(tokenAmountAdjusted))
    );
    mintBoxBuilder.mint_token(token, tokName, tokDesc, tokDecimals);
    mintBoxBuilder.set_register_value(7, await encodeStrConst(NFT_TYPES[tokType]));
    mintBoxBuilder.set_register_value(8, await encodeStrConst(tokHash));
    mintBoxBuilder.set_register_value(9, await encodeStrConst(tokURL));
    try {
        outputCandidates.add(mintBoxBuilder.build());
    } catch (e) {
        console.log(`building error: ${e}`);
        throw e;
    }
    var tx = await createTransaction(boxSelection, outputCandidates, [], address, utxos);
    console.log("tx", tx)
    const txId = await walletSignTx(alert, tx, address);
    return txId;
}

export async function mintCITYContract(tokName, tokDesc, tokAmount, tokDecimals, tokType, tokURL, tokHash, txFeeNano, tokIdStart) {
    const alert = waitingAlert("Preparing the transaction...");
    const address = localStorage.getItem('address');
    var txAmount = txFeeNano; // initial amount in the contract
    if (txFeeNano < 2 * (TX_FEE + MIN_NANOERG_BOX_VALUE)) {
        txAmount = 2 * (TX_FEE + MIN_NANOERG_BOX_VALUE);
    }
    const utxos = await getUtxos(txAmount + TX_FEE);
    const inputsWASM = (await ergolib).ErgoBoxes.from_boxes_json(utxos);
    const dataListWASM = new (await ergolib).ErgoBoxAssetsDataList();
    const boxSelection = new (await ergolib).BoxSelection(inputsWASM, dataListWASM);
    const creationHeight = await currentHeight();
    const outputCandidates = (await ergolib).ErgoBoxCandidates.empty();
    const tokenAmountAdjusted = BigInt(tokAmount * Math.pow(10, tokDecimals)).toString();
    // fix required tokIdStart if number of char if odd
    if (tokIdStart.length % 2 === 1) {
        tokIdStart = tokIdStart + '0';
    }
    // MINT CYTI
    const txAmountBoxValue = (await ergolib).BoxValue.from_i64((await ergolib).I64.from_str((txAmount).toString()));
    const mintCYTIBoxBuilder = new (await ergolib).ErgoBoxCandidateBuilder(
        txAmountBoxValue,
        (await ergolib).Contract.pay_to_address((await ergolib).Address.from_base58(CYTI_MINT_REQUEST_SCRIPT_ADDRESS)),
        creationHeight);
    mintCYTIBoxBuilder.set_register_value(4, await encodeLong(tokenAmountAdjusted));
    const tokenMintInfos = [tokName, tokDesc, tokDecimals, NFT_TYPES[tokType], tokHash, tokURL];
    console.log("mint info", [tokName, tokDesc, tokDecimals, NFT_TYPES[tokType], tokHash, tokURL]);
    const registerValue5 = tokenMintInfos.map((val) => {
        return new Uint8Array(Buffer.from(Serializer.stringToHex(val), 'hex'))

    });
    mintCYTIBoxBuilder.set_register_value(5, (await ergolib).Constant.from_coll_coll_byte(registerValue5));
    const ownerSigmaProp = (await ergolib).Constant.from_ecpoint_bytes(
        (await ergolib).Address.from_base58(address).to_bytes(0x00).subarray(1, 34)
    );
    mintCYTIBoxBuilder.set_register_value(6, ownerSigmaProp);
    mintCYTIBoxBuilder.set_register_value(7, await encodeHexConst(tokIdStart));
    mintCYTIBoxBuilder.set_register_value(8, ownerSigmaProp);
    mintCYTIBoxBuilder.set_register_value(9, await encodeHexConst("000000"));
    try {
        outputCandidates.add(mintCYTIBoxBuilder.build());
    } catch (e) {
        console.log(`building error: ${e}`);
        throw e;
    }

    var tx = await createTransaction(boxSelection, outputCandidates, [], address, utxos);
    console.log("tx", tx)
    const txId = await walletSignTx(alert, tx, address);
    return txId;
}

export async function refundMintRequest(mintRequestJSON) {
    const alert = waitingAlert("Preparing the transaction...");
    const address = localStorage.getItem('address');
    var utxos = [mintRequestJSON];
    if (parseInt(mintRequestJSON.value) < TX_FEE + MIN_NANOERG_BOX_VALUE) {
        const utxos1 = await getUtxos(TX_FEE);
        utxos = utxos.concat(utxos1)
    }
    const utxosValue = getUtxosListValue(utxos);
    const inputsWASM = (await ergolib).ErgoBoxes.from_boxes_json(utxos);
    const dataListWASM = new (await ergolib).ErgoBoxAssetsDataList();
    const boxSelection = new (await ergolib).BoxSelection(inputsWASM, dataListWASM);
    const creationHeight = await currentHeight();
    const outputCandidates = (await ergolib).ErgoBoxCandidates.empty();
    const refundBoxValue = (await ergolib).BoxValue.from_i64((await ergolib).I64.from_str((parseInt(utxosValue) - TX_FEE).toString()));
    const refundBoxBuilder = new (await ergolib).ErgoBoxCandidateBuilder(
        refundBoxValue,
        (await ergolib).Contract.pay_to_address((await ergolib).Address.from_base58(address)),
        creationHeight);
    try {
        outputCandidates.add(refundBoxBuilder.build());
    } catch (e) {
        console.log(`building error: ${e}`);
        throw e;
    }
    var tx = await createTransaction(boxSelection, outputCandidates, [], address, utxos);
    console.log("tx", tx)
    const txId = await walletSignTx(alert, tx, address);
    return txId;
}

