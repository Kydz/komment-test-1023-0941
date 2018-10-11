import { Injectable } from '@angular/core';
import { forkJoin, Subject } from 'rxjs';
import Eos from 'eosjs';
import { MatDialog, MatSnackBar } from '@angular/material';

import { NoScatterComponent } from '../no-scatter/no-scatter.component';
import { environment } from '../../environments/environment';
import BigNumber from 'bignumber.js';

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
  private gameIndex = 1;
  private eosNetwork = environment.eosNet;

  constructor(private snackBar: MatSnackBar, private dialog: MatDialog) {
    const eosOptions = {
      httpEndpoint: `${this.eosNetwork.protocol}://${this.eosNetwork.host}:${this.eosNetwork.port}`
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
  }

  getData() {
    forkJoin(
      this.getGameInfo('state'),
      this.getGameInfo('gameplayer')
    ).subscribe(res => {
      let index = this.gameIndex;
      if (this.gameIndex > 5) {
        index = this.gameIndex - 5;
      }
      this.getGameInfo('game', index).then(game => {
        const data = {
          players: res[1]['rows'],
          lastGame: {},
          previousGames: []
        };
        data.lastGame = game['rows'].pop();
        data.previousGames = game['rows'];
        this.eosGameList().next(data);
        setTimeout(() => {
          this.getData();
        }, 3000);
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

  gameStart() {
    const options = {
      authorization: [
        `${this.account.name}@${this.account.authority}`
      ]
    };
    return this.contract.start(this.account.name, options);
  }

  transferEos(amounts: string) {
    const transfer = new BigNumber(amounts);
    const amount = `${transfer.toFixed(4)} EOS`;
    const options = {
      authorization: [
        `${this.account.name}@${this.account.authority}`
      ],
      broadcast: true,
      sign: true
    };

    return this.eos.transfer(this.account.name, 'treasuregame', amount, 'memo', options);
  }

  draw() {
    const options = {
      authorization: [
        `${this.account.name}@${this.account.authority}`
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
          panelClass: 'pending-snack-bar'
        });
      });
    }).catch(e => {
      console.log('登录 Scatter 失败:', e);
    });
  }

  getAccountName(): string {
    return this.account.name;
  }

  private getGameInfo(name: string, lowerBound: number = 0) {
    const tableQuery = {
      'json': true,
      'scope': 'treasuregame',
      'code': 'treasuregame',
      'table': name,
      'lower_bound': lowerBound.toString()
    };

    return this.eos.getTableRows(tableQuery).then(res => {
      if (name === 'state') {
        this.gameIndex = res.rows[1].value;
      }
      return res;
    });
  }

  private initScatter() {
    const eosOptions = {
      broadcast: true,
      chainId: this.eosNetwork.chainId
    };

    this.eos = this.scatter.eos(this.eosNetwork, Eos, eosOptions, 'http');

    const login = window.localStorage.getItem('login');
    console.log(login);
    if (login === 'yes') {
      this.login();
    }
  }
}
