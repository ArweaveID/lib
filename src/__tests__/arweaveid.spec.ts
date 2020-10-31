import Arweave from 'arweave';
import { JWKInterface } from 'arweave/node/lib/wallet';
import { ArweaveID } from '../arweaveid';
import { AccountInterface } from '../faces';

const arweave = Arweave.init({
  host: 'arweave.net',
  protocol: 'https',
  port: 443,
});
const arweaveid = new ArweaveID(arweave);

let wallet: JWKInterface;
async function randomGenerate() {
  if (wallet) return wallet;

  wallet = await arweave.wallets.generate();
  await arweaveid.setWallet(wallet);

  return wallet;
}

it('should get the current state', async () => {
  await randomGenerate();
  const state = await arweaveid.getState();

  expect(state).toHaveProperty('accounts');
  expect(state).toHaveProperty('takenNames');
});

it('should set a wallet', async () => {
  await randomGenerate();
  expect(await arweaveid.setWallet(await arweave.wallets.generate())).toBeDefined();
});

it('should not get dummy account', async () => {
  await randomGenerate();

  let acc: AccountInterface;
  try {
    acc = (await arweaveid.get()).account;
  } catch (err) {
    expect(err.message).toBe('Account not found.');
  }
  expect(acc).toBeUndefined();
});

it('should get avatar', async () => {
  await randomGenerate();

  expect(await arweaveid.getAvatar('BPr7vrFduuQqqVMu_tftxsScTKUq9ke0rx4q5C9ieQU')).toBeDefined();
});

it('should set account', async () => {
  await randomGenerate();

  expect(await arweaveid.setAccount({ name: 'asdrf' })).toBeDefined();
});

it('should create an identicon', async () => {
  await randomGenerate();

  const identicon = await arweaveid.getIdenticon('BPr7vrFduuQqqVMu_tftxsScTKUq9ke0rx4q5C9ieQU');
  expect(identicon).toBeDefined();
});
