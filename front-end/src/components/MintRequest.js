import React, { Fragment } from 'react';
import { refundMintRequest } from '../ergo-related/mint';
import { CYTIRequest } from '../utils/CYTIRequest';
import { formatERGAmount, formatLongString } from '../utils/utils';
import TokenMedia from './TokenMedia';


export default class MintRequest extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            cytiBoxJSON: props.cytiBoxJSON,
            request: {"boxId": "", "targetFirstChar": ""},
        };
    }

    async componentDidMount() {
        const request = await CYTIRequest.create(this.state.cytiBoxJSON);
        this.setState({
            request: request,
        });
    }

    async refund(mintRequestJSON) {
        await refundMintRequest(mintRequestJSON);
        
    }

    render() {
        const connectedAddress = localStorage.getItem("address");
        var statusLabel = "To be mined";
        if (this.state.request.isProcessed) {
            statusLabel = "Processed";
        }
        const tokenType = this.state.request.tokType;
        var labelMap = { // order matters
            "Fee": formatERGAmount(this.state.request.value) + " ERG",
            "Owner": formatLongString(this.state.request.requestOwner, 6),
            "Type": this.state.request.tokType,
            "Name": this.state.request.tokName,
            "Amount": this.state.request.tokAmount,
            "Decimals": this.state.request.tokDecimals,
            "Description": this.state.request.tokDesc,
            [tokenType]: "",
            "URL": "",
            "ID first chars": this.state.request.targetFirstChar,
            "Miner": formatLongString(this.state.request.minerAddress, 6),
            "Status": statusLabel,
            "boxId": formatLongString(this.state.request.boxId, 6),
        }
        if (this.state.request.tokType !== 'Standard') {
            labelMap["URL"] = <a href={this.state.request.tokMediaURL}>{formatLongString(this.state.request.tokMediaURL, 15)}</a>;
            labelMap[tokenType] = <TokenMedia type={this.state.request.tokType} address={this.state.request.tokMediaURL} width={50} />
        }
        return (

            <Fragment >
                <div className='card zonerequest d-flex flex-column justify-content-between m-2 p-2'>
                <div className='d-flex flex-column'>
                    {
                        Object.keys(labelMap).filter(lbl => labelMap[lbl] !== "").map(lbl =>
                            <div key={lbl} className='d-flex flex-row justify-content-between align-items-center'>
                                <label htmlFor={lbl} className='col-sm d-flex align-items-start'>{lbl}</label>
                                <div id={lbl} className='limit-width'>{labelMap[lbl]}</div>
                            </div>
                        )
                    }
                    </div>
                    {
                        this.state.request.requestOwner === connectedAddress &&
                            !this.state.request.boxId.startsWith(this.state.request.targetFirstChar) ?
                            <div className='w-100 d-flex flex-row justify-content-center'>
                                <button className='btn btn-blue' onClick={() => this.refund(this.state.cytiBoxJSON)}>
                                    Refund
                                </button>
                            </div>
                            : null
                    }
                </div>
            </Fragment>
        )
    }
}

