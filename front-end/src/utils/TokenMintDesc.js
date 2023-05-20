import { errorAlert } from "./Alerts";
import { NANOERG_TO_ERG, NFT_TYPES, RECOMMENDED_FEES } from "./constants";
import { downloadAndSetSHA256 } from "./utils";

/* global BigInt */

export default class TokenMintDesc {
    constructor(name, type, desc, amount, decimals, mediaURL, mediaHash, idPattern, CYTIFee) {
        this.name = name;
        this.type = type;
        this.desc = desc;
        this.amount = amount;
        this.decimals = decimals;
        this.mediaURL = mediaURL;
        this.mediaHash = mediaHash;
        this.idPattern = idPattern;
        this.CYTIFee = CYTIFee;
    }
}

export function getEmptyTokenMintDesc(name = 'Token') {
    return new TokenMintDesc(
        name, 'Standard', '', '1', '0', '', '', '', (RECOMMENDED_FEES[0] / NANOERG_TO_ERG).toString()
    )
}

export async function tokenMintDescFromJSON(token) {
    var newToken = {};
    // Name
    if (!token["name"]) {
        errorAlert("Invalid token, name field is mandatory");
        return;
    }
    newToken["name"] = token["name"];
    // Type
    if (!token["type"]) {
        newToken["type"] = 'Standard';
    } else {
        if (!Object.keys(NFT_TYPES).includes(token["type"])) {
            errorAlert("Invalid token type, it needs to be in the list: " + Object.keys(NFT_TYPES));
            return;
        }
    }
    newToken["type"] = token["type"];
    // description
    if (token["desc"]) {
        newToken["desc"] = token["desc"];
    } else {
        newToken["desc"] = '';
    }
    // amount
    if (token["amount"]) {
        try {
            BigInt(token["amount"]);
        } catch (e) {
            errorAlert("Invalid token amount");
            return;
        }
        newToken["amount"] = token["amount"];
    } else {
        newToken["amount"] = "1";
    }
    // decimals
    if (token["decimals"]) {
        try {
            parseInt(token["decimals"]);
        } catch (e) {
            errorAlert("Invalid token decimals");
            return;
        }
        newToken["decimals"] = token["decimals"];
    } else {
        newToken["decimals"] = "0";
    }
    // URL
    if (token["mediaURL"]) {
        newToken["mediaURL"] = token["mediaURL"];
    } else {
        newToken["mediaURL"] = "";
    }
    // Media hash
    if (token["mediaHash"]) {
        newToken["mediaHash"] = token["mediaHash"];
    } else {
        if (newToken["type"] === 'Standard') {
            newToken["mediaHash"] = "";
        } else {
            if (newToken["mediaURL"].length > 0) {
                newToken["mediaHash"] = await downloadAndSetSHA256(newToken["mediaURL"]);
            } else {
                newToken["mediaHash"] = "";
            }
        }
    }
    // CYTI token ID pattern
    if (token["idPattern"]) {
        newToken["idPattern"] = token["idPattern"];
    } else {
        newToken["idPattern"] = "";
    }
    // CYTI fee
    if (token["CYTIFee"]) {
        try {
            parseFloat(token["CYTIFee"]);
        } catch (e) {
            errorAlert("Invalid CYTIFee");
            return;
        }
        newToken["CYTIFee"] = token["CYTIFee"];
    } else {
        newToken["CYTIFee"] = (RECOMMENDED_FEES[newToken["idPattern"].length] / NANOERG_TO_ERG).toString();
    }
    return new TokenMintDesc(newToken["name"], newToken["type"], newToken["desc"], newToken["amount"],
        newToken["decimals"], newToken["mediaURL"], newToken["mediaHash"], newToken["idPattern"], newToken["CYTIFee"]);
}