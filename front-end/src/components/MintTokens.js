import React, { Fragment } from 'react';
import { mintCITYContract, mintSimpleToken } from '../ergo-related/mint';
import { TX_FEE, RECOMMENDED_FEES, NANOERG_TO_ERG } from '../utils/constants';
import { downloadAndSetSHA256, formatERGAmount } from '../utils/utils';
import HelpToolTip from './HelpToolTip';
import ThemedSelect from './ThemedSelect';
import TokenMedia from './TokenMedia';

/* global BigInt */

const MAX_SIGNIFICANT_NUMBER_TOKEN = 19;

const optionsType = [
    { value: 'Standard', label: 'Standard' },
    { value: 'Picture', label: 'Picture' },
    { value: 'Audio', label: 'Audio' },
    { value: 'Video', label: 'Video' },
]

export default class MintTokens extends React.Component {
    constructor(props) {
        super(props);
        var optionsDecimals = [];
        for (var i = 0; i < 10; i++) {
            optionsDecimals.push({ value: i.toString(), label: i.toString() })
        }
        this.state = {
            walletList: [],
            setPage: props.setPage,
            tokenName: '',
            tokenAmount: '1',
            tokenDescription: '',
            tokenDecimals: '0',
            tokenType: 'Standard',
            tokenMediaHash: '',
            tokenMediaAddress: '',
            optionsDecimals: optionsDecimals,
            tokenIDStart: '',
            recommendedFee: TX_FEE,
            fee: parseFloat(TX_FEE / NANOERG_TO_ERG),
        };
        this.setTokenName = this.setTokenName.bind(this);
        this.setTokenDescription = this.setTokenDescription.bind(this);
        this.setTokenAmount = this.setTokenAmount.bind(this);
        this.setTokenDecimals = this.setTokenDecimals.bind(this);
        this.setTokenType = this.setTokenType.bind(this);
        this.setTokenMediaAddress = this.setTokenMediaAddress.bind(this);
        this.isValidTokenAmount = this.isValidTokenAmount.bind(this);
        this.validateAmountStrInt = this.validateAmountStrInt.bind(this);
    }
    setTokenName = (name) => { this.setState({ tokenName: name }); };
    setTokenDescription = (desc) => { this.setState({ tokenDescription: desc }); };
    setTokenAmount = (amount) => {
        if (this.isValidTokenAmount(amount)) {
            this.setState({ tokenAmount: amount });
        }
    };
    setTokenDecimals = (dec) => {
        this.setState({
            tokenDecimals: dec,
            tokenMediaAddress: '',
            tokenMediaHash: '',
        });
        if (dec === '0') {
            this.setTokenAmount(this.state.tokenAmount.split('.')[0]);
        } else {
            const splittedAmount = this.state.tokenAmount.split('.');
            var newAmount = splittedAmount[0];
            if (splittedAmount.length > 1 && typeof splittedAmount[1] === 'string' && splittedAmount[1].length > 0) {
                newAmount = newAmount + '.' + splittedAmount[1].substring(0, dec);
            }
            if (newAmount.toString().length + parseInt(dec) <= 19) {
                this.setTokenAmount(newAmount);
            } else { // token amount too big with new decimals
                this.setTokenAmount("1");
            }
        }
    };
    setTokenType = (type) => {
        var decimals = this.state.tokenDecimals;
        if (type !== 'Standard') {
            decimals = '0';
        }
        this.setState({
            tokenType: type,
        });
        this.setTokenDecimals(decimals);
    };
    async setTokenMediaAddress(addr) {
        this.setState({ tokenMediaAddress: addr, tokenMediaHash: await downloadAndSetSHA256(addr) });
    };
    setTokenIDStart = (startID) => {
        const fixedStartID = startID.toLowerCase().replace(/[^a-f0-9]/gi, '').substring(0, RECOMMENDED_FEES.length - 1)
        this.setState({
            tokenIDStart: fixedStartID,
            recommendedFee: RECOMMENDED_FEES[fixedStartID.length],
            fee: parseFloat(RECOMMENDED_FEES[fixedStartID.length] / NANOERG_TO_ERG).toFixed(4),
        });
    };
    setFee = (feeFloat) => {
        const fixedFee = feeFloat.replace(',', '.').replace(/[^0-9\.]/g, ''); //eslint-disable-line
        this.setState({
            fee: fixedFee,
        });

    }

