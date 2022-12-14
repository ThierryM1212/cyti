let ergolib = import('ergo-lib-wasm-nodejs');
import {Serializer} from "@coinbarn/ergo-ts";
import JSONBigInt from 'json-bigint';
import { TX_FEE } from './constants.js';
import { currentHeight, getExplorerBlockHeadersFull } from './explorer.js';
import crypto from "crypto-js";


export async function getErgoStateContext() {
    return await getErgoStateContext2(0);
}

export async function getErgoStateContext2(contextId) {
    const explorerContext = (await getExplorerBlockHeadersFull()).splice(contextId, 10);
    const block_headers = (await ergolib).BlockHeaders.from_json(explorerContext);
    const pre_header = (await ergolib).PreHeader.from_block_header(block_headers.get(0));
    return new (await ergolib).ErgoStateContext(pre_header, block_headers);
}

export async function signTransaction(unsignedTx, inputs, dataInputs, wallet) {
    //console.log("signTransaction1", unsignedTx, inputs, dataInputs);
    const unsignedTransaction = (await ergolib).UnsignedTransaction.from_json(JSONBigInt.stringify(unsignedTx));
    const inputBoxes = (await ergolib).ErgoBoxes.from_boxes_json(inputs);
    const dataInputsBoxes = (await ergolib).ErgoBoxes.from_boxes_json(dataInputs);
    const ctx = await getErgoStateContext();
    //console.log("signTransaction2", unsignedTx, inputs, dataInputs);
    const signedTx = wallet.sign_transaction(ctx, unsignedTransaction, inputBoxes, dataInputsBoxes);
    return signedTx.to_json();
}

export function getRegisterValue(box, register) {
    if (register in box.additionalRegisters) {
        if (isDict(box.additionalRegisters[register])) {
            //console.log("getRegisterValue", box.additionalRegisters[register].serializedValue);
            return box.additionalRegisters[register].serializedValue;
        } else {
            return box.additionalRegisters[register];
        }
    } else {
        return "";
    }
}

export async function encodeLong(num) {
    return (await ergolib).Constant.from_i64((await ergolib).I64.from_str(num));
}
export async function decodeLong(num) {
    return (await ergolib).Constant.decode_from_base16(num).to_i64().to_str();
}

export async function encodeStrConst(str) {
    return (await ergolib).Constant.from_byte_array(Buffer.from(Serializer.stringToHex(str), 'hex'));
}

export async function encodeStr(str) {
    return encodeHex(Serializer.stringToHex(str))
}

export async function encodeHex(reg) {
    return (await ergolib).Constant.from_byte_array(Buffer.from(reg, 'hex')).encode_to_base16();
}

export async function encodeHexConst(reg) {
    return (await ergolib).Constant.from_byte_array(Buffer.from(reg, 'hex'));
}

export async function decodeHex(encoded) {
    return toHexString((await ergolib).Constant.decode_from_base16(encoded).to_byte_array())
}

export async function decodeStringArray(encoded) {
    return (await ergolib).Constant.decode_from_base16(encoded).to_coll_coll_byte().map(r => {
        return Serializer.stringFromHex(toHexString(r));
    })
}

export async function decodeR5Array(encoded) {
    return (await ergolib).Constant.decode_from_base16(encoded).to_coll_coll_byte().map((r, i) => {
        if ( i === 4) {
            return toHexString(r);
        } else {
            return Serializer.stringFromHex(toHexString(r));
        }
        
    })
}

export async function encodeAddress(address) {
    const byteArray = (await ergolib).Address.from_mainnet_str(address).to_bytes();
    return (await ergolib).Constant.from_byte_array(byteArray);
}

export async function decodeString(encoded) {
    return Serializer.stringFromHex(toHexString((await ergolib).Constant.decode_from_base16(encoded).to_byte_array()))
}

export async function sigmaPropToAddress(sigmaProp) {
    return (await ergolib).Address.recreate_from_ergo_tree((await ergolib).ErgoTree.from_base16_bytes("00" + sigmaProp)).to_base58();
}

export async function addressToSigmaPropHex(address) {
    return toHexString((await ergolib).Constant.from_ecpoint_bytes(
        (await ergolib).Address.from_base58(address).to_bytes(0x00).subarray(1, 34)
    ).sigma_serialize_bytes());
}

