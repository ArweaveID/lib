"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArweaveID = void 0;
const smartweave_1 = require("smartweave");
class ArweaveID {
    constructor(arweave, wallet, cacheRefreshInterval = 1000 * 60 * 2) {
        this.contractSrc = 'Q5Nc1bxWKa09bRiPcxgCuUL9uZm0msAc9w-FKOCev78';
        this.mainContract = 'U7vXbqvJZ7ZrY77dprQD--_aJG9BNpoLFGqzAKqz2yY';
        this.firstCall = true;
        this.cacheRefreshInterval = 1000 * 60 * 2; // 2 minutes
        this.stateCallInProgress = false;
        this.arweave = arweave;
        if (wallet) {
            this.wallet = wallet;
            arweave.wallets.jwkToAddress(wallet).then(addy => this.walletAddress = addy).catch(console.log);
        }
        if (cacheRefreshInterval) {
            this.cacheRefreshInterval = cacheRefreshInterval;
        }
    }
    getState(cached = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.firstCall) {
                this.firstCall = false;
                return this.update(true);
            }
            if (!cached || !this.state) {
                return this.update(false);
            }
            return this.state;
        });
    }
    setWallet(wallet) {
        return __awaiter(this, void 0, void 0, function* () {
            this.wallet = wallet;
            this.walletAddress = yield this.arweave.wallets.jwkToAddress(wallet);
            return this.walletAddress;
        });
    }
    // Getters
    get(params = { function: 'get', request: 'account' }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.read(params);
        });
    }
    getAccount(target = this.walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.get({ function: 'get', request: 'account', target });
            res.extras = new Map(res.extras);
            return res.account;
        });
    }
    getName(target = this.walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.get({ function: 'get', request: 'name', target });
            return res.name;
        });
    }
    getAvatar(target = this.walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.get({ function: 'get', request: 'avatar', target });
            return res.avatar;
        });
    }
    getIdenticon(target = this.walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const canvas = '';
        });
    }
    getBio(target = this.walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.get({ function: 'get', request: 'bio', target });
            return res.bio;
        });
    }
    getUrl(target = this.walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.get({ function: 'get', request: 'url', target });
            return res.url;
        });
    }
    getExtra(key, target = this.walletAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.get({ function: 'get', request: 'extra', key, target });
            return res.extra;
        });
    }
    // Setters
    setAccount(acc) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkWallet();
            const input = {
                function: 'set',
                request: 'account'
            };
            const keys = Object.keys(acc);
            if (!keys.length) {
                throw new Error('At least one account property is required.');
            }
            for (const key of keys) {
                if (key === 'name' || key === 'bio' || key === 'url') {
                    input[key] = this.clean(acc[key]);
                }
                else if (key === 'avatar') {
                    input[key] = this.validateTxId(this.clean(acc[key]));
                }
                else if (key === 'extras') {
                    const kvs = Array.from(acc[key]).reduce((obj, [k, value]) => (Object.assign(obj, { [k]: this.clean(value) })), {});
                    input[key] = kvs;
                }
            }
            return this.interact(input);
        });
    }
    setName(name) {
        return __awaiter(this, void 0, void 0, function* () {
            name = this.clean(name);
            if (!name.length) {
                throw new Error('Name is required.');
            }
            return this.setAccount({ name });
        });
    }
    setAvatar(avatar) {
        return __awaiter(this, void 0, void 0, function* () {
            avatar = this.validateTxId(this.clean(name));
            if (!avatar.length) {
                throw new Error('Avatar is required.');
            }
            return this.setAccount({ avatar });
        });
    }
    setBio(bio) {
        return __awaiter(this, void 0, void 0, function* () {
            bio = this.clean(bio);
            if (!bio.length) {
                throw new Error('Bio is required.');
            }
            return this.setAccount({ bio });
        });
    }
    setUrl(url) {
        return __awaiter(this, void 0, void 0, function* () {
            url = this.clean(url);
            if (!url.length) {
                throw new Error('Url is required.');
            }
            return this.setAccount({ url });
        });
    }
    setExtra(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            key = this.clean(key);
            value = this.clean(value);
            if (!key.length || !value.length) {
                throw new Error('Key and value are required.');
            }
            const m = new Map();
            m.set(key, value);
            return this.setAccount({ extras: m });
        });
    }
    // Private methods
    checkWallet() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.wallet) {
                throw new Error('You first need to set the user wallet, you can do this while on new Community(..., wallet) or using setWallet(wallet).');
            }
        });
    }
    update(recall = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.stateCallInProgress) {
                const getLastState = () => __awaiter(this, void 0, void 0, function* () {
                    if (this.stateCallInProgress) {
                        return new Promise((resolve) => setTimeout(() => resolve(getLastState()), 1000));
                    }
                    return this.state;
                });
                return getLastState();
            }
            this.stateCallInProgress = true;
            // @ts-ignore
            const res = yield smartweave_1.readContract(this.arweave, this.mainContract);
            this.state = res;
            this.stateCallInProgress = false;
            if (recall) {
                setTimeout(() => this.update(true), this.cacheRefreshInterval);
            }
            return this.state;
        });
    }
    read(input) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.wallet && !this.dummyWallet) {
                this.dummyWallet = yield this.arweave.wallets.generate();
            }
            const res = yield smartweave_1.interactRead(this.arweave, this.wallet || this.dummyWallet, this.mainContract, input);
            if (typeof res === 'string') {
                throw new Error(res);
            }
            return res;
        });
    }
    interact(input) {
        return __awaiter(this, void 0, void 0, function* () {
            // @ts-ignore
            const res = yield smartweave_1.interactWriteDryRun(this.arweave, this.wallet, this.mainContract, input);
            if (res.type === 'error') {
                //  || res.type === 'exception'
                throw new Error(res.result);
            }
            // @ts-ignore
            return smartweave_1.interactWrite(this.arweave, this.wallet, this.mainContract, input);
        });
    }
    // Utils
    clean(str) {
        return str.toString().replace(/(<([^>]+)>)/ig, '').trim();
    }
    validateTxId(str) {
        if (!str.length)
            return str;
        if (!/[a-z0-9_-]{43}/i.test(str)) {
            throw new Error(`${str} is not a transaction ID.`);
        }
        return str;
    }
}
exports.ArweaveID = ArweaveID;
