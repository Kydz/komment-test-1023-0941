import { Component, OnInit } from '@angular/core';
import { ScatterService } from '../../services/scatter.service';
import { MatSnackBar } from '@angular/material';
import { interval, Subscription } from 'rxjs';
import BigNumber from 'bignumber.js';
import { ApiService } from '../../services/api.service';
import * as moment from 'moment';

@Component({
  selector: 'app-treasure-pending',
  templateUrl: './treasure-pending.component.html',
  styleUrls: ['./treasure-pending.component.scss']
})
export class TreasurePendingComponent implements OnInit {

  STATUS_STARTING = 1;
  STATUS_STARTED = 2;
  STATUS_END = 3;

  gameInfo;
  eosAmount;
  previousGames;
  lastPurchase;
  previousLastPurchase = null;
  value = 1;
  progressHeight = 0;
  income = '--';
  remainingUnits = 0;
  previousWinners = [];
  gameStatus = this.STATUS_STARTING;
  lockDuration = 300;
  remainingMinutes = '--';
  remainingSeconds = '--';
  isLocked = false;
  isPlayerIn = false;
  isLastPurchaseUpdated = false;

  private countdownSub$: Subscription;

  constructor(private scatterService: ScatterService, private snackBar: MatSnackBar, private apiService: ApiService) {
  }

  ngOnInit() {
    this.scatterService.refreshData().subscribe(data => {
      if (data) {
        this.gameInfo = data.lastGame;
        this.previousGames = data.previousGames;
        this.lockDuration = data.lockPeriodTime;
        this.setLastPurchase(data.lastPurchase);
        this.setIncome();
        this.setHeight();
        this.loadPreviousGames();
        if (data.players.length > 0) {
          this.updateCountDown();
          this.isPlayerIn = true;
        } else {
          this.isPlayerIn = false;
        }
        this.gameStatus = this.isPlayerIn ?
          (this.isLocked || this.remainingUnits === 0) ? this.STATUS_END : this.STATUS_STARTED :
          this.STATUS_STARTING;
      }
    });
  }

  changeValue(flag) {
    if (flag) {
      this.value = Math.min(this.value + 1, this.remainingUnits);
    } else {
      this.value = Math.max(this.value - 1, 1);
    }
  }

  draw() {
    if (!this.scatterService.isScatterLoaded() || !this.scatterService.isContractLoaded()) {
      this.scatterService.openDialog();
      return;
    }

    this.scatterService.scatterStatus().next('open');
    this.scatterService.draw().subscribe(res => {
      this.scatterService.scatterStatus().next('closed');
    }, error => {
      this.scatterService.scatterStatus().next('closed');
      const message = this.scatterService.getScatterErrorByType(error.name);
      this.snackBar.open(message, '', {
        duration: 5000,
        panelClass: 'pending-snack-bar'
      });
    });
  }

  stop() {
    if (!this.scatterService.isScatterLoaded() || !this.scatterService.isContractLoaded()) {
      this.scatterService.openDialog();
      return;
    }

    this.scatterService.scatterStatus().next('open');
    this.scatterService.stop().subscribe(res => {
      this.scatterService.scatterStatus().next('closed');
    }, error => {
      this.scatterService.scatterStatus().next('closed');
      const message = this.scatterService.getScatterErrorByType(error.name);
      this.snackBar.open(message, '', {
        duration: 5000,
        panelClass: 'pending-snack-bar'
      });
    });
  }

  checkMaxInputEos() {
    if (this.value > this.remainingUnits) {
      this.value = this.remainingUnits;
    }
    if (this.value < 1) {
      this.value = 1;
    }
  }

  transferEos() {
    if (!this.scatterService.isScatterLoaded() || !this.scatterService.isContractLoaded()) {
      this.scatterService.openDialog();
      return;
    }

    if (!this.value) {
      this.snackBar.open('最小的投注不能小於1', '', {
        duration: 5000,
        panelClass: 'pending-snack-bar'
      });
      return;
    } else if (new BigNumber(this.eosAmount).times(10000).lt(this.gameInfo.price)) {
      this.snackBar.open('您的錢包餘額不足', '', {
        duration: 5000,
        panelClass: 'pending-snack-bar'
      });
      return;
    }
    this.scatterService.scatterStatus().next('open');
    this.scatterService.transferEos(this.getEosPrice(this.value)).subscribe(res => {
      this.scatterService.scatterStatus().next('closed');
      this.apiService.addGameRecord(this.scatterService.getAccountName(), this.getEosPrice(this.value), res['transaction_id']).
        subscribe(_ => {
        });
    }, error => {
      this.scatterService.scatterStatus().next('closed');
      const message = this.scatterService.getScatterErrorByType(error.name);
      this.snackBar.open(message, '', {
        duration: 5000,
        panelClass: 'pending-snack-bar'
      });
    });
  }

  getEosPrice(unit: number): string {
    return new BigNumber(this.gameInfo.price).div(10000).times(unit).toFixed();
  }

  private updateCountDown() {
    if (!this.isLastPurchaseUpdated) {
      return;
    }
    if (this.countdownSub$) {
      this.countdownSub$.unsubscribe();
    }
    const now = moment(), lastPurchaseTime = moment(this.lastPurchase.created_at + '+00:00').utcOffset('+08:00');
    let gap = now.diff(lastPurchaseTime, 'seconds');
    gap = this.lockDuration - gap;
    this.countdownSub$ = interval(1000).subscribe(_ => {
      if (gap-- < 1) {
        this.isLocked = true;
        return;
      } else {
        this.isLocked = false;
      }
      this.remainingMinutes = new BigNumber(gap).div(60).toFixed(0, 1);
      this.remainingSeconds = this.timeZeroPadding(new BigNumber(gap).mod(60).toFixed(0));
    });
  }

  private timeZeroPadding(time: string): string {
    if (time.length !== 2) {
      return '0' + time;
    } else {
      return time;
    }
  }

  private setIncome() {
    this.income = this.scatterService.getWinnerEosAmount(this.gameInfo);
    this.remainingUnits = this.gameInfo.total_count - this.gameInfo.current_count;
  }

  private setHeight() {
    let height = 250;
    const newHeight = height / this.gameInfo.total_count * this.remainingUnits,
      gap = newHeight - height,
      step = gap >= 0 ? 5 : -5;
    if (newHeight === this.progressHeight) {
      return;
    }

    const sub$ = interval(10).subscribe((_ => {
      height = height + step;
      if ((gap >= 0 && height >= newHeight) || (gap < 0 && height <= newHeight)) {
        this.progressHeight = newHeight;
        sub$.unsubscribe();
      } else {
        this.progressHeight = height;
      }
    }));
  }

  private loadPreviousGames() {
    this.previousWinners = [];
    const games = [...this.previousGames];
    games.reverse().forEach((game) => {
      this.previousWinners.push({
        name: game.winner.name,
        time: moment(game.created_at + '+00:00').utcOffset('+08:00').format('MM/DD HH:mm'),
        amount: this.scatterService.getWinnerEosAmount(game)
      });
    });
  }

  private setLastPurchase(purchase) {
    this.lastPurchase = purchase;
    if (this.previousLastPurchase && this.previousLastPurchase.id) {
      this.isLastPurchaseUpdated = this.lastPurchase.id !== this.previousLastPurchase.id;
    } else {
      this.isLastPurchaseUpdated = true;
    }
    if (this.isLastPurchaseUpdated) {
      this.previousLastPurchase = this.lastPurchase;
    }
  }
}
