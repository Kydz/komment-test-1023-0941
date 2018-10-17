import { Component, OnInit } from '@angular/core';

import { ScatterService } from '../services/scatter.service';

@Component({
  selector: 'app-treasure-game',
  templateUrl: './treasure-game.component.html',
  styleUrls: ['./treasure-game.component.scss']
})
export class TreasureGameComponent implements OnInit {
  lastGame: any;

  constructor(private scatterService: ScatterService) {
  }

  ngOnInit() {
    this.scatterService.refreshData().subscribe(data => {
      if (data) {
        this.lastGame = data.lastGame;
      }
    });
  }
}
