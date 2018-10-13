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
    if (!this.scatterService.isScatterLoaded()) {
      this.scatterService.openDialog();
      return;
    }

    if (!this.scatterService.isContractLoaded()) {

      this.scatterService.openDialog();

      this.snackBar.open('请先登陆scatter', '', {
        duration: 5000,
        panelClass: 'pending-snack-bar',
      });
      this.scatterService.scatterStatus().next('closed');
      return;
    }

    this.scatterService.scatterStatus().next('open');
    this.scatterService.gameStart().subscribe(result => {
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

  private getIncome() {
    const fee_percent = this.gameInfo.total_amount / 100 * this.gameInfo.fee_percent;
    this.income = (this.gameInfo.total_amount - fee_percent - this.gameInfo.draw_fee - this.gameInfo.start_fee) / 10000;
  }
}
