import React, { Fragment } from 'react';


export default function TokenMedia(props) {
    return (
        <Fragment>
            {
                props.type === "Standard" || props.address === '' ? null :
                    <div className='d-flex flex-row justify-content-center align-items-center m-1 p-1'>
                        {
                            props.type === "Picture" ?
                                <img src={props.address} alt="token" width={props.width} />
                                : null
                        }
                        {
                            props.type === "Video" ?
                                <video controls src={props.address} alt="token" width={props.width} />
                                : null
                        }
                        {
                            props.type === "Audio" ?
                                <audio controls src={props.address} alt="token" width={props.width} />
                                : null
                        }
                    </div>
            }
        </Fragment>

    )
}
