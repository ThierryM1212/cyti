{   // ----------------------------------
    // CYTI ergoscript contract
    // ----------------------------------
    // The owner of the contract fund it, to request the minting of a token with a specific start sequence for the token ID (R7)
    // The contracts also embed the description of the token (R4, R5)
    // Once funded by its owner the CYTI contract can be
    // - refunded by the same owner, if the boxId does not match the requirement (not yet mined)
    // - replicated with a boxId matching the requirement (mined)
    // When the CYTI contracts match the requirement for the boxId, the token minting and the miner fee payment can be issued
    // The miner will set its address to get the payment in R8
    // The nonce, allowing to find the proper boxId is R9[Coll[Byte]]
    // Another miner cannot re-use the same nonce as the address will be different producing another boxId

    val targetLength = SELF.R7[Coll[Byte]].get.size // length of the start pattern for the token ID
    val selfChar = SELF.id.slice(0, targetLength) // current pattern of the box
    val amountTokenRequest = SELF.R4[Long].get // amount of token to mint
    val tokenInfo = SELF.R5[Coll[Coll[Byte]]].get // description of the token to mint
                                                  // [token name, token description, token decimals, token type, token_media_hash, token_media_URL]
    val ownerPKIn = SELF.R6[SigmaProp].get // minter address
    val targetChar = SELF.R7[Coll[Byte]].get // requested pattern for the token ID
    val minerPKIn = SELF.R8[SigmaProp].get // miner address (to be set by the miner, initially minter address)

    val outputId0Char = OUTPUTS(0).id.slice(0, targetLength) // generated pattern in output of the transaction

    // token ID miner compute the requested boxId hash
    val validComputeHash = if (OUTPUTS.size == 2           && 
                               outputId0Char == targetChar &&  // miner has computed the right hash for OUTPUTS(0)
                               selfChar != targetChar          // the hash is not already correct
                               ) {
        // check request replication
        OUTPUTS(0).propositionBytes == SELF.propositionBytes        && 
        OUTPUTS(0).value == SELF.value - txFee                      && 
        OUTPUTS(0).value >= txFee + 2 * BoxMinValue                 && // ensure we are able to process the minting on next step
        OUTPUTS(0).R4[Long].get == amountTokenRequest               &&
        OUTPUTS(0).R5[Coll[Coll[Byte]]].get == tokenInfo            &&
        OUTPUTS(0).R6[SigmaProp].get == ownerPKIn                   &&
        OUTPUTS(0).R7[Coll[Byte]].get == SELF.R7[Coll[Byte]].get    &&
        OUTPUTS(0).R8[SigmaProp].isDefined                          &&
        OUTPUTS(0).R9[Coll[Byte]].isDefined
    } else {
        false
    }

    // Refund the request to the address requesting the mint
    val validRefund = (selfChar != targetChar) // refund only if hash not computed

    // Process token mint once the hash of the box is correct
    val validTokMint = if (OUTPUTS.size == 3 && selfChar == targetChar) {
        // token ID miner fee
        OUTPUTS(0).propositionBytes == minerPKIn.propBytes          &&
        OUTPUTS(0).value >= SELF.value - BoxMinValue - txFee        &&
        // mint the token with request info for the owner
        OUTPUTS(1).propositionBytes == ownerPKIn.propBytes          &&
        OUTPUTS(1).value == BoxMinValue                             &&
        OUTPUTS(1).tokens.size == 1                                 &&
        OUTPUTS(1).tokens(0)._1 == SELF.id                          &&
        OUTPUTS(1).tokens(0)._2 == amountTokenRequest               &&
        OUTPUTS(1).R4[Coll[Byte]].get == tokenInfo(0)               &&
        OUTPUTS(1).R5[Coll[Byte]].get == tokenInfo(1)               &&
        OUTPUTS(1).R6[Coll[Byte]].get == tokenInfo(2)               &&
        OUTPUTS(1).R7[Coll[Byte]].get == tokenInfo(3)               &&
        OUTPUTS(1).R8[Coll[Byte]].get == tokenInfo(4)               &&
        OUTPUTS(1).R9[Coll[Byte]].get == tokenInfo(5)
    } else {
        false
    }
    
    // RESULT
    (
        ( // Owner actions (only refund if not computed)
        ownerPKIn && sigmaProp(validRefund)
        ) ||
        (// Action by anyone
            sigmaProp(
                        validComputeHash     ||   // miner compute the proper hash (CYTI miner)
                        validTokMint              // mint the proper token once the hash match the request (CYTI results)
                        )
        )
    )
}   
