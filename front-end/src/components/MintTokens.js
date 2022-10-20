import React, { Fragment } from 'react';
import { mintCITYContracts } from '../ergo-related/mint';
import { TX_FEE, NANOERG_TO_ERG } from '../utils/constants';
import { formatERGAmount } from '../utils/utils';
import HelpToolTip from './HelpToolTip';
import HelpImage from "../images/help_outline_blue_48dp.png";
import { errorAlert } from '../utils/Alerts';


export default class MintTokens extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            tokenList: props.tokenList,
            fee: parseFloat(TX_FEE / NANOERG_TO_ERG),
        };
    }

    setFee = (feeFloat) => {
        const fixedFee = feeFloat.replace(',', '.').replace(/[^0-9\.]/g, ''); //eslint-disable-line
        this.setState({
            fee: fixedFee,
        });
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.tokenList !== this.props.tokenList) {
            this.setState({
                tokenList: this.props.tokenList,
            });
        }
    }

    async mintToken() {
        try {
            await mintCITYContracts(this.state.tokenList, this.state.fee);
        } catch (e) {
            console.log(e);
            errorAlert(e.toString())
        }
    }

    render() {
        const address = localStorage.getItem('address') ?? '';
        const cytiFee = this.state.tokenList.reduce((acc, tok) => acc += parseFloat(tok.CYTIFee), 0);
        return (
            <Fragment >
                <div className="w-100 card zonemint p-1 m-1">
                    <div className='d-flex flex-row justify-content-left  m-1 p-1'>
                        <label htmlFor="nbTokens" className='col-sm-4 d-flex align-items-center'>Number of tokens
                        </label>
                        <div className='w-100 d-flex flex-row justify-content-between align-items-center'>
                            <div id="nbTokens" className='d-flex align-items-start'>{this.state.tokenList.length}</div>
                            <div></div>
                        </div>
                    </div>
                    <div className='d-flex flex-row justify-content-left  m-1 p-1'>
                        <label htmlFor="cytiFee" className='col-sm-4 d-flex align-items-center'>Total CYTI fee
                            <HelpToolTip image={HelpImage} id="feeToolTip0" html={
                                <Fragment>
                                    <div className='d-flex flex-column align-items-start'>
                                        <div>Fee for token ID miners</div>
                                        <div>Min 0.0042 ERG per token for non-empty token ID pattern.</div>
                                        <div>Min 0.0031 ERG for empty token ID pattern, and 0.002 will be refunded, minimal cost 0.0021 ERG per token.</div>
                                    </div>
                                </Fragment>
                            } />
                        </label>
                        <div className='w-100 d-flex flex-row justify-content-between align-items-center'>
                            <div id="cytiFee" className='d-flex align-items-start'>{formatERGAmount(cytiFee * NANOERG_TO_ERG)} ERG</div>
                            <div></div>
                        </div>
                    </div>
                    <div className='d-flex flex-row justify-content-left  m-1 p-1'>
                        <label htmlFor="txFee" className='col-sm-4 d-flex align-items-center'>Transaction fee
                            <HelpToolTip image={HelpImage} id="feeToolTip1" html={
                                <Fragment>
                                    <div>Fee for transaction miners (0.0011 ERG)</div>
                                </Fragment>
                            } />
                        </label>
                        <input type="text"
                            id="txFee"
                            className="form-control col-sm input-dark"
                            onChange={e => this.setFee(e.target.value)}
                            value={this.state.fee}
                            autoComplete="off"
                        />
                    </div>
                    <div className='d-flex flex-row justify-content-center align-items-center m-1 p-1'>
                        <button className='btn btn-blue'
                            onClick={() => this.mintToken()}
                            disabled={address === ''}
                        >
                            Mint CYTI
                        </button>
                    </div>
                </div >
            </Fragment >
        )
    }
}
