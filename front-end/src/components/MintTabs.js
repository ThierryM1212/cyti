import React from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import './react-tabs.css';
import MintToken from './MintToken';
import AddImage from "../images/add_circle_outline_black_48dp.png";
import DeleteImage from "../images/highlight_off_black_48dp.png";
import ExportImage from "../images/file_upload_black_48dp.png";
import LoadButton from './LoadButton';
import MintTokens from './MintTokens';
import { getEmptyTokenMintDesc } from '../utils/TokenMintDesc';
import ReactTooltip from 'react-tooltip';


export default class MintTabs extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tabList: [getEmptyTokenMintDesc()],
        };
        this.exportTabs = this.exportTabs.bind(this);
    }

    addTab = () => {
        this.setState({
            tabList: [...this.state.tabList, getEmptyTokenMintDesc("Token " + (this.state.tabList.length + 1))]
        })
    }

    deleteTab = (id) => {
        this.setState(prevState => ({
            tabList: prevState.tabList.filter((elem, index) => index !== id)
        }));
    }

    updateToken = (id, token) => {
        //console.log("updateToken", id, token);
        var newList = this.state.tabList;
        newList[id] = token;
        this.setState({
            tabList: newList,
        });
    }

    loadTabs = (tabListJSON) => {
        this.setState({
            tabList: tabListJSON,
        });
    }

    async exportTabs() {
        var _myArray = JSON.stringify(this.state.tabList, null, 4);
        var vLink = document.createElement('a'),
            vBlob = new Blob([_myArray], { type: "octet/stream" }),
            vName = 'CYTI_tokens.json',
            vUrl = window.URL.createObjectURL(vBlob);
        vLink.setAttribute('href', vUrl);
        vLink.setAttribute('download', vName);
        vLink.click();
    }

    render() {
        return (
            <div className='w-100 d-flex justify-content-center'>
                <Tabs className='w-75' selectedTabClassName="react-tabs-tab-selected" >
                    <TabList className='w-100'>
                        {
                            this.state.tabList.map((tab, index) =>
                                <Tab key={index}>
                                    <div className='d-flex flex-row align-items-center justify-content-between'>
                                        {tab.name} &nbsp;
                                        <img src={DeleteImage} onClick={() => this.deleteTab(index)} width={24} alt="delete" />
                                    </div>
                                </Tab>
                            )
                        }
                        &nbsp;&nbsp;
                        <img src={AddImage} onClick={this.addTab} width={24} alt="add" />
                        &nbsp;&nbsp;
                        <LoadButton loadTab={this.loadTabs} />
                        &nbsp;&nbsp;
                        <span >
                            <img
                                src={ExportImage}
                                alt={"export"}
                                width="24px"
                                data-tip
                                data-for={"exportJSON"}
                                onClick={this.exportTabs}
                            />
                            <ReactTooltip id={"exportJSON"}
                                place="right"
                                effect="solid"
                                data-html={true}
                                delayShow={300}
                                delayHide={300}
                                insecure={true}
                                multiline={true}
                                backgroundColor="black"
                            >
                                <span>Export tokens to JSON file</span>
                            </ReactTooltip>
                        </span>
                    </TabList>
                    {
                        this.state.tabList.map((tab, index) =>
                            <TabPanel key={index}>
                                <MintToken id={index} 
                                token={tab} 
                                updateHandler={this.updateToken} 
                                nbTokens={this.state.tabList.length}
                                />
                            </TabPanel>
                        )
                    }
                    <br />
                    <MintTokens tokenList={this.state.tabList} />
                </Tabs>
            </div>
        )
    }
}
