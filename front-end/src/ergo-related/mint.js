import { waitingAlert } from "../utils/Alerts";
import { encodeHexConst, encodeLong, encodeStrConst } from "./serializer";
import { CYTI_MINT_REQUEST_SCRIPT_ADDRESS, MIN_NANOERG_BOX_VALUE, NANOERG_TO_ERG, NFT_TYPES, TX_FEE } from "../utils/constants";
import { getUtxos, walletSignTx } from "./wallet";
import { Serializer } from "@coinbarn/ergo-ts";
import { currentHeight } from "./explorer";
import { createTransaction, getUtxosListValue } from "./wasm";
let ergolib = import('ergo-lib-wasm-browser');

/* global BigInt */

async function mintSimpleToken(tokName, tokDesc, tokAmount, tokDecimals, tokType, tokURL, tokHash, txFeeNano) {
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
    mintBoxBuilder.set_register_value(8, await encodeHexConst(tokHash));
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


export async function mintCITYContracts(tokenList, txFeeFloat) {
    // if only one token and no requirement on the start token ID, mint a simple token
    if (tokenList && tokenList.length === 1 && tokenList[0].idPattern === "") {
        return await mintSimpleToken(tokenList[0].name, tokenList[0].desc, tokenList[0].amount,
            tokenList[0].decimals, tokenList[0].type, tokenList[0].mediaURL, tokenList[0].mediaHash,
            Math.round(txFeeFloat * NANOERG_TO_ERG)
        );
    }

    const alert = waitingAlert("Preparing the transaction...");
    const address = localStorage.getItem('address');

    // Adjust the fee to avoid stuck contracts
    var fixedFeeTokenList = [];
    for (var token of tokenList) {
        if (token.idPattern === "" && parseFloat(token.CYTIFee) < (TX_FEE + 2 * MIN_NANOERG_BOX_VALUE) / NANOERG_TO_ERG) {
            token.CYTIFee = (TX_FEE + 2 * MIN_NANOERG_BOX_VALUE) / NANOERG_TO_ERG
        }
        if (token.idPattern !== "" && parseFloat(token.CYTIFee) < (2 * TX_FEE + 2 * MIN_NANOERG_BOX_VALUE) / NANOERG_TO_ERG) {
            token.CYTIFee = (2 * TX_FEE + 2 * MIN_NANOERG_BOX_VALUE) / NANOERG_TO_ERG
        }
        fixedFeeTokenList.push(token);
    }
    var txAmount = Math.round((fixedFeeTokenList.reduce((acc, tok) => acc += parseFloat(tok.CYTIFee), 0)) * NANOERG_TO_ERG);

    const utxos = await getUtxos(txAmount + Math.round(parseFloat(txFeeFloat) * NANOERG_TO_ERG));
    const inputsWASM = (await ergolib).ErgoBoxes.from_boxes_json(utxos);
    const dataListWASM = new (await ergolib).ErgoBoxAssetsDataList();
    const boxSelection = new (await ergolib).BoxSelection(inputsWASM, dataListWASM);
    const creationHeight = await currentHeight();
    const outputCandidates = (await ergolib).ErgoBoxCandidates.empty();
    const ownerSigmaProp = (await ergolib).Constant.from_ecpoint_bytes(
        (await ergolib).Address.from_base58(address).to_bytes(0x00).subarray(1, 34)
    );

    for (var token of fixedFeeTokenList) {
        const tokenAmountAdjusted = BigInt(token.amount * Math.pow(10, token.decimals)).toString();
        // fix required tokIdStart if number of char if odd
        if (token.idPattern.length % 2 === 1) {
            token.idPattern = token.idPattern + '0';
        }
        // MINT CYTI
        const txAmountBoxValue = (await ergolib).BoxValue.from_i64((await ergolib).I64.from_str((Math.round(token.CYTIFee * NANOERG_TO_ERG)).toString()));
        const mintCYTIBoxBuilder = new (await ergolib).ErgoBoxCandidateBuilder(
            txAmountBoxValue,
            (await ergolib).Contract.pay_to_address((await ergolib).Address.from_base58(CYTI_MINT_REQUEST_SCRIPT_ADDRESS)),
            creationHeight);
        mintCYTIBoxBuilder.set_register_value(4, await encodeLong(tokenAmountAdjusted));
        const tokenMintInfos = [token.name, token.desc, token.decimals, NFT_TYPES[token.type], token.mediaHash, token.mediaURL];
        console.log("mint info", [token.name, token.desc, token.decimals, NFT_TYPES[token.type], token.mediaHash, token.mediaURL]);
        const registerValue5 = tokenMintInfos.map((val, index) => {
            if (index === 4) { // encode hash as hex
                return new Uint8Array(Buffer.from(val, 'hex'))
            } else {
                return new Uint8Array(Buffer.from(Serializer.stringToHex(val), 'hex'))
            }
        });
        mintCYTIBoxBuilder.set_register_value(5, (await ergolib).Constant.from_coll_coll_byte(registerValue5));
        mintCYTIBoxBuilder.set_register_value(6, ownerSigmaProp);
        mintCYTIBoxBuilder.set_register_value(7, await encodeHexConst(token.idPattern));
        mintCYTIBoxBuilder.set_register_value(8, ownerSigmaProp);
        mintCYTIBoxBuilder.set_register_value(9, await encodeHexConst("000000"));
        try {
            outputCandidates.add(mintCYTIBoxBuilder.build());
        } catch (e) {
            console.log(`building error: ${e}`);
            throw e;
        }
    }

    var tx = await createTransaction(boxSelection, outputCandidates, [], address, utxos);
    console.log("tx", tx)
    const txId = await walletSignTx(alert, tx, address);
    return txId;
}


export async function refundMintRequest(mintRequestJSON) {
    return await refundAllMintRequests([mintRequestJSON]);
}

export async function refundAllMintRequests(mintRequestsJSON) {
    const alert = waitingAlert("Preparing the transaction...");
    const address = localStorage.getItem('address');
    var utxos = mintRequestsJSON;
    var utxosValue = getUtxosListValue(utxos);
    if (utxosValue < TX_FEE + MIN_NANOERG_BOX_VALUE) {
        const utxos1 = await getUtxos(TX_FEE);
        utxos = utxos.concat(utxos1);
        utxosValue = getUtxosListValue(utxos);
    }
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