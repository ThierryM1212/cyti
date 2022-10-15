import './App.css';
import React from 'react';
import InputAddress from './components/InputAddress';
import MintRequests from './components/MintRequests';
import Footer from './components/Footer';
import MintTabs from './components/MintTabs';

export default class App extends React.Component {

  render() {
    return (
      <div className="App d-flex flex-column justify-content-between align-items-center">
        <div className="w-100 d-flex flex-column align-items-center">
          <div className="w-100 d-flex flex-row justify-content-between align-items-center bggrey">
            <div className='d-flex flex-column  align-items-start m-1 p-1'>
              <h2>&nbsp;C.Y.T.I<span className='hidden-mobile'> - Choose Your Token ID</span></h2>
              <div>
                <button className='btn btn-yellow'
                  onClick={() => {
                    const url = 'https://github.com/ThierryM1212/cyti/releases';
                    window.open(url, '_blank').focus();
                  }}
                >
                  Get CYTI miner
                </button>
              </div>
            </div>
            <InputAddress />
          </div>
          <div className="w-75 p-1 m-1">
            <h4>Mint tokens</h4>
            <h5>Use CYTI minable smart contract to choose your token ID</h5>
          </div>
          <MintTabs />
          <MintRequests />
        </div>
        <Footer />
      </div>
    );
  }

}
