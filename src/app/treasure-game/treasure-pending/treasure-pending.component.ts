import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { ScatterService } from '../../services/scatter.service';
import { MatSnackBar } from '@angular/material';
import { interval } from 'rxjs';
import BigNumber from 'bignumber.js';
import { ApiService } from '../../services/api.service';
import * as moment from 'moment';

@Component({
  selector: 'app-treasure-pending',
  templateUrl: './treasure-pending.component.html',
  styleUrls: ['./treasure-pending.component.scss']
})
export class TreasurePendingComponent implements OnInit, OnChanges {
  @Input() gameInfo;
  @Input() eosAmount;
  @Input() previousGames;
  value = 1;
  progressHeight = 0;
  income = 0;
  surplus = 0;
  imgDisplay = true;
  previousWinners = [];
  currentReward = 0;
  canWithdraw = false;

  constructor(private scatterService: ScatterService, private snackBar: MatSnackBar, private apiService: ApiService) {
  }

  ngOnInit() {
    this.getIncome();
    this.getHeight();
    this.loadPreviousGames();
    setTimeout(3000, this.apiService.getGameRecord(this.scatterService.getAccountName()).subscribe(
      response => {
        this.currentReward = response.reward;
        this.canWithdraw = response.can_withdraw_reward;
      }));
  }

  ngOnChanges() {
    this.getIncome();
    this.getHeight();
    this.loadPreviousGames();
  }

  changeValue(flag) {
    if (flag) {
      this.value = Math.min(this.value + 1, this.surplus);
    } else {
      this.value = Math.max(this.value - 1, 1);
    }
  }

  draw() {
    if (!this.scatterService.getScatter() || !this.scatterService.getContract()) {
      this.scatterService.openDialog();
      return;
    }

    this.scatterService.scatterEos().next('change');
    this.scatterService.draw().then(res => {
      console.log(res);
      this.scatterService.gameAnimationTime = false;
      this.scatterService.scatterEos().next('closeMatSpinner');
      this.imgDisplay = false;
    }).catch(error => {

      console.log(error);
      this.scatterService.scatterEos().next('closeMatSpinner');
      const info = error.message.indexOf('current game is not full');
      const long = error.message.indexOf('Transaction took too long');
      const expired0 = error.message.indexOf(' the current CPU usage limit imposed');
      const expired1 = error.message.indexOf('Account using more than allotted RAM usage');
      const expired2 = error.message.indexOf('User rejected the signature request');

      let message = '出错了.';
      if (info !== -1) {
        message = '能量没有填满不能发射';
      } else if (long !== -1) {
        message = '交易花费时间过长，请重新发送';
      } else if (expired0 !== -1) {
        message = '您的CPU不够';
      } else if (expired1 !== -1) {
        message = '您的RAM不够';
      } else if (expired2 !== -1) {
        message = '您取消了操作';
      }
      this.snackBar.open(message, '', {
        duration: 5000,
        panelClass: 'pending-snack-bar'
      });
    });
  }

  checkMaxInputEos() {
    if (this.value > this.surplus) {
      this.value = this.surplus;
    }
    if (this.value < 1) {
      this.value = 1;
    }
  }

  transferEos() {
    if (!this.scatterService.getScatter() || !this.scatterService.getContract()) {
      this.scatterService.openDialog();
      return;
    }

    if (!this.value) {
      this.snackBar.open('最小的投注不能小于1', '', {
        duration: 5000,
        panelClass: 'pending-snack-bar'
      });
      return;
    } else if (new BigNumber(this.eosAmount).times(10000).lt(this.gameInfo.price)) {
      this.snackBar.open('您的钱包余额不足', '', {
        duration: 5000,
        panelClass: 'pending-snack-bar'
      });
      return;
    }
    this.scatterService.scatterEos().next('change');
    this.scatterService.transferEos(this.getEosPrice(this.value)).then(res => {
      this.scatterService.scatterEos().next('closeMatSpinner');
      this.apiService.addGameRecord(this.scatterService.getAccountName(), this.getEosPrice(this.value), res.transaction_id).subscribe(_ => {
      });
    }).catch(error => {
      console.log(error);
      this.scatterService.scatterEos().next('closeMatSpinner');
      const info = error.message.indexOf('buy amount exceeds remaining amount');
      const expired0 = error.message.indexOf(' the current CPU usage limit imposed');
      const expired1 = error.message.indexOf('Account using more than allotted RAM usage');
      const expired2 = error.message.indexOf('User rejected the signature request');

      console.log(info);
      console.log('transferEos =>', error);
      let message = '出错了.';
      if (info !== -1) {
        message = '能量已填满，请开始发射.';
      } else if (expired0 !== -1) {
        message = '您的CPU不够';
      } else if (expired1 !== -1) {
        message = '您的RAM不够';
      } else if (expired2 !== -1) {
        message = '您取消了操作';
      }
      this.snackBar.open(message, '', {
        duration: 5000,
        panelClass: 'pending-snack-bar'
      });
    });
  }

  withDraw() {
    this.apiService.getReward(this.scatterService.getAccountName()).subscribe(_ => {
    });
  }

  private getIncome() {
    const fee_percent = this.gameInfo.total_amount / 100 * this.gameInfo.fee_percent;
    this.income = (this.gameInfo.total_amount - fee_percent - this.gameInfo.draw_fee - this.gameInfo.start_fee) / 10000;
    this.surplus = this.gameInfo.total_count - this.gameInfo.current_count;
  }

  private getHeight() {
    let height = 125;
    const newHeight = height / this.gameInfo.total_count * this.surplus,
      gap = newHeight - height,
      step = gap >= 0 ? 1 : -1;
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

  private getWinnerEosAmount(game) {
    const fee = new BigNumber(game.fee_percent).div(100).times(game.total_amount).plus(game.start_fee).plus(game.draw_fee);
    return new BigNumber(game.total_amount).minus(fee).div(10000).toFixed();
  }

  private loadPreviousGames() {
    this.previousWinners = [];
    this.previousGames.reverse().forEach((game) => {
      this.previousWinners.push({
        name: game.winner.name,
        time: moment(game.created_at).format('MM/DD HH:mm'),
        amount: this.getWinnerEosAmount(game)
      });
    });
  }

  private getEosPrice(unit: number): string {
    return new BigNumber(this.gameInfo.price).div(10000).times(unit).toFixed();
  }
}
