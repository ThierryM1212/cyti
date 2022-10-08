import React from 'react';
import { getUnconfirmedTxsFor, getUnspentBoxesForAddressUpdated } from '../ergo-related/explorer';
import { toHexString } from '../ergo-related/serializer';
import { CYTI_MINT_REQUEST_SCRIPT_ADDRESS } from '../utils/constants';
import MintRequest from './MintRequest';
let ergolib = import('ergo-lib-wasm-browser');


export default class MintRequests extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            userMintRequests: [],
        };
    }

    async componentDidMount() {
        await this.fetchMintRequests();
    }

    async fetchMintRequests() {
        var mintBoxes = await getUnspentBoxesForAddressUpdated(CYTI_MINT_REQUEST_SCRIPT_ADDRESS);
        const address = localStorage.getItem('address') ?? '';

        var unconfirmedTxs = await getUnconfirmedTxsFor(address);
        var spentBoxes = [];
        var newBoxes = [];
        if (unconfirmedTxs && unconfirmedTxs.length > 0) {
            spentBoxes = unconfirmedTxs.map(tx => tx.inputs).flat();
            newBoxes = unconfirmedTxs.map(tx => tx.outputs).flat().filter(box => address === box.CYTI_MINT_REQUEST_SCRIPT_ADDRESS);
        }
        const spentBoxIds = spentBoxes.map(box => box.boxId);
        mintBoxes = newBoxes.concat(mintBoxes).filter(box => !spentBoxIds.includes(box.boxId));

        var addressSigmaPropHex = '';
        if (address !== '') {
            addressSigmaPropHex = toHexString((await ergolib).Constant.from_ecpoint_bytes(
                (await ergolib).Address.from_base58(localStorage.getItem('address')).to_bytes(0x00).subarray(1, 34)
            ).sigma_serialize_bytes());
        }
        var userMintRequests = [];
        for (const box of mintBoxes) {
            try {
                if (box.additionalRegisters.R6) {
                    const mintSigmaProp = Buffer.from(box.additionalRegisters.R6.serializedValue, 'hex')
                    if (toHexString(mintSigmaProp) === addressSigmaPropHex) {
                        userMintRequests.push(box);
                    }
                }
            } catch (e) {
                console.log("fetchMintRequests", e)
            }
        }
        this.setState({
            userMintRequests: userMintRequests,
        })
    }

    render() {
        const address = localStorage.getItem('address') ?? '';
        return (
            <div className='w-100 d-flex flex-column m-2 p-2'>
                <br />
                <div><h4>My CYTI mint requests</h4></div>
                {
                    this.state.userMintRequests.length === 0 ?
                        <div className='d-flex flex-column m-1 p-1'>
                            <h6>
                                No CITY mint request found {address === '' ? null : "for " + address}
                            </h6>
                        </div>
                        :
                        <div className='d-flex flex-column m-1 p-1'>
                            <div></div>
                            <div className='d-flex flex-wrap justify-content-center m-1 p-1'>
                                {
                                    this.state.userMintRequests.map(box =>
                                        <MintRequest key={box.boxId + "_1"} cytiBoxJSON={box} />
                                    )
                                }
                            </div>
                        </div>
                }
            </div>
        )
    }
}
