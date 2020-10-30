import Arweave from 'arweave';
import { ArweaveID } from '../arweaveid';
import { AccountInterface } from '../faces';

const arweave = Arweave.init({
  host: 'arweave.net',
  protocol: 'https',
  port: 443
});
const arweaveid = new ArweaveID(arweave);

beforeAll(done => {
  arweave.wallets.generate().then(wallet => {
    arweaveid.setWallet(wallet).then(() => done());
  });
});
afterAll(() => {
  process.exit(0);
});

it('should get the current state', async () => {
  const state = await arweaveid.getState();

  expect(state).toHaveProperty('accounts');
  expect(state).toHaveProperty('takenNames');
});

it('should set a wallet', async () => {
  expect(await arweaveid.setWallet(await arweave.wallets.generate())).toBeDefined();
});

it('should not get dummy account', async () => {
  let acc: AccountInterface; 
  try {
    acc = (await arweaveid.get()).account;
  } catch (err) {
    expect(err.message).toBe('Account not found.');
  }
  expect(acc).toBeUndefined();
});

it('should get avatar', async () => {
  expect(await arweaveid.getAvatar('BPr7vrFduuQqqVMu_tftxsScTKUq9ke0rx4q5C9ieQU')).toBeDefined();
});

it('should set account', async () => {
  expect(await arweaveid.setAccount({name: 'asdrf'})).toBeDefined();
});