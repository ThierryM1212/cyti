import { decodeHex, decodeLong, sigmaPropToAddress, toHexString } from '../ergo-related/serializer';
import { getRegisterValue } from '../ergo-related/wasm';
import { NFT_TYPES } from './constants';
import {Serializer} from "@coinbarn/ergo-ts";
let ergolib = import('ergo-lib-wasm-browser');

export class CYTIRequest {
    constructor(boxJSON) {
        this.full = boxJSON;
        this.value = boxJSON.value;
        this.requestOwner = '';
        this.targetFirstChar = '';
        this.minerAddress = '';
        this.tokAmount = '0';
        this.tokName = '';
        this.tokDesc = '';
        this.tokDecimals = 0;
        this.tokType = 'Standard';
        this.tokMediaHash = '';
        this.tokMediaURL = '';
        this.boxId = boxJSON.boxId;
        this.isProcessed = false;
    }

    async initialize() {
        this.tokAmount = await decodeLong(getRegisterValue(this.full, "R4"));
        const tokInfo = await decodeR5Array(getRegisterValue(this.full, "R5"));
        this.tokName = tokInfo[0] ?? '';
        this.tokDesc = tokInfo[1] ?? '';
        this.tokDecimals = tokInfo[2] ?? '';
        const tokTypeValue = tokInfo[3] ?? '';
        this.tokType = Object.keys(NFT_TYPES).find(key => NFT_TYPES[key] === tokTypeValue);
        this.tokMediaHash = tokInfo[4] ?? '';
        this.tokMediaURL = tokInfo[5] ?? '';
        this.targetFirstChar = await decodeHex(getRegisterValue(this.full, "R7"));
        this.isProcessed = this.boxId.substring(0, this.targetFirstChar.length) === this.targetFirstChar;
        this.requestOwner = await sigmaPropToAddress(getRegisterValue(this.full, "R6"));
        if (this.isProcessed) {
            this.minerAddress = await sigmaPropToAddress(getRegisterValue(this.full, "R8"));
        }
        //console.log("this",this);
    }

    static async create(boxJSON) {
        const o = new CYTIRequest(boxJSON);
        await o.initialize();
        return o;
    }
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