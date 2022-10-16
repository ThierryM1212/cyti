# CYTI - Choose Your Token ID

The project was made in the context of the Ergohack V.

The goal is to provide a decentralized service allowing token minter to choose a specific pattern for the beginning of their token ID.
This can be convenient and add some values to the tokens or token collections.

The pattern requested needs to include an even number of hexadecimal characters ([0-9a-f]).
The difficulty increase exponentially with the length of the pattern requested.

On the other side, token ID miners can run the mining software to collect fees and compute the right hash.
They can setup a minimal price for the mining for each length.

Given the performance of the provided miner the possible length are limited to: 2, 4, 6, 8

The CYTI contract is open to anyone without developper fee.
More performant token miner could be implemented to reduce the computation time and increase the possible choice for the length of the patterns.

 - The dApp front-end is running on FLUX: https://cytiminter.app.runonflux.io/
 - The dApp front-end is also deployed at: https://thierrym1212.github.io/cyti/index.html
 - The miner is available at: https://github.com/ThierryM1212/cyti/releases


# Contract overview

The CYTI contract includes:
- the description of the token to be minted
- the address of the minter
- the pattern for the start of the token ID (for example "aaaa" in the following diagram)
- an amount of ERG to process the mining transactions and pay a fee to the miner processing them (min 0.042 ERG)

The CYTI contract is refundable to the minter until it does not meet the requirement for the boxId.

Miners (running cyti-miner software) can try to find the right hash for the output box.

Once a miner found it and send the transaction, the contract can be processed (by anyone, without signing) to mint the tokens for the token minter and pay the fee to the miner.

<img src='contract/mint_eip4_4char.drawio.png' width='800'>


# Mass minting

## Presentation
CYTI allows to mint several different tokens in one transaction.
If only one token is minted without requirement in the token ID pattern, a simple token will be minted without CYTI contracts.
For more than one token of if the token has a requirement on the token ID, one CYTI contract will be created per token request.

## Working with JSON file
You can load and export a list of token definition in the UI to process the minting of several tokens in one transaction.

## Details of token definition
|Parameter|Description                                       |Requirement                                                    |Default  |
|---------|--------------------------------------------------|---------------------------------------------------------------|---------|
|name     | Name of the token                                | Non empty string                                              | None    |
|type     | Type of the token                                | Standard; Picture; Audio; Video                               | Standard|
|desc     | Description of the token                         | -                                                             | Empty   |
|amount   | Amount of tokens to mint                         | Integer                                                       | 1       |
|decimals | Number of decimals                               | Integer (0 to 9)                                              | 0       |
|mediaURL | URL of the media for Picture; Audio or Video type| String                                                        | Empty   |
|mediaHash| Hash SHA-256 of the content of the URL           | String                                                        | Empty   |
|idPattern| Requirement for the fiest digits of the token ID | Hexadecimal string max 8 characters                           | Empty   |
|CYTIFee  | Fee for the token ID miners                      | 0.0042 if idPattern non empty; min 0.0031 for empty id Pattern| 0.0042  |

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


# Choose the mining fee

The miners can configure a minimal mining fee for each pattern length and will start mining the mint request only if the limit is reached.<br />
The fee limit is removed when the miner address is the same than the token mint request.

|Number of characters|Difficulty         |Minting time with 3kH/s|Suggested mint fee per token|
|--------------------|-------------------|-----------------------|----------------------------|
|0                   | No mining required| 0s                    | 0.0031 ERG                 |
|1 or 2              | Extremly easy     | 0.1s                  | 0.005 ERG                  |
|3 or 4              | Easy              | 25s                   | 0.01 ERG                   |
|5 or 6              | Hard              | 1h30mn                | 0.1 ERG                    |
|7 or 8              | Very Hard         | 17 days               | 1 ERG                      |


# Compatible wallets

|Platform            |Compatible wallet                                 |
|--------------------|--------------------------------------------------|
|Desktop browser     | Nautilus                                         |
|Desktop browser     | SAFEW                                            |
|Desktop browser     | Mosaic (ergopay)                                 |
|Android             | Ergo wallet (ergopay)                            |
|iOS                 | Terminus wallet (ergopay)                        |


# Project structure

## contract
[CYTI contract](contract/README.md) and document associated
## front-end
[React js UI to mint CYTI](front-end/README.md) contracts or normal tokens, allows mass minting of tokens.
## cyti-miner
[nodejs miner](cyti-miner/README.md) bot to mine and process the CYTI contracts

