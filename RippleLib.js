require('dotenv').config();
const bip39 = require("bip39");
const bip32 = require("ripple-bip32");
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
        this.getBalance(myTestAddress)
        // this.getAccountInfo(myTestAddress)
        // this.sendTx('r9LinkU2BtReewBoeNURJC3bd5oHonifWc', 2.123, 0.000012, "12345");
        // this.sendTx(myTestAddress, 0.1);
        // this.getTxHistory(myTestAddress)
        // this.validatorAddress(myTestAddress)
        // this.validatorSecret(myTestSecret)
    }
    // get balance in XRP
    async getBalance(address){
        try {
            await this.api.connect();
            const result = await this.api.getBalances(address);
            await this.api.disconnect();
            const balance = result[0].value;
            console.log(balance)
            return balance;
        } catch (error) {
            console.log(error)
        }
    }

    async sendTx(to, amount, fee, memo){
        try {
            await this.api.connect();
            const address = myTestAddress;
            const secret = myTestSecret;
            let sequence = await this.getAccountInfo(address)
            const tx = {
                TransactionType: 'Payment',
                Account: address,
                Fee : this.api.xrpToDrops(fee),
                Destination: to,
                DestinationTag : Number(memo),
                Amount: this.api.xrpToDrops(amount),
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
            await this.api.disconnect();
        } catch (error) {
            console.log(error)
        }
    }

    async getTxHistory(address){
        try {
            await this.api.connect();
            let result = [];
            const allTx = await this.api.getTransactions(address, {limit: 5})
            const rate = "0.16";
            for(let txKey in allTx){
                let tx = allTx[txKey];
                if (tx.outcome.result === 'tesSUCCESS') {
                    if(tx.outcome.deliveredAmount.currency === "XRP"){
                        let timeStamp = tx.outcome.timestamp;
                        timeStamp = Date.parse(timeStamp)/1000;
                        const hash = tx.id;
                        const memo = tx.specification.destination.tag;
                        const txFee = tx.outcome.fee;
                        const amount = tx.outcome.deliveredAmount.value;
                        const from = tx.specification.source.address;
                        const to = tx.specification.destination.address;
                        const status = "CONFIRM";
                        let action;
                        if(to != from){
                            if(address == to){
                                action = "DEPOSIT";
                            }else if(address == from){
                                action = "SEND";
                            }
                        }else{
                            action = "SELF";
                        }
                        const moneyQuantity = (amount*rate).toFixed(2); 
                        const id = result.length+1;
                        const txData = this.formatTxData(timeStamp, id, action, status, amount, moneyQuantity, hash, from, to, txFee, memo);
                        result.push(txData);
                    } continue;
                } continue;
            }
            console.log(result)
            return result;
        } catch (error) {
            console.log(error)
        }
    }

    formatTxData(timeStamp, id, action, status, amount, moneyQuantity, hash, from, to, txFee, memo){
		let txData = {
            timeStamp,
            id,
            action,
            status,
            cryptoAmount: amount,
            moneyQuantity,
            copy: hash,
            explorer: `https://test.bithomp.com/explorer/${hash}`,
            fromAddress: from,
            toAddress: to,
            txFee, 
			memo,
		};
		return txData;
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
    // get transaction fee in protocol
    async getFee(){
        try {
            await this.api.connect();
            const fee = await this.api.getFee();
            return fee;
        } catch (error) {
            console.log(error)
        }
    }
    // address is valid or not. return boolean
    validatorAddress(address){
        try {
            const result = this.api.isValidAddress(address);
            console.log(result)
            return result;
        } catch (error) {
            console.log(error)
        }
    }

    validatorSecret(secret){
        try {
            const result = this.api.isValidSecret(secret);
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
            console.log('publicKey: ' + keyPair.publicKey)
            console.log('privateKey: ' + keyPair.privateKey)
            const address = this.api.deriveAddress(keyPair.publicKey)
            console.log('address: ' + address)
            return address;
        } catch (error) {
            console.log(error)
        }
    }
}

let rippleLib = new RippleLib(RIPPLE_PROVIDER);
