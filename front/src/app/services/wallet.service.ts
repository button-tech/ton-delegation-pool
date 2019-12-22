import {Injectable} from '@angular/core';
import {StorageService} from './storage.service';
import {IAddress} from '../dto';
import {wch} from '../constants';

// import * as TonLib from '../../assets/ton/index.js';

@Injectable({
  providedIn: 'root'
})
export class WalletService {

  constructor(private storage: StorageService) {
    // this.test();
  }

  signSimpleTransaction() {

  }

  // @ts-ignore
  async sendTransaction(address: string, amount: number, comment = ''): Promise<any> {
      const workchainId = wch.length === 3 ? '-1' : '0';
      return (window as any).send(this.storage.getDataOfAccount().privateKey, address, amount, workchainId, 'send', comment);
  }

  async delegateFunds(address: string, amount: number, comment = ''): Promise<any> {
    return (window as any).send(this.storage.getDataOfAccount().privateKey, address, amount, comment, '0', 'stakeRequest');
  }

  getPublicKey(): string {
    const KeyPair = (window as any).nacl.sign.keyPair.fromSeed((window as any).hexToBuffer(this.storage.getDataOfAccount().privateKey));
    return (window as any).bufferToHex2(KeyPair.publicKey);
  }

  getPrivateKey(): string  {
    return this.storage.getDataOfAccount().privateKey;
  }

  getAddressKey(): IAddress {
    return this.storage.getDataOfAccount().address;
  }

}
