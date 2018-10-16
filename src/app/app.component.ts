import { Component, OnInit } from '@angular/core';
import { ScatterService } from './services/scatter.service';
import { HelperGuideComponent } from './helper-guide/helper-guide.component';
import { MatDialog } from '@angular/material';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'treasure-game';

  matSpinner = true;

  constructor(private scatterService: ScatterService, private dialog: MatDialog, private translate: TranslateService) {
    translate.setDefaultLang('ch');
    translate.use('ch');
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

  openHelperGuide() {
    this.dialog.open(HelperGuideComponent);
  }

  changeLang(lang: string) {
    if (lang === 'ch') {
      this.translate.use('ch');
    } else {
      this.translate.use('en');
    }
  }
}
