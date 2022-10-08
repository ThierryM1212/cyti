import './App.css';
import React from 'react';
import InputAddress from './components/InputAddress';
import MintTokens from './components/MintTokens';
import MintRequests from './components/MintRequests';
import Footer from './components/Footer';

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

          <MintTokens />
          <MintRequests />
        </div>
        <Footer />
      </div>
    );
  }

}
