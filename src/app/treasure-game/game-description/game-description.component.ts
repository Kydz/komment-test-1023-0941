import { Component, OnInit } from '@angular/core';
import { ScatterService } from '../../services/scatter.service';
import * as moment from 'moment';

@Component({
  selector: 'app-game-description',
  templateUrl: './game-description.component.html',
  styleUrls: ['./game-description.component.scss']
})
export class GameDescriptionComponent implements OnInit {

  previousGames;
  isFirstBatchData = true;
  previousWinners = [];
  gamePlayers = [];
  gamePlayersLeft = [];
  gamePlayersRight = [];

  constructor(private scatterService: ScatterService) {
  }

  ngOnInit() {
    this.scatterService.refreshData().subscribe(data => {
      if (data) {
        this.previousGames = data.previousGames;
        this.loadPlayers(data.players);
        this.closeSpinnerForFirstData();
        this.loadPreviousGames();
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

  private loadPlayers(players: any[]) {
    this.gamePlayersLeft = [];
    this.gamePlayersRight = [];
    this.gamePlayers = [];
    players.forEach((player, index) => {
      if (index % 2 === 0) {
        this.gamePlayersLeft.push(player);
      } else {
        this.gamePlayersRight.push(player);
      }
      this.gamePlayers.push(player);
    });
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
}
