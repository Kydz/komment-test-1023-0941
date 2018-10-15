import { Component, Input, OnInit } from '@angular/core';
import { ScatterService } from '../../services/scatter.service';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-treasure-close',
  templateUrl: './treasure-close.component.html',
  styleUrls: ['./treasure-close.component.scss']
})
export class TreasureCloseComponent implements OnInit {
  income = '--';
  gameInfo: any;

  constructor(private scatterService: ScatterService, private snackBar: MatSnackBar) { }

  ngOnInit() {
    this.scatterService.refreshData().subscribe(data => {
      if (data) {
        this.gameInfo = data.lastGame;
        this.getIncome();
      }
    });
  }

  gameStart() {
    if (!this.scatterService.isScatterLoaded()) {
      this.scatterService.openDialog();
      return;
    }

    if (!this.scatterService.isContractLoaded()) {

      this.scatterService.openDialog();

      this.snackBar.open('請先登錄 Scatter', '', {
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
    this.income = this.scatterService.getWinnerEosAmount(this.gameInfo);
  }
}
