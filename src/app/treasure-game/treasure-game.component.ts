import { Component, OnInit } from '@angular/core';

import { ScatterService } from '../services/scatter.service';
import * as moment from 'moment';

@Component({
  selector: 'app-treasure-game',
  templateUrl: './treasure-game.component.html',
  styleUrls: ['./treasure-game.component.scss']
})
export class TreasureGameComponent implements OnInit {
  gamePlayers = [];
  lastGame: any;
  isFirstBatchData = true;

  constructor(private scatterService: ScatterService) {
  }

  ngOnInit() {
    this.scatterService.refreshData().subscribe(data => {
      if (data) {
        this.lastGame = data.lastGame;
        this.gamePlayers = data.players;
        this.closeSpinnerForFirstData();
      }
    });
  }

  getUTCFixedTime(time: string) {
    return moment(time + '+00:00').utcOffset('+08:00').format('YYYY/MM/DD HH:mm:ss');
  }

  private closeSpinnerForFirstData() {
    if (this.isFirstBatchData) {
      this.scatterService.scatterStatus().next('closed');
      this.isFirstBatchData = false;
    }
  }
}
