# CYTI - Choose Your Token ID

The project was made in the context of the Ergohack V.

The goal is to provide a decentralized service allowing token minter choose a specific pattern for the beginning of the token ID.
This can be convenient and add some values to the tokens.

The pattern requested needs to include an even number of hexadecimal characters ([0-9a-f]).
The difficulty increase exponentially with the length of the pattern requested.

On the other side, token ID miners can run the mining software to collect fees and compute the right hash.
They can setup a minimal price for the mining for each length.

Given the performance of the provided miner the possible length are limited to: 2, 4, 6, 8
A rough estimate of the mining difficulty depending on the length:

Possible length, difficulty and with 2800 H/s:
- 2 - Extremly easy (0.1s)
- 4 - Easy (25s)
- 6 - Hard (1h30mn)
- 8 - Extremly hard (17 days)

The CYTI contract is open to anyone without developper fee.
More performant token miner could be implemented to reduce the computation time and increase the possible choice for the length of the patterns.

# Mass minting
## Presentation
CYTI allows to mint several different tokens in one transaction.
If only one token is minted without requirement in the token ID pattern, a simple token will be minted without CYTI contracts.
For more than one token of if the token has a requirement on the token ID, one CYTI contract will be created per token request.

## Working with JSON file
You can load and export a list of token definition in the UI to process the minting of several tokens in one transaction conveniently.
The file format to follow is:

## Limits
- The limit depends on the size of the transaction.
- Minting token with a long description or a long URL reduce the amount of tokens a single transaction can create.

- Test transaction: https://explorer.ergoplatform.com/en/transactions/2993dae1a1f02ebc33c0adaa62923a7530c1b1dc0bf9f045a33d7672c6bfb6b3
  * 150 tokens were minted from a single transaction with CYTI contracts.
  * All the 150 tokens have their token ID starting by "1111".
  * The price of the transaction was 0.63 ERG for a real cost of 0.48 ERG as 0.15 ERG are returned with the token delivery.
  * All the transactions took 26mn to be mined and processed.

## Sample token mint list JSON
https://github.com/ThierryM1212/cyti/blob/84afa577da2a9b45f84f913893aedba76e19b304/front-end/sample_mass_mint.json#L1-L35

# Contract overview
The token minter create a CYTI contract that includes:
- the description of the token he wants to mint
- its address (to sent the tokens)
- a pattern for the start of the token ID (for example "aaaa" in the following diagram)
- an amount a of ERG to process the mining transactions and pay a fee to the miner processing them (min 0.042 ERG)

This CYTI contract is refundable to the minter until it does not meet the requirement for the boxId.

Miners (running the token ID mining software) can try to find the right hash for the output box.

Once a miner found it and send the transaction, the contract can be processed (by anyone, without signing) to mint the tokens for the token minter and pay the fee to the miner.

![CITY contract overview](./contract/mint_eip4_4char.drawio.png)

# Project structure
## contract
CYTI contract and document associated
## front-end
React js UI to mint CYTI contract or normal tokens
## cyti-miner
nodejs miner bot to mine and process the CYTI contracts

