import fetch from 'node-fetch';
import JSONBigInt from 'json-bigint';
import { addressToErgotree, ergoTreeToTemplateHash } from './wasm.js';
import { config } from '../config.js';


export async function get(url, apiKey = '') {
    try {
        return await fetch(url, {
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                api_key: apiKey,
            }
        }).then(res => res.json());
    } catch (e) {
        console.error(e);
        return [];
    }
}
async function post(url, body = {}, apiKey = '') {
    //console.log("post0", JSONBigInt.stringify(body));
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'mode': 'cors',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        },
        body: JSONBigInt.stringify(body)
    });
    const [responseOk, body2] = await Promise.all([response.ok, response.json()]);
    //console.log("post1", body2, responseOk)
    if (responseOk) {
        return { result: true, data: body2 };
    } else {
        if (Object.keys(body2).includes("detail")) {
            return { result: false, data: body2.detail };
        } else {
            return { result: false, data: body2.reason };
        }
    }
}

async function getRequestV1(url) {
    const res = await get(config.EXPLORER_API_URL + 'api/v1' + url, '')
    return res.items;
}
async function getRequestV0(url) {
    const res = await get(config.EXPLORER_API_URL + 'api/v0' + url, '')
    return res.items;
}

export async function postTxMempool(tx) {
    try {
        const res = await postTx(config.EXPLORER_API_URL + 'api/v1' + '/mempool/transactions/submit', tx);
        return res;
    } catch (err) {
        console.log("postTxMempool", err);
        return undefined;
    }
}

export async function sendTx(json) {
    const res = await postTxMempool(json);
    //const res = await postRequest('transactions', json)
    return res;
}

export async function postTx(url, body = {}, apiKey = '') {
    //console.log("post", url)
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'mode': 'cors',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        },
        body: JSONBigInt.stringify(body)
    });
    const [responseOk, bodyRes] = await Promise.all([response.ok, response.json()]);
    if (responseOk) {
        //console.log("fetch1", bodyRes);
        if (typeof bodyRes === 'object') {
            return bodyRes.id;
        } else {
            return bodyRes;
        }
    } else {
        //console.log("fetch2", bodyRes);
        return;
    }
}

export async function currentHeight() {
    return getRequestV0('/blocks?limit=1')
        .then(res => res[0].height);
}
export async function getUnspentBoxesByAddress(address, limit = 50) {
    return await getRequestV1('/boxes/unspent/byAddress/' + address + "?limit=" + limit.toString());
}
export async function boxByTokenId(tokenId) {
    return await getRequestV1(`/boxes/unspent/byTokenId/${tokenId}`);
}
export async function getExplorerBlockHeaders() {
    return (await getRequestV1(`/blocks/headers`)).slice(0, 10);
}
export async function getExplorerBlockHeadersFull() {
    return (await getRequestV1(`/blocks/headers`));
}

export async function searchUnspentBoxes(address, tokens, register = '', registerValue = '') {
    const ergoT = await addressToErgotree(address);
    var searchParam = { "ergoTreeTemplateHash": await ergoTreeToTemplateHash(ergoT) }
    if (tokens.length > 0) {
        searchParam["assets"] = tokens;
    }
    if (register !== '' && registerValue !== '') {
        var reg = {};
        reg[register] = registerValue;
        searchParam['registers'] = reg;
    }
    const res = await post(config.EXPLORER_API_URL + 'api/v1' + '/boxes/unspent/search', searchParam);
    return res.data.items;
}

export async function searchUnspentBoxesUpdated(address, tokens, register = '', registerValue = '') {
    const currentBlobBoxes = await searchUnspentBoxes(address, tokens, register, registerValue);
    const [spentBoxes, newBoxes] = await getSpentAndUnspentBoxesFromMempool(address);
    const spentBlobBoxIds = spentBoxes.map(box => box.boxId);
    const updatedBlobBoxes = newBoxes.filter(box => box.additionalRegisters[register].renderedValue === registerValue)
        .concat(currentBlobBoxes)
        .filter(box => !spentBlobBoxIds.includes(box.boxId));
    return updatedBlobBoxes;
}


export async function getUnconfirmedTxsFor(addr) {
    const res = await getRequestV1(`/mempool/transactions/byAddress/${addr}`);
    //console.log("getUnconfirmedTxsFor",addr, res);
    return res;
}

export async function getSpentAndUnspentBoxesFromMempool(address) {
    try {
        var unconfirmedTxs = await getUnconfirmedTxsFor(address);
        var spentBoxes = [];
        var newBoxes = [];
        if (unconfirmedTxs && unconfirmedTxs.length > 0) {
            spentBoxes = unconfirmedTxs.map(tx => tx.inputs).flat();
            newBoxes = unconfirmedTxs.map(tx => tx.outputs).flat().filter(box => address === box.address);
        }
        //console.log("getSpentAndUnspentBoxesFromMempool", address, spentBoxes, newBoxes)
        return [spentBoxes, newBoxes];
    } catch (e) {
        console.log(e);
        return [[], []];
    }
}

export async function getUnspentBoxesForAddressUpdated(address) {
    try {
        const boxesTmp = await getUnspentBoxesByAddress(address);
        const [spentBlobs, newBlobs] = await getSpentAndUnspentBoxesFromMempool(address);
        const spentBlobBoxIds = spentBlobs.map(box => box.boxId);
        const boxes = newBlobs.concat(boxesTmp).filter(box => !spentBlobBoxIds.includes(box.boxId));
        return boxes;
    } catch (e) {
        console.log(e);
        return [];
    }
}
