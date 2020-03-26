require('dotenv').config();
const bip39 = require("bip39");
const bip32 = require("ripple-bip32");
const ripple = require('ripple-keypairs')
const RippleAPI = require('ripple-lib').RippleAPI;
// const RIPPLE_PROVIDER = 'wss://s1.ripple.com'; // Production ripple provider
const RIPPLE_PROVIDER = 'wss://s.altnet.rippletest.net:51233'; // // Developmnet ripple provider

const myTestAddress = process.env.MY_TEST_ADDRESS
const myTestSecret = process.env.MY_TEST_SECRET
const mnemonic = process.env.MY_TEST_MNEMONIC

class RippleLib{
    constructor(provider){
        this.api = new RippleAPI({ server: provider });
        // for test
        // this.generateAddress()
        // this.mnemonicToAddress(mnemonic)
        // this.getBalance(myTestAddress)
        // this.getAccountInfo(myTestAddress)
        // this.sendTx('r9LinkU2BtReewBoeNURJC3bd5oHonifWc', 1.123, 0.000012);
        // this.sendTx(myTestAddress, 0.1);
    }
    // get balance in XRP
    async getBalance(address){
        try {
            await this.api.connect();
            const result = await this.api.getBalances(address);
            await this.api.disconnect();
            console.log(result)
            return result[0].value;
        } catch (error) {
            console.log(error)
        }
    }

    async sendTx(to, amount, fee){
        try {
            await this.api.connect();
            const address = myTestAddress;
            const secret = myTestSecret;
            let sequence = await this.getAccountInfo(address)
            let tx = {
                TransactionType: 'Payment',
                Account: address,
                Fee : (fee * 1000 * 1000) + '',
                Destination: to,
                DestinationTag : 2,
                Amount: (amount * 1000 * 1000) + '',
                Sequence: sequence.sequence
            }
            let txJSON = JSON.stringify(tx)
            let txSign;
            if (secret) {
                txSign = this.api.sign(txJSON, secret)
            } else if (keypair) {
                txSign = this.api.sign(txJSON, keypair)
            }
            const result = await this.api.submit(txSign.signedTransaction)
            const status = result.resultCode
            if(status === 'tesSUCCESS'){
                console.log("hash: ", result.tx_json.hash)
                const hash = result.tx_json.hash;
                return hash;
            }
        } catch (error) {
            console.log(error)
        }
    }

    async getAccountInfo(address){
        try {
            await this.api.connect();
            let result = await this.api.getAccountInfo(address);
            // console.log(result)
            return result;
        } catch (error) {
            console.log(error)
        }
    }
    // generate new testnet address
    generateAddress(){
        try {
            const result = this.api.generateAddress({"test": true});
            console.log(result)
            return result;
        } catch (error) {
            console.log(error)
        }
    }

    async mnemonicToAddress(mnemonic){
        try {
            const seed = await bip39.mnemonicToSeed(mnemonic)
            const m = bip32.fromSeedBuffer(seed)
            const keyPair = m.derivePath("m/44'/144'/0'/0/0").keyPair.getKeyPairs()
            const address = ripple.deriveAddress(keyPair.publicKey)
            // console.log('privateKey: ' + keyPair.privateKey)
            console.log('address: ' + address)
            return address;
        } catch (error) {
            console.log(error)
        }
    }
}

let rippleLib = new RippleLib(RIPPLE_PROVIDER);
