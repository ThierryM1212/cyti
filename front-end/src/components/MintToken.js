import React, { Fragment } from 'react';
import { RECOMMENDED_FEES, NANOERG_TO_ERG } from '../utils/constants';
import { formatERGAmount } from '../utils/utils';
import HelpToolTip from './HelpToolTip';
import HelpImage from "../images/help_outline_blue_48dp.png";
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

export default class MintToken extends React.Component {
    constructor(props) {
        super(props);
        var optionsDecimals = [];
        for (var i = 0; i < 10; i++) {
            optionsDecimals.push({ value: i.toString(), label: i.toString() })
        }
        this.state = {
            id: props.id,
            tokenName: props.token.name,
            tokenAmount: props.token.amount,
            tokenDescription: props.token.desc,
            tokenDecimals: props.token.decimals,
            tokenType: props.token.type,
            tokenMediaHash: props.token.mediaHash,
            tokenMediaAddress: props.token.mediaURL,
            tokenIDStart: props.token.idPattern,
            fee: props.token.CYTIFee,
            updateHandler: props.updateHandler,
            nbTokens: props.nbTokens,
            optionsDecimals: optionsDecimals,
            recommendedFee: RECOMMENDED_FEES[props.token.idPattern.length],
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
    getToken = () => {
        return {
            type: this.state.tokenType,
            name: this.state.tokenName,
            desc: this.state.tokenDescription,
            amount: this.state.tokenAmount,
            decimals: this.state.tokenDecimals,
            mediaURL: this.state.tokenMediaAddress,
            mediaHash: this.state.tokenMediaHash,
            idPattern: this.state.tokenIDStart,
            CYTIFee: this.state.fee,
        }
    }
    setTokenName = (name) => {
        this.setState({ tokenName: name }, () => {
            this.state.updateHandler(this.state.id, this.getToken())
        });
    };
    setTokenDescription = (desc) => {
        this.setState({ tokenDescription: desc }, () => {
            this.state.updateHandler(this.state.id, this.getToken())
        });
    };
    setTokenAmount = (amount) => {
        if (this.isValidTokenAmount(amount)) {
            this.setState({ tokenAmount: amount }, () => {
                this.state.updateHandler(this.state.id, this.getToken())
            });
        }
    };
    setTokenDecimals = (dec) => {
        this.setState({
            tokenDecimals: dec
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
        var tokenMediaAddress = this.state.tokenMediaAddress;
        var tokenMediaHash = this.state.tokenMediaHash;
        if (type === 'Standard') {
            tokenMediaAddress = '';
            tokenMediaHash = '';
        }
        this.setState({
            tokenType: type,
            tokenMediaAddress: tokenMediaAddress,
            tokenMediaHash: tokenMediaHash,
        });
    };
    setTokenMediaAddress(addr) {
        this.setState({ tokenMediaAddress: addr }, () => {
            this.state.updateHandler(this.state.id, this.getToken());
            //console.log("tokenMediaHash", this.state.tokenMediaHash)
        });
    };
    setTokenIDStart = (startID) => {
        const fixedStartID = startID.toLowerCase().replace(/[^a-f0-9]/gi, '').substring(0, RECOMMENDED_FEES.length - 1)
        var recommendedFee = RECOMMENDED_FEES[fixedStartID.length];
        var CYTIFee = parseFloat(recommendedFee / NANOERG_TO_ERG).toFixed(4);
        if (this.state.nbTokens === 1 && fixedStartID === "") {
            recommendedFee = 0;
            CYTIFee = 0;
        }
        console.log("setTokenIDStart", recommendedFee, CYTIFee, fixedStartID);
        this.setState({
            tokenIDStart: fixedStartID,
            recommendedFee: recommendedFee,
            fee: CYTIFee,
        }, () => {
            this.state.updateHandler(this.state.id, this.getToken());
        });
    };
    setFee = (feeFloat) => {
        var fixedFee = parseFloat(0).toFixed(4);
        if (feeFloat) {
            fixedFee = feeFloat.replace(',', '.').replace(/[^0-9\.]/g, ''); //eslint-disable-line
        }
        this.setState({
            fee: fixedFee,
        }, () => {
            this.state.updateHandler(this.state.id, this.getToken())
        });
    }

    async componentDidUpdate(prevProps, prevState) {
        if (prevProps.token !== this.props.token ||
            prevProps.nbTokens !== this.props.nbTokens ||
            prevProps.id !== this.props.id) {
            this.setState({
                id: this.props.id,
                tokenName: this.props.token.name,
                tokenAmount: this.props.token.amount,
                tokenDescription: this.props.token.desc,
                tokenDecimals: this.props.token.decimals,
                tokenType: this.props.token.type,
                tokenMediaHash: this.props.token.mediaHash,
                tokenMediaAddress: this.props.token.mediaURL,
                tokenIDStart: this.props.token.idPattern,
                fee: this.props.token.CYTIFee,
                nbTokens: this.props.nbTokens,
                updateHandler: this.props.updateHandler,
            });
        }
    }

    isValidTokenAmount = (amount) => {
        //console.log("isValidTokenAmount", amount, this.state.tokenDecimals);
        var validAmount = false;
        if (amount.match("^[0-9\.]+$") !== null) { //eslint-disable-line
            if (this.state.tokenDecimals === '0') { // No decimals
                if (amount.match("^[0-9]+$") !== null) {
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

    render() {
        return (
            <Fragment >
                <div className="card zonemint p-1 m-1">
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
                            autoComplete="off"
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
                            autoComplete="off"
                        />
                    </div>
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
                                        autoComplete="off"
                                    />
                                </div>
                            </Fragment>
                    }
                    <div className='d-flex flex-row justify-content-between align-items-center m-1 p-1'>
                        <label htmlFor="tokenIdStart" className='col-sm-4 d-flex align-items-center'>Desired token ID start
                            <HelpToolTip image={HelpImage} id="tokenIdStartToolTip" html={
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
                            autoComplete="off"
                        />
                    </div>
                    <div className='d-flex flex-row justify-content-between align-items-center m-1 p-1'>
                        <label htmlFor="recommendedFee" className='col-sm-4 d-flex align-items-end'>Recommended fee
                            <HelpToolTip image={HelpImage} id="recommendedFeeToolTip" html={
                                <Fragment>
                                    <div>Fee recommended by default in the miner configuration.</div>
                                </Fragment>
                            } />
                        </label>
                        <div className='w-100 d-flex flex-row justify-content-between align-items-center'>
                            <div id="recommendedFee" className='d-flex align-items-start'>
                                {formatERGAmount(this.state.recommendedFee)
                                } ERG</div>
                            <div></div>
                        </div>
                    </div>
                    <div className='d-flex flex-row justify-content-left  m-1 p-1'>
                        <label htmlFor="fee" className='col-sm-4 d-flex align-items-center'>CYTI fee
                            <HelpToolTip image={HelpImage} id="feeToolTip" html={
                                <Fragment>
                                    <div className='d-flex flex-column align-items-start'>
                                        <div>Fee for token ID miners</div>
                                        <div>Min 0.0042 ERG per token for non-empty token ID pattern.</div>
                                        <div>Min 0.0031 ERG for empty token ID pattern, and 0.002 will be refunded, minimal CYTI cost 0.0011 ERG per token.</div>
                                        <div>A CYTI contract with a too low fee might never be mined but it is refundable.</div>
                                    </div>
                                </Fragment>
                            } />
                        </label>
                        <input type="text"
                            id="fee"
                            className="form-control col-sm input-dark"
                            onChange={e => this.setFee(e.target.value)}
                            value={this.state.fee}
                            autoComplete="off"
                        />
                    </div>
                </div >
            </Fragment >
        )
    }
}
