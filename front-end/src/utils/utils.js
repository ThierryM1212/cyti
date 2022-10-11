import { getBlob } from "../ergo-related/rest";
import { NANOERG_TO_ERG } from "./constants";
const { createHash } = require('crypto');


export function formatLongString(str, num) {
    if (typeof str !== 'string') return str;
    if (str.length > 2 * num) {
        return str.substring(0, num) + "..." + str.substring(str.length - num, str.length);
    } else {
        return str;
    }
}

export function formatERGAmount(amountStr) {
    return parseFloat(parseInt(amountStr) / NANOERG_TO_ERG).toFixed(4);
}

export async function downloadAndSetSHA256(url) {
    try {
        const blob = await getBlob(url);
        const hash = createHash('sha256').update(new Uint8Array(blob)).digest('hex');
        console.log("HASH", hash)
        return hash;
    } catch(e) {
        console.log(e)
    }
    return "";
}

export function promiseTimeout(ms, promise) {
    // Create a promise that rejects in <ms> milliseconds
    let timeout = new Promise((resolve, reject) => {
        let id = setTimeout(() => {
            clearTimeout(id);
            reject('Timed out in ' + ms + 'ms.')
        }, ms)
    })
    // Returns a race between our timeout and the passed in promise
    return Promise.race([
        promise,
        timeout
    ])
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}