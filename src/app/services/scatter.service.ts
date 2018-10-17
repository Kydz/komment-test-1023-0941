import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, Subscription, throwError } from 'rxjs';
import Eos from 'eosjs';
import { MatDialog, MatSnackBar } from '@angular/material';

import { NoScatterComponent } from '../no-scatter/no-scatter.component';
import { environment } from '../../environments/environment';
import BigNumber from 'bignumber.js';
import { fromPromise } from 'rxjs/internal-compatibility';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ScatterService {
  private scatterStatusSub$ = new BehaviorSubject<string>('open');
  private dataRefreshSub$ = new BehaviorSubject<{ players, lastGame, previousGames, lastPurchase, lockPeriodTime }>(
    null
  );
  private identitySub$ = new BehaviorSubject({
    name: null
  });
  private scatter: any;
  private contract: any;
  private account: any;
  private eos: any = null;
  private gameIndex = 1;
  private eosNetwork = environment.eosNet;
  private pollingSub$: Subscription;

  constructor(private snackBar: MatSnackBar, private dialog: MatDialog) {
    const eosOptions = {
      httpEndpoint: `${this.eosNetwork.protocol}://${this.eosNetwork.host}:${this.eosNetwork.port}`
    };

    this.eos = this.eos = Eos(eosOptions);

    if (!this.pollingSub$) {
      this.getData();
    }
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

  getIdentitySub() {
    return this.identitySub$;
  }

  scatterStatus() {
    return this.scatterStatusSub$;
  }

  refreshData() {
    return this.dataRefreshSub$;
  }

  openDialog(): void {
    if (!this.isScatterLoaded()) {
      this.dialog.open(NoScatterComponent, {
        width: '250px',
        data: {name: 'scatter'}
      });
    } else if (!this.isContractLoaded()) {
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

  isScatterLoaded() {
    return !!this.scatter;
  }

  isContractLoaded() {
    return !!this.contract;
  }

  gameStart() {
    const options = {
      authorization: [
        `${this.account.name}@${this.account.authority}`
      ]
    };
    return fromPromise(this.contract.start(this.account.name, options)).pipe(
      catchError(this.handleError)
    );
  }

  transferEos(amounts: string): Observable<any> {
    const transfer = new BigNumber(amounts);
    const amount = `${transfer.toFixed(4)} EOS`;
    const options = {
      authorization: [
        `${this.account.name}@${this.account.authority}`
      ],
      broadcast: true,
      sign: true
    };

    return fromPromise(this.eos.transfer(this.account.name, 'treasuregame', amount, 'memo', options)).pipe(
      catchError(this.handleError)
    );
  }

  draw(): Observable<any> {
    const options = {
      authorization: [
        `${this.account.name}@${this.account.authority}`
      ]
    };
    return fromPromise(this.contract.draw(this.account.name, options)).pipe(
      catchError(this.handleError)
    );
  }

  stop(): Observable<any> {
    const options = {
      authorization: [
        `${this.account.name}@${this.account.authority}`
      ]
    };
    return fromPromise(this.contract.stop(this.account.name, options)).pipe(
      catchError(this.handleError)
    );
  }

  getAccountInfo(): Observable<any> {
    return fromPromise(this.eos.getAccount(this.account.name)).pipe(
      catchError(this.handleError)
    );
  }

  changeScatter() {
    this.scatter.forgetIdentity();
    return this.initScatter();
  }

  login() {
    this.scatter.getIdentity({accounts: [this.eosNetwork]}).then(identity => {
      this.account = identity.accounts.find(acc => acc.blockchain === 'eos');
      this.identitySub$.next(this.account);
      console.log('以獲取 Scatter Identity');
      this.eos.contract('treasuregame').then(contract => {
        this.contract = contract;
        window.localStorage.setItem('login', 'yes');
        this.snackBar.open('載入完成', '', {
          duration: 5000,
          panelClass: 'pending-snack-bar'
        });
      });
    }).catch(e => {
      console.log('獲取 Scatter Identity 失敗:');
      console.warn(e);
      if (e.type && e.type === 'locked') {
        this.snackBar.open('請先解鎖 Scatter', '', {
          duration: 5000,
          panelClass: 'pending-snack-bar'
        });
      }
    });
  }

  getAccountName(): string {
    return this.account.name;
  }

  getScatterErrorByType(type: string): string {
    if (type === 'signature_rejected') {
      return '您取消了操作';
    }
    if (type === 'tx_cpu_usage_exceeded') {
      return '您的CPU不夠';
    }
    if (type === 'tx_ram_usage_exceeded') {
      return '您的RAM不够';
    }
    if (type === 'eosio_assert_message_exception') {
      return '智能合約異常';
    }
    return '出錯了!';
  }

  getWinnerEosAmount(game): string {
    const constFee = new BigNumber(game.start_fee).plus(game.draw_fee);
    const platformFeeModifier = new BigNumber(game.fee_percent).div(100);
    const rowReward = new BigNumber(game.price).times(game.current_count);
    const result = rowReward.times(new BigNumber(1).minus(platformFeeModifier)).minus(constFee);
    if (result.lt(0)) {
      return '0';
    } else {
      return result.div(10000).toFixed();
    }
  }

  private getData() {
    this.pollingSub$ = this.getGameInfo('state', 0, 20).subscribe(
      state => {
        let index;
        this.gameIndex = index = state.rows[1].value;
        const lockPeriodTime = state.rows[10].value;
        if (this.gameIndex > 5) {
          index = this.gameIndex - 5;
        }
        forkJoin(
          this.getGameInfo('gameplayer', 0, 200),
          this.getGameInfo('game', index)
        ).subscribe(response => {
          const data = {
            players: this.getCurrentGamePlayers(response[0]['rows']),
            lastGame: {},
            previousGames: [],
            lastPurchase: {},
            lockPeriodTime: 3600
          };
          data.lastGame = response[1]['rows'][response[1]['rows'].length - 1];
          response[1]['rows'].pop();
          data.previousGames = response[1]['rows'];
          data.lastPurchase = response[0]['rows'][response[0]['rows'].length - 1];
          data.lockPeriodTime = lockPeriodTime;
          this.dataRefreshSub$.next(data);
          setTimeout(() => {
            this.getData();
          }, 1500);
        });
      }
    );
  }

  private getGameInfo(name: string, lowerBound: number = 0, limit: number = 10): Observable<any> {
    const tableQuery = {
      'json': true,
      'scope': 'treasuregame',
      'code': 'treasuregame',
      'table': name,
      'lower_bound': lowerBound.toString(),
      'limit': limit
    };

    return fromPromise(this.eos.getTableRows(tableQuery));
  }

  private initScatter() {
    const eosOptions = {
      broadcast: true,
      chainId: this.eosNetwork.chainId
    };

    this.eos = this.scatter.eos(this.eosNetwork, Eos, eosOptions, 'http');
    const login = window.localStorage.getItem('login');
    if (login === 'yes') {
      this.login();
    }
  }

  private getCurrentGamePlayers(players: any[]): any[] {
    return players.filter((item, index, origArray) => {
      return item.game_id === this.gameIndex;
    });
  }

  private handleError(error) {
    if (typeof(error) === 'string') {
      error = JSON.parse(error);
    }
    let name = 'general_error';
    if (error['code']) {
      const errorCode = error['code'];
      if (errorCode === 402 && error['type']) {
        name = error['type'];
      }
      if (errorCode === 500) {
        if (error['error'] && error['error']['name']) {
          name = error['error']['name'];
        }
      }
    }
    const scatterError = new Error('請求 Scatter 出錯');
    scatterError.name = name;
    return throwError(scatterError);
  }
}
