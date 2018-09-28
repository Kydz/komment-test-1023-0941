import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import Eos from 'eosjs';

declare let scatter: any;

@Injectable({
  providedIn: 'root'
})
export class ScatterService {
  private scatterEos$: Subject<string> = new Subject();
  private scatter: any = null;
  private contract: any = null;
  private account: any = null;
  private eos: any = null;
  private eosNetwork = {
    protocol: 'http',
    blockchain: 'eos',
    host: 'jungle.cryptolions.io',
    port: 18888,
    chainId: '038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca'
  };

  constructor() {
    if (window['scatter']) {
      this.scatter = scatter;
      this.initScatter();
    } else {
      document.addEventListener('scatterLoaded', () => {
        this.scatter = scatter;
        this.initScatter();
      });
    }
  }

  scatterEos() {
    return this.scatterEos$;
  }

  getGameInfo(name: string, lowerBound: string = '0') {
    const tableQuery = {
      'json': true,
      'scope': 'treasuregame',
      'code': 'treasuregame',
      'table': name,
      'lower_bound': lowerBound,
    };

    return this.eos.getTableRows(tableQuery).then(res => {
      return res;
    });
  }

  gameStart() {
    const options = {
      authorization: [
        `${this.account.name}@${this.account.authority}`,
      ]
    };
    console.log('开启');
    return this.contract.start(this.account.name, options);
  }

  transferEos(amounts: number) {
    const amount = `${amounts}.0000 EOS`;
    const options = {
      authorization: [
        `${this.account.name}@${this.account.authority}`,
      ],
      broadcast: true,
      sign: true
    };

    return this.eos.transfer(this.account.name, 'treasuregame', amount, 'memo', options);
  }

  draw() {
    const options = {
      authorization: [
        `${this.account.name}@${this.account.authority}`,
      ]
    };
    return this.contract.draw(this.account.name, options);
  }

  getCurrencyBalance() {
    return this.eos.getAccount(this.account.name);
  }

  changeScatter() {
    this.scatter.forgetIdentity();
    return this.initScatter();
  }

  private initScatter() {
    const eosOptions = {
      broadcast: true,
      chainId: this.eosNetwork.chainId,
    };

    this.eos = this.scatter.eos(this.eosNetwork, Eos, eosOptions, 'http');
    this.scatterEos().next('open');

    this.scatter.getIdentity({accounts: [this.eosNetwork]}).then(identity => {
      console.log('1. 获取用户信息 =>', identity);
      // 1. 用户授权完成后，获取用户的EOS帐号名字（12位长度）
      this.account = identity.accounts.find(acc => acc.blockchain === 'eos');

      this.scatterEos().next('getIdentity');
      this.eos.contract('treasuregame').then(contract => {
        this.contract = contract;
      });
    }).catch(e => {
      console.log('error', e);
    });
  }
}
