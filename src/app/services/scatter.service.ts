import { Injectable } from '@angular/core';
import { forkJoin, Subject } from 'rxjs';
import Eos from 'eosjs';
import { MatSnackBar, MatDialog } from '@angular/material';

import { NoScatterComponent } from '../no-scatter/no-scatter.component';

@Injectable({
  providedIn: 'root'
})
export class ScatterService {
  private scatterEos$: Subject<string> = new Subject();
  private eosGameList$: Subject<any> = new Subject();
  private scatter: any = null;
  private contract: any = null;
  private account: any = null;
  private eos: any = null;
  private gameIndex: '';
  gameAnimationTime = true;
  private eosNetwork = {
    protocol: 'http',
    blockchain: 'eos',
    host: 'jungle.cryptolions.io',
    port: 18888,
    chainId: '038f4b0fc8ff18a4f0842a8f0564611f6e96e8535901dd45e43ac8691a1c4dca'
  };

  constructor(private snackBar: MatSnackBar, private dialog: MatDialog) {
    const eosOptions = {
      httpEndpoint: `http://${this.eosNetwork.host}:18888`,
    };

    this.eos = this.eos = Eos(eosOptions);

    this.getData();
    this.scatterEos().next('closeMatSpinner');
    if (window['scatter']) {
      this.scatter = window['scatter'];
      this.initScatter();
    } else {
      document.addEventListener('scatterLoaded', () => {
        this.scatter = window['scatter'];
        this.initScatter();
      });
    }

    this.scatterEos().subscribe(eos => {
      if (eos === 'close') {
        this.gameAnimationTime = false;
      }
    });
  }

  getData() {
    forkJoin(
      this.getGameInfo('state'),
      this.getGameInfo('gameplayer'),
    ).subscribe(res => {
      this.getGameInfo('game', this.gameIndex).then(game => {
        res.push(game);
        if (this.gameAnimationTime) {
          this.eosGameList().next(res);
          setTimeout(() => {
            this.getData();
          }, 500);
        } else {
          setTimeout(() => {
            console.log('动画完成');
            this.eosGameList().next(res);
            this.getData();
            this.gameAnimationTime = true;
          }, 4200);
        }
      });
    });
  }

  scatterEos() {
    return this.scatterEos$;
  }

  eosGameList() {
    return this.eosGameList$;
  }

  openDialog(): void {
    if (!this.getScatter()) {
      this.dialog.open(NoScatterComponent, {
        width: '250px',
        data: {name: 'scatter'}
      });
    } else if (!this.getContract()) {
      const dialogRef = this.dialog.open(NoScatterComponent, {
        width: '250px',
        data: {name: 'contract', login: ''}
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result === 'contract') {
          this.login();
        }
      });
    }
  }

  getScatter() {
    return this.scatter !== null;
  }

  getContract() {
    return this.contract !== null;
  }

  private getGameInfo(name: string, lowerBound: string = '0') {
    const tableQuery = {
      'json': true,
      'scope': 'treasuregame',
      'code': 'treasuregame',
      'table': name,
      'lower_bound': lowerBound,
    };

    return this.eos.getTableRows(tableQuery).then(res => {
      if (name === 'state') {
        this.gameIndex = res.rows[1].value;
      }
      return res;
    });
  }

  gameStart() {
    const options = {
      authorization: [
        `${this.account.name}@${this.account.authority}`,
      ]
    };
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

  login() {
    this.scatter.getIdentity({accounts: [this.eosNetwork]}).then(identity => {
      console.log(identity);
      // 1. 用户授权完成后，获取用户的EOS帐号名字（12位长度）
      this.account = identity.accounts.find(acc => acc.blockchain === 'eos');

      this.scatterEos().next('getIdentity');
      this.eos.contract('treasuregame').then(contract => {
        this.contract = contract;
        window.localStorage.setItem('login', 'yes');
        this.snackBar.open('登陆成功', '', {
          duration: 5000,
          panelClass: 'pending-snack-bar',
        });
      });
    }).catch(e => {
      console.log('error', e);
    });
  }

  private initScatter() {
    const eosOptions = {
      broadcast: true,
      chainId: this.eosNetwork.chainId,
    };

    this.eos = this.scatter.eos(this.eosNetwork, Eos, eosOptions, 'http');

    const login = window.localStorage.getItem('login');
    console.log(login);
    if (login === 'yes') {
      this.login();
    }
  }
}