async function boxCandidateToJsonMin(boxCandidate) {
    var res = {};
    res["value"] = boxCandidate.value().as_i64().as_num().toString();
    res["ergoTree"] = boxCandidate.ergo_tree().to_base16_bytes();
    res["address"] = (await ergolib).Address.recreate_from_ergo_tree(boxCandidate.ergo_tree()).to_base58();
    var tokens = [];
    for (let i = 0; i < boxCandidate.tokens().len(); i++) {
        tokens.push(boxCandidate.tokens().get(i).to_js_eip12())
    }
    res["assets"] = tokens;
    return res;
}
async function boxCandidatesToJsonMin(boxCandidates) {
    var res = [];
    for (let i = 0; i < boxCandidates.len(); i++) {
        res.push(await boxCandidateToJsonMin(boxCandidates.get(i)))
    }
    return res;
}

export async function createTransaction(boxSelection, outputCandidates, dataInputs, changeAddress, utxos) {
    const creationHeight = await currentHeight();

    // build the change box
    var outputJs = await boxCandidatesToJsonMin(outputCandidates);
    const missingErgs = getMissingErg(utxos, outputJs) - BigInt(TX_FEE);
    const tokens = getMissingTokens(utxos, outputJs);
    
    if (missingErgs > 0 || Object.keys(tokens) > 0) {
        const changeBoxValue = (await ergolib).BoxValue.from_i64((await ergolib).I64.from_str(missingErgs.toString()));
        const changeBoxBuilder = new (await ergolib).ErgoBoxCandidateBuilder(
            changeBoxValue,
            (await ergolib).Contract.pay_to_address((await ergolib).Address.from_base58(changeAddress)),
            creationHeight);
            for (const tokId of Object.keys(tokens)) {
                const tokenId = (await ergolib).TokenId.from_str(tokId);
                const tokenAmount = (await ergolib).TokenAmount.from_i64((await ergolib).I64.from_str(tokens[tokId].toString()));
                changeBoxBuilder.add_token(tokenId, tokenAmount);
            }
        try {
            outputCandidates.add(changeBoxBuilder.build());
        } catch (e) {
            console.log(`building error: ${e}`);
            throw e;
        }
    }

    const txBuilder = (await ergolib).TxBuilder.new(
        boxSelection,
        outputCandidates,
        creationHeight,
        (await ergolib).BoxValue.from_i64((await ergolib).I64.from_str(TX_FEE.toString())),
        (await ergolib).Address.from_base58(changeAddress));
    var dataInputsWASM = new (await ergolib).DataInputs();
    for (const box of dataInputs) {
        const boxIdWASM = (await ergolib).BoxId.from_str(box.boxId);
        const dataInputWASM = new (await ergolib).DataInput(boxIdWASM);
        dataInputsWASM.add(dataInputWASM);
    }
    txBuilder.set_data_inputs(dataInputsWASM);
    const tx = parseUnsignedTx(txBuilder.build().to_json());

    const unsignedTx = (await ergolib).UnsignedTransaction.from_json(JSONBigInt.stringify(tx))
    var correctTx = parseUnsignedTx(unsignedTx.to_json());

    // Put back complete selected inputs in the same order
    correctTx.inputs = correctTx.inputs.map(box => {
        const fullBoxInfo = parseUtxo(utxos.find(utxo => utxo.boxId === box.boxId));
        return {
            ...fullBoxInfo,
            extension: {}
        };
    });
    // Put back complete selected datainputs in the same order
    correctTx.dataInputs = correctTx.dataInputs.map(box => {
        const fullBoxInfo = parseUtxo(dataInputs.find(utxo => utxo.boxId === box.boxId));
        return {
            ...fullBoxInfo,
            extension: {}
        };
    });

    return correctTx;
}

export function parseUnsignedTx(str) {
    let json = JSONBigInt.parse(str);
    return {
        id: json.id,
        inputs: json.inputs,
        dataInputs: json.dataInputs,
        outputs: json.outputs.map(output => (parseUtxo(output))),
    };
}

function parseUtxo(json, addExtention = true, mode = 'input') {
    if (json === undefined) {
        return {};
    }
    var res = {};
    if (mode === 'input') {
        if ("id" in json) {
            res["boxId"] = json.id;
        } else {
            res["boxId"] = json.boxId;
        }
    }
    res["value"] = json.value.toString();
    res["ergoTree"] = json.ergoTree;
    if (Array.isArray(json.assets)) {
        res["assets"] = json.assets.map(asset => ({
            tokenId: asset.tokenId,
            amount: asset.amount.toString(),
            name: asset.name ?? '',
            decimals: asset.decimals ?? 0,
        }));
    } else {
        res["assets"] = [];
    }
    if (isDict(json["additionalRegisters"])) {
        res["additionalRegisters"] = parseAdditionalRegisters(json.additionalRegisters);
    } else {
        res["additionalRegisters"] = {};
    }

    res["creationHeight"] = json.creationHeight;

    if ("address" in json) {
        res["address"] = json.address;
    }

    if (mode === 'input') {
        if ("txId" in json) {
            res["transactionId"] = json.txId;
        } else {
            res["transactionId"] = json.transactionId;
        }
        res["index"] = json.index;
    }
    if (addExtention) {
        res["extension"] = {};
    }
    return res;
}

