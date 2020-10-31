import Arweave from 'arweave';
import * as jdenticon from 'jdenticon';
import { interactWrite, readContract, interactWriteDryRun, interactRead } from 'smartweave';
import { JWKInterface } from 'arweave/node/lib/wallet';
import { AccountInterface, InputInterface, ResultInterface, StateInterface } from './faces';
import { createCanvas } from 'canvas';

export class ArweaveID {
  private readonly contractSrc: string = 'Q5Nc1bxWKa09bRiPcxgCuUL9uZm0msAc9w-FKOCev78';
  private readonly mainContract: string = 'U7vXbqvJZ7ZrY77dprQD--_aJG9BNpoLFGqzAKqz2yY';

  private arweave: Arweave;
  private wallet!: JWKInterface;
  private walletAddress!: string;
  private dummyWallet: JWKInterface;

  private state!: StateInterface;
  private firstCall: boolean = true;
  private cacheRefreshInterval: number = 1000 * 60 * 2; // 2 minutes
  private stateCallInProgress: boolean = false;

  constructor(arweave: Arweave, wallet?: JWKInterface, cacheRefreshInterval = 1000 * 60 * 2) {
    this.arweave = arweave;

    if (wallet) {
      this.wallet = wallet;
      arweave.wallets
        .jwkToAddress(wallet)
        .then((addy) => (this.walletAddress = addy))
        .catch(console.log);
    }

    if (cacheRefreshInterval) {
      this.cacheRefreshInterval = cacheRefreshInterval;
    }
  }

  async getState(cached = true): Promise<StateInterface> {
    if (this.firstCall) {
      this.firstCall = false;
      return this.update(true);
    }

    if (!cached || !this.state) {
      return this.update(false);
    }

    return this.state;
  }

  async setWallet(wallet: JWKInterface) {
    this.wallet = wallet;
    this.walletAddress = await this.arweave.wallets.jwkToAddress(wallet);

    return this.walletAddress;
  }

  // Getters
  public async get(params: InputInterface = { function: 'get', request: 'account' }): Promise<ResultInterface> {
    return this.read(params);
  }

  async getAccount(target: string = this.walletAddress, identiconSize: number = 120) {
    const res = await this.get({ function: 'get', request: 'account', target });
    res.extras = new Map(res.extras);
    res.identicon = await this.getIdenticon(target, identiconSize);

    return res.account;
  }

  async getName(target: string = this.walletAddress) {
    const res = await this.get({ function: 'get', request: 'name', target });
    return res.name;
  }

  async getAvatar(target: string = this.walletAddress) {
    const res = await this.get({ function: 'get', request: 'avatar', target });
    return res.avatar;
  }

  async getIdenticon(target: string = this.walletAddress, size: number = 120) {
    const canvas = createCanvas(size, size, 'svg');
    jdenticon.drawIcon(canvas.getContext('2d'), target, size);

    return canvas.toDataURL();
  }

  async getBio(target: string = this.walletAddress) {
    const res = await this.get({ function: 'get', request: 'bio', target });
    return res.bio;
  }

  async getUrl(target: string = this.walletAddress) {
    const res = await this.get({ function: 'get', request: 'url', target });
    return res.url;
  }

  async getExtra(key: string, target: string = this.walletAddress) {
    const res = await this.get({ function: 'get', request: 'extra', key, target });
    return res.extra;
  }

  // Setters
  async setAccount(acc: AccountInterface) {
    await this.checkWallet();

    const input: InputInterface = {
      function: 'set',
      request: 'account',
    };

    const keys = Object.keys(acc);
    if (!keys.length) {
      throw new Error('At least one account property is required.');
    }

    for (const key of keys) {
      if (key === 'name' || key === 'bio' || key === 'url') {
        input[key] = this.clean(acc[key]);
      } else if (key === 'avatar') {
        input[key] = this.validateTxId(this.clean(acc[key]));
      } else if (key === 'extras') {
        const kvs: { [key: string]: string } = Array.from(acc[key]).reduce((obj, [k, value]) => Object.assign(obj, { [k]: this.clean(value) }), {});
        input[key] = kvs;
      }
    }

    return this.interact(input);
  }

  async setName(name: string) {
    name = this.clean(name);
    if (!name.length) {
      throw new Error('Name is required.');
    }

    return this.setAccount({ name });
  }

  async setAvatar(avatar: string) {
    avatar = this.validateTxId(this.clean(name));
    if (!avatar.length) {
      throw new Error('Avatar is required.');
    }

    return this.setAccount({ avatar });
  }

  async setBio(bio: string) {
    bio = this.clean(bio);
    if (!bio.length) {
      throw new Error('Bio is required.');
    }

    return this.setAccount({ bio });
  }

  async setUrl(url: string) {
    url = this.clean(url);
    if (!url.length) {
      throw new Error('Url is required.');
    }

    return this.setAccount({ url });
  }

  async setExtra(key: string, value: string) {
    key = this.clean(key);
    value = this.clean(value);

    if (!key.length || !value.length) {
      throw new Error('Key and value are required.');
    }

    const m: Map<string, string> = new Map();
    m.set(key, value);

    return this.setAccount({ extras: m });
  }

  // Private methods
  private async checkWallet(): Promise<void> {
    if (!this.wallet) {
      throw new Error('You first need to set the user wallet, you can do this while on new Community(..., wallet) or using setWallet(wallet).');
    }
  }

  private async update(recall = false): Promise<StateInterface> {
    if (this.stateCallInProgress) {
      const getLastState = async (): Promise<StateInterface> => {
        if (this.stateCallInProgress) {
          return new Promise((resolve) => setTimeout(() => resolve(getLastState()), 1000));
        }

        return this.state;
      };
      return getLastState();
    }

    this.stateCallInProgress = true;

    // @ts-ignore
    const res: StateInterface = await readContract(this.arweave, this.mainContract);
    this.state = res;

    this.stateCallInProgress = false;

    if (recall) {
      setTimeout(() => this.update(true), this.cacheRefreshInterval);
    }
    return this.state;
  }

  private async read(input: InputInterface) {
    if (!this.wallet && !this.dummyWallet) {
      this.dummyWallet = await this.arweave.wallets.generate();
    }

    const res = await interactRead(this.arweave, this.wallet || this.dummyWallet, this.mainContract, input);
    if (typeof res === 'string') {
      throw new Error(res);
    }

    return res;
  }

  private async interact(input: InputInterface): Promise<string> {
    // @ts-ignore
    const res = await interactWriteDryRun(this.arweave, this.wallet, this.mainContract, input);
    if (res.type === 'error') {
      //  || res.type === 'exception'
      throw new Error(res.result);
    }

    // @ts-ignore
    return interactWrite(this.arweave, this.wallet, this.mainContract, input);
  }

  // Utils
  private clean(str: string) {
    return str
      .toString()
      .replace(/(<([^>]+)>)/gi, '')
      .trim();
  }

  private validateTxId(str: string) {
    if (!str.length) return str;

    if (!/[a-z0-9_-]{43}/i.test(str)) {
      throw new Error(`${str} is not a transaction ID.`);
    }
    return str;
  }
}