    isValidTokenAmount = (amount) => {
        var validAmount = false;
        if (amount.match("^[0-9\.]+$") != null) { //eslint-disable-line
            if (this.state.tokenDecimals === '0') { // No decimals
                if (amount.match("^[0-9]+$") != null) {
                    validAmount = this.validateAmountStrInt(amount);
                }
            } else { // Token decimals allowed
                var splited = amount.split('.');
                if (splited.length === 1) { // no decimals
                    validAmount = this.validateAmountStrInt(amount + parseInt(this.state.tokenDecimals));
                }
                if (splited.length === 2) {
                    if (amount.length - 1 < MAX_SIGNIFICANT_NUMBER_TOKEN) {
                        if (splited[1].length <= parseInt(this.state.tokenDecimals)) {
                            validAmount = this.validateAmountStrInt(splited[0] + splited[1]);
                        }
                    }
                }
            }
        }
        return validAmount;
    }
    validateAmountStrInt = (amountStrInt) => {
        if (amountStrInt.length <= MAX_SIGNIFICANT_NUMBER_TOKEN) {
            try {
                BigInt(amountStrInt);
                return true;
            } catch (e) {
                return false;
            }
        }
        return false;
    }

    async mintToken() {
        const txFeeNano = Math.round(parseFloat(this.state.fee) * NANOERG_TO_ERG);
        if (this.state.tokenIDStart.length === 0) {
            await mintSimpleToken(this.state.tokenName, this.state.tokenDescription, this.state.tokenAmount, this.state.tokenDecimals,
                this.state.tokenType, this.state.tokenMediaAddress, this.state.tokenMediaHash, txFeeNano);
        } else {
            await mintCITYContract(this.state.tokenName, this.state.tokenDescription, this.state.tokenAmount, this.state.tokenDecimals,
                this.state.tokenType, this.state.tokenMediaAddress, this.state.tokenMediaHash, txFeeNano, this.state.tokenIDStart);
        }
        //
    }

