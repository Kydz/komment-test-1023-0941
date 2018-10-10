import { Component, OnInit } from '@angular/core';

import { ScatterService } from '../services/scatter.service';

@Component({
  selector: 'app-treasure-game',
  templateUrl: './treasure-game.component.html',
  styleUrls: ['./treasure-game.component.scss']
})
export class TreasureGameComponent implements OnInit {
  gamePlayer = [];
  lastGame: any = null;
  matSpinner = false;
  eosAmount = 0;

  constructor(private scatterService: ScatterService) { }

  ngOnInit() {
    this.getGameList();
    this.scatterService.scatterEos().subscribe(eos => {
      if (eos === 'getIdentity') {
        this.getCurrencyBalance();
      } else if (eos === 'change') {
        this.matSpinner = true;
      } else if (eos === 'closeMatSpinner') {
        this.matSpinner = false;
      }
    });
  }

  changeScatter() {
    this.scatterService.changeScatter();
  }

  getCurrencyBalance() {
    this.scatterService.getCurrencyBalance().then(res => {
      this.eosAmount = parseFloat(res.core_liquid_balance);
    });
  }

  getGameList() {
    this.scatterService.eosGameList().subscribe(res => {
      this.lastGame = res[2].rows[0];
      this.gamePlayer = res[1].rows;
    });
  }
}
