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

  constructor(public scatterService: ScatterService, private dialog: MatDialog, private translate: TranslateService) {
    translate.setDefaultLang('zn-CH');
    translate.use('zn-CH');
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
    if (lang === 'zn-CH') {
      this.translate.use('zn-CH');
    } else if (lang === 'zn-TW') {
      this.translate.use('zn-TW');
    } else {
      this.translate.use('en-UK');
    }
  }

  login() {
    this.scatterService.login();
  }

  logout() {
    this.scatterService.logout();
  }

  isLogin() {
    return this.scatterService.isLogin();
  }
}
