import { Component, OnInit } from '@angular/core';
import { ScatterService } from '../services/scatter.service';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-treasure-game',
  templateUrl: './treasure-game.component.html',
  styleUrls: ['./treasure-game.component.scss']
})
export class TreasureGameComponent implements OnInit {
  gamePlayer = [];
  lastGame: any = null;
  matSpinner = true;
  eosAmount = 0;

  constructor(private scatterService: ScatterService) { }

  ngOnInit() {
    console.log('初始化');
    this.scatterService.scatterEos().subscribe(eos => {
      if (eos === 'open') {
        forkJoin(
          this.getGameState(),
          this.getGameGamePlayer(),
        ).subscribe(res => {
          this.matSpinner = false;
        });
      } else if (eos === 'getIdentity') {
        this.getCurrencyBalance();
      } else {
        this.matSpinner = eos === 'change';
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

  getGameList(lowerBound: string) {
    this.scatterService.getGameInfo('game', lowerBound).then(res => {

      setTimeout(() => {
        this.getGameState();
      }, 1000);


      if (this.displayAnimation(res.rows[res.rows.length - 1])) {
        console.log('开始动画');
        setTimeout(() => {
          this.lastGame = res.rows[res.rows.length - 1];
        }, 3000);
      } else {
        this.lastGame = res.rows[res.rows.length - 1];
      }

    }).catch(error => {
      console.log('getGameList =>', error);
      setTimeout(() => {
        this.getGameState();
      }, 1000);
    });
  }

  getGameState() {
    return this.scatterService.getGameInfo('state').then(res => {
      this.getGameList(res.rows[1].value);
      return true;
    }).catch(error => {
      console.log('getGameState =>', error);
      return true;
    });
  }

  getGameGamePlayer() {
    return this.scatterService.getGameInfo('gameplayer').then(res => {
      this.gamePlayer = res.rows;
      setTimeout(() => {
        this.getGameGamePlayer();
      }, 1000);
      return true;
    }).catch(error => {
      console.log('getGameGamePlayer =>', error);
      setTimeout(() => {
        this.getGameGamePlayer();
      }, 1000);
      return true;
    });
  }

  private displayAnimation(game) {
    return this.lastGame && this.lastGame.status === 0 && this.lastGame.status !== game.status;
  }
}
