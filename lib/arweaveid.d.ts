import Arweave from 'arweave';
import { JWKInterface } from 'arweave/node/lib/wallet';
import { AccountInterface, InputInterface, ResultInterface, StateInterface } from './faces';
export declare class ArweaveID {
    private readonly contractSrc;
    private readonly mainContract;
    private arweave;
    private wallet;
    private walletAddress;
    private dummyWallet;
    private state;
    private firstCall;
    private cacheRefreshInterval;
    private stateCallInProgress;
    constructor(arweave: Arweave, wallet?: JWKInterface, cacheRefreshInterval?: number);
    getState(cached?: boolean): Promise<StateInterface>;
    setWallet(wallet: JWKInterface): Promise<string>;
    get(params?: InputInterface): Promise<ResultInterface>;
    getAccount(target?: string): Promise<AccountInterface>;
    getName(target?: string): Promise<string>;
    getAvatar(target?: string): Promise<string>;
    getBio(target?: string): Promise<string>;
    getUrl(target?: string): Promise<string>;
    getExtra(key: string, target?: string): Promise<string>;
    setAccount(acc: AccountInterface): Promise<string>;
    setName(name: string): Promise<string>;
    setAvatar(avatar: string): Promise<string>;
    setBio(bio: string): Promise<string>;
    setUrl(url: string): Promise<string>;
    setExtra(key: string, value: string): Promise<string>;
    private checkWallet;
    private update;
    private read;
    private interact;
    private clean;
    private validateTxId;
}