    render() {
        const address = localStorage.getItem('address') ?? '';
        return (
            <Fragment >
                <div className="w-75 p-1 m-1">
                    <h4>Mint tokens</h4>
                    <h5>Use CYTI minable smart contract to choose your token ID</h5>
                </div>
                <div className="w-75 card zonemint container p-1 m-1">
                    <div className='d-flex flex-row justify-content-between align-items-end m-1 p-1'>
                        <label htmlFor="tokenType" className='col-sm-4 d-flex align-items-start'>Type</label>
                        <div className='w-100 d-flex flex-row'>
                            <ThemedSelect id="tokenType"
                                value={this.state.tokenType}
                                onChange={(type) => this.setTokenType(type.value)}
                                options={optionsType}
                            />
                            <div></div>
                        </div>
                    </div>
                    <div className='d-flex flex-row justify-content-between align-items-end m-1 p-1'>
                        <label htmlFor="tokenName" className='col-sm-4 d-flex align-items-start'>Name</label>
                        <input type="text"
                            id="tokenName"
                            className="form-control col-sm input-dark"
                            onChange={e => this.setTokenName(e.target.value)}
                            value={this.state.tokenName}
                            autocomplete="off"
                        />
                    </div>
                    <div className='d-flex flex-row justify-content-between align-items-center m-1 p-1'>
                        <label htmlFor="tokenDescription" className='col-sm-4 d-flex align-items-start'>Description</label>
                        <textarea id="tokenDescription"
                            className="form-control col-sm input-dark"
                            onChange={e => this.setTokenDescription(e.target.value)}
                            value={this.state.tokenDescription}
                            rows="4"
                        />
                    </div>
                    <div className='d-flex flex-row justify-content-between align-items-end m-1 p-1'>
                        <label htmlFor="tokenAmount" className='col-sm-4 d-flex justify-content-start align-items-start'>Amount</label>
                        <input type="text"
                            id="tokenAmount"
                            className="form-control col-sm input-dark"
                            onChange={e => this.setTokenAmount(e.target.value)}
                            value={this.state.tokenAmount}
                            autocomplete="off"
                        />
                    </div>
                    {
                        this.state.tokenType === 'Standard' ?
                            <div className='d-flex flex-row justify-content-between align-items-end m-1 p-1'>
                                <label htmlFor="tokenDecimals" className='col-sm-4 d-flex align-items-start'>Decimals</label>
                                <div className='w-100 d-flex flex-row justify-content-between '>
                                    <ThemedSelect id="tokenDecimals"
                                        value={this.state.tokenDecimals}
                                        onChange={(dec) => this.setTokenDecimals(dec.value)}
                                        options={this.state.optionsDecimals}
                                    />
                                    <div></div>
                                </div>
                            </div>
                            : null
                    }
                    <TokenMedia type={this.state.tokenType} address={this.state.tokenMediaAddress} width={200} />
                    {
                        this.state.tokenType === "Standard" ? null
                            :
                            <Fragment>

                                <div className='d-flex flex-row justify-content-between align-items-end m-1 p-1'>
                                    <label htmlFor="tokenMediaAddr" className='col-sm-4 d-flex align-items-start'>{this.state.tokenType} URL</label>
                                    <input type="text"
                                        id="tokenMediaAddr"
                                        className="form-control col-sm input-dark"
                                        onChange={e => this.setTokenMediaAddress(e.target.value)}
                                        value={this.state.tokenMediaAddress}
                                        autocomplete="off"
                                    />
                                </div>
                            </Fragment>
                    }
                    <div className='d-flex flex-row justify-content-between align-items-center m-1 p-1'>
                        <label htmlFor="tokenIdStart" className='col-sm-4 d-flex align-items-center'>Desired token ID start
                            <HelpToolTip id="tokenIdStartToolTip" html={
                                <Fragment>
                                    <div>Hexadecimal ([0-9a-f]) characters chosen for the begining of the minted token ID. </div>
                                    <div>The maximum allowed length is currently 8 characters given the performance of the miner.</div>
                                    <div>The difficulty goes by two charracters: 1 and 2 character length will have the same difficulty, like 3 and 4 ...</div>
                                    <div>Leave empty to mint a standard token instead of a minable CYTI contract.</div>
                                </Fragment>
                            } />
                        </label>
                        <input type="text"
                            id="tokenIdStart"
                            className="form-control col-sm input-dark"
                            onChange={e => this.setTokenIDStart(e.target.value)}
                            value={this.state.tokenIDStart}
                            autocomplete="off"
                        />
                    </div>
                    <div className='d-flex flex-row justify-content-between align-items-center m-1 p-1'>
                        <label htmlFor="recommendedFee" className='col-sm-4 d-flex align-items-end'>Recommended fee
                            <HelpToolTip id="recommendedFeeToolTip" html={
                                <Fragment>
                                    <div>Fee recommended by default in the miner configuration.</div>
                                </Fragment>
                            } />
                        </label>
                        <div className='w-100 d-flex flex-row justify-content-between align-items-center'>
                            <div id="recommendedFee" className='d-flex align-items-start'>{formatERGAmount(this.state.recommendedFee)} ERG</div>
                            <div></div>
                        </div>
                    </div>
                    <div className='d-flex flex-row justify-content-left  m-1 p-1'>
                        <label htmlFor="fee" className='col-sm-4 d-flex align-items-center'>Fee
                            <HelpToolTip id="feeToolTip" html={
                                <Fragment>
                                    <div>Fee for transaction miners and token ID miners.</div>
                                    <div>The minimal fee for a CYTI contrat is 0.0042 ERG so it can technically be excuted.</div>
                                    <div>The miners are configuring a price for each difficulty level (number of characters you require for the start of the token ID).</div>
                                    <div>A CYTI contract with a too low fee might never be mined but is refundable.</div>
                                </Fragment>
                            } />
                        </label>
                        <input type="text"
                            id="fee"
                            className="form-control col-sm input-dark"
                            onChange={e => this.setFee(e.target.value)}
                            value={this.state.fee}
                            autocomplete="off"
                        />
                    </div>
                    <div className='d-flex flex-row justify-content-center align-items-center m-1 p-1'>
                        <button className='btn btn-blue'
                            onClick={() => this.mintToken()}
                            disabled={this.state.tokenName.length === 0 }
                        >
                            {
                                this.state.tokenIDStart.length > 0 ?
                                    "Mint CYTI"
                                    : "Mint"
                            }

                        </button>
                    </div>
                </div >
            </Fragment >
        )
    }
}
