# Compile the contract
## Standard
java -cp ErgoScriptCompiler-assembly-0.1.jar Compile cyti_mint_request.es symbols.json

The ErgoScriptCompiler jar can be downloaded at: https://github.com/ergoplatform/ergoscript-compiler/releases/download/v0.1/ErgoScriptCompiler-assembly-0.1.jar

## Generate javascript constants - compile.py
With Python 3 installed:
python compile.py all symbols.json
