import { Component, OnInit } from '@angular/core';
import { ScatterService } from './services/scatter.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'treasure-game';

  matSpinner = true;

  constructor(private scatterService: ScatterService) {
  }

  ngOnInit() {
    this.scatterService.scatterStatus().subscribe(scatterStatus => {
      if (scatterStatus === 'open') {
        this.matSpinner = true;
      } else if (scatterStatus === 'closed') {
        this.matSpinner = false;
      }
    });
  }
}
