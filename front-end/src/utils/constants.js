export const NANOERG_TO_ERG = 1000000000;
export const MIN_NANOERG_BOX_VALUE = 0.001 * NANOERG_TO_ERG;
export const TX_FEE = 1100000;

export const DEFAULT_EXPLORER_API_ADDRESS = "https://api.ergoplatform.com/";
export const DEFAULT_EXPLORER_ADDRESS = "https://explorer.ergoplatform.com/";

export const NFT_TYPES = {
    'Standard': "",
    'Picture': "",
    'Audio': "",
    'Video': "",
}

export const RECOMMENDED_FEES = [
    TX_FEE,
    0.005 * NANOERG_TO_ERG,  // 2 char
    0.005 * NANOERG_TO_ERG,  // 2 char
    0.01 * NANOERG_TO_ERG,   // 4 char
    0.01 * NANOERG_TO_ERG,   // 4 char
    0.1 * NANOERG_TO_ERG,    // 6 char
    0.1 * NANOERG_TO_ERG,    // 6 char
    1 * NANOERG_TO_ERG,      // 8 char 
    1 * NANOERG_TO_ERG,      // 8 char  
];

export const CYTI_MINT_REQUEST_SCRIPT="1020040004000404040005c0a3860105c0b5fa02010004060580897a05c0a38601040204020580897a04020402040204000402040004020400040204020402040404020406040204080402040a0100d80ad601e4c6a70608d602c5a7d603e4c6a7070ed604b17203d605b4720273007204d6069472057203d607b1a5d608b2a5730100d609e4c6a70405d60ae4c6a7051aeb02ea027201d17206d1ec95eded937207730293b4c572087303720472037206edededededededed93c27208c2a793c1720899c1a7730492c17208730593e4c672080405720993e4c67208051a720a93e4c672080608720193e4c67208070e7203e6c672080808e6c67208090e730695ed93720773079372057203edededededededededededed93c27208d0e4c6a7080892c172089999c1a77308730993c2b2a5730a00d0720193c1b2a5730b00730c93b1db6308b2a5730d00730e938cb2db6308b2a5730f00731000017202938cb2db6308b2a573110073120002720993e4c6b2a5731300040eb2720a73140093e4c6b2a5731500050eb2720a73160093e4c6b2a5731700060eb2720a73180093e4c6b2a5731900070eb2720a731a0093e4c6b2a5731b00080eb2720a731c0093e4c6b2a5731d00090eb2720a731e00731f";
export const CYTI_MINT_REQUEST_SCRIPT_HASH="08262f1f872737e3f62af908517603572e8fd5ae0c019ce94bb91ed27ef281c4";
export const CYTI_MINT_REQUEST_SCRIPT_ADDRESS="PjsKkeMDreCAE9RoZm6ocrrMg7Pes8tHL7yCfdDJRi6NWT3Ds7vQoi69rMNmn7Ma6RtJp2jmAMcwHD4GyRuqXr6H5vy1CDEPTzq23XYCCocDEvGrwFXUK4h7SVtXSpJWJrGZHqw5vSvHE2hHGM7uvhcJHVxkAFUttLUxdWgVGnAH6YqbUKs95Ky6Hgz4peTjs95Zo2QcmAJkdCD6XZKZ5iztvQdMb9jHv9QdGhh7Ls8SnQ2qLaWkDH1NghFwvrqhb99whJZe2wt1PDzNVHjzvL7XXnjDfUKQXG1N4qE1Nzpjz3cdQLojNNMr48u9op9rs21amziXfWmS9rjtZn5jeaiNXdmMqastrSdDXcijpru3wUetrvdnzUXCDKP9Gs7AHMBCiRwr2FrXHZ1Lf71UT1uwVLzfrJ4PFYL7APYL5pkJJF9Q7i9v7kFsQd4iHFwD52NnZiiqS14gYu4SQppFL9pBWotug7rQHuNZ11gEbvvH1EYwMvDRKnRzmGqbs28Uoco1ZGeAu7aK7cppNAHy7vmgqM1c8ch9gWMSdxs5ecMQwCgwjH8fLZxMEEEt7SekgTpifCDNGKFumiiGHRwcysgmA9wmb8ReazWoiMgw1yTz7w1vykT4iu85JnEcSGThG";
