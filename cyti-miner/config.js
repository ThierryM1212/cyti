export const config = {
    // ERG Address to receive fee (payment) from token ID mining
    "MINER_ADDRESS": "9gQgjFPG2PefNjAvXf7jHvbVKsNLMjmiaWC5Z56hsLMwJ43tzs3",

    // Number of worker processes
    "PARALLEL_DEGREE": 8,

    // Port for the web monitoring UI
    "MINER_PORT": 4000,

    // Minimal fee to start mining depending on the difficulty (ERG)
    "MIN_ERG_PRICE_2_CHAR": 0.0042,   // 1/256 valid
    "MIN_ERG_PRICE_4_CHAR": 0.0042,   // 1/65536 valid
    "MIN_ERG_PRICE_6_CHAR": 0.01,     // 1/1677216 valid
    "MIN_ERG_PRICE_8_CHAR": 0.1,      // 1/4294967296 valid
    "MIN_ERG_PRICE_10_CHAR": 1,       // 1/1099511627776 valid

    // Miner wait time when nothing to process (s)
    "MINER_COLD_DOWN": 20,

    // Interval to process CYTI results transactions (s)
    "RESULTS_INTERVAL": 60,

    // Explorer URL
    "EXPLORER_API_URL": "https://api.ergoplatform.com/",

    // Number of try per process per tentative
    // Increase this value improve the average hashrate but there is a risk you continue to mine a contract that was already resolved
    // The check for new CITY contract is done after the number of iterations configured and the mining restarted.
    "NUM_ITERATIONS": 100000000,

    // Colors of table headers
    "COLOR_HEADER_1": "green",
    "COLOR_HEADER_2": "blue",

    // Number of log lines to display
    "LOG_LENGTH": 15,

    // If > 0 enable the debug mode
    "DEBUG": 0
}
