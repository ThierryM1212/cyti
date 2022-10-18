import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactTooltip from 'react-tooltip';
import LoadImage from "../images/file_download_black_48dp.png";
import { errorAlert, waitingAlert } from '../utils/Alerts';
import { tokenMintDescFromJSON } from '../utils/TokenMintDesc';


export default function LoadButton(props) {
    const onDrop = useCallback((acceptedFiles) => {
        acceptedFiles.forEach((file) => {
            const reader = new FileReader()
            const alert = waitingAlert("Loading tokens...");
            reader.onabort = () => console.log('file reading was aborted')
            reader.onerror = () => console.log('file reading has failed')
            reader.onload = async () => {
                const binaryStr = reader.result
                //console.log(binaryStr)
                var enc = new TextDecoder("utf-8");
                var json = {};
                try {
                    json = JSON.parse(enc.decode(binaryStr));
                } catch (e) {
                    errorAlert("Invalid json file");
                    return;
                }
                if (Array.isArray(json)) {
                    if (json.length > 0) {
                        var tokenList = [];
                        for (const token of json) {
                            const newToken = await tokenMintDescFromJSON(token);
                            tokenList.push(newToken);
                            console.log("newToken", newToken)
                        }
                        props.loadTab(tokenList);
                        alert.close();
                    } else {
                        errorAlert("Invalid json file, array is empty");
                        return;
                    }
                } else {
                    errorAlert("Invalid json file, it needs to be an array of token descriptions. ");
                    return;
                }
            }
            reader.readAsArrayBuffer(file)
        })   
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: '.json'
    })

    return (
        <span {...getRootProps()}>
            <input {...getInputProps()} />
            <img
                src={LoadImage}
                alt={"load tooltip"}
                width="24px"
                data-tip
                data-for={"loadFileTT"}
            />
            <ReactTooltip id={"loadFileTT"}
                place="right"
                effect="solid"
                data-html={true}
                delayShow={300}
                delayHide={300}
                insecure={true}
                multiline={true}
                backgroundColor="black"
            >
                <span>Load a json file with one or more token definition.</span>
                <span>Check the README on github for the compatible file format.</span>
            </ReactTooltip>
        </span>
    )
}