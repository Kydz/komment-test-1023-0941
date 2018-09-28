import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { ScatterService } from '../../services/scatter.service';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-treasure-pending',
  templateUrl: './treasure-pending.component.html',
  styleUrls: ['./treasure-pending.component.scss']
})
export class TreasurePendingComponent implements OnInit, OnChanges {
  @Input() gameInfo;
  @Input() eosAmount;
  value = 1;
  progressHeight = 0;
  income = 0;
  surplus = 0;
  imgDisplay = true;
  gamePlayer = [
    {
      name: '123',
      time: '123',
      amount: 13
    }, {
      name: '123',
      time: '123',
      amount: 13
    }, {
      name: '123',
      time: '123',
      amount: 13
    }
  ];

  constructor(private scatterService: ScatterService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.getIncome();
    this.getHeight();
  }

  ngOnChanges() {
    this.getIncome();
    this.getHeight();
  }

  changeValue(flag) {
    if (flag) {
      this.value = Math.min(this.value + 1, this.surplus);
    } else {
      this.value = Math.max(this.value - 1, 1);
    }
  }

  draw() {
    this.scatterService.scatterEos().next('change');
    this.scatterService.draw().then(res => {
      console.log(res);
      this.imgDisplay = false;
      this.scatterService.scatterEos().next('close');
    }).catch(error => {
      this.scatterService.scatterEos().next('close');
      const info = error.indexOf('current game is not full');
      const long = error.indexOf('Transaction took too long');
      if (info !== -1) {
        this.snackBar.open('能量没有填满不能发射', '', {
          duration: 5000,
          panelClass: 'pending-snack-bar',
        });
      } else if (long !== -1) {
        this.snackBar.open('交易花费时间过长，请重新发送', '', {
          duration: 5000,
          panelClass: 'pending-snack-bar',
        });
      }
      console.log('draw =>', error);
    });
  }

  transferEos() {
    this.scatterService.scatterEos().next('change');
    console.log(this.value);
    if (!this.value) {
      this.snackBar.open('最小的投注不能小于1', '', {
        duration: 5000,
        panelClass: 'pending-snack-bar',
      });
      return;
    } else if (this.eosAmount < 1) {
      this.snackBar.open('您的钱包余额不足', '', {
        duration: 5000,
        panelClass: 'pending-snack-bar',
      });
      return;
    }
    console.log('注入');
    this.scatterService.transferEos(this.value).then(res => {
      console.log(res);
      this.scatterService.scatterEos().next('close');
    }).catch(error => {
      this.scatterService.scatterEos().next('close');
      const info = error.indexOf('buy amount exceeds remaining amount');
      console.log(info);
      console.log('transferEos =>', error);
      if (info !== -1) {
        this.snackBar.open('能量已填满，请开始发射.', '', {
          duration: 5000,
          panelClass: 'pending-snack-bar',
        });
      }
    });
  }

  private getIncome() {
    const fee_percent = this.gameInfo.total_amount / 100 * this.gameInfo.fee_percent;
    this.income = (this.gameInfo.total_amount - fee_percent - this.gameInfo.draw_fee - this.gameInfo.start_fee) / 10000;
    this.surplus = this.gameInfo.total_count - this.gameInfo.current_count;
  }

  private getHeight() {
    const height = 125;
    this.progressHeight = height / this.gameInfo.total_count * this.surplus;
  }
}