function parseAdditionalRegisters(json) {
    var registterOut = {};
    //console.log("json",json);
    Object.entries(json).forEach(([key, value]) => {
        //console.log("key",key,"value",value);
        if (isDict(value)) {
            registterOut[key] = value["serializedValue"];
        } else {
            registterOut[key] = value;
        }
      });
      //console.log("registterOut",registterOut);
    return registterOut;
}

function isDict(v) {
    return typeof v==='object' && v!==null && !(v instanceof Array) && !(v instanceof Date);
}

export async function encodeLongArray(longArray) {
    return (await ergolib).Constant.from_i64_str_array(longArray);
}

export async function ergoTreeToAddress(ergoTree) {
    //console.log("ergoTreeToAddress",ergoTree);
    const ergoT = (await ergolib).ErgoTree.from_base16_bytes(ergoTree);
    const address = (await ergolib).Address.recreate_from_ergo_tree(ergoT);
    return address.to_base58();
}

export async function addressToErgotree(address) {
    const addressWASM = (await ergolib).Address.from_base58(address);
    return addressWASM.to_ergo_tree().to_base16_bytes();
}

export async function encodeIntArray(intArray) {
    return (await ergolib).Constant.from_i32_array(intArray);
}

export async function decodeIntArray(encodedArray) {
    return (await ergolib).Constant.decode_from_base16(encodedArray).to_i32_array()
}

export async function ergoTreeToTemplate(ergoTree) {
    const ergoTreeWASM = (await ergolib).ErgoTree.from_base16_bytes(ergoTree);
    return toHexString(ergoTreeWASM.template_bytes());
}

export async function ergoTreeToTemplateHash(ergoTree) {
    const ergoTreeTemplateHex = await ergoTreeToTemplate(ergoTree);
    //return toHexString(ergoTreeWASM.template_bytes());
    return crypto.SHA256(crypto.enc.Hex.parse(ergoTreeTemplateHex)).toString(crypto.enc.Hex);
}

export function toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
}

export function getUtxosListValue(utxos) {
    return utxos.reduce((acc, utxo) => acc += BigInt(utxo.value), BigInt(0));
}

export function getTokenListFromUtxos(utxos) {
    var tokenList = {};
    for (const i in utxos) {
        for (const j in utxos[i].assets) {
            if (utxos[i].assets[j].tokenId in tokenList) {
                tokenList[utxos[i].assets[j].tokenId] = BigInt(tokenList[utxos[i].assets[j].tokenId]) + BigInt(utxos[i].assets[j].amount);
            } else {
                tokenList[utxos[i].assets[j].tokenId] = BigInt(utxos[i].assets[j].amount);
            }
        }
    }
    return tokenList;
}

export function getMissingErg(inputs, outputs) {
    const amountIn = getUtxosListValue(inputs);
    const amountOut = getUtxosListValue(outputs);
    if (amountIn >= amountOut) {
        return amountIn - amountOut;
    } else {
        return BigInt(0);
    }
}

export function getMissingTokens(inputs, outputs) {
    const tokensIn = getTokenListFromUtxos(inputs);
    const tokensOut = getTokenListFromUtxos(outputs);
    var res = {};
    if (tokensIn !== {}) {
        for (const token in tokensIn) {
            if (tokensOut !== {} && token in tokensOut) {
                if (tokensIn[token] - tokensOut[token] > 0) {
                    res[token] = tokensIn[token] - tokensOut[token];
                }
            } else {
                res[token] = tokensIn[token];
            }
        }
    }
    return res;
}

export async function buildBalanceBox(inputs, outputs, address) {
    const missingErgs = getMissingErg(inputs, outputs).toString();
    const contract = await encodeContract(address);
    const tokens = buildTokenList(getMissingTokens(inputs, outputs));
    const height = await currentHeight();

    return {
        value: missingErgs,
        ergoTree: contract,
        assets: tokens,
        additionalRegisters: {},
        creationHeight: height,
        extension: {},
        index: undefined,
        boxId: undefined,
    };
}

export function buildTokenList(tokens) {
    var res = [];
    if (tokens !== {}) {
        for (const i in tokens) {
            res.push({ "tokenId": i, "amount": tokens[i].toString() });
        }
    };
    return res;
}