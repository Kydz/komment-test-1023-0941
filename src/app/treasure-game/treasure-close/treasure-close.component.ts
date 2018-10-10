import { Component, Input, OnInit } from '@angular/core';
import { ScatterService } from '../../services/scatter.service';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-treasure-close',
  templateUrl: './treasure-close.component.html',
  styleUrls: ['./treasure-close.component.scss']
})
export class TreasureCloseComponent implements OnInit {
  @Input() gameInfo;
  income = 0;
  noRam = false;

  constructor(private scatterService: ScatterService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.getIncome();
  }

  gameStart() {
    this.scatterService.scatterEos().next('change');

    if (!this.scatterService.getContract()) {

      this.scatterService.openDialog();

      /*this.snackBar.open('请先登陆scatter', '', {
        duration: 5000,
        panelClass: 'pending-snack-bar',
      });*/
      this.scatterService.scatterEos().next('close');
      return;
    }

    console.log('开启');

    this.scatterService.gameStart().then(result => {
      console.log(result);
      this.scatterService.scatterEos().next('close');
    }).catch(error => {
      console.log('gameStart =>', error);
      this.scatterService.scatterEos().next('close');

      const info = error.indexOf('current game is open');
      const expired1 = error.indexOf('Expired Transaction');
      const expired2 = error.indexOf('expired transaction');

      if (info !== -1) {
        this.snackBar.open('游戏已经被开启', '', {
          duration: 5000,
          panelClass: 'pending-snack-bar',
        });
      } else if (expired1 !== -1 || expired2 !== -1) {
        this.snackBar.open('交易过期请重新发送', '', {
          duration: 5000,
          panelClass: 'pending-snack-bar',
        });
      } else {
        this.noRam = true;
      }
    });
  }

  private getIncome() {
    const fee_percent = this.gameInfo.total_amount / 100 * this.gameInfo.fee_percent;
    this.income = (this.gameInfo.total_amount - fee_percent - this.gameInfo.draw_fee - this.gameInfo.start_fee) / 10000;
  }
}
